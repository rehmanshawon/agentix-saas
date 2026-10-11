# Agentix Codebase Audit

Last updated: 2026-10-12

## Architecture Summary

Agentix is a pnpm/Turborepo monorepo.

- `apps/web`: Next.js 14 App Router frontend for marketing, auth, dashboard, billing, admin, and Stripe/Paddle webhooks.
- `apps/api`: NestJS backend for chat, knowledge uploads, RAG processing, Stripe/Paddle checkout, workspace data, auth utilities, and admin APIs.
- `apps/widget`: Vite-built vanilla JavaScript embeddable chat widget. Its build output is served from `apps/web/public/widget.js`.
- `packages/database`: Prisma schema and generated MySQL client.
- `packages/config`: Shared SaaS pricing configuration.

## Frontend Routes

- `/`: Public global SaaS landing page with signup, demo, pricing, and Bangladesh service CTAs. No functional Gumroad flow remains.
- `/pricing`: USD self-service plan overview and BDT managed-service packages.
- `/bd`: Bangladesh done-for-you annual service landing page.
- `/demo`: Scripted FAQ chat demo; it is not connected to a production demo agent.
- `/login`, `/signup`, `/forgot-password`, `/reset-password`: Auth-related pages.
- `/dashboard`: Customer dashboard.
- `/dashboard/knowledge`: Document upload and training UI.
- `/dashboard/builder`: Chatbot configuration and embed script UI.
- `/dashboard/billing`: Global subscription plan UI with a configurable Stripe/Paddle checkout provider.
- `/admin`: Admin dashboard.
- `/admin/subscribers`, `/admin/analytics`, `/admin/settings`, `/admin/integrations`: Admin management screens.
- `/api/auth/*`: NextAuth and register routes.
- `/api/agents`: Next.js agent CRUD helper route.
- `/api/webhooks/stripe`: Stripe webhook receiver.
- `/api/webhooks/paddle`: Paddle webhook receiver.

## Backend Routes

- `GET /api/chat/config`, `POST /api/chat/config`: Builder configuration for the authenticated web user; the web proxy supplies the session email.
- `GET /api/chat/:agentId`: Public widget agent theme/config.
- `POST /api/chat/message`: Public widget chat endpoint. It checks subscription state and monthly reply usage, calls RAG, then records usage.
- `POST /knowledge/upload`: Multipart PDF/TXT upload (10 MB limit), document record creation, vectorization.
- `GET /knowledge`: Lists documents for a user workspace.
- `DELETE /knowledge/:id`: Deletes workspace-scoped Pinecone vectors and document metadata.
- `POST /billing/checkout`, `POST /billing/paddle/checkout`: Create global subscription checkout sessions.
- `GET /api/workspace`: Returns workspace, limits, and usage summary.
- `GET/PATCH /api/admin/workspaces`: Admin workspace listing and manual subscription/usage editing.
- Additional admin analytics, settings, subscriber detail, and webhook endpoints.

## Database

Prisma uses MySQL. Core models:

- `User`
- `Workspace`
- `WorkspaceMember`
- `Agent`
- `Document`
- `PasswordResetToken`
- `OutgoingWebhook`

Multi-tenancy exists through `Workspace`, `WorkspaceMember`, and `workspaceId` relations on agents/documents. Vector records include `workspaceId` metadata in Pinecone for retrieval isolation.

Current subscription and usage data:

- `Workspace` stores subscription status/provider, annual start/expiry, notes, and an optional monthly reply override for manual clients.
- `WorkspaceMonthlyUsage` records reply counts keyed by workspace and calendar-month start.
- `Workspace.tokenBalance` is still decremented alongside monthly usage. When no record exists for a new calendar month, the first reply resets the legacy balance to that month's plan limit.
- The admin subscriber editor can update existing workspaces, but does not create a customer, user, or workspace from scratch.
- Expiry is enforced when public chat is requested; there is no background expiry/status update or notification process.

## Auth

NextAuth is configured in `apps/web/lib/auth.ts` with credentials auth and optional Google OAuth. Credentials auth loads the first workspace membership into the JWT/session. The register route creates a user, workspace, and owner membership. Dashboard API requests pass through a same-origin Next.js proxy that requires a NextAuth session and overrides email values from the session before forwarding them to NestJS.

Admin login is verified server-side. The web app issues a signed, HttpOnly, 12-hour cookie; browser code no longer receives or stores the admin password. The API also checks the server-injected admin key for admin endpoints.

Development/demo mode currently grants a Starter subscription and token balance automatically when `DEMO_MODE=true` or `NODE_ENV=development`.

## Billing and Payment Providers

Stripe and Paddle checkout are implemented in the NestJS API. Webhooks are handled in the Next.js app at `apps/web/app/api/webhooks/stripe/route.ts` and `apps/web/app/api/webhooks/paddle/route.ts`.

Current behavior:

