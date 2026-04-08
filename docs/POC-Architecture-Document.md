# Architect AI — Proof of Concept Document

**Version:** 1.0
**Date:** April 8, 2026
**Prepared for:** Co-Founder Review
**Classification:** Internal / Confidential

---

## 1. Executive Summary

Architect AI is a **SaaS platform for autonomous AI agent orchestration**. It enables businesses to deploy, manage, and monitor AI agents (powered by Claude, GPT, etc.) that autonomously execute tasks — SEO audits, code generation, content creation, data analysis, and more.

**Key differentiator:** Agents run locally on the customer's machine using their own API keys, while the management dashboard is hosted in the cloud. This means:
- Zero infrastructure cost per customer for compute
- Customer data never leaves their machine
- We only host the lightweight UI layer

---

## 2. Architecture

```
                    CLOUD (Vercel - Free/Pro)
                    ┌─────────────────────────┐
                    │   React Dashboard (UI)   │
                    │   - User auth (sign up)  │
                    │   - Admin panel          │
                    │   - Agent monitoring     │
                    │   - Task management      │
                    └───────────┬─────────────┘
                                │ HTTPS
                                │ (connects to customer's local server)
                                ▼
              CUSTOMER'S MACHINE (Local)
              ┌─────────────────────────────────┐
              │  Yantra Server (Node.js)         │
              │  ┌───────────────────────────┐   │
              │  │ Embedded PostgreSQL (DB)   │   │
              │  └───────────────────────────┘   │
              │  ┌───────────────────────────┐   │
              │  │ AI Agents (Claude Code)    │   │
              │  │ - Execute tasks locally    │   │
              │  │ - Access local filesystem  │   │
              │  │ - Browser automation (MCP) │   │
              │  └───────────────────────────┘   │
              │  ┌───────────────────────────┐   │
              │  │ Customer's API Keys        │   │
              │  │ - Anthropic (Claude)       │   │
              │  │ - OpenAI (GPT)             │   │
              │  │ - Stored encrypted (AES)   │   │
              │  └───────────────────────────┘   │
              └─────────────────────────────────┘
```

### How It Works

1. Customer signs up on our hosted dashboard (Vercel)
2. Customer installs Yantra server on their computer (one command)
3. Dashboard connects to their local server via URL
4. Customer adds their Anthropic API key in the dashboard
5. They create agents that run locally using Claude Code
6. Dashboard shows real-time agent activity, costs, and results

---

## 3. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Tailwind CSS, Vite | Dashboard UI |
| **Hosting** | Vercel (free tier) | Serves static UI |
| **Backend** | Node.js, Express, TypeScript | API server (runs locally) |
| **Database** | Embedded PostgreSQL | Zero-config DB (runs locally) |
| **AI Runtime** | Claude Code, OpenAI Codex | Agent execution |
| **Browser Automation** | Chrome MCP (Model Context Protocol) | Web scraping, testing |
| **Auth** | Better Auth (email/password) | User management |
| **Encryption** | AES-256-GCM | API key storage |

---

## 4. Infrastructure Costs

### Our Costs (Platform Provider)

| Service | Tier | Monthly Cost | Notes |
|---------|------|-------------|-------|
| **Vercel** | Hobby (free) → Pro | $0 → $20/mo | Static site hosting, 100GB bandwidth |
| **Domain** | .com/.ai | $10-15/yr | e.g., architectai.com |
| **Monitoring** | Vercel Analytics | $0 (included) | Page views, web vitals |
| **Total (launch)** | | **$0/mo** | Free tier is sufficient for MVP |
| **Total (growth)** | | **$20/mo** | Vercel Pro at ~1000+ users |

### Customer Costs (Per User)

| Item | Cost | Notes |
|------|------|-------|
| **Anthropic API Key** | $5-100/mo (usage-based) | Customer provides their own |
| **Compute** | $0 (their machine) | Agents run locally |
| **Storage** | $0 (their machine) | Embedded PostgreSQL, local files |
| **Our SaaS Fee** | TBD (see pricing below) | Dashboard access |

**Key insight:** Our marginal cost per customer is effectively $0. We don't pay for AI API calls, compute, or storage. The customer brings their own API key and machine.

---

## 5. Bandwidth & Performance

### Dashboard (Vercel)
- **Initial load:** ~250KB gzipped (React app)
- **API calls:** Proxied to customer's local server
- **Bandwidth per user:** ~5-10MB/month (UI assets cached after first load)
- **Vercel free tier:** 100GB/month = supports ~10,000-20,000 active users

