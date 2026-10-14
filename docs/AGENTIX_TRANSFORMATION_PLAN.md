# Agentix Transformation Plan

Last updated: 2026-10-14

## 1. Current Architecture Summary

Agentix is a full-featured monorepo with:
- **`apps/web`**: Next.js 14 App Router application handling public marketing pages (`/`, `/pricing`, `/bd`, `/demo`, `/contact`), user authentication (NextAuth), customer dashboard (`/dashboard`, `/dashboard/knowledge`, `/dashboard/builder`, `/dashboard/billing`), admin portal (`/admin`, `/admin/subscribers`), and webhook endpoints (`/api/webhooks/stripe`, `/api/webhooks/paddle`).
- **`apps/api`**: NestJS 10 backend providing document ingestion, PDF parsing, Pinecone vector storage, DeepSeek V4 Flash default chat completion with OpenAI fallback, atomic monthly reply tracking, and admin management endpoints.
- **`apps/widget`**: Standalone Vite-built Shadow DOM chat embed (`apps/web/public/widget.js`).
- **`packages/database`**: Prisma schema configured with MySQL multi-tenant models (`Workspace`, `WorkspaceMember`, `User`, `Agent`, `Document`, `WorkspaceMonthlyUsage`).
- **`packages/config`**: Centralized pricing, tier configurations, and reply/document limits for both global Stripe plans and Bangladesh managed service plans.

---

## 2. Identified Gaps & Target Enhancements

1. **Manual Client Creation in Admin Panel**:
   - *Current state*: Admin can edit existing workspaces (`PATCH /api/admin/workspaces/:id`), but there is no API endpoint or UI form to manually onboard a new client from scratch.
   - *Requirement*: Local Bangladesh clients pay manually (bank transfer, cash, etc.) and need admin creation of customer accounts, workspaces, plan assignment, expiry dates, monthly caps, and notes.
2. **Subdomain Routing & Route Parity**:
   - *Current state*: Routes exist under `/`, `/pricing`, `/bd`, `/demo`, but `/contact` and `/app` are missing. Subdomain host rewriting (`bd.agentix.ilogicmagic.com`, `demo.agentix.ilogicmagic.com`, `app.agentix.ilogicmagic.com`) is not handled in Next.js middleware.
   - *Requirement*: Add `apps/web/middleware.ts` for clean host routing alongside route-based equivalents (`/app`, `/contact`, `/bd`, `/demo`).
3. **Admin Expiration & Status Controls**:
   - *Current state*: Chat endpoint checks expiry, but admin needs quick visibility, expiration warnings, and one-click toggle to disable/enable an account.
4. **Billing UI Alignment**:
   - *Current state*: Billing page displays Stripe plans well, but if an account has a manual or Bangladesh plan (`BD_BASIC`, `BD_STANDARD`, `BD_INSTITUTIONAL`), it should clearly display their managed plan name, annual term, and monthly reply allocation instead of treating it as "No Plan" or an unrecognized string.
5. **Contact Page & Lead Capture**:
   - *Current state*: CTAs link to `mailto:hello@ilogicmagic.com`. Having a dedicated `/contact` page with a consultation form improves conversion for both enterprise global leads and local Bangladesh businesses.

---

## 3. Files Likely to Change

- `apps/api/src/admin/admin.controller.ts`: Add `POST /api/admin/workspaces` for creating manual customer workspaces with user accounts, initial agents, plans, and notes.
- `apps/web/app/admin/subscribers/page.tsx`: Add "Add Client / Tenant" modal dialog and quick status toggle.
- `apps/web/middleware.ts`: Add Next.js host header routing for `bd.*`, `demo.*`, and `app.*` subdomains.
- `apps/web/app/app/page.tsx`: Route redirecting `/app` to `/dashboard`.
- `apps/web/app/contact/page.tsx`: Contact / Consultation request page for local and global custom clients.
- `apps/web/app/dashboard/billing/page.tsx`: Support displaying Bangladesh/manual service tier names and statuses cleanly.
- `apps/web/components/Navbar.tsx`: Update navigation links to include Contact and Bangladesh options cleanly.
- `packages/config/pricing.ts`: Verify plan limits and helper functions (`isLocalPlan`, etc.).
- `README.md`, `DEPLOYMENT.md`, `.env.example`: Update documentation with full subdomain setup, DeepSeek V4 Flash config, and manual client administration instructions.

