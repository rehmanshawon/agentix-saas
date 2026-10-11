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

- `apps/web`: Next.js 14 dashboard, auth, marketing pages, admin, Stripe/Paddle webhooks
- `apps/api`: NestJS API for chat, knowledge uploads, RAG, billing, admin
- `apps/widget`: Vanilla JS embeddable widget built with Vite
- `packages/database`: Prisma schema/client for MySQL
- `packages/config`: Shared pricing and plan limits

## Product Routes

- `/`: Global SaaS landing page
- `/pricing`: Global Stripe plans and Bangladesh annual service packages
- `/demo`: Public scripted FAQ demo (a live demo workspace is not configured yet)
- `/bd`: Bangladesh done-for-you service page
- `/dashboard`: Customer app
- `/dashboard/knowledge`: Upload and train documents
- `/dashboard/builder`: Configure chatbot and copy embed snippet
- `/dashboard/billing`: Monthly/yearly Stripe or Paddle subscription plans
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
if [ ! -f .env ]; then cp .env.example .env; fi
docker compose up -d
corepack pnpm db:push
corepack pnpm db:generate
corepack pnpm dev
```

For local work, `.env` should use the Docker Compose MySQL URL on port `3307`.
Set a random `API_INTERNAL_SECRET` and a strong `ADMIN_PASSWORD` in both the
root `.env` and `apps/web/.env.local`; also set `API_URL` to
`http://localhost:3001` in the web environment. The web environment needs
`DATABASE_URL`, `NEXTAUTH_URL=http://localhost:3000`, `NEXTAUTH_SECRET`, and
`NEXT_PUBLIC_API_URL=http://localhost:3001` as well. Do not commit either
environment file.

Default local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- API docs: `http://localhost:3001/api/docs`

### Local end-to-end widget test

After configuring the required server environment variables in the root
`.env` and `apps/web/.env.local`, start the local services with
`corepack pnpm dev`. The root test page at `index.html` can then load your
configured widget against `http://localhost:3001/api/chat`. Serve the
repository root in a separate terminal with:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://localhost:8080/`, paste the agent ID from the Agent Builder, and
select **Load chatbot**. See `DEPLOYMENT.md` for the required `API_URL`,
`API_INTERNAL_SECRET`, `ADMIN_PASSWORD`, and NextAuth configuration.

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
same plan limits. `WorkspaceMonthlyUsage` records replies by calendar month;
the legacy `Workspace.tokenBalance` is also maintained and refilled when a
workspace begins using the service in a new month.

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
Webhook activation updates the workspace plan. Monthly reply caps are tracked
by calendar month, regardless of whether checkout renews monthly or yearly.

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

## Known Limitations

- Admins can assign manual plans to existing workspaces; creating a user and
  workspace directly from the admin UI is not yet supported.
- Private dashboard and admin API calls pass through a server-side authenticated
  proxy; the API requires a shared internal secret for non-public endpoints.
  Configure `API_INTERNAL_SECRET`, `API_URL`, `ADMIN_PASSWORD`, and the
  NextAuth secrets as described in `DEPLOYMENT.md`.

Manual annual client fields are stored on `Workspace` and managed from the
admin subscriber editor. Set a `BD_*` tier, `billingProvider=manual`, annual
dates, a monthly reply override, and notes for a local client. Expired
workspaces are blocked from public chat by the API.
