# Agentix Codebase Audit

Last updated: 2026-10-14

## Executive Summary

Agentix is an AI chatbot SaaS monorepo built using Turborepo and pnpm. Originally structured with demo/source-code sales funnels (Gumroad), it is being converted into a real dual-market SaaS and managed service under `ilogicmagic.com`:

1. **Global Self-Service SaaS** (`agentix.ilogicmagic.com`):
   Affordable self-service chatbot builder with document training (PDF/TXT via RAG), Stripe subscriptions, and a 1-script embeddable website widget.
2. **Bangladesh Done-For-You Managed Service** (`bd.agentix.ilogicmagic.com` / `/bd`):
   Annual setup, custom document training, embed installation, and maintenance for local businesses and institutions (Universities, Coaching centers, Clinics, Agencies, E-commerce) with manual BDT invoicing.

---

## 1. Repository & Architecture Structure

```
agentix-saas/
├── apps/
│   ├── web/           # Next.js 14 App Router (Public marketing, Auth, Dashboards, Webhooks, Next.js API proxy)
│   ├── api/           # NestJS 10 REST API (Chat, RAG, Knowledge, AI router, Billing, Admin)
│   └── widget/        # Vanilla JS shadow-DOM embeddable chatbot widget (Vite build -> apps/web/public/widget.js)
├── packages/
│   ├── database/      # Prisma schema (MySQL) and generated client
│   └── config/        # Shared pricing, tier definitions, limits, and helper methods
├── docs/              # Architecture audits, transformation plans, setup guides
├── docker-compose.yml # Local MySQL (3306) and Redis (6379)
└── turbo.json         # Turbo pipeline configurations
```

---

## 2. Frontend & Routing (`apps/web`)

### Public Routes
- `/`: Global SaaS landing page. Clean marketing copy focusing on "Upload business PDFs → Train AI → Embed in 3 clicks". Highlights Starter ($7/mo), Growth ($15/mo), and Business ($29/mo) plans.
- `/pricing`: Dual pricing page showing Global USD plans (Stripe) and Bangladesh annual packages in BDT.
- `/bd`: Dedicated Bangladesh done-for-you service landing page (managed annual packages ৳30k - ৳250k).
- `/demo`: Interactive chatbot test page without any Gumroad redirects.
- `/contact`: Direct consultation and inquiry form for enterprise and local Bangladesh clients.
- `/app`: Convenience entry point redirecting to `/dashboard` (or `/login`).

### Customer Dashboard Routes (Protected)
- `/dashboard`: Control center displaying onboarding wizard, quick status, and current-month AI reply usage.
- `/dashboard/knowledge`: Drag-and-drop document upload (PDF/TXT up to 10MB), status tracking, and deletion.
- `/dashboard/builder`: Chatbot appearance, prompt configuration, and embed snippet generation.
- `/dashboard/billing`: Plan tier overview, current reply usage, and Stripe checkout launcher.

### Admin Dashboard Routes (`/admin`)
- `/admin`: Metrics dashboard with MRR, active clients, signups, and agent charts.
- `/admin/subscribers`: Workspace management table with manual plan assignment, status, dates, and client creation.
- `/admin/analytics`, `/admin/settings`, `/admin/integrations`: Administrative management interfaces.

### Backend Proxy (`/api/backend/[...path]`)
- Acts as a secure same-origin proxy between Next.js and NestJS.
- Injects `x-agentix-internal-token` (`API_INTERNAL_SECRET`) so direct NestJS endpoints cannot be invoked by unauthorized external callers.
- For customer requests: derives email directly from authenticated NextAuth session.
- For admin requests: validates HttpOnly signed admin cookie and injects `x-admin-key`.

---

## 3. Backend & API Services (`apps/api`)

- **Chat Module (`/api/chat`)**:
  - `GET /api/chat/config`, `POST /api/chat/config`: Configures the agent name, system prompt, and theme color.
  - `GET /api/chat/:agentId`: Public endpoint returning chatbot theme and name for the embed widget.
  - `POST /api/chat/message`: Public message endpoint with rate-limiting (`@Throttle`), active subscription verification, monthly reply limit enforcement, RAG retrieval, and atomic usage recording.
- **Knowledge Module (`/knowledge`)**:
  - `POST /knowledge/upload`: Multipart PDF/TXT upload with file signature validation, plan storage limit enforcement, text chunking, OpenAI embeddings, and Pinecone vector upsertion.
  - `GET /knowledge`: Lists documents for workspace.
  - `DELETE /knowledge/:id`: Deletes document metadata and removes Pinecone vectors filtered by `documentId` and `workspaceId`.