---

## 4. Implementation Phases

### Phase 1: Routing, Subdomain Architecture & Public Pages
- Implement Next.js `middleware.ts` to support subdomain mapping (`bd.*`, `app.*`, `demo.*`).
- Add `/app` route redirecting to dashboard/login.
- Add `/contact` page with clear forms for global inquiries and Bangladesh consultation requests.
- Ensure all navigation bars and footers provide cohesive links.

### Phase 2: AI Provider & Model Router Verification
- Validate `ModelRouter`, `ChatCompletionService`, and `EmbeddingService`.
- Verify DeepSeek V4 Flash (`deepseek-v4-flash`) is the primary chat model.
- Verify OpenAI fallback (`gpt-4o-mini`) triggers seamlessly on error.
- Verify environment documentation for `DEEPSEEK_*` and `OPENAI_*`.

### Phase 3: Admin Manual Client & Tenant Management
- Add `POST /api/admin/workspaces` in NestJS `AdminController` to create:
  - User record (with email, name, hashed password)
  - Workspace record (with subscription tier, status, annual start/end dates, monthly reply limit, payment notes)
  - WorkspaceMember (OWNER role)
  - Default Agent (ready for embedding)
- Build "Add Client" modal in `apps/web/app/admin/subscribers/page.tsx`.
- Enhance workspace table with status badges (Active, Manual, Expired, Canceled) and expiry countdowns.

### Phase 4: Usage Limits, Billing Display & Final Polish
- Ensure customer dashboard and billing page display managed Bangladesh plans correctly with their respective monthly reply quotas.
- Verify atomic reply counter in `ChatController`.
- Run full typecheck and production build.
- Update `README.md` and deployment documentation.

---

## 5. Risks & Mitigations

1. **Prisma User / Workspace Relations**:
   - *Risk*: Creating a workspace with an existing email could conflict or duplicate accounts.
   - *Mitigation*: Look up existing `User` by email; if found, link to a new or existing workspace; if not found, create new `User` with secure temporary password.
2. **Subdomain Routing in Local Development vs Production**:
   - *Risk*: `host` headers differ between localhost and production domains.
   - *Mitigation*: Support both subdomain matching (e.g., `bd.agentix.ilogicmagic.com`) and path-based URLs (`/bd`, `/demo`, `/pricing`, `/contact`) so development and production work identically.
3. **Database Schema Constraints**:
   - *Risk*: Incompatible schema updates.
   - *Mitigation*: The database schema already includes all necessary fields (`subscriptionTier`, `subscriptionStatus`, `billingProvider`, `subscriptionStartDate`, `subscriptionExpiresAt`, `subscriptionNotes`, `monthlyReplyLimit`, `tokenBalance`). No destructive Prisma migrations required.

---

## 6. Exact Next Steps

1. Create `apps/web/middleware.ts` for host-based subdomain routing.
2. Create `apps/web/app/app/page.tsx` and `apps/web/app/contact/page.tsx`.
3. Update `packages/config/pricing.ts` helper methods if needed.
4. Add `POST /api/admin/workspaces` to `apps/api/src/admin/admin.controller.ts`.
5. Update `apps/web/app/admin/subscribers/page.tsx` with the Client Creation Modal.
6. Refine `apps/web/app/dashboard/billing/page.tsx` for manual plan recognition.
7. Run `OPENSSL_CONF=/dev/null corepack pnpm run typecheck` and `build`.
8. Update `README.md`, `DEPLOYMENT.md`, and `.env.example`.
