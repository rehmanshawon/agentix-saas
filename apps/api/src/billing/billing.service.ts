import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import Stripe from "stripe";

interface BillingWorkspaceResult {
  workspaceId: string;
  email: string;
}

@Injectable()
export class BillingService {
  private stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2024-06-20",
    });
  }

  async createCheckoutSession(
    email: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const { workspaceId } = await this.findOrCreateBillingWorkspace(email);

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) throw new BadRequestException("Workspace not found");

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: workspace.stripeCustomerId || undefined,
      client_reference_id: workspaceId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return { url: session.url, provider: "stripe" };
  }

  async createPaddleCheckout(
    email: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) {
      throw new BadRequestException("Paddle is not configured.");
    }

    const { workspaceId } = await this.findOrCreateBillingWorkspace(email);
    const apiBase =
      process.env.PADDLE_ENVIRONMENT === "sandbox"
        ? "https://sandbox-api.paddle.com"
        : "https://api.paddle.com";

    const checkoutBaseUrl =
      process.env.PADDLE_CHECKOUT_BASE_URL ||
      `${new URL(successUrl).origin}/checkout/paddle`;

    const response = await fetch(`${apiBase}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        custom_data: {
          workspaceId,
          email,
          priceId,
          billingProvider: "paddle",
        },
        checkout: {
          url: checkoutBaseUrl,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      this.logger.error(
        `Paddle checkout creation failed: ${JSON.stringify(data).slice(0, 500)}`,
      );
      throw new BadRequestException("Failed to create Paddle checkout.");
    }

    const checkoutUrl = data?.data?.checkout?.url;
    if (!checkoutUrl) {
      throw new BadRequestException("Paddle did not return a checkout URL.");
    }

    return { url: checkoutUrl, provider: "paddle" };
  }

  private async findOrCreateBillingWorkspace(
    email: string,
  ): Promise<BillingWorkspaceResult> {
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

    return { workspaceId, email: user.email };
  }
}
