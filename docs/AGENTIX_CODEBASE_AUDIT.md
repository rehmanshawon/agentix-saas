# Agentix Codebase Audit

Last updated: 2026-06-14

## Architecture Summary

Agentix is a pnpm/Turborepo monorepo.

- `apps/web`: Next.js 14 App Router frontend for marketing, auth, dashboard, billing, admin, and Stripe webhooks.
- `apps/api`: NestJS backend for chat, knowledge uploads, RAG processing, billing checkout, workspace data, auth utilities, and admin APIs.
- `apps/widget`: Vite-built vanilla JavaScript embeddable chat widget. Its build output is served from `apps/web/public/widget.js`.
- `packages/database`: Prisma schema and generated MySQL client.
- `packages/config`: Shared SaaS pricing configuration.

## Frontend Routes

- `/`: Public landing page. Before this audit it positioned Agentix as a source-code/Gumroad product and linked directly to Gumroad.
- `/login`, `/signup`, `/forgot-password`, `/reset-password`: Auth-related pages.
- `/dashboard`: Customer dashboard.
- `/dashboard/knowledge`: Document upload and training UI.
- `/dashboard/builder`: Chatbot configuration and embed script UI.
- `/dashboard/billing`: Stripe subscription plan UI.
- `/admin`: Admin dashboard.
- `/admin/subscribers`, `/admin/analytics`, `/admin/settings`, `/admin/integrations`: Admin management screens.
- `/api/auth/*`: NextAuth and register routes.
- `/api/agents`: Next.js agent CRUD helper route.
- `/api/webhooks/stripe`: Stripe webhook receiver.

## Backend Routes

- `GET /api/chat/config`, `POST /api/chat/config`: Builder configuration by user email.
- `GET /api/chat/:agentId`: Public widget agent theme/config.
- `POST /api/chat/message`: Public widget chat endpoint. It checks subscription tier and decrements `Workspace.tokenBalance`.
- `POST /knowledge/upload`: Multipart document upload, document record creation, vectorization.
- `GET /knowledge`: Lists documents for a user workspace.
- `DELETE /knowledge/:id`: Deletes document metadata.
- `POST /billing/checkout`: Creates Stripe Checkout subscription session.
- `GET /api/workspace`: Returns workspace, limits, and usage summary.
- `GET/PATCH /api/admin/workspaces`: Admin workspace listing and manual tier/token editing.
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

Important current limitations:

- No dedicated `Subscription`, `UsageEvent`, `Message`, or `PlanOverride` table.
- Reply metering is stored as `Workspace.tokenBalance`, which is decremented per public chat reply.
- Manual admin subscription support is minimal: admins can edit `subscriptionTier` and `tokenBalance`, but there is no annual start/end date, payment notes, local client flag, or expiry automation yet.

## Auth

NextAuth is configured in `apps/web/lib/auth.ts` with credentials auth and optional Google OAuth. Credentials auth loads the first workspace membership into the JWT/session. The register route creates a user, workspace, and owner membership.

Development/demo mode currently grants a Starter subscription and token balance automatically when `DEMO_MODE=true` or `NODE_ENV=development`.

## Billing and Stripe

Stripe checkout is implemented in the NestJS API. Stripe webhooks are handled in the Next.js app at `apps/web/app/api/webhooks/stripe/route.ts`.

Current behavior:

- Checkout creates a subscription session and stores the workspace ID in `client_reference_id`.
- `checkout.session.completed` maps the purchased price ID to `SAAS_PRICING`, sets `stripeCustomerId`, `subscriptionTier`, and `tokenBalance`.
- `customer.subscription.updated` resets tier and token balance when status is active.
- `customer.subscription.deleted` clears the tier and token balance.

Gaps:

- Pricing was monthly-only and used older $29/$79/$299 source-code-era positioning.
- No yearly price IDs in the pricing config.
- No Stripe Customer Portal.
- No durable subscription status field.
- No explicit handling for failed/past_due subscriptions beyond deleted/canceled.

## Chatbot, RAG, and Embed Flow

The dashboard flow is:

1. User uploads documents in `/dashboard/knowledge`.
2. NestJS `KnowledgeController` stores a `Document` row and calls `RagService`.
3. `RagService` parses PDFs with `pdf-parse` or text files directly, chunks text, creates OpenAI embeddings, and upserts vectors to Pinecone.
4. User configures chatbot in `/dashboard/builder`.
5. The builder shows an embed snippet using `widget.js` and the agent ID.
6. Public visitors use the embedded widget.
7. `ChatController` receives messages, verifies the workspace has a plan and token balance, calls `ChatService`, then decrements `tokenBalance`.

The widget is a standalone Shadow DOM script. It fetches `GET /api/chat/:agentId` for branding and posts messages to `/api/chat/message`.

## AI and Model Provider Logic

Before this transformation, AI logic was hardcoded to OpenAI:

- `apps/api/src/ai/chat.service.ts` used `OpenAIEmbeddings` and `ChatOpenAI` with `gpt-4o-mini`.
- `apps/api/src/ai/rag.service.ts` used `OpenAIEmbeddings` with `text-embedding-3-small`.
- The builder exposed OpenAI model names directly to customers.
- Startup validation required `OPENAI_API_KEY`.

There was no provider abstraction, no DeepSeek support, and no fallback router.

## Gumroad and Source-Code Sales References

Main Gumroad/source-code references found:

- `apps/web/app/page.tsx`: Gumroad links, "Buy Now", "$149", source-code license copy, OpenAI-as-selling-point copy, and Gumroad refund/support FAQ.
- `README.md`: Digital download/license/support via Gumroad copy.

No Gumroad redirect was found in the chat API or widget flow. The main issue was marketing CTAs and copy on the public landing page.

## Usage Limits

Existing plan enforcement:

- Agent count checked in `ChatController.saveBuilderConfig`.
- Document count checked in `KnowledgeController.uploadDocument`.
- Public chat checks `subscriptionTier` and `tokenBalance`.
- Dashboard workspace endpoint calculates used tokens from tier max minus current balance.

Gaps:

- Usage is customer-facing as "tokens", even though it is actually reply credits.
- Limits are duplicated in several files instead of consistently using shared config.
- There is no historical monthly usage record or automatic monthly reset job outside Stripe subscription update/webhook behavior.

## Security and Privacy Notes

Good existing patterns:

- Pinecone metadata includes `workspaceId` and chat retrieval filters by workspace.
- Dashboard routes generally use authenticated sessions, while API endpoints commonly resolve a workspace by email.
- API keys are server-side environment variables.

Risks/gaps:

- Several NestJS dashboard-facing endpoints accept `email` query/body parameters instead of verifying a session token.
- Document deletion removes the database row but does not delete vectors from Pinecone.
- Chat logs include the first 50 characters of user messages.
- CORS is currently `origin: "*"`.
- Admin auth is a single `ADMIN_PASSWORD` header.

## Deployment Config

- `docker-compose.yml` provides local MySQL and Redis.
- `DEPLOYMENT.md`, `STRIPE_SETUP.md`, and `ADMIN_GUIDE.md` exist.
- `.env.example` documents database, API, OpenAI, Pinecone, NextAuth, Google OAuth, Stripe, app URLs, and seed values.

## Summary of Production Readiness

Agentix has the skeleton of a real SaaS: auth, workspaces, document upload/RAG, widget embed, Stripe checkout, Stripe webhooks, and admin views. The largest gaps are product positioning, provider abstraction, clean plan config, local/manual annual client management, durable usage/subscription records, and stronger API authorization.
