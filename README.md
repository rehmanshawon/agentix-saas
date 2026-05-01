# 🤖 Agentix SaaS

**Agentix** is a full-stack, multi-tenant Software-as-a-Service (SaaS) platform that empowers businesses to build, train, and deploy custom AI chatbots. Users can upload their company documents (PDFs, text files) to create a private "Second Brain" for their AI, customize the chatbot's persona and appearance, and embed it directly into their own websites using a lightweight JavaScript widget.

The platform includes built-in secure multi-tenancy, AI token usage tracking, and automated Stripe subscription billing.

---

## 🏗️ Project Architecture

Agentix is built as a **Monorepo** (managed by Turborepo and pnpm) to strictly separate concerns while sharing database schemas and configurations.

**The stack consists of 4 core pillars:**

1. **The Dashboard (Next.js):** A React-based web application where SaaS customers sign up, manage their subscription, upload training documents, and configure their AI Agent's appearance.
2. **The Core API (NestJS):** A robust backend server that acts as the traffic controller. It handles file parsing, Stripe webhook processing, and coordinates the AI logic securely.
3. **The RAG Pipeline (OpenAI + Pinecone + LangChain):** When documents are uploaded, the NestJS API chunks the text and stores it as vector embeddings in Pinecone. When a chat message arrives, it retrieves the most relevant chunks and feeds them to OpenAI (`gpt-4o-mini`) to generate an accurate, context-aware response.
4. **The Embeddable Widget (Vite + Vanilla JS):** A lightweight, standalone script that customers inject into their HTML. It renders a shadow-DOM chat interface and communicates securely with the NestJS API.

### Architecture Diagram

```text
                        +-------------------------------------------------+
                        |                  STRIPE (Billing)               |
                        +-------------------------------------------------+
                                  | (Webhooks)           ^ (Checkout)
                                  v                      |
  +-----------------+      +-----------------------------------------+      +-----------------+
  |  SaaS Customer  | ---> |          NEXT.JS DASHBOARD (Web)        | ---> |  MySQL Database |
  | (Browser/Admin) |      | (Auth, UI, Agent Builder, File Uploads) |      | (Users, Agents, |
  +-----------------+      +-----------------------------------------+      |  Workspaces)    |
                                                |                           +-----------------+
                                                v                                   ^
  +-----------------+      +-----------------------------------------+              |
  |  End User       | ---> |              NESTJS API (Hub)           | --------------
  | (Widget Chat)   |      |   (Chat Logic, Vectorization, Billing)  |
  +-----------------+      +-----------------------------------------+
                                  |                           |
                                  v                           v
                        +-------------------+       +-------------------+
                        | PINECONE (Vector) |       |   OPENAI (LLM)    |
                        | (Document Chunks) |       | (Embeddings/Chat) |
                        +-------------------+       +-------------------+
```

---

## 📂 Directory Tree Structure

```text
agentix-saas/
├── apps/
│   ├── api/                   # NestJS Backend Application
│   ├── web/                   # Next.js Frontend Dashboard
│   └── widget/                # Vite Vanilla JS Embeddable Widget
├── packages/
│   ├── config/                # Shared configurations (ESLint, TSConfig)
│   └── database/              # Prisma ORM & MySQL Schema
├── docker-compose.yml         # Local development database provisioning
├── package.json               # Root workspace dependencies & Turbo scripts
├── pnpm-workspace.yaml        # Monorepo workspace definitions
└── turbo.json                 # Turborepo build pipeline configuration
```

---

## 📖 Developer Guide: What File Does What?

### 1. `apps/api/` (The NestJS Backend)

This is the brain of the application. It handles all heavy lifting, AI processing, and database interactions.

- **`src/ai/rag.service.ts`:** The "Retrieval-Augmented Generation" engine. It takes uploaded files, parses the text (via `pdf-parse`), chunks it, converts it to vectors via OpenAI, and stores it in Pinecone with strict tenant-isolation metadata.
- **`src/ai/chat.service.ts`:** The conversational engine. It takes a user's chat message, searches Pinecone for relevant workspace knowledge, constructs a LangChain prompt, and asks OpenAI to generate the final response.
- **`src/chat/chat.controller.ts`:** The API routes for the chat widget. It exposes endpoints to get the agent's theme/color (`GET /api/chat/:agentId`) and to handle incoming chat messages (`POST /api/chat/message`). It also deducts SaaS tokens from the user's balance here!
- **`src/knowledge/knowledge.controller.ts`:** Handles multipart file uploads from the Next.js dashboard, creates Document records in MySQL, and triggers the `RagService`.
- **`src/billing/billing.service.ts & controller.ts`:** Communicates with Stripe. Generates secure checkout session URLs and listens for Stripe Webhooks (`checkout.session.completed`) to instantly upgrade users to the Pro tier and grant them AI tokens.

### 2. `apps/web/` (The Next.js Dashboard)

The SaaS user interface where buyers configure their agents. Built with App Router and Tailwind CSS.

- **`app/layout.tsx & providers.tsx`:** The root shell of the app. It wraps the application in the NextAuth `SessionProvider` so user data is accessible everywhere.
- **`app/page.tsx`:** The intelligent entry point. It instantly redirects logged-in users to the dashboard and guests to the login page.
- **`app/dashboard/builder/page.tsx`:** The Agent Builder UI. Contains the form to set the Agent's name, prompt, and color, alongside a beautiful live-updating mock iPhone chat preview.
- **`app/dashboard/knowledge/page.tsx`:** The Knowledge Base UI. Provides a drag-and-drop zone for users to upload PDFs/TXT files to train their AI.
- **`app/dashboard/billing/page.tsx`:** The Pricing UI. Displays the Free vs Pro tiers and initiates the Stripe Checkout flow.
- **`lib/auth.ts`:** The NextAuth configuration. Handles Google OAuth and Credentials login, and automatically provisions new users into the MySQL database upon sign-up.

### 3. `apps/widget/` (The Embeddable Chat UI)

The script that SaaS customers put on their own websites.

- **`src/widget.js`:** A standalone Vanilla JavaScript file wrapped in an IIFE (Immediately Invoked Function Expression). When executed, it creates an isolated `ShadowDOM` so its CSS doesn't conflict with the host website. It fetches its custom branding from the NestJS API, renders the floating chat button, and handles sending/receiving messages to the AI.
- **`vite.config.js`:** The bundler config. It minifies `widget.js` and outputs the production-ready file directly into the Next.js `apps/web/public` folder so it can be served publicly over the internet.

### 4. `packages/database/` (The Data Layer)

Contains everything related to the MySQL relational database.

- **`schema.prisma`:** The single source of truth for the database structure. Defines models for `User`, `Workspace`, `WorkspaceMember`, `Agent` (the chatbot settings), and `Document` (uploaded files tracking).

### 5. `Root Configurations`

- **`docker-compose.yml`:** Provisions a local MySQL database (port 3307) and Redis instance instantly, so developers don't have to install databases natively on their machines.
- **`.env`:** Contains the environment variables needed to run the app (OpenAI Keys, Pinecone Keys, Stripe Secrets, Database URLs).

---

## 🚀 Running the Project Locally

1. **Start the local database:**
   ```bash
   docker compose up -d
   ```
2. **Sync the Prisma Schema:**
   ```bash
   corepack pnpm db:push
   corepack pnpm db:generate
   ```
3. **Start the Development Servers:**
   ```bash
   corepack pnpm dev
   ```
   _Next.js will run on `http://localhost:3000` and NestJS on `http://localhost:3001`._
