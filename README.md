# Agentix SaaS

Agentix is an AI chatbot SaaS for businesses and institutions worldwide. Customers upload company documents (PDF/TXT), train an assistant using vector RAG, copy an embeddable script tag, and install a 24/7 AI chatbot on their website in minutes.

The platform is designed with two distinct market models under **iLogic Magic** (`www.ilogicmagic.com`):

1. **Global Self-Service SaaS** (`agentix.ilogicmagic.com`):
   - Fast, affordable self-service chatbot builder for global small businesses (e-commerce, coaching, clinics, agencies).
   - Stripe card checkout in USD.
   - Core proposition: *“Upload your business PDFs, train your AI chatbot, and embed it on your website in 3 clicks.”*
2. **Bangladesh Done-For-You Managed Service** (`bd.agentix.ilogicmagic.com` / `/bd`):
   - Annual turnkey setup, document training, embed installation, and maintenance for local businesses and institutions (Universities, Coaching centers, Clinics, Agencies, E-commerce).
   - Manual consultation, formal agreement, bank transfer, invoice, cash, or manual mobile payment (no international card or Stripe required).
   - Core proposition: *“We install a 24/7 AI assistant on your website, train it with your documents, and maintain it for one full year.”*

---

## Architecture & Monorepo Structure

```
agentix-saas/
├── apps/
│   ├── web/           # Next.js 14 App Router (Marketing, Auth, Dashboards, Webhooks, Next.js API proxy)
│   ├── api/           # NestJS 10 REST API (Chat, RAG, Knowledge, AI router, Billing, Admin)
│   └── widget/        # Vanilla JS shadow-DOM embeddable chatbot widget (Vite build -> apps/web/public/widget.js)
├── packages/
│   ├── database/      # Prisma schema (MySQL) and generated client
│   └── config/        # Shared pricing, tier definitions, limits, and helper methods
├── docs/              # AGENTIX_CODEBASE_AUDIT.md and AGENTIX_TRANSFORMATION_PLAN.md
└── docker-compose.yml # Local MySQL (3306/3307) and Redis (6379)
```

---

## Routing & Subdomain Architecture

Next.js middleware (`apps/web/middleware.ts`) automatically rewrites incoming subdomain traffic while preserving direct path equivalents:

| Host / Subdomain | Target Route | Purpose |
| :--- | :--- | :--- |
| `agentix.ilogicmagic.com` | `/` | Global SaaS marketing landing page |
| `app.agentix.ilogicmagic.com` | `/app` &rarr; `/dashboard` | SaaS web application & dashboard |
| `demo.agentix.ilogicmagic.com` | `/demo` | Interactive public chatbot demo |
| `bd.agentix.ilogicmagic.com` | `/bd` | Bangladesh done-for-you managed service |

### Public Routes
- `/`: Global SaaS landing page
- `/pricing`: Dual pricing overview (Global Stripe USD plans + Bangladesh BDT annual packages)
- `/bd`: Bangladesh managed service page with consultation CTAs
- `/demo`: Interactive chatbot preview (no Gumroad redirects)
- `/contact`: Direct consultation and inquiry form for custom/enterprise and local BD clients
- `/app`: Convenience entry point redirecting to `/dashboard` (or `/login`)

### Authenticated Customer Dashboard
- `/dashboard`: Control center displaying onboarding progress and monthly reply usage
- `/dashboard/knowledge`: Drag-and-drop PDF and TXT document upload with vector indexing
- `/dashboard/builder`: Agent customization (name, prompt, brand color) and embed snippet generator
- `/dashboard/billing`: Subscription plans, current usage, and Stripe checkout

### Admin Dashboard (`/admin`)
- `/admin`: Analytics and MRR dashboard
- `/admin/subscribers`: Full client management with **Add Client / Tenant** modal, plan assignment, expiry controls, status toggling, and reply overrides
- `/admin/analytics`, `/admin/settings`, `/admin/integrations`: System administration

---

## Pricing & Plan Caps

Every plan includes strict caps — never unlimited AI usage:

