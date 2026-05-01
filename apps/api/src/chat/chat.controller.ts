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

interface ChatRequestDto {
  agentId: string;
  message: string;
  sessionId?: string;
}

function getTierLimits(tier: string | null) {
  switch (tier) {
    case "STARTER":
      return { maxAgents: 1, maxMessagesPerMonth: 500 };
    case "GROWTH":
      return { maxAgents: 5, maxMessagesPerMonth: 5000 };
    case "ENTERPRISE":
      return { maxAgents: 20, maxMessagesPerMonth: 25000 };
    default:
      return { maxAgents: 1, maxMessagesPerMonth: 0 };
  }
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
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

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

    if (!agentId || !message) {
      throw new HttpException(
        "Missing agentId or message",
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      this.logger.log(
        `Received message for Agent ${agentId}: "${message.substring(0, 50)}..."`,
      );

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

      // Check if workspace has an active subscription
      if (!agent.workspace.subscriptionTier) {
        return {
          reply:
            "This AI agent requires an active subscription. Please contact the site owner to upgrade their plan.",
        };
      }

      // Token balance check
      if (agent.workspace.tokenBalance <= 0) {
        return {
          reply:
            "This AI agent has reached its monthly message limit. Please contact the site owner to upgrade their plan.",
        };
      }

      const aiResponse = await this.chatService.generateAnswer(
        agent.workspaceId,
        agent.id,
        agent.systemPrompt,
        message,
      );

      // Deduct token
      await this.prisma.workspace.update({
        where: { id: agent.workspaceId },
        data: {
          tokenBalance: {
            decrement: 1,
          },
        },
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
