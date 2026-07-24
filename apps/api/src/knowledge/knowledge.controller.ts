import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { RagService } from "../ai/rag.service";
import { PrismaService } from "../database/prisma.service";
import { getTierLimits } from "@agentix/config/pricing";

const logger = new Logger("KnowledgeController");

@Controller("knowledge")
export class KnowledgeController {
  constructor(
    private readonly ragService: RagService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadDocument(
    @UploadedFile() file: any,
    @Body("email") email: string,
  ) {
    logger.log(
      `Upload request received. Email: ${email}, File: ${file?.originalname}`,
    );

    if (!file) {
      throw new BadRequestException("No file provided.");
    }
    if (!email) {
      throw new BadRequestException("Email is required.");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { workspaces: true },
    });

    if (!user) {
      logger.error(`User not found for email: ${email}`);
      throw new BadRequestException("User not found.");
    }

    const workspaceId = user.workspaces[0]?.workspaceId;
    if (!workspaceId) {
      logger.error(`No workspace found for user: ${email}`);
      throw new BadRequestException("Workspace not found.");
    }

    logger.log(`Workspace ID: ${workspaceId}`);

    // Enforce storage limit — count ALL documents
    const totalDocs = await this.prisma.document.count({
      where: { workspaceId },
    });

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    const maxDocs = getTierLimits(
      workspace?.subscriptionTier || null,
    ).maxStorageDocs;
    logger.log(
      `Document count: ${totalDocs}/${maxDocs} (tier: ${workspace?.subscriptionTier || "none"})`,
    );

    if (totalDocs >= maxDocs) {
      throw new BadRequestException(
        `Document storage limit reached (${maxDocs} max). You have ${totalDocs} document(s). Delete old documents or upgrade your plan.`,
      );
    }

    // Create document record
    const document = await this.prisma.document.create({
      data: {
        fileName: file.originalname,
        fileUrl: "",
        mimeType: file.mimetype,
        status: "PROCESSING",
        workspaceId,
      },
    });

    logger.log(`Document created: ${document.id} (${file.originalname})`);

    try {
      await this.ragService.processAndVectorizeDocument(
        file.buffer,
        document.id,
        workspaceId,
        {
          fileName: file.originalname,
          mimeType: file.mimetype,
        },
      );

      const updated = await this.prisma.document.update({
        where: { id: document.id },
        data: { status: "READY" },
      });

      logger.log(`Document vectorized successfully: ${document.id}`);
      return updated;
    } catch (error) {
      logger.error(`Vectorization failed for ${document.id}: ${error.message}`);
      await this.prisma.document.update({
        where: { id: document.id },
        data: { status: "FAILED" },
      });
      throw new BadRequestException(
        "Failed to process and vectorize the document.",
      );
    }
  }

  @Get()
  async getDocuments(@Query("email") email: string) {
    logger.log(`Fetching documents for email: ${email}`);

    if (!email) {
      throw new BadRequestException("Email is required.");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { workspaces: true },
    });

    if (!user) {
      logger.warn(`User not found for email: ${email}`);
      return [];
    }

    const workspaceId = user.workspaces[0]?.workspaceId;
    if (!workspaceId) {
      logger.warn(`No workspace found for user: ${email}`);
      return [];
    }

    logger.log(`Workspace ID: ${workspaceId}`);

    const documents = await this.prisma.document.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    logger.log(
      `Found ${documents.length} document(s) for workspace ${workspaceId}`,
    );
    documents.forEach((doc) => {
      logger.log(`  - ${doc.fileName} (${doc.status})`);
    });

    return documents;
  }

  @Delete(":id")
  async deleteDocument(@Param("id") id: string, @Query("email") email: string) {
    if (!email) {
      throw new BadRequestException("Email is required.");
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { workspaces: true },
    });

    const workspaceId = user?.workspaces[0]?.workspaceId;
    if (!workspaceId) {
      throw new BadRequestException("Workspace not found.");
    }

    const doc = await this.prisma.document.findFirst({
      where: { id, workspaceId },
    });

    if (!doc) {
      throw new BadRequestException("Document not found.");
    }

    await this.prisma.document.delete({ where: { id } });

    return { success: true };
  }
}