### A. Global SaaS (Stripe / USD)
- **Starter**: `$7/month` or `$69/year` | 1 chatbot | 1,000 AI replies/mo | 5 docs | Agentix branding
- **Growth**: `$15/month` or `$149/year` | 3 chatbots | 5,000 AI replies/mo | 25 docs | Basic customization
- **Business**: `$29/month` or `$299/year` | 10 chatbots | 15,000 AI replies/mo | 75 docs | Branding removal & priority support

### B. Bangladesh Annual Managed Service (BDT / Invoicing)
- **Basic AI Assistant**: `৳30,000–৳45,000/year` | 1 chatbot | 1,500 AI replies/mo | 10 docs | Website installation, document training, basic annual maintenance
- **Standard AI Assistant**: `৳60,000–৳90,000/year` | 3 chatbots | 5,000 AI replies/mo | 30 docs | Installation, monthly content updates, lead capture, dashboard access
- **Institutional AI Desk**: `৳120,000–৳250,000/year` | 10 chatbots | 15,000 AI replies/mo | 100 docs | Universities, coaching centers, agencies, priority maintenance

---

## AI Model Provider & Routing

- **Default Provider**: **DeepSeek V4 Flash** (`deepseek-v4-flash`). Selected for superior speed, cost efficiency, and accuracy.
- **Automatic Fallback Provider**: **OpenAI** (`gpt-4o-mini`). Triggers automatically if DeepSeek returns an error or times out.
- **Embedding Provider**: **OpenAI** (`text-embedding-3-small`). Vector dimensions match the Pinecone index.
- **Customer Privacy**: Model names and token mechanics are concealed from customers; the UI displays "Platform default" and business-facing AI reply counts.

### Environment Variables

```bash
# Provider routing
DEFAULT_AI_PROVIDER=deepseek
FALLBACK_AI_PROVIDER=openai

# DeepSeek (Default chat model)
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_CHAT_MODEL=deepseek-v4-flash

# OpenAI (Fallback chat model + Pinecone embeddings)
OPENAI_API_KEY=your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_FALLBACK_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Vector DB
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=agentix-index

# Database
DATABASE_URL="mysql://root:password@127.0.0.1:3307/agentix"

# Security & Admin
API_INTERNAL_SECRET=generate-a-random-secret
ADMIN_PASSWORD=replace-with-a-strong-password
NEXTAUTH_SECRET=generate-a-random-secret
NEXTAUTH_URL=https://agentix.ilogicmagic.com
```

---

## Admin Client & Tenant Management

Local Bangladesh clients and manual enterprise accounts are managed directly from `/admin/subscribers`:

1. Click **+ Add Client / Tenant**.
2. Enter the client's email, business name, and optional password (auto-generated if omitted).
3. Select their plan (`BD_BASIC`, `BD_STANDARD`, `BD_INSTITUTIONAL`, `STARTER`, `GROWTH`, `ENTERPRISE`).
4. Set the annual start date and expiry date (use the quick **+1 Year** preset).
5. Specify the monthly AI reply cap and add agreement/payment notes (e.g. *"INV-1024, Bank Transfer BDT 60,000"*).
6. The client workspace, user account, and default agent are created immediately.
7. Use the **Expire** / **Activate** button to immediately manage access if an agreement expires.

---

## Local Development & Verification

```bash
# 1. Install dependencies
corepack pnpm install

# 2. Database setup
docker compose up -d
corepack pnpm db:push
corepack pnpm db:generate

# 3. Typecheck
OPENSSL_CONF=/dev/null corepack pnpm run typecheck

# 4. Production build
OPENSSL_CONF=/dev/null corepack pnpm run build

# 5. Start development
corepack pnpm dev
```

---

## Detailed Documentation

- [Codebase Audit](docs/AGENTIX_CODEBASE_AUDIT.md)
- [Transformation Plan](docs/AGENTIX_TRANSFORMATION_PLAN.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Stripe Setup](STRIPE_SETUP.md)
- [Admin Guide](ADMIN_GUIDE.md)
