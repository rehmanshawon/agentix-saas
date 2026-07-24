# Agentix SaaS

Agentix is an AI chatbot SaaS for small businesses. Customers upload business
PDFs/documents, train an assistant, copy an embeddable script, and add a 24/7
AI chatbot to their website.

Production direction:

- Global self-service SaaS: `agentix.ilogicmagic.com`
- SaaS app dashboard: `app.agentix.ilogicmagic.com` when deployment supports it
- Public demo: `demo.agentix.ilogicmagic.com` or `/demo`
- Bangladesh managed service: `bd.agentix.ilogicmagic.com` or `/bd`

## Current Stack

- `apps/web`: Next.js 14 dashboard, auth, marketing pages, admin, Stripe webhook
- `apps/api`: NestJS API for chat, knowledge uploads, RAG, billing, admin
- `apps/widget`: Vanilla JS embeddable widget built with Vite
- `packages/database`: Prisma schema/client for MySQL
- `packages/config`: Shared pricing and plan limits

## Product Routes

- `/`: Global SaaS landing page
- `/pricing`: Global Stripe plans and Bangladesh annual service packages
- `/demo`: Public non-Gumroad demo entry point
- `/bd`: Bangladesh done-for-you service page
- `/dashboard`: Customer app
- `/dashboard/knowledge`: Upload and train documents
- `/dashboard/builder`: Configure chatbot and copy embed snippet
- `/dashboard/billing`: Stripe subscription plans
- `/admin`: Admin dashboard

## Pricing Model

Global self-service plans are configured in `packages/config/pricing.ts`:

- Starter: `$7/month`, `$69/year`, 1 chatbot, 1,000 AI replies/month
- Growth: `$15/month`, `$149/year`, 3 chatbots, 5,000 AI replies/month
- Business: `$29/month`, `$299/year`, 10 chatbots, 15,000 AI replies/month

Bangladesh annual packages are also configured there and use manual
consultation/payment, not Stripe. Never sell unlimited AI usage; use reply,
chatbot, document, and storage caps.

## AI Provider Configuration

DeepSeek is the default chat provider. OpenAI remains configured as fallback and
is still used for the current embedding pipeline.

Required AI variables:

```bash
DEFAULT_AI_PROVIDER=deepseek
FALLBACK_AI_PROVIDER=openai
DEEPSEEK_API_KEY=...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_CHAT_MODEL=deepseek-v4-flash
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_FALLBACK_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

Provider names are not exposed to normal customers. The dashboard presents
business-facing limits such as AI replies, chatbots, and documents.

## Local Development

```bash
corepack pnpm install
cp .env.example .env
docker compose up -d
corepack pnpm db:push
corepack pnpm db:generate
corepack pnpm dev
```

Default local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- API docs: `http://localhost:3001/api/docs`

## Stripe Setup

Set Stripe keys and price IDs in `.env`:

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_GROWTH_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_GROWTH_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID=price_...
```

The webhook at `/api/webhooks/stripe` maps monthly or yearly price IDs to the
same plan limits and refreshes `Workspace.tokenBalance` as monthly AI reply
credits.

## Paddle Setup

Paddle can be used as the global card checkout provider when Stripe is not
available for your business location. Set:

```bash
NEXT_PUBLIC_BILLING_PROVIDER=paddle
PADDLE_ENVIRONMENT=sandbox
PADDLE_API_KEY=pdl_...
PADDLE_WEBHOOK_SECRET=...
PADDLE_CHECKOUT_BASE_URL=https://agentix.ilogicmagic.com/checkout/paddle
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=live_...
NEXT_PUBLIC_PADDLE_STARTER_MONTHLY_PRICE_ID=pri_...
NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID=pri_...
NEXT_PUBLIC_PADDLE_GROWTH_MONTHLY_PRICE_ID=pri_...
NEXT_PUBLIC_PADDLE_GROWTH_YEARLY_PRICE_ID=pri_...
NEXT_PUBLIC_PADDLE_BUSINESS_MONTHLY_PRICE_ID=pri_...
NEXT_PUBLIC_PADDLE_BUSINESS_YEARLY_PRICE_ID=pri_...
```

Paddle webhooks should point to:

```text
https://agentix.ilogicmagic.com/api/webhooks/paddle
```

The Paddle checkout page is:

```text
/checkout/paddle
```

Paddle must approve the checkout domain/payment link before live checkout works.
Webhook activation updates the workspace plan and monthly AI reply balance.

## Subdomain Deployment Notes

If the host supports subdomain routing, map:

- `agentix.ilogicmagic.com` to the marketing web app `/`
- `app.agentix.ilogicmagic.com` to the same app, with dashboard/login links
- `demo.agentix.ilogicmagic.com` to `/demo`
- `bd.agentix.ilogicmagic.com` to `/bd`

Until subdomain routing is configured, the route-based structure works:

- `/`
- `/pricing`
- `/demo`
- `/bd`
- `/dashboard`

## Important Audits and Plan

- `docs/AGENTIX_CODEBASE_AUDIT.md`
- `docs/AGENTIX_TRANSFORMATION_PLAN.md`

## Known Next Work

- Add durable monthly usage events instead of only `Workspace.tokenBalance`.
- Add full admin-managed annual local client fields: start/end date, notes,
  active/inactive/expired state, and manual payment metadata.
- Tighten API authorization for endpoints that currently accept user email
  parameters.
- Add Pinecone vector deletion when a document is deleted.
