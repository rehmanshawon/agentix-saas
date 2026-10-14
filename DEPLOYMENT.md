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

The app implements route-based pages: `/`, `/pricing`, `/demo`, `/bd`, `/contact`, and `/app`.
In addition, `apps/web/middleware.ts` automatically rewrites subdomain requests at the application level:

- `agentix.ilogicmagic.com` -> `/` (Marketing landing page)
- `app.agentix.ilogicmagic.com` -> `/dashboard` (SaaS Dashboard & App)
- `demo.agentix.ilogicmagic.com` -> `/demo` (Chatbot Demo)
- `bd.agentix.ilogicmagic.com` or `agentix-bd.ilogicmagic.com` -> `/bd` (Bangladesh Done-For-You Service)

Simply point CNAME records for `app`, `demo`, and `bd` to your Agentix web deployment (`agentix.ilogicmagic.com`), and Next.js middleware handles routing seamlessly.

## Bangladesh Manual Client Setup

Admins can directly onboard local clients without asking them to sign up:

1. Log in to the Admin Dashboard at `/admin` using `ADMIN_PASSWORD`.
2. Navigate to **Subscribers** (`/admin/subscribers`).
3. Click **+ Add Client / Tenant**.
4. Enter the client's email, business name, and optional password.
5. Select the plan tier (`BD_BASIC`, `BD_STANDARD`, or `BD_INSTITUTIONAL`).
6. Set the annual start and expiry dates (click **+1 Year** for an instant 12-month term).
7. Confirm the monthly AI reply cap and enter payment/agreement notes (e.g. invoice number, bank transfer details).
8. Click **Create Client Account**. The workspace, user account, and default agent are provisioned immediately.
9. To suspend or reactivate an account upon expiry, click **Expire** or **Activate** on the subscriber row. The API automatically blocks public chat when a workspace is expired or past its annual expiry date.
