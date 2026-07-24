# Agentix Transformation Plan

Last updated: 2026-06-14

## 1. Current Architecture Summary

Agentix is a pnpm monorepo with:

- Next.js web app in `apps/web`.
- NestJS API in `apps/api`.
- Vanilla JS embeddable widget in `apps/widget`.
- Prisma/MySQL data layer in `packages/database`.
- Shared pricing config in `packages/config`.

The core SaaS flow already exists: customers sign up, get a workspace, upload documents, vectorize them into Pinecone, configure an agent, copy an embed script, and public visitors chat with that agent. Stripe checkout and webhooks set subscription tier and reply credit balance.

## 2. Existing Issues and Gaps

- Public landing page still sells Agentix as a Gumroad/source-code product.
- Gumroad/source-code copy appears in the README.
- Pricing config is old, monthly-only, and not aligned with the new affordable SaaS plans.
- OpenAI is hardcoded for chat and embeddings.
- Customers can see model names in the builder UI.
- Usage is displayed as "tokens" even though the runtime decrements one credit per AI reply.
- Limits are duplicated across API controllers and admin code.
- Admin can edit tier and token balance, but does not yet have a full local annual subscription model with dates, notes, or expiry state.
- Stripe works for basic subscription activation/cancelation, but lacks robust status history, failed-payment handling, yearly price IDs, and a customer portal.
- Paddle can be used as the primary global card checkout provider when Stripe is unavailable, but it requires Paddle merchant approval, product/price setup, approved checkout domain, client token, API key, and webhook secret.
- API authorization relies heavily on email parameters in several NestJS endpoints.

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
- Continue using `Workspace.tokenBalance` as reply credits for now.
- Add minimal admin support for manual local clients if schema changes are acceptable:
  - local/manual plan type
  - annual start/end date
  - monthly reply limit
  - payment/agreement notes
  - active/inactive/expired status
- Add durable monthly usage table if a migration window is available.

### Phase 4: Deployment, Demo, Embed, and Polish

- Document subdomain mapping:
  - `agentix.ilogicmagic.com`
  - `app.agentix.ilogicmagic.com`
  - `demo.agentix.ilogicmagic.com`
  - `bd.agentix.ilogicmagic.com`
- Improve public demo with a configured demo agent ID.
- Improve embed onboarding and checklist copy.
- Add SEO metadata for new public pages.
- Tighten CORS/admin auth/session-based API authorization.

## 5. Risks

- Changing database schema for manual annual plans requires Prisma migration/deploy coordination.
- Existing workspaces may use legacy `ENTERPRISE` tier values, so pricing changes should preserve compatibility.
- DeepSeek does not provide the same embedding API as OpenAI in the current code, so embeddings should remain OpenAI-based until an embedding alternative is selected.
- Stripe yearly prices need real Stripe price IDs before production checkout can support annual billing.
- Some current API endpoints trust email parameters; fixing that properly requires coordinated frontend/API auth work.

## 6. Exact Next Steps

1. Update shared pricing config with new USD plan amounts, annual price fields, local BDT service plans, and reusable limit helpers.
2. Update public landing page to global SaaS positioning and remove Gumroad.
3. Add `/bd`, `/pricing`, and `/demo`.
4. Update dashboard billing and builder copy to hide model names/tokens from normal customers.
5. Add model provider abstraction in the API and route chat through DeepSeek default/OpenAI fallback.
6. Update environment docs and README.
7. Run typecheck/build, then fix any errors introduced by the changes.

## 7. Implementation Status From This Pass

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
- Typecheck and build passed.

Still pending:

- Full schema-backed manual annual subscription management for Bangladesh clients.
- Durable monthly usage events and reset history.
- Stronger session-based authorization for email-parameter API endpoints.
- Pinecone vector cleanup when documents are deleted.
