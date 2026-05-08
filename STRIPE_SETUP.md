## `STRIPE_SETUP.md`

````markdown
# 💳 Stripe Setup Guide for Agentix

This guide walks you through connecting Stripe billing to your Agentix SaaS platform.

---

## 1. Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Toggle between **Test Mode** and **Live Mode** using the switch in the top-right corner
3. Use Test Mode for initial setup and testing

---

## 2. Get Your API Keys

1. Go to [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

Add these to your `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_...
```
````

---

## 3. Create Products & Prices

Agentix uses 3 subscription tiers. You need to create matching products in Stripe.

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click **Add Product**
3. Create these as **recurring** products:

| Product Name | Price   | Interval |
| ------------ | ------- | -------- |
| **Starter**  | $29.00  | Monthly  |
| **Growth**   | $79.00  | Monthly  |
| **Agency**   | $299.00 | Monthly  |

4. After creating each product, Stripe generates a **Price ID** (looks like `price_1ABC123...`)
5. Copy each Price ID

---

## 4. Update the Pricing Configuration

Open `packages/config/pricing.ts` and replace the dummy Price IDs with your real ones:

```typescript
export const SAAS_PRICING: Record<Tier, SubscriptionPlan> = {
  STARTER: {
    id: "STARTER",
    name: "Starter",
    monthlyPriceId: "price_1ABC123...", // ← Your real Starter Price ID
    price: 29,
    limits: {
      maxAgents: 1,
      maxMessagesPerMonth: 500,
      maxStorageDocs: 5,
    },
    features: [
      "1 Custom AI Agent",
      "500 AI Messages per month",
      "5 Document Uploads",
      "Embeddable Website Widget",
      "Standard RAG Document Search",
      "Email Support",
    ],
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    monthlyPriceId: "price_2DEF456...", // ← Your real Growth Price ID
    price: 79,
    isPopular: true,
    limits: {
      maxAgents: 5,
      maxMessagesPerMonth: 5000,
      maxStorageDocs: 20,
    },
    features: [
      "Everything in Starter",
      "Up to 5 AI Agents",
      "5,000 AI Messages per month",
      "20 Document Uploads",
      "Advanced Webhook Actions",
      "Analytics Dashboard",
      "Priority Support",
    ],
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Agency",
    monthlyPriceId: "price_3GHI789...", // ← Your real Agency Price ID
    price: 299,
    limits: {
      maxAgents: 20,
      maxMessagesPerMonth: 25000,
      maxStorageDocs: 50,
    },
    features: [
      "Everything in Growth",
      "Up to 20 AI Agents",
      "25,000 AI Messages per month",
      "50 Document Uploads",
      "Multi-User Workspaces",
      "API Access",
      "Priority Human Handoff",
      "Dedicated Support",
    ],
  },
};
```

Also update your `.env`:

```env
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_1ABC123...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_2DEF456...
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_3GHI789...
```

---

## 5. Set Up Webhooks

Webhooks allow Stripe to notify your server when payments succeed, subscriptions renew, or customers cancel.

### For Local Development (Testing)

Use the Stripe CLI:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Copy the **webhook signing secret** (starts with `whsec_`) and add to `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### For Production

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. **URL:** `https://yourdomain.com/api/webhooks/stripe`
4. **Events to listen for:**
   - ✅ `checkout.session.completed` — Payment succeeded
   - ✅ `customer.subscription.updated` — Subscription changed
   - ✅ `customer.subscription.deleted` — Subscription cancelled
5. Click **Add endpoint**
6. Copy the **Signing secret** and add to your production `.env`

---

## 6. How Billing Works in Agentix

1. **User clicks "Upgrade"** in the billing page
2. **Frontend calls** `POST /billing/checkout` → creates a Stripe Checkout Session
3. **User is redirected** to Stripe to enter payment details
4. **Stripe sends a webhook** (`checkout.session.completed`) to your server
5. **Server upgrades** the workspace tier and tops up tokens
6. **Each month,** Stripe sends `customer.subscription.updated` → tokens are refilled
7. **If cancelled,** Stripe sends `customer.subscription.deleted` → tier removed, tokens set to 0

---

## 7. Testing Payments

Use Stripe's test card numbers:

| Card Number           | Result             |
| --------------------- | ------------------ |
| `4242 4242 4242 4242` | Success            |
| `4000 0000 0000 0002` | Decline            |
| `4000 0025 0000 3155` | Requires 3D Secure |

- Use any future expiration date
- Use any 3-digit CVC
- Use any ZIP code

---

## 8. Switching to Live Mode

1. In Stripe Dashboard, toggle to **Live Mode**
2. Create the same 3 products with real prices in Live Mode
3. Copy the **Live Price IDs** and update `packages/config/pricing.ts`
4. Copy the **Live Secret Key** and update `STRIPE_SECRET_KEY` in `.env`
5. Create a new **Live webhook endpoint** and update `STRIPE_WEBHOOK_SECRET`
6. Update `NEXT_PUBLIC_STRIPE_*` environment variables with live Price IDs
7. Or use the **Admin Panel → Settings → Billing** to switch modes and update keys

---

## 9. Troubleshooting

| Problem                                  | Solution                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| Checkout URL is blank                    | `STRIPE_SECRET_KEY` is missing or invalid                                      |
| Payment succeeds but tier doesn't change | Webhook isn't reaching your server. Check Stripe Dashboard → Webhooks → Events |
| Webhook returns 400 error                | `STRIPE_WEBHOOK_SECRET` doesn't match                                          |
| Workspace not upgraded after payment     | Check the Price ID in `pricing.ts` matches Stripe exactly                      |
| "Missing priceId" error in browser       | Set `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` in your `.env`                           |

---

## 📞 Need Help?

Refer to [Stripe's Documentation](https://stripe.com/docs) or contact Agentix support.

```

---

```
