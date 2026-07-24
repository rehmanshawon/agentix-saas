import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getPlanByPaddlePriceId } from "@agentix/config/pricing";

interface PaddleEvent {
  event_type: string;
  data?: {
    status?: string;
    custom_data?: {
      workspaceId?: string;
      priceId?: string;
      billingProvider?: string;
    };
    items?: Array<{
      price?: {
        id?: string;
      };
    }>;
  };
}

function verifyPaddleSignature(rawBody: string, signatureHeader: string) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(";").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );

  const timestamp = parts.ts;
  const signature = parts.h1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}:${rawBody}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  return (
    signatureBuffer.length === expectedBuffer.length &&
    timingSafeEqual(signatureBuffer, expectedBuffer)
  );
}

function getPaddlePriceId(event: PaddleEvent) {
  return (
    event.data?.custom_data?.priceId || event.data?.items?.[0]?.price?.id || ""
  );
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature") || "";

  if (!verifyPaddleSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody) as PaddleEvent;
    const workspaceId = event.data?.custom_data?.workspaceId;
    const priceId = getPaddlePriceId(event);
    const selectedPlan = getPlanByPaddlePriceId(priceId);

    if (!workspaceId) {
      console.warn("[Paddle] Webhook missing workspaceId custom_data");
      return NextResponse.json({ received: true });
    }

    switch (event.event_type) {
      case "transaction.completed":
      case "subscription.activated":
      case "subscription.updated": {
        if (!selectedPlan) {
          console.warn(`[Paddle] Unknown price ID: ${priceId}`);
          return NextResponse.json({ received: true });
        }

        await prisma.workspace.update({
          where: { id: workspaceId },
          data: {
            subscriptionTier: selectedPlan.id,
            tokenBalance: selectedPlan.limits.maxMessagesPerMonth,
          },
        });

        console.log(
          `[Paddle] Workspace ${workspaceId} activated as ${selectedPlan.name}`,
        );
        break;
      }

      case "subscription.canceled":
      case "subscription.past_due": {
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: {
            subscriptionTier: null,
            tokenBalance: 0,
          },
        });
        console.log(`[Paddle] Workspace ${workspaceId} suspended`);
        break;
      }

      default:
        console.log(`[Paddle] Unhandled event type ${event.event_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`[Paddle] Webhook handler failed: ${error.message}`);
    return NextResponse.json({ received: true });
  }
}
