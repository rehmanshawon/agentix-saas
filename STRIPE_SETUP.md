# Stripe Setup

Stripe provides global self-service subscriptions. Bangladesh managed-service
plans are handled manually and should not be sent to Stripe Checkout.

## Create recurring prices

Create monthly and yearly recurring prices for each plan:

| Plan | Monthly | Yearly |
| --- | ---: | ---: |
| Starter | $7 | $69 |
| Growth | $15 | $149 |
| Business | $29 | $299 |

The plan limits and amounts are centralized in `packages/config/pricing.ts`.
Copy the Stripe Price IDs into the web environment:

```env
NEXT_PUBLIC_BILLING_PROVIDER=stripe
NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_GROWTH_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_GROWTH_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID=price_...
```

Yearly prices are optional until configured; the billing UI disables annual
checkout for any plan without a corresponding Price ID. Keep the amounts and
reply/document/chatbot limits in the shared pricing config aligned with the
Stripe products.

## Configure keys and webhook

Set the server-side API key and webhook signing secret:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

For local testing, forward events with the Stripe CLI:

```bash
stripe login
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

For production, register `https://<web-host>/api/webhooks/stripe` and subscribe
to:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

The webhook verifies Stripe's signature. It maps the purchased Price ID to the
central plan config, stores subscription status and period dates on the
workspace, and applies the plan's monthly reply limit. Non-active subscription
updates suspend the plan. Processing errors return a retryable server error;
check the Stripe dashboard's webhook delivery log if a workspace does not
update after checkout.

## Test checkout

Use Stripe test mode and card `4242 4242 4242 4242`, any future expiration date,
any CVC, and any postal code. Confirm the webhook delivery succeeds and the
workspace plan is updated before testing public chat.

## Go live

Create the same products/prices in Stripe live mode, replace all test Price IDs,
and configure the live secret key and live webhook signing secret in the
production environment. Never commit live credentials to the repository.

Paddle remains an optional global checkout provider. Configure Paddle separately
if enabled. Bangladesh annual packages use consultation, invoice, bank
transfer, cash, or manual mobile payment and are assigned through
**Admin → Subscribers**.
