# Agentix Transformation Plan

Last updated: 2026-10-12

## 1. Current Architecture Summary

Agentix is a pnpm monorepo with:

- Next.js web app in `apps/web`.
- NestJS API in `apps/api`.
- Vanilla JS embeddable widget in `apps/widget`.
- Prisma/MySQL data layer in `packages/database`.
- Shared pricing config in `packages/config`.

The core SaaS flow already exists: customers sign up, get a workspace, upload documents, vectorize them into Pinecone, configure an agent, copy an embed script, and public visitors chat with that agent. Stripe checkout and webhooks set subscription tier and reply credit balance.

## 2. Existing Issues and Gaps

- The marketing flow now uses SaaS product positioning rather than source-code sales.
- Shared pricing config includes the requested USD monthly/yearly prices and capped BDT service packages; billing now supports configured monthly and yearly checkout.
- DeepSeek is the default chat provider with OpenAI fallback; OpenAI remains required for embeddings.
- `WorkspaceMonthlyUsage` and manual subscription fields are schema-backed, and administrators can edit existing workspaces' plans, dates, status, monthly limits, and notes.
- Legacy `tokenBalance` is still decremented as a second usage gate and is refilled to the plan limit on the first request in a new calendar month.
- The admin subscriber editor cannot create a user/workspace for a new client.
- Failed chat generations now return errors and are not counted as successful replies.
- Stripe/Paddle webhook processing failures return server errors so providers can retry.
- Private API authorization now uses an internal server-to-server token and a Next.js proxy that derives customer email from NextAuth. Admin login uses a signed HttpOnly cookie and server-side credentials.
- Uploads now validate PDF/TXT type and size, and document deletion removes associated Pinecone vectors.
- Chat logs no longer include user message content.
- Stripe/Paddle production credentials, price IDs, webhook secrets, merchant approval, and DNS/subdomain routing still require setup.

## 3. Files Likely to Change

Phase 1 and 2 changes:

- `packages/config/pricing.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/pricing/page.tsx`
- `apps/web/app/bd/page.tsx`
- `apps/web/app/demo/page.tsx`
- `apps/web/app/dashboard/billing/page.tsx`
- `apps/web/app/dashboard/builder/page.tsx`
- `apps/web/app/dashboard/page.tsx`
- `apps/web/app/sitemap.ts`
- `apps/api/src/ai/*`
- `apps/api/src/chat/chat.controller.ts`
- `apps/api/src/knowledge/knowledge.controller.ts`
- `apps/api/src/workspace/workspace.controller.ts`
- `apps/api/src/main.ts`
- `.env.example`
- `README.md`
- `docs/AGENTIX_CODEBASE_AUDIT.md`
- `docs/AGENTIX_TRANSFORMATION_PLAN.md`

Later phases may require:

- `packages/database/schema.prisma`
- `apps/api/src/admin/admin.controller.ts`
- `apps/web/app/admin/subscribers/page.tsx`
- `apps/web/app/admin/settings/page.tsx`
- Stripe setup/deployment docs.

## 4. Proposed Implementation Phases

### Phase 1: Product Repositioning and Main Flow Cleanup

- Replace Gumroad/source-code landing copy with global SaaS positioning.
- Remove Gumroad CTAs from the main journey.
- Add `/pricing` with global SaaS plans and Bangladesh local annual packages.
- Add `/bd` for the local done-for-you Bangladesh service.
- Add `/demo` that does not redirect to Gumroad.
- Update dashboard billing language from tokens to AI replies.
- Keep Stripe checkout for global self-service plans.

### Phase 2: AI Provider Abstraction

- Add a lightweight provider router for chat completion.
- Make DeepSeek the default chat provider through environment variables.
- Keep OpenAI as fallback.
- Keep OpenAI embeddings for RAG unless another embedding provider is added later.
- Hide model names from normal customer UI.
- Document `DEEPSEEK_*` and OpenAI fallback variables.

### Phase 3: Usage Limits and Manual Local Clients

- Centralize plan limits in `packages/config`.
- Use the monthly usage table as the source of truth for calendar-month reply limits while keeping the legacy balance synchronized for compatibility.
- Keep admin controls for manual local clients:
  - local/manual plan type
  - annual start/end date
  - monthly reply limit
  - payment/agreement notes
  - active/inactive/expired status
- Add admin user/workspace creation if it can be done without exposing admin credentials.
- Surface reply usage on the customer dashboard.

### Phase 4: Deployment, Demo, Embed, and Polish

- Document subdomain mapping:
  - `agentix.ilogicmagic.com`
  - `app.agentix.ilogicmagic.com`
  - `demo.agentix.ilogicmagic.com`
  - `bd.agentix.ilogicmagic.com`
- Keep the scripted public demo clearly identified, or connect it to a configured demo agent when a safe demo workspace is available.
- Improve embed onboarding and checklist copy.
- Add SEO metadata for new public pages.
- Keep the private API proxy, internal-token guard, and public widget route allowlist covered by regression checks.
- Keep upload validation, vector deletion, and privacy-safe logging covered by regression checks.

## 5. Risks

- Changing database schema for manual annual plans requires Prisma migration/deploy coordination.
- Existing workspaces may use legacy `ENTERPRISE` tier values, so pricing changes should preserve compatibility.
- DeepSeek does not provide the same embedding API as OpenAI in the current code, so embeddings should remain OpenAI-based until an embedding alternative is selected.
- Stripe yearly prices need real Stripe price IDs before production checkout can support annual billing.
- The server-to-server API secret and admin password must be configured consistently across web and API deployments.

## 6. Exact Next Steps

1. Exercise manual-plan monthly renewal and reply-limit behavior at calendar boundaries and under concurrent requests.
2. Configure production monthly/yearly Stripe prices and verify checkout/webhook delivery; configure Paddle only if enabled.
3. Configure high-entropy `API_INTERNAL_SECRET` and `ADMIN_PASSWORD` values for production web/API services.
4. Decide whether a live demo agent and direct admin customer/workspace creation are required for launch.
5. Configure DNS and host-level routing for any desired subdomains.

## 7. Implementation Status Before This Pass

Completed:

- Phase 1 public repositioning for `/`, `/pricing`, `/demo`, and `/bd`.
- Gumroad removed from the main user journey.
- Global SaaS and Bangladesh local service pricing centralized in `packages/config/pricing.ts`.
- Dashboard billing copy now uses AI replies instead of tokens.
- Customer builder UI no longer exposes OpenAI model names.
- DeepSeek/OpenAI chat provider router added, with DeepSeek as default and OpenAI fallback.
- OpenAI embeddings preserved for the current Pinecone RAG pipeline.
- README and `.env.example` updated for the new product direction and provider setup.
- Paddle checkout module, checkout page, and signed webhook handler added.
- Prisma validation, web/API typecheck, and the full API/web/widget production build pass.

Still pending:

- Manual-plan usage boundary/concurrency verification.
- Production configuration of monthly/yearly payment price IDs and webhook secrets.
- Admin customer/workspace creation and live demo setup.
- Production configuration of the internal API secret and admin password; end-to-end verification against configured payment and AI services.

## 8. Current Implementation Pass

The worktree already contains schema-backed manual subscription fields, per-workspace monthly reply usage, admin editing for local annual clients, non-active subscription handling, the SaaS/local marketing pages, and DeepSeek/OpenAI routing. Private API and admin authorization have now been moved behind the authenticated Next.js proxy; preserve the existing work and run final validation.
