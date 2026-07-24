import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { getTierLimits, getTierName } from "@agentix/config/pricing";

@Controller("api/workspace")
export class WorkspaceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getWorkspace(@Query("email") email: string) {
    if (!email) {
      throw new HttpException("Missing email", HttpStatus.BAD_REQUEST);
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { workspaces: true },
    });

    const workspaceId = user?.workspaces[0]?.workspaceId;
    if (!workspaceId) {
      return { workspace: null };
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
        tokenBalance: true,
      },
    });

    const tier = workspace?.subscriptionTier || null;
    const tierLimits = {
      ...getTierLimits(tier),
      name: getTierName(tier),
    };
    const agentCount = await this.prisma.agent.count({
      where: { workspaceId },
    });
    const docCount = await this.prisma.document.count({
      where: { workspaceId, status: "READY" },
    });

    const tokensUsed =
      tierLimits.maxMessagesPerMonth > 0
        ? tierLimits.maxMessagesPerMonth - (workspace?.tokenBalance || 0)
        : 0;

    return {
      workspace: {
        ...workspace,
        limits: tierLimits,
        usage: {
          agents: agentCount,
          documents: docCount,
          tokensUsed: Math.max(0, tokensUsed),
        },
      },
    };
  }
}