### Local Server (Customer Machine)
- **RAM:** ~150-300MB (Node.js + embedded PostgreSQL)
- **Disk:** ~500MB base + agent data
- **CPU:** Minimal when idle; spikes during agent runs
- **Network:** API calls to Anthropic/OpenAI (customer's bandwidth)

### Minimum Customer Requirements
- **OS:** Windows 10/11, macOS 12+, Linux
- **RAM:** 4GB minimum (8GB recommended)
- **Disk:** 1GB free space
- **Network:** Broadband internet for API calls
- **Software:** Node.js 20+ (installed automatically)

---

## 6. Pricing Strategy (Proposed)

### Freemium Model

| Tier | Price | Limits | Target |
|------|-------|--------|--------|
| **Free** | $0/mo | 1 company, 2 agents, 50 tasks/mo | Individual developers, trial |
| **Pro** | $29/mo | 3 companies, 10 agents, unlimited tasks | Freelancers, small teams |
| **Team** | $79/mo | 10 companies, 50 agents, priority support | Agencies, SMBs |
| **Enterprise** | Custom | Unlimited, SSO, dedicated support | Large organizations |

### Revenue Projections (Conservative)

| Month | Free Users | Paid Users | MRR |
|-------|-----------|-----------|-----|
| 1-3 | 100 | 5 | $145 |
| 4-6 | 500 | 25 | $725 |
| 7-12 | 2,000 | 100 | $2,900 |
| 12-18 | 5,000 | 300 | $8,700 |
| 18-24 | 10,000 | 750 | $21,750 |

*Assumes 5% free-to-paid conversion, average $29/mo per paid user.*

---

## 7. Customer Onboarding Flow

```
Step 1: Sign Up
   → Visit architectai.com
   → Create account (email + password)
   → Lands on dashboard

Step 2: Install Local Server
   → One-command installer shown in dashboard:
     npx create-yantra@latest
   → Starts server automatically on localhost:3100

Step 3: Connect Dashboard
   → Dashboard auto-detects local server
   → Or user enters server URL manually

Step 4: Configure
   → Add Anthropic API key (stored encrypted locally)
   → Create first company/organization
   → Create first AI agent

Step 5: Run
   → Assign tasks to agents
   → Agents execute locally using Claude Code
   → Results appear in real-time on dashboard
```

### Distribution Options

| Method | Effort | Best For |
|--------|--------|----------|
| **npm package** (`npx create-yantra`) | Low | Developers |
| **Desktop installer** (.exe/.dmg) | Medium | Non-technical users |
| **Docker image** | Low | DevOps teams |
| **Homebrew formula** | Low | macOS users |

---

## 8. Security Model

| Aspect | Implementation |
|--------|---------------|
| **API Keys** | AES-256-GCM encrypted, stored locally only |
| **Auth** | Session-based (Better Auth), HTTP-only cookies |
| **Data at Rest** | All data stays on customer's machine |
| **Data in Transit** | HTTPS between dashboard and local server |
| **Passwords** | bcrypt hashed, minimum 8 characters |
| **Admin Access** | Role-based (instance admin, company owner, member) |
| **Agent Isolation** | Each agent runs in separate process |

**Privacy advantage:** We never see customer data, API keys, or agent output. Everything runs locally. This is a strong selling point for enterprise and regulated industries.

---

## 9. Current POC Status

### Completed
- [x] Azure Clarity UI design system (light theme)
- [x] User authentication (sign up / sign in)
- [x] Admin panel with user metrics
- [x] Anthropic API key management (encrypted storage)
- [x] Agent orchestration (CEO, CTO, SEO agents)
- [x] Task management with real-time status
- [x] Browser automation via Chrome MCP
- [x] Cost tracking and budget management
- [x] Activity feed and dashboard metrics
- [x] Multi-company/organization support
- [x] Vercel-ready frontend (static deployment)
- [x] CORS support for remote dashboard access

### Remaining for Launch
- [ ] npm installer package (`npx create-yantra`)
- [ ] Vercel deployment + custom domain
- [ ] Stripe integration for paid tiers
- [ ] Usage metering and tier enforcement
- [ ] Customer onboarding email flow
- [ ] Documentation site
- [ ] Landing page

---

## 10. Competitive Advantages

| vs. | Our Advantage |
|-----|--------------|
| **CrewAI / AutoGen** | Full dashboard + auth + multi-tenant. Not just a framework. |
| **ChatGPT Teams** | Agents run locally, access filesystem and browser. Not just chat. |
| **Devin / Cursor** | Multi-agent orchestration, not single-agent coding. |
| **AWS Bedrock Agents** | No cloud costs. Customer owns their compute. |

**Moat:** Network effects from agent templates, skill marketplace, and company-shared agent configurations.

---

## 11. Next Steps

1. **Deploy frontend to Vercel** — 30 minutes
2. **Create npm installer** — 2-3 hours
3. **Set up Stripe billing** — 1-2 days
4. **Landing page** — 1 day
5. **Soft launch** to 10 beta users — Week 1
6. **Product Hunt launch** — Week 4

---

## 12. Team Requirements

| Role | When | Why |
|------|------|-----|
| **Founder (You)** | Now | Product, strategy, sales |
| **Co-Founder (Technical)** | Now | Architecture, backend, agent SDK |
| **Frontend Dev** | Month 2 | Dashboard polish, landing page |
| **DevRel / Docs** | Month 3 | Docs, tutorials, community |
| **Support** | Month 6 | Customer success |

---

*This document is a living POC specification. Updated as the product evolves.*
