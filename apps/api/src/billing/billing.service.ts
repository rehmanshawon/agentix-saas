import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import Stripe from "stripe";

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

    return { url: session.url };
  }
}
