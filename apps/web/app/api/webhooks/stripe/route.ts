import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "../../../../lib/prisma";
import { getPlanByStripePriceId } from "@agentix/config/pricing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.client_reference_id;
        const stripeCustomerId = session.customer as string;

        if (!workspaceId)
          throw new Error("No workspace ID provided in checkout session");

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );
        const priceId = subscription.items.data[0].price.id;

        const selectedTier = getPlanByStripePriceId(priceId);

        if (!selectedTier)
          throw new Error("Purchased price ID not found in pricing config");

        await prisma.workspace.update({
          where: { id: workspaceId },
          data: {
            stripeCustomerId: stripeCustomerId,
            subscriptionTier: selectedTier.id,
            tokenBalance: selectedTier.limits.maxMessagesPerMonth,
          },
        });

        console.log(
          `[Stripe] Workspace ${workspaceId} upgraded to ${selectedTier.name}`,
        );
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;
        const priceId = subscription.items.data[0].price.id;

        const updatedTier = getPlanByStripePriceId(priceId);

        if (subscription.status === "active" && updatedTier) {
          await prisma.workspace.updateMany({
            where: { stripeCustomerId: stripeCustomerId },
            data: {
              subscriptionTier: updatedTier.id,
              tokenBalance: updatedTier.limits.maxMessagesPerMonth,
            },
          });

          console.log(
            `[Stripe] Customer ${stripeCustomerId} renewed/updated to ${updatedTier.name}`,
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;

        await prisma.workspace.updateMany({
          where: { stripeCustomerId: stripeCustomerId },
          data: {
            subscriptionTier: null,
            tokenBalance: 0,
          },
        });

        console.log(
          `[Stripe] Customer ${stripeCustomerId} canceled. Subscription removed.`,
        );
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error: any) {
    console.error(`Error processing webhook: ${error.message}`);
    return new NextResponse("Webhook handler failed, but event received", {
      status: 200,
    });
  }

  return new NextResponse("Success", { status: 200 });
}
