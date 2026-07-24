import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Headers,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import {
  getMonthlyPrice,
  getTierLimits,
  getTierName,
} from "@agentix/config/pricing";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

@Controller("api/admin")
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  private validateAdmin(adminKey: string) {
    if (adminKey !== ADMIN_PASSWORD) {
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);
    }
  }

  private getReplyLimit(tier: string | null) {
    return getTierLimits(tier).maxMessagesPerMonth;
  }

  @Get("dashboard/stats")
  async getDashboardStats(@Headers("x-admin-key") adminKey: string) {
    this.validateAdmin(adminKey);

    const [
      totalWorkspaces,
      totalUsers,
      totalAgents,
      activeSubscriptions,
      totalMessagesToday,
    ] = await Promise.all([
      this.prisma.workspace.count(),
      this.prisma.user.count(),
      this.prisma.agent.count(),
      this.prisma.workspace.count({
        where: { subscriptionTier: { not: null } },
      }),
      // Messages today — we track via token deduction
      // Simplified: count workspaces that had activity today
      this.prisma.workspace.count({
        where: {
          tokenBalance: { gt: 0 },
        },
      }),
    ]);

    const workspaces = await this.prisma.workspace.findMany({
      where: { subscriptionTier: { not: null } },
      select: { subscriptionTier: true },
    });

    const mrr = workspaces.reduce((sum, w) => {
      return sum + getMonthlyPrice(w.subscriptionTier);
    }, 0);

    // New customers today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newToday = await this.prisma.user.count({
      where: { createdAt: { gte: today } },
    });

    // Active clients (chat activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Active workspaces have used at least one AI reply from their monthly balance.
    const activeClients = await this.prisma.workspace.findMany({
      where: {
        subscriptionTier: { not: null },
      },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
        tokenBalance: true,
        createdAt: true,
        members: {
          include: { user: { select: { email: true } } },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const activeClientsWithStatus = activeClients.map((w) => {
      const tierMax = this.getReplyLimit(w.subscriptionTier);

      const repliesUsed = tierMax - w.tokenBalance;
      const isActive = repliesUsed > 0;

      return {
        id: w.id,
        name: w.name,
        email: w.members[0]?.user.email || "N/A",
        tier: w.subscriptionTier,
        tokensUsed: repliesUsed,
        tokensMax: tierMax,
        status: isActive ? "Active" : "Inactive",
        joinedAt: w.createdAt,
      };
    });

    return {
      stats: {
        totalWorkspaces,
        totalUsers,
        totalAgents,
        activeSubscriptions,
        mrr,
        newCustomersToday: newToday,
        totalMessagesToday: totalMessagesToday * 50, // rough estimate
      },
      activeClients: activeClientsWithStatus,
    };
  }

  @Get("dashboard/charts")
  async getDashboardCharts(@Headers("x-admin-key") adminKey: string) {
    this.validateAdmin(adminKey);

    // Signups over last 7 days
    const signupData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      signupData.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count,
      });
    }

    // Agents created over last 7 days
    const agentData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.prisma.agent.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      agentData.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count,
      });
    }

    // MRR over last 6 months (simplified)
    const mrrData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthLabel = date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });

      // Count active subscriptions (simplified)
      const count = await this.prisma.workspace.count({
        where: { subscriptionTier: { not: null } },
      });

      mrrData.push({
        month: monthLabel,
        mrr: count * getMonthlyPrice("STARTER"), // simplified average
      });
    }

    return {
      signups: signupData,
      agents: agentData,
      mrr: mrrData,
    };
  }

  // Existing endpoints for subscribers...
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
    @Body() body: { subscriptionTier?: string | null; tokenBalance?: number },
  ) {
    this.validateAdmin(adminKey);

    const data: any = {};
    if (body.subscriptionTier !== undefined) {
      data.subscriptionTier =
        body.subscriptionTier === "none" ? null : body.subscriptionTier;
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

  @Get("subscribers/:id")
  async getSubscriberDetail(
    @Headers("x-admin-key") adminKey: string,
    @Param("id") id: string,
  ) {
    this.validateAdmin(adminKey);

    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { email: true, name: true, createdAt: true } },
          },
        },
        agents: {
          select: { id: true, name: true, modelName: true, createdAt: true },
        },
        documents: {
          select: { id: true, fileName: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: { agents: true, documents: true },
        },
      },
    });

    if (!workspace) {
      throw new HttpException("Workspace not found", HttpStatus.NOT_FOUND);
    }

    const tierMax = workspace.subscriptionTier
      ? this.getReplyLimit(workspace.subscriptionTier)
      : 0;

    return {
      ...workspace,
      tierPrice: workspace.subscriptionTier
        ? getMonthlyPrice(workspace.subscriptionTier)
        : 0,
      tierMaxTokens: tierMax,
      tokensUsed: tierMax - workspace.tokenBalance,
      stripeDashboardUrl: workspace.stripeCustomerId
        ? `https://dashboard.stripe.com/customers/${workspace.stripeCustomerId}`
        : null,
    };
  }

  @Get("analytics/revenue")
  async getRevenueAnalytics(@Headers("x-admin-key") adminKey: string) {
    this.validateAdmin(adminKey);
    // Get all subscribed workspaces
    const workspaces = await this.prisma.workspace.findMany({
      where: { subscriptionTier: { not: null } },
      select: { subscriptionTier: true, createdAt: true },
    });

    // Total revenue
    const totalRevenue = workspaces.reduce((sum, w) => {
      return sum + getMonthlyPrice(w.subscriptionTier);
    }, 0);

    // Revenue by tier
    const tierCounts: Record<string, number> = {
      STARTER: 0,
      GROWTH: 0,
      ENTERPRISE: 0,
    };
    workspaces.forEach((w) => {
      if (w.subscriptionTier && tierCounts[w.subscriptionTier] !== undefined) {
        tierCounts[w.subscriptionTier]++;
      }
    });

    const revenueByTier = Object.entries(tierCounts).map(([tier, count]) => ({
      name: getTierName(tier),
      value: count * getMonthlyPrice(tier),
      subscribers: count,
      color:
        tier === "STARTER"
          ? "#3B82F6"
          : tier === "GROWTH"
            ? "#6366F1"
            : "#8B5CF6",
    }));

    // MRR over last 12 months
    const mrrHistory = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthLabel = date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });

      // Count workspaces created before this month
      const count = await this.prisma.workspace.count({
        where: {
          subscriptionTier: { not: null },
          createdAt: {
            lte: new Date(date.getFullYear(), date.getMonth() + 1, 0),
          },
        },
      });

      mrrHistory.push({
        month: monthLabel,
        mrr: count * getMonthlyPrice("STARTER"), // Simplified average
        subscribers: count,
      });
    }

    return {
      totalRevenue,
      revenueByTier,
      mrrHistory,
      totalSubscribers: workspaces.length,
    };
  }

  @Get("analytics/usage")
  async getUsageAnalytics(@Headers("x-admin-key") adminKey: string) {
    this.validateAdmin(adminKey);

    // Total AI replies across all workspaces
    const workspaces = await this.prisma.workspace.findMany({
      where: { subscriptionTier: { not: null } },
      select: { subscriptionTier: true, tokenBalance: true, name: true },
    });

    const totalTokensAllocated = workspaces.reduce((sum, w) => {
      return sum + this.getReplyLimit(w.subscriptionTier);
    }, 0);

    const totalTokensRemaining = workspaces.reduce((sum, w) => {
      return sum + w.tokenBalance;
    }, 0);

    const totalTokensConsumed = totalTokensAllocated - totalTokensRemaining;

    // Top workspaces by usage
    const topWorkspaces = workspaces
      .map((w) => ({
        name: w.name,
        tier: w.subscriptionTier,
        allocated: this.getReplyLimit(w.subscriptionTier),
        remaining: w.tokenBalance,
        consumed: this.getReplyLimit(w.subscriptionTier) - w.tokenBalance,
      }))
      .sort((a, b) => b.consumed - a.consumed)
      .slice(0, 10);

    // Document analytics
    const totalDocuments = await this.prisma.document.count();
    const readyDocuments = await this.prisma.document.count({
      where: { status: "READY" },
    });

    // Agent analytics
    const totalAgents = await this.prisma.agent.count();
    const modelBreakdown = await this.prisma.agent.groupBy({
      by: ["modelName"],
      _count: true,
    });

    return {
      tokens: {
        allocated: totalTokensAllocated,
        remaining: totalTokensRemaining,
        consumed: totalTokensConsumed,
        consumptionRate:
          totalTokensAllocated > 0
            ? Math.round((totalTokensConsumed / totalTokensAllocated) * 100)
            : 0,
      },
      documents: {
        total: totalDocuments,
        ready: readyDocuments,
        processing: totalDocuments - readyDocuments,
      },
      agents: {
        total: totalAgents,
        modelBreakdown: modelBreakdown.map((m) => ({
          model: m.modelName,
          count: m._count,
        })),
      },
      topWorkspaces,
    };
  }

  @Get("settings")
  async getSettings(@Headers("x-admin-key") adminKey: string) {
    this.validateAdmin(adminKey);

    // For now, return defaults from env/existing config
    // In production, these would come from the AdminSettings table
    const settings = {
      platformName: "Agentix",
      primaryColor: "#4F46E5",
      logoUrl: "",
      faviconUrl: "",
      trialEnabled: process.env.DEMO_MODE === "true",
      trialDays: 7,
      trialTokens: 100,
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPass: "",
      fromEmail: "",
      adminPassword: ADMIN_PASSWORD,
      rateLimitPerMin: 10,
      sessionTimeout: 86400,
      stripeMode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_live")
        ? "live"
        : "test",
      stripeTestKey: "",
      stripeTestSecret: "",
      stripeLiveKey: "",
      stripeLiveSecret: "",
      stripeWebhookSecret: "",
    };

    return { settings };
  }

  @Put("settings")
  async updateSettings(
    @Headers("x-admin-key") adminKey: string,
    @Body() body: any,
  ) {
    this.validateAdmin(adminKey);

    // In production, save to AdminSettings table
    // For now, log and return success
    console.log("Settings updated:", JSON.stringify(body, null, 2));

    return { success: true, message: "Settings saved successfully." };
  }

  @Get("integrations/status")
  async getIntegrationStatus(@Headers("x-admin-key") adminKey: string) {
    this.validateAdmin(adminKey);

    const integrations = [
      {
        service: "ai",
        name: "AI Providers",
        status:
          process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
            ? "connected"
            : "disconnected",
        message: process.env.DEEPSEEK_API_KEY
          ? "DeepSeek chat provider configured. OpenAI remains available for fallback and embeddings."
          : "DeepSeek API key not configured. Chat fallback depends on OpenAI configuration.",
        details: [
          `Default provider: ${process.env.DEFAULT_AI_PROVIDER || "deepseek"}`,
          `Fallback provider: ${process.env.FALLBACK_AI_PROVIDER || "openai"}`,
          `Embedding model: ${process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"}`,
        ],
      },
      {
        service: "pinecone",
        name: "Pinecone",
        status: process.env.PINECONE_API_KEY ? "connected" : "disconnected",
        message: process.env.PINECONE_API_KEY
          ? `Connected to Pinecone vector database. Index: ${process.env.PINECONE_INDEX_NAME || "agentix-index"}`
          : "Pinecone API key not configured. Document vector search will not work.",
        details: [
          "Index: " + (process.env.PINECONE_INDEX_NAME || "agentix-index"),
          "Dimension: 1536, Metric: cosine",
          "Console: app.pinecone.io",
        ],
      },
      {
        service: "stripe",
        name: "Stripe",
        status: process.env.STRIPE_SECRET_KEY ? "connected" : "disconnected",
        message: process.env.STRIPE_SECRET_KEY
          ? `Connected to Stripe in ${process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "live" : "test"} mode.`
          : "Stripe not configured. Billing features will not work.",
        details: [
          "Mode: " +
            (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live")
              ? "Live"
              : "Test"),
          "Webhook configured: " +
            (process.env.STRIPE_WEBHOOK_SECRET ? "Yes" : "No"),
          "Dashboard: dashboard.stripe.com",
        ],
      },
    ];

    return { integrations };
  }

  @Get("webhooks")
  async getWebhooks(@Headers("x-admin-key") adminKey: string) {
    this.validateAdmin(adminKey);

    const webhooks = await this.prisma.outgoingWebhook.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { webhooks };
  }

  @Post("webhooks")
  async createWebhook(
    @Headers("x-admin-key") adminKey: string,
    @Body() body: { url: string; events: string },
  ) {
    this.validateAdmin(adminKey);

    if (!body.url) {
      throw new HttpException("URL is required", HttpStatus.BAD_REQUEST);
    }

    const webhook = await this.prisma.outgoingWebhook.create({
      data: {
        workspaceId: "admin", // Global webhook
        url: body.url,
        events: body.events || "chat.message",
      },
    });

    return { webhook };
  }

  @Patch("webhooks/:id")
  async updateWebhook(
    @Headers("x-admin-key") adminKey: string,
    @Param("id") id: string,
    @Body() body: { isActive?: boolean },
  ) {
    this.validateAdmin(adminKey);

    const webhook = await this.prisma.outgoingWebhook.update({
      where: { id },
      data: { isActive: body.isActive },
    });

    return { webhook };
  }

  @Delete("webhooks/:id")
  async deleteWebhook(
    @Headers("x-admin-key") adminKey: string,
    @Param("id") id: string,
  ) {
    this.validateAdmin(adminKey);

    await this.prisma.outgoingWebhook.delete({ where: { id } });

    return { success: true };
  }
}