- Checkout maps configured monthly/yearly price IDs to a shared plan; Stripe stores the workspace ID in `client_reference_id`.
- Successful webhook events set the plan, billing provider, subscription status, period dates, and reply balance.
- Canceled or past-due subscriptions are blocked by subscription-status/tier checks.
- Paddle is an optional global checkout path; Bangladesh managed-service plans use manual payment.

Gaps:

- Shared pricing config contains monthly/yearly amounts and plan limits; the billing UI supports both intervals and disables yearly checkout when a price ID is missing.
- No Stripe Customer Portal.
- Production price IDs, webhook signing secrets, and Paddle merchant configuration still require deployment setup.

## Chatbot, RAG, and Embed Flow

The dashboard flow is:

1. User uploads documents in `/dashboard/knowledge`.
2. NestJS `KnowledgeController` stores a `Document` row and calls `RagService`.
3. `RagService` parses PDFs with `pdf-parse` or text files directly, chunks text, creates OpenAI embeddings, and upserts vectors to Pinecone.
4. User configures chatbot in `/dashboard/builder`.
5. The builder shows an embed snippet using `widget.js` and the agent ID.
6. Public visitors use the embedded widget.
7. `ChatController` receives messages, verifies subscription state and monthly usage, calls `ChatService`, then updates usage and the legacy `tokenBalance`.

The widget is a standalone Shadow DOM script. It fetches `GET /api/chat/:agentId` for branding and posts messages to `/api/chat/message`.

## AI and Model Provider Logic

Current AI setup:

- `ModelRouter` selects DeepSeek by default from `DEFAULT_AI_PROVIDER` and OpenAI as the configured fallback.
- `ChatCompletionService` sends OpenAI-compatible chat-completion requests and retries with the configured fallback after a primary failure.
- `EmbeddingService` uses OpenAI `text-embedding-3-small` by default for Pinecone-compatible vectors; `OPENAI_API_KEY` remains required for RAG.
- The customer builder exposes only the platform-default engine; provider/model selection is not customer-facing.
- `ChatService` propagates generation failures; the chat endpoint returns an error and does not count failed generations as replies.

## Gumroad and Source-Code Sales References

No functional Gumroad references remain in the main application flow. Historical references are retained only in this audit/plan for traceability; the demo page and README use SaaS language.

## Usage Limits

Existing plan enforcement:

- Agent count checked in `ChatController.saveBuilderConfig`.
- Document count checked in `KnowledgeController.uploadDocument`.
- Public chat checks subscription state and monthly reply usage.
- `WorkspaceMonthlyUsage` provides per-month reply history; the workspace endpoint returns replies used, remaining, and limit.
- Shared pricing config defines global and local plan caps.

Gaps:

- `tokenBalance` remains an additional legacy gate and is refilled lazily on the first request in a new month.
- Customer and admin dashboards show current-month replies used, limit, and remaining.
- Some admin analytics still describe replies as tokens and derive usage from the legacy balance.

## Security and Privacy Notes

Good existing patterns:

- Pinecone metadata includes `workspaceId` and chat retrieval filters by workspace.
- Private NestJS endpoints require the shared server-only `API_INTERNAL_SECRET`. Dashboard and admin requests use the Next.js server-side proxy; customer identity is derived from NextAuth, not caller-supplied email fields.
- Public widget chat/configuration and password-reset endpoints are explicitly exempt from the internal-token guard.
- Admin sessions are signed, HttpOnly cookies; no browser-exposed admin password or weak API default remains.
- API keys are server-side environment variables.

Risks/gaps:

- Production must configure the same high-entropy `API_INTERNAL_SECRET` for the web and API services, plus a strong `ADMIN_PASSWORD`; the API fails startup if its internal secret is missing.
- Direct public widget endpoints remain unauthenticated by design and should continue to be rate-limited and monitored.
- The admin login is password-based and does not currently support MFA.
- Document deletion removes matching Pinecone vectors before deleting the database row.
- Chat logs no longer include message content.
- CORS currently allows `origin: "*"` without credentials for public widget access.
- Uploads accept PDF and TXT files up to 10 MB and validate PDF signatures.

## Deployment Config

- `docker-compose.yml` provides local MySQL and Redis.
- `DEPLOYMENT.md`, `STRIPE_SETUP.md`, and `ADMIN_GUIDE.md` exist.
- `.env.example` documents database, internal API authentication, server-side admin login, DeepSeek/OpenAI, Pinecone, NextAuth, Google OAuth, Stripe/Paddle, app URLs, and seed values.

## Summary of Production Readiness

Agentix has the core of a real SaaS: auth, workspaces, document upload/RAG, widget embed, Stripe/Paddle checkout, provider routing, monthly usage records, and admin-managed local plan fields. The largest remaining gaps are admin customer/workspace creation, some legacy token-based analytics, an unconfigured live demo agent, and production verification of payment price IDs/webhook secrets and DNS/subdomain routing.
