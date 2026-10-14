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
  LOCAL_SERVICE_PLANS,
  SAAS_PRICING,
} from "@agentix/config/pricing";
import { hash } from "bcryptjs";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

@Controller("api/admin")
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  private validateAdmin(adminKey: string) {
    if (!ADMIN_PASSWORD || adminKey !== ADMIN_PASSWORD) {
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);
    }
  }

  private getReplyLimit(tier: string | null) {
    return getTierLimits(tier).maxMessagesPerMonth;
  }

  private parseSubscriptionDate(
    value: string | null,
    fieldName: string,
    endOfDay = false,
  ): Date | null {
    if (value === null) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new HttpException(
        `${fieldName} must be a valid date.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      date.setUTCHours(23, 59, 59, 999);
    }
    return date;
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

    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const workspaces = await this.prisma.workspace.findMany({
      include: {
        members: {
          include: { user: { select: { email: true, name: true } } },
          take: 1,
        },
        monthlyUsage: {
          where: { monthStart },
          select: { aiReplies: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      workspaces: workspaces.map((workspace) => {
        const aiRepliesLimit =
          workspace.monthlyReplyLimit ??
          this.getReplyLimit(workspace.subscriptionTier);
        const aiRepliesUsed = workspace.monthlyUsage[0]?.aiReplies ?? 0;
        const { monthlyUsage, ...workspaceDetails } = workspace;

        return {
          ...workspaceDetails,
          aiRepliesUsed,
          aiRepliesLimit,
          aiRepliesRemaining: Math.max(0, aiRepliesLimit - aiRepliesUsed),
        };
      }),
    };
  }

  @Post("workspaces")
  async createWorkspace(
    @Headers("x-admin-key") adminKey: string,
    @Body()
    body: {
      email: string;
      name?: string;
      password?: string;
      subscriptionTier?: string | null;
      subscriptionStatus?: string | null;
      billingProvider?: string | null;
      subscriptionStartDate?: string | null;
      subscriptionExpiresAt?: string | null;
      subscriptionNotes?: string | null;
      monthlyReplyLimit?: number | null;
    },
  ) {
    this.validateAdmin(adminKey);

    if (
      !body.email ||
      typeof body.email !== "string" ||
      !body.email.includes("@")
    ) {
      throw new HttpException(
        "A valid client email is required.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const email = body.email.trim().toLowerCase();
    const validTiers = new Set([
      ...Object.keys(SAAS_PRICING),
      ...LOCAL_SERVICE_PLANS.map((plan) => plan.id),
    ]);

    const tier =
      body.subscriptionTier && body.subscriptionTier !== "none"
        ? body.subscriptionTier
        : null;

    if (tier && !validTiers.has(tier)) {
      throw new HttpException(
        "Invalid subscription plan.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const status = body.subscriptionStatus || "active";
    if (
      !["active", "manual", "past_due", "canceled", "expired"].includes(status)
    ) {
      throw new HttpException(
        "Invalid subscription status.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const billingProvider = body.billingProvider || "manual";
    if (!["stripe", "paddle", "manual"].includes(billingProvider)) {
      throw new HttpException(
        "Invalid billing provider.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const startDate = body.subscriptionStartDate
      ? this.parseSubscriptionDate(
          body.subscriptionStartDate,
          "Subscription start date",
        )
      : new Date();

    let expiresAt: Date | null = null;
    if (body.subscriptionExpiresAt) {
      expiresAt = this.parseSubscriptionDate(
        body.subscriptionExpiresAt,
        "Subscription expiry date",
        true,
      );
    } else if (
      tier &&
      (tier.startsWith("BD_") || billingProvider === "manual")
    ) {
      // Default to 1 year for annual manual/BD subscriptions
      expiresAt = new Date(startDate || new Date());
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    const tierLimits = getTierLimits(tier);
    const replyLimit =
      body.monthlyReplyLimit !== undefined && body.monthlyReplyLimit !== null
        ? body.monthlyReplyLimit
        : tierLimits.maxMessagesPerMonth;

    if (replyLimit < 0) {
      throw new HttpException(
        "Monthly reply limit must be non-negative.",
        HttpStatus.BAD_REQUEST,
      );
    }

    // 1. Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    const clientPassword =
      body.password?.trim() ||
      `Agentix-${Math.random().toString(36).slice(-8)}`;

    if (!user) {
      const passwordHash = await hash(clientPassword, 10);
      user = await this.prisma.user.create({
        data: {
          email,
          name: body.name?.trim() || email.split("@")[0],
          passwordHash,
        },
      });
    }

    // 2. Create workspace
    const workspaceName =
      body.name?.trim() ||
      `${user.name || email.split("@")[0]}'s Workspace`;

    const workspace = await this.prisma.workspace.create({
      data: {
        name: workspaceName,
        subscriptionTier: tier,
        subscriptionStatus: status,
        billingProvider,
        subscriptionStartDate: startDate,
        subscriptionExpiresAt: expiresAt,
        monthlyReplyLimit: replyLimit,
        tokenBalance: replyLimit,
        subscriptionNotes: body.subscriptionNotes?.trim() || null,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    // 3. Create initial default Agent
    await this.prisma.agent.create({
      data: {
        workspaceId: workspace.id,
        name: "Support Assistant",
        systemPrompt: "You are a helpful customer support AI.",
        modelName: "default",
        colorHex: "#10B981",
      },
    });

    return {
      success: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        subscriptionTier: workspace.subscriptionTier,
        subscriptionStatus: workspace.subscriptionStatus,
        billingProvider: workspace.billingProvider,
        subscriptionStartDate: workspace.subscriptionStartDate,
        subscriptionExpiresAt: workspace.subscriptionExpiresAt,
        monthlyReplyLimit: workspace.monthlyReplyLimit,
        tokenBalance: workspace.tokenBalance,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      temporaryPassword: body.password ? undefined : clientPassword,
    };
  }

  @Delete("workspaces/:id")
  async deleteWorkspace(
    @Headers("x-admin-key") adminKey: string,
    @Param("id") id: string,
  ) {
    this.validateAdmin(adminKey);

    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });
    if (!workspace) {
      throw new HttpException("Workspace not found", HttpStatus.NOT_FOUND);
    }

    // Clean up dependent relations
    await this.prisma.client.$transaction(async (tx) => {
      await tx.workspaceMonthlyUsage.deleteMany({ where: { workspaceId: id } });
      await tx.document.deleteMany({ where: { workspaceId: id } });
      await tx.agent.deleteMany({ where: { workspaceId: id } });
      await tx.workspaceMember.deleteMany({ where: { workspaceId: id } });
      await tx.workspace.delete({ where: { id } });
    });

    return { success: true, message: `Workspace ${id} deleted.` };
  }

  @Patch("workspaces/:id")
  async updateWorkspace(
    @Headers("x-admin-key") adminKey: string,
    @Param("id") id: string,
    @Body()
    body: {
      subscriptionTier?: string | null;
      tokenBalance?: number;
      subscriptionStatus?: string | null;
      billingProvider?: string | null;
      subscriptionStartDate?: string | null;
      subscriptionExpiresAt?: string | null;
      subscriptionNotes?: string | null;
      monthlyReplyLimit?: number | null;
    },
  ) {
    this.validateAdmin(adminKey);

    const validTiers = new Set([
      ...Object.keys(SAAS_PRICING),
      ...LOCAL_SERVICE_PLANS.map((plan) => plan.id),
    ]);
    if (
      body.subscriptionTier !== undefined &&
      body.subscriptionTier !== null &&
      body.subscriptionTier !== "none" &&
      !validTiers.has(body.subscriptionTier)
    ) {
      throw new HttpException("Invalid subscription plan.", HttpStatus.BAD_REQUEST);
    }
    if (
      body.subscriptionStatus !== undefined &&
      body.subscriptionStatus !== null &&
      !["active", "manual", "past_due", "canceled", "expired"].includes(
        body.subscriptionStatus,
      )
    ) {
      throw new HttpException(
        "Invalid subscription status.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      body.billingProvider !== undefined &&
      body.billingProvider !== null &&
      !["stripe", "paddle", "manual"].includes(body.billingProvider)
    ) {
      throw new HttpException(
        "Invalid billing provider.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      body.tokenBalance !== undefined &&
      (!Number.isInteger(body.tokenBalance) || body.tokenBalance < 0)
    ) {
      throw new HttpException(
        "AI reply balance must be a non-negative integer.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      body.monthlyReplyLimit !== undefined &&
      body.monthlyReplyLimit !== null &&
      (!Number.isInteger(body.monthlyReplyLimit) || body.monthlyReplyLimit < 1)
    ) {
      throw new HttpException(
        "Monthly AI reply limit must be a positive integer.",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      body.subscriptionNotes !== undefined &&
      body.subscriptionNotes !== null &&
      (typeof body.subscriptionNotes !== "string" ||
        body.subscriptionNotes.length > 5000)
    ) {
      throw new HttpException(
        "Subscription notes must be 5,000 characters or fewer.",
        HttpStatus.BAD_REQUEST,
      );
    }

    const data: any = {};
    if (body.subscriptionTier !== undefined) {
      data.subscriptionTier =
        body.subscriptionTier === "none" ? null : body.subscriptionTier;
    }
    if (body.tokenBalance !== undefined) {
      data.tokenBalance = body.tokenBalance;
    }
    if (body.subscriptionStatus !== undefined) {
      data.subscriptionStatus = body.subscriptionStatus;
    }
    if (body.billingProvider !== undefined) {
      data.billingProvider = body.billingProvider;
    }
    if (body.subscriptionStartDate !== undefined) {
      data.subscriptionStartDate = this.parseSubscriptionDate(
        body.subscriptionStartDate,
        "Subscription start date",
      );
    }
    if (body.subscriptionExpiresAt !== undefined) {
      data.subscriptionExpiresAt = this.parseSubscriptionDate(
        body.subscriptionExpiresAt,
        "Subscription expiry date",
        true,
      );
    }
    if (body.subscriptionNotes !== undefined) {
      data.subscriptionNotes = body.subscriptionNotes;
    }
    if (body.monthlyReplyLimit !== undefined) {
      data.monthlyReplyLimit = body.monthlyReplyLimit;
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

    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const monthlyUsage =
      await this.prisma.client.workspaceMonthlyUsage.findUnique({
        where: {
          workspaceId_monthStart: {
            workspaceId: id,
            monthStart,
          },
        },
      });
    const replyLimit =
      workspace.monthlyReplyLimit ??
      this.getReplyLimit(workspace.subscriptionTier);
    const repliesUsed = monthlyUsage?.aiReplies ?? 0;
    const tierMax = this.getReplyLimit(workspace.subscriptionTier);

    return {
      ...workspace,
      tierPrice: workspace.subscriptionTier
        ? getMonthlyPrice(workspace.subscriptionTier)
        : 0,
      tierMaxTokens: tierMax,
      tokensUsed: tierMax - workspace.tokenBalance,
      aiRepliesUsed: repliesUsed,
      aiRepliesLimit: replyLimit,
      aiRepliesRemaining: Math.max(0, replyLimit - repliesUsed),
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
