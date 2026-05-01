import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Headers,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

@Controller("api/admin")
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  private validateAdmin(adminKey: string) {
    if (adminKey !== ADMIN_PASSWORD) {
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);
    }
  }

  @Get("workspaces")
  async getWorkspaces(@Headers("x-admin-key") adminKey: string) {
    this.validateAdmin(adminKey);

    const workspaces = await this.prisma.workspace.findMany({
      include: {
        members: {
          include: { user: { select: { email: true, name: true } } },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { workspaces };
  }

  @Patch("workspaces/:id")
  async updateWorkspace(
    @Headers("x-admin-key") adminKey: string,
    @Param("id") id: string,
    @Body() body: { subscriptionTier?: string; tokenBalance?: number },
  ) {
    this.validateAdmin(adminKey);

    const data: any = {};
    if (body.subscriptionTier !== undefined) {
      data.subscriptionTier = body.subscriptionTier;
    }
    if (body.tokenBalance !== undefined) {
      data.tokenBalance = body.tokenBalance;
    }

    const workspace = await this.prisma.workspace.update({
      where: { id },
      data,
    });

    return { workspace };
  }
}
