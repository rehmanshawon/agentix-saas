# 🚀 Agentix SaaS — Deployment Guide

This guide walks you through deploying Agentix to production, step by step.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **pnpm** installed
- **Docker & Docker Compose** (for local MySQL — optional if using a cloud DB)
- **A Stripe account** (for billing)
- **A DeepSeek account** for default chat completions
- **An OpenAI account** for fallback chat and document embeddings
- **A Pinecone account** (for vector search)

---

## Step 1: Clone & Install

```bash
git clone <your-repo-url> agentix-saas
cd agentix-saas
corepack pnpm install
```

## Step 2: Configure Environment

Copy `.env.example` to `.env` and configure the production database, API,
authentication, vector search, and payment credentials. At minimum, set:

- `DATABASE_URL`
- `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
- `API_INTERNAL_SECRET` (the same random secret in the web and API server
  environments)
- `ADMIN_PASSWORD` (a long random password set server-side for both web and
  API; never prefix it with `NEXT_PUBLIC_`)
- `API_URL` (the private NestJS origin used by the Next.js server-side proxy)
- `DEEPSEEK_API_KEY` (default chat provider)
- `OPENAI_API_KEY` (required for embeddings; also used as chat fallback)
- `PINECONE_API_KEY` and `PINECONE_INDEX_NAME`
- `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WIDGET_URL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the monthly/yearly Stripe
  price IDs in `.env.example`

DeepSeek is configured with `DEFAULT_AI_PROVIDER=deepseek`,
`DEEPSEEK_BASE_URL=https://api.deepseek.com/v1`, and
`DEEPSEEK_CHAT_MODEL=deepseek-v4-flash`. Set
`FALLBACK_AI_PROVIDER=openai` and `OPENAI_FALLBACK_MODEL=gpt-4o-mini` to enable
the optional chat fallback. Keep all secret API keys server-side; only billing
price IDs and the public app URLs should use `NEXT_PUBLIC_*`.

## Step 3: Prepare the Database and Build

Apply the Prisma schema and generate the client before starting the services:

```bash
corepack pnpm db:push
corepack pnpm db:generate
corepack pnpm build
```

Deploy `apps/web` and `apps/api` as separately reachable services. The web app
serves the widget bundle at `/widget.js`; set `NEXT_PUBLIC_WIDGET_URL` to that
web origin. Set `API_URL` to the API's private service address for authenticated
dashboard and admin requests. `NEXT_PUBLIC_API_URL` remains the public API
origin for the embeddable widget, API docs, and public password-reset endpoints.

Generate `API_INTERNAL_SECRET` with `openssl rand -hex 32` and provide the same
value only to the web and API server environments. The API refuses to start
without it. The browser never receives this token: dashboard requests pass
through the Next.js proxy, which requires a NextAuth session and replaces
user-supplied email values with the signed-in account's email. Public widget
chat/config and password-reset routes remain directly accessible.

Admin login is verified server-side using `ADMIN_PASSWORD`. The web app stores
only a signed, HttpOnly admin-session cookie; it injects the admin key when
proxying requests to the API. Remove any old `NEXT_PUBLIC_ADMIN_PASSWORD`
setting and rotate credentials that may have been exposed in a browser bundle.

## Step 4: Configure Billing Webhooks

For Stripe, set `NEXT_PUBLIC_BILLING_PROVIDER=stripe`, configure monthly and
yearly recurring price IDs for each plan, and register
`https://<web-host>/api/webhooks/stripe` for `checkout.session.completed`,
`customer.subscription.updated`, and `customer.subscription.deleted`.

Paddle is an optional global checkout provider; configure the `PADDLE_*`
variables and `/api/webhooks/paddle` only if Paddle is approved and enabled.
Bangladesh managed-service plans are handled manually and do not require
Stripe, Paddle, bKash, or Nagad integration.

## Route and Subdomain Strategy

The app implements route-based pages: `/`, `/pricing`, `/demo`, and `/bd`.
Until host-level routing is configured, serve the same Next.js deployment at
`agentix.ilogicmagic.com` and use these routes. If the hosting platform supports
host rewrites, map `app.agentix.ilogicmagic.com` to dashboard/login routes,
`demo.agentix.ilogicmagic.com` to `/demo`, and
`bd.agentix.ilogicmagic.com` to `/bd`; DNS records and those rewrites must be
configured at the hosting provider. There is no application-level subdomain
router yet.

## Bangladesh Manual Client Setup

Have the client create an account, then open **Admin → Subscribers** and edit
their workspace. Assign a `BD_*` plan, set status to **Manual active**, provider
to **Manual**, enter the annual start and expiry dates, set the monthly AI
reply limit, and record agreement/payment notes. The API blocks public chat
when the workspace is canceled, expired, or past its expiry date.