- **Billing Module (`/billing`)**:
  - `POST /billing/checkout`: Creates Stripe subscription checkout session.
  - `POST /billing/paddle/checkout`: Optional Paddle checkout integration.
- **Admin Module (`/api/admin`)**:
  - `GET /api/admin/dashboard/stats`: Returns workspace counts, active subscriptions, estimated MRR.
  - `GET /api/admin/workspaces`: Lists all workspaces with current-month reply usage and plan status.
  - `POST /api/admin/workspaces`: Allows manual creation of a customer workspace, owner user, initial agent, and subscription terms.
  - `PATCH /api/admin/workspaces/:id`: Updates manual plan, dates, reply limits, status, and payment notes.

---

## 4. AI Provider & RAG Pipeline

- **`ModelRouter` (`apps/api/src/ai/model-router.service.ts`)**:
  - Default chat provider: **DeepSeek V4 Flash** (`deepseek-v4-flash`).
  - Fallback chat provider: **OpenAI** (`gpt-4o-mini`).
  - Environment-driven: `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_CHAT_MODEL`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_FALLBACK_MODEL`.
  - Hides provider/model names from normal customers (UI displays "Platform default").
- **`ChatCompletionService` (`apps/api/src/ai/chat-completion.service.ts`)**:
  - Executes OpenAI-compatible chat completion requests.
  - Automatically fails over to OpenAI if DeepSeek encounters an error or network issue.
- **`EmbeddingService` (`apps/api/src/ai/embedding.service.ts`)**:
  - Uses OpenAI `text-embedding-3-small` (1536 dimensions) for Pinecone-compatible vector indexing.
- **`RagService` (`apps/api/src/ai/rag.service.ts`)**:
  - Extracts text from PDF using `pdf-parse` or text directly.
  - Chunks text using `RecursiveCharacterTextSplitter` (chunkSize: 1000, chunkOverlap: 200).
  - Embeds chunks and stores in Pinecone with metadata `{ workspaceId, documentId, fileName, text, loc_pageNumber }`.
- **Tenant Isolation**:
  - Vector retrieval strictly filters `{ workspaceId: { $eq: workspaceId } }`. Documents are never leaked across workspaces.

---

## 5. Pricing & Subscription Plans (`packages/config/pricing.ts`)

### Global SaaS Plans (USD / Stripe)
| Plan | Monthly | Yearly | Chatbots | Monthly AI Replies | Max Documents | Key Features |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Starter** | $7/mo | $69/yr | 1 | 1,000 | 5 | 1 chatbot, 1k replies, 5 docs, Agentix branding |
| **Growth** | $15/mo | $149/yr | 3 | 5,000 | 25 | 3 chatbots, 5k replies, 25 docs, basic customization |
| **Business** | $29/mo | $299/yr | 10 | 15,000 | 75 | 10 chatbots, 15k replies, 75 docs, branding removal |

### Bangladesh Managed Service Plans (BDT / Manual Agreement)
| Plan | Annual Price | Chatbots | Monthly Reply Cap | Max Documents | Service Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Basic AI Assistant** | ৳30,000 - ৳45,000/yr | 1 | 1,500 | 10 | 1 chatbot, website installation, document training, basic maintenance |
| **Standard AI Assistant** | ৳60,000 - ৳90,000/yr | 3 | 5,000 | 30 | Up to 3 chatbots, monthly content updates, lead capture, dashboard access |
| **Institutional AI Desk** | ৳120,000 - ৳250,000/yr | 10 | 15,000 | 100 | Multi-department, priority maintenance, large organizations/universities |

---

## 6. Gumroad References Audit

All Gumroad sales links, purchase redirects, and downloadable source-code CTAs have been completely eradicated from the application code, UI pages, and public user journeys. The site functions strictly as an operational SaaS and managed service platform.

---

## 7. Security, Isolation & Production Readiness

- **Internal API Protection**: NestJS endpoints are secured with `InternalApiGuard` checking `API_INTERNAL_SECRET`.
- **Admin Authentication**: Admin authentication uses server-verified signed HttpOnly cookies and environment password comparison.
- **Rate Limiting**: In-memory / Redis-ready ThrottlerGuard on chat endpoints preventing abuse.
- **Tenant Isolation**: Prisma multi-tenancy (`Workspace`, `WorkspaceMember`, `Agent`, `Document`, `WorkspaceMonthlyUsage`) and Pinecone metadata filtering by `workspaceId`.
- **Upload Sanitization**: Size limit (10MB) and mime/magic header verification for PDF/TXT.
