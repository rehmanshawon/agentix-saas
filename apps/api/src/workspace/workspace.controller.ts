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
        subscriptionStatus: true,
        billingProvider: true,
        subscriptionExpiresAt: true,
        monthlyReplyLimit: true,
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

    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const monthlyUsage =
      await this.prisma.client.workspaceMonthlyUsage.findUnique({
        where: { workspaceId_monthStart: { workspaceId, monthStart } },
      });
    const monthlyReplyLimit =
      workspace?.monthlyReplyLimit ?? tierLimits.maxMessagesPerMonth;
    const repliesUsed = monthlyUsage?.aiReplies || 0;

    return {
      workspace: {
        ...workspace,
        limits: tierLimits,
        usage: {
          agents: agentCount,
          documents: docCount,
          aiRepliesUsed: repliesUsed,
          aiRepliesRemaining: Math.max(0, monthlyReplyLimit - repliesUsed),
          aiRepliesLimit: monthlyReplyLimit,
          tokensUsed: Math.max(
            0,
            tierLimits.maxMessagesPerMonth - (workspace?.tokenBalance || 0),
          ),
        },
      },
    };
  }
}
