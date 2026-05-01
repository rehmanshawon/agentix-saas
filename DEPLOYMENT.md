# 🚀 Agentix SaaS — Deployment Guide

This guide walks you through deploying Agentix to production, step by step.

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **pnpm** installed
- **Docker & Docker Compose** (for local MySQL — optional if using a cloud DB)
- **A Stripe account** (for billing)
- **An OpenAI account** (for AI features)
- **A Pinecone account** (for vector search)

---

## Step 1: Clone & Install

```bash
git clone <your-repo-url> agentix-saas
cd agentix-saas
corepack pnpm install
```
