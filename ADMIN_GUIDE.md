# 🛠️ Admin Dashboard Guide

The Agentix admin dashboard is your command center for managing your entire AI chatbot SaaS business. Access it at `/admin` on your deployment.

---

## 🔐 Accessing the Admin Panel

1. Navigate to `https://yourdomain.com/admin`
2. Enter the admin password (default: `admin123`)
3. **Change this password immediately** in Settings → Security

---

## 📊 Overview

The Overview tab gives you a bird's-eye view of your business:

- **Total Workspaces** — All customer accounts
- **Active Subscriptions** — Currently paying customers
- **Monthly Revenue (MRR)** — Recurring revenue from all subscriptions
- **AI Agents Deployed** — Total chatbots created across all workspaces

### Charts

- **New Customer Signups** — Daily signup trend (bar chart)
- **AI Models Deployed** — Agents created per day (bar chart)
- **MRR Growth** — Monthly revenue trend (line chart)
- **Active Clients Table** — Recent workspaces with usage bars and status indicators

---

## 👥 Subscribers

Manage all your customer workspaces:

- **Search** — Filter by name, email, or subscription tier
- **Filter by Tier** — View only Starter, Growth, or Business subscribers
- **Sort** — Click any column header to sort
- **Edit** — Click "Edit" to change a workspace's tier or token balance
- **Export CSV** — Download subscriber list as a spreadsheet

---

## 📈 Analytics

### Revenue Tab

- Total all-time revenue
- Current MRR
- Average revenue per subscriber
- Revenue by tier (pie chart)
- MRR growth trend (12-month line chart)

### Usage Tab

- Tokens consumed vs. allocated
- Document and agent counts
- Top workspaces by token usage
- AI model distribution

---

## ⚙️ Settings

### Platform

- Customize platform name, brand color, logo, and favicon

### Subscription

- Enable/disable free trials
- Set trial duration and token allocation

### Email

- Configure SMTP for password reset emails (Resend, SendGrid, etc.)

### Security

- Change admin password
- Set API rate limits
- Configure session timeout

### Billing

- Toggle between Stripe Test Mode and Live Mode
- Update Stripe API keys without touching `.env` files
- Configure webhook secret

---

## 🔌 Integrations

### Service Status

Check the connection status of OpenAI, Pinecone, and Stripe at a glance.

### Webhooks

Add outgoing webhook URLs to receive real-time events:

- `chat.message` — Fires when a user sends a chat message
- `signup` — Fires when a new user registers
- `subscription` — Fires on subscription changes

### API Access

- Link to Swagger API documentation (`/api/docs`)
- API rate limit reference
- API key management (coming soon)
