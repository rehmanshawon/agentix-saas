import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ChatService } from "../ai/chat.service";
import { PrismaService } from "../database/prisma.service";
import { getTierLimits } from "@agentix/config/pricing";

interface ChatRequestDto {
  agentId: string;
  message: string;
  sessionId?: string;
}

@Controller("api/chat")
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("config")
  async getBuilderConfig(@Query("email") email: string) {
    if (!email) {
      throw new HttpException("Missing email", HttpStatus.BAD_REQUEST);
    }
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { workspaces: true },
    });
    const workspaceId = user?.workspaces[0]?.workspaceId;
    if (!workspaceId) return { agent: null };

    const agent = await this.prisma.agent.findFirst({
      where: { workspaceId },
    });
    return { agent };
  }

  @Post("config")
  async saveBuilderConfig(@Body() body: any) {
    const { email, name, systemPrompt, model, primaryColor } = body;
    if (!email) {
      throw new HttpException("Missing email", HttpStatus.BAD_REQUEST);
    }

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { workspaces: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { email },
        include: { workspaces: true },
      });
    }

    let workspaceId = user.workspaces[0]?.workspaceId;
    if (!workspaceId) {
      const newWorkspace = await this.prisma.workspace.create({
        data: {
          name: "My Workspace",
          tokenBalance: 0,
          subscriptionTier: null,
          members: { create: { userId: user.id, role: "OWNER" } },
        },
      });
      workspaceId = newWorkspace.id;
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new HttpException("Workspace not found", HttpStatus.NOT_FOUND);
    }

    const subscriptionExpired =
      workspace.subscriptionExpiresAt !== null &&
      workspace.subscriptionExpiresAt <= new Date();
    const subscriptionInactive =
      workspace.subscriptionStatus !== null &&
      !["active", "manual"].includes(workspace.subscriptionStatus);
    if (subscriptionExpired || subscriptionInactive) {
      throw new HttpException(
        "This workspace subscription is inactive or expired.",
        HttpStatus.FORBIDDEN,
      );
    }

    const existingAgent = await this.prisma.agent.findFirst({
      where: { workspaceId },
    });

    let agent;
    if (existingAgent) {
      agent = await this.prisma.agent.update({
        where: { id: existingAgent.id },
        data: { name, systemPrompt, modelName: model, colorHex: primaryColor },
      });
    } else {
      // Enforce agent limit
      const currentAgentCount = await this.prisma.agent.count({
        where: { workspaceId },
      });

      const limits = getTierLimits(workspace?.subscriptionTier || null);

      if (currentAgentCount >= limits.maxAgents) {
        throw new HttpException(
          `Agent limit reached (${limits.maxAgents} max). Upgrade your plan to create more agents.`,
          HttpStatus.FORBIDDEN,
        );
      }

      agent = await this.prisma.agent.create({
        data: {
          workspaceId,
          name,
          systemPrompt,
          modelName: model,
          colorHex: primaryColor,
        },
      });
    }

    return { success: true, agent };
  }

  @Get(":agentId")
  async getAgentConfig(@Param("agentId") agentId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      select: { name: true, colorHex: true },
    });

    if (!agent) {
      throw new HttpException("Agent not found", HttpStatus.NOT_FOUND);
    }

    return agent;
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post("message")
  async handleIncomingMessage(@Body() body: ChatRequestDto) {
    const { agentId, message } = body;

    if (
      typeof agentId !== "string" ||
      !agentId ||
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 4000
    ) {
      throw new HttpException(
        "A valid agentId and message of at most 4,000 characters are required.",
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      this.logger.log(`Received message for Agent ${agentId}.`);

      const agent = await this.prisma.agent.findUnique({
        where: { id: agentId },
        include: { workspace: true },
      });

      if (!agent) {
        throw new HttpException(
          "Agent not found or inactive",
          HttpStatus.NOT_FOUND,
        );
      }

      const subscriptionExpired =
        agent.workspace.subscriptionExpiresAt !== null &&
        agent.workspace.subscriptionExpiresAt <= new Date();
      const subscriptionInactive =
        agent.workspace.subscriptionStatus !== null &&
        !["active", "manual"].includes(agent.workspace.subscriptionStatus);

      // Check if workspace has an active subscription.
      if (
        !agent.workspace.subscriptionTier ||
        subscriptionExpired ||
        subscriptionInactive
      ) {
        return {
          reply:
            "This AI agent requires an active subscription. Please contact the site owner to upgrade their plan.",
        };
      }

      const now = new Date();
      const monthStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );
      const monthlyUsage =
        await this.prisma.client.workspaceMonthlyUsage.findUnique({
          where: {
            workspaceId_monthStart: {
              workspaceId: agent.workspaceId,
              monthStart,
            },
          },
        });
      const monthlyReplyLimit =
        agent.workspace.monthlyReplyLimit ??
        getTierLimits(agent.workspace.subscriptionTier).maxMessagesPerMonth;

      if (!monthlyUsage) {
        await this.prisma.client.workspace.update({
          where: { id: agent.workspaceId },
          data: { tokenBalance: monthlyReplyLimit },
        });
      }

      const currentReplyBalance = monthlyUsage
        ? agent.workspace.tokenBalance
        : monthlyReplyLimit;

      if (
        currentReplyBalance <= 0 ||
        (monthlyUsage?.aiReplies ?? 0) >= monthlyReplyLimit
      ) {
        return {
          reply:
            "This AI agent has reached its monthly AI reply limit. Please contact the site owner to upgrade their plan.",
        };
      }

      const aiResponse = await this.chatService.generateAnswer(
        agent.workspaceId,
        agent.id,
        agent.systemPrompt,
        message,
      );

      await this.prisma.client.$transaction(async (transaction) => {
        await transaction.workspaceMonthlyUsage.upsert({
          where: {
            workspaceId_monthStart: {
              workspaceId: agent.workspaceId,
              monthStart,
            },
          },
          create: {
            workspaceId: agent.workspaceId,
            monthStart,
            aiReplies: 0,
          },
          update: {},
        });

        const usageUpdate = await transaction.workspaceMonthlyUsage.updateMany({
          where: {
            workspaceId: agent.workspaceId,
            monthStart,
            aiReplies: { lt: monthlyReplyLimit },
          },
          data: { aiReplies: { increment: 1 } },
        });

        if (usageUpdate.count !== 1) {
          throw new HttpException(
            "This AI agent has reached its monthly AI reply limit.",
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        const updatedWorkspace = await transaction.workspace.updateMany({
          where: { id: agent.workspaceId, tokenBalance: { gt: 0 } },
          data: { tokenBalance: { decrement: 1 } },
        });

        if (updatedWorkspace.count !== 1) {
          throw new HttpException(
            "This AI agent has reached its monthly AI reply limit.",
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      });

      return { reply: aiResponse };
    } catch (error: any) {
      this.logger.error(`Error processing chat: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        "The chat agent encountered an error.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
