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
  ForbiddenException,
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
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        if (!["application/pdf", "text/plain"].includes(file.mimetype)) {
          callback(
            new BadRequestException("Only PDF and TXT files are supported."),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: any,
    @Body("email") email: string,
  ) {
    if (!file) {
      throw new BadRequestException(
        "No supported file provided. Upload a PDF or TXT file up to 10 MB.",
      );
    }
    if (!email) {
      throw new BadRequestException("Email is required.");
    }

    if (
      file.mimetype === "application/pdf" &&
      !file.buffer.subarray(0, 1024).includes(Buffer.from("%PDF-"))
    ) {
      throw new BadRequestException("The uploaded file is not a valid PDF.");
    }
    if (
      file.mimetype === "text/plain" &&
      file.buffer.includes(Buffer.from([0]))
    ) {
      throw new BadRequestException("The uploaded text file is not valid.");
    }

    const fileName =
      file.originalname
        .replace(/[\/\\\u0000-\u001f\u007f]/g, "_")
        .trim()
        .slice(0, 255) || "document";

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { workspaces: true },
    });

    if (!user) {
      throw new BadRequestException("User not found.");
    }

    const workspaceId = user.workspaces[0]?.workspaceId;
    if (!workspaceId) {
      throw new BadRequestException("Workspace not found.");
    }

    // Enforce storage limit — count ALL documents
    const totalDocs = await this.prisma.document.count({
      where: { workspaceId },
    });

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new BadRequestException("Workspace not found.");
    }

    const subscriptionInactive =
      workspace.subscriptionStatus !== null &&
      !["active", "manual"].includes(workspace.subscriptionStatus);
    const subscriptionExpired =
      workspace.subscriptionExpiresAt !== null &&
      workspace.subscriptionExpiresAt <= new Date();
    if (subscriptionInactive || subscriptionExpired) {
      throw new ForbiddenException(
        "This workspace subscription is inactive or expired.",
      );
    }

    const maxDocs = getTierLimits(workspace.subscriptionTier).maxStorageDocs;
    if (totalDocs >= maxDocs) {
      throw new BadRequestException(
        `Document storage limit reached (${maxDocs} max). You have ${totalDocs} document(s). Delete old documents or upgrade your plan.`,
      );
    }

    // Create document record
    const document = await this.prisma.document.create({
      data: {
        fileName,
        fileUrl: "",
        mimeType: file.mimetype,
        status: "PROCESSING",
        workspaceId,
      },
    });

    logger.log(`Document created: ${document.id}`);

    try {
      await this.ragService.processAndVectorizeDocument(
        file.buffer,
        document.id,
        workspaceId,
        {
          fileName,
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
    if (!email) {
      throw new BadRequestException("Email is required.");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { workspaces: true },
    });

    if (!user) {
      throw new BadRequestException("User not found.");
    }

    const workspaceId = user.workspaces[0]?.workspaceId;
    if (!workspaceId) {
      throw new BadRequestException("Workspace not found.");
    }

    const documents = await this.prisma.document.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return documents;
  }

  @Delete(":id")
  async deleteDocument(@Param("id") id: string, @Query("email") email: string) {
    if (!email) {
      throw new BadRequestException("Email is required.");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
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

    await this.ragService.deleteDocumentVectors(id, workspaceId);
    await this.prisma.document.delete({ where: { id } });

    return { success: true };
  }
}
