# Architect AI — Customer Setup Guide

**Get your AI agent team running in under 10 minutes.**

---

## Table of Contents

1. [What is Architect AI?](#1-what-is-architect-ai)
2. [How It Works](#2-how-it-works)
3. [What You Need](#3-what-you-need)
4. [Step-by-Step Setup](#4-step-by-step-setup)
5. [Adding Your Anthropic API Key](#5-adding-your-anthropic-api-key)
6. [Creating Your Workspace](#6-creating-your-workspace)
7. [Setting Up Your First Agent](#7-setting-up-your-first-agent)
8. [Assigning Your First Task](#8-assigning-your-first-task)
9. [Reading the Dashboard](#9-reading-the-dashboard)
10. [Browser Automation](#10-browser-automation)
11. [Managing Costs](#11-managing-costs)
12. [Troubleshooting](#12-troubleshooting)
13. [FAQ](#13-faq)
14. [Quick Reference](#14-quick-reference)

---

## 1. What is Architect AI?

Architect AI gives you a team of **AI agents** that work autonomously on your tasks — SEO audits, code generation, content writing, data analysis, and more.

You assign work. Agents think, plan, and execute. You review results.

**Example use cases:**
- "Audit my website for SEO issues" → Agent crawls your site, analyzes 50+ factors, delivers a report
- "Write a blog post about AI trends" → Agent researches, writes, and formats a publish-ready article
- "Analyze this dataset and summarize findings" → Agent processes CSV files and generates insights

---

## 2. How It Works

```
    You (Browser)                     Your Computer
    ┌──────────────┐                  ┌───────────────────────┐
    │              │    connects to    │                       │
    │  Architect   │ ───────────────► │  Local Agent Server   │
    │  AI Portal   │                  │                       │
    │  (online)    │ ◄─────────────── │  ┌─────────────────┐  │
    │              │   sends results  │  │ AI Agents        │  │
    └──────────────┘                  │  │ (Claude Code)    │  │
                                      │  └─────────────────┘  │
                                      │  ┌─────────────────┐  │
                                      │  │ Your Files       │  │
                                      │  │ Your API Keys    │  │
                                      │  │ Your Database    │  │
                                      │  └─────────────────┘  │
                                      └───────────────────────┘
```

**Important privacy guarantee:**
- Your API keys are encrypted and stored **only on your computer**
- Your files and agent output **never leave your machine**
- The online portal is only the interface — all processing happens locally
- We have **zero access** to your data

---

## 3. What You Need

### Your Computer

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **OS** | Windows 10, macOS 12, Ubuntu 20.04 | Windows 11, macOS 14, Ubuntu 22.04 |
| **RAM** | 4 GB | 8 GB+ |
| **Disk** | 1 GB free | 5 GB+ free |
| **Internet** | 5 Mbps+ | 25 Mbps+ |

### Software to Install (one-time, 5 minutes)

#### 1. Node.js (version 20+)

Download and install from **https://nodejs.org** — choose the **LTS** version.

Verify it's installed:
```bash
node --version
# Should show v20.x.x or higher
```

#### 2. pnpm (package manager)

Open your terminal and run:
```bash
npm install -g pnpm
```

#### 3. Claude Code (AI runtime)

```bash
npm install -g @anthropic-ai/claude-code
```

Verify:
```bash
claude --version
```

#### 4. Google Chrome (optional — for browser automation)

Only needed if your agents need to browse websites, fill forms, or take screenshots.
Download from **https://www.google.com/chrome**

### An Anthropic API Key

You'll need an API key from Anthropic to power your agents.
- Sign up at **https://console.anthropic.com**
- Create a key (starts with `sk-ant-api03-...`)
- Costs: $5-50/month depending on usage (billed by Anthropic, not us)

---

## 4. Step-by-Step Setup

### Step 1: Sign Up on the Portal

1. Go to **https://app.architectai.com**
2. Click **"Create one"** to sign up
3. Enter your name, email, and password (min 8 characters)
4. Click **"Create Account"**

### Step 2: Install the Local Server

Open your terminal (Command Prompt on Windows, Terminal on Mac) and run:

```bash
# Download the server
git clone https://github.com/gglagent19/yantra.git
cd yantra

# Install dependencies (takes 1-2 minutes)
pnpm install
```

### Step 3: Start the Server

```bash
pnpm dev:server
```

You should see:
```
Server listening on 127.0.0.1:3100
```

**Leave this terminal window open.** The server needs to keep running for agents to work.

### Step 4: Connect the Portal to Your Server

1. Go back to the Architect AI portal in your browser
2. You'll see the **"Connect to Yantra"** screen
3. Enter your server URL: `http://localhost:3100`
4. Click **Connect**
5. You should see "Connected! Redirecting..."

### Step 5: Sign In

1. The portal redirects to the sign-in page
2. Enter the same email and password from Step 1
3. You're now on your dashboard

---

## 5. Adding Your Anthropic API Key

Your agents need this key to think and respond.

1. On the **Dashboard**, find the **"Anthropic API Key"** card at the top
2. Click the input field and paste your key (`sk-ant-api03-...`)
3. Click the eye icon to verify it looks correct
4. Click **"Save Key"**

**What happens to your key:**
- Encrypted with **AES-256-GCM** military-grade encryption
- Stored in a local database on your computer only
- Never transmitted to our servers or any third party
- Used only when your agents need to call the Anthropic API

To update later: click **"Update Key"** on the same card.

---

## 6. Creating Your Workspace

Workspaces (called "Companies") organize your agents and tasks.

1. The onboarding wizard appears after first sign-in
2. Enter a **name** for your workspace (e.g., "My Agency", "Project Alpha")
3. Optionally describe its purpose
4. Click **Next**

**You can create multiple workspaces** — one per client, project, or team. Switch between them using the icons in the left rail.

---

## 7. Setting Up Your First Agent

### What is an Agent?

An agent is an AI worker with a specific role and set of instructions. Think of it as a specialist employee that never sleeps.

### Creating One

1. Click **"Agents"** in the sidebar
2. Click **"New Agent"**
3. Fill in:

| Field | What to Enter | Example |
|-------|--------------|---------|
| **Name** | The agent's role | "SEO Manager" |
| **Adapter** | Choose `claude_local` | Claude Code runtime |
| **Model** | AI model to use | `claude-sonnet-4-6` (fast + affordable) |
| **Instructions** | What the agent does | See examples below |

4. Click **Create**

### Example Agent Instructions

**SEO Manager:**
```
You are an SEO specialist. When given a website URL:
1. Analyze technical SEO (crawlability, Core Web Vitals, mobile)
2. Review on-page SEO (meta tags, headings, content quality)
3. Check backlink profile and competitor landscape
4. Deliver a prioritized action plan with estimated impact
```

**Content Writer:**
```
You are a content strategist. When given a topic:
1. Research the topic thoroughly using available sources
2. Create an outline with H2/H3 structure
3. Write a 1500-2000 word article optimized for SEO
4. Include a meta description and suggested title tags
```

**Code Reviewer:**
```
You are a senior software engineer. When given code:
1. Review for bugs, security issues, and performance
2. Check code style and best practices
3. Suggest specific improvements with code examples
4. Rate overall quality on a 1-10 scale
```

### Choosing the Right Model

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| `claude-sonnet-4-6` | Fast | $$ | Most tasks, daily work |
| `claude-opus-4-6` | Slower | $$$$ | Complex analysis, multi-step reasoning |
| `claude-haiku-4-5` | Very fast | $ | Simple tasks, high volume |

**Start with Sonnet** — upgrade to Opus only for complex tasks.

---

## 8. Assigning Your First Task

### Create a Task

1. Click **"New Issue"** in the sidebar (or press **C** on your keyboard)
2. Fill in:
   - **Title:** Clear description (e.g., "Audit example.com for SEO issues")
   - **Assignee:** Select your agent
   - **Priority:** High / Medium / Low
   - **Description:** Detailed context and requirements
3. Click **"Create Issue"**

### Watch It Work

After creating the task:
1. Your agent starts working immediately
2. On the **Dashboard**, you'll see the agent's card with a live transcript
3. The transcript shows the agent's reasoning, actions, and findings in real-time
4. When complete, the task status changes to **Done**

### What the Agent Can Do

| Capability | Description |
|-----------|-------------|
| **Read/write files** | Create reports, modify code, process data |
| **Browse the web** | Visit URLs, extract content, fill forms (requires Chrome) |
| **Call APIs** | Interact with external services |
| **Run commands** | Execute shell commands on your machine |
| **Delegate** | Create sub-tasks for other agents |

---

## 9. Reading the Dashboard

### Metric Cards (Top Row)

| Card | Meaning |
|------|---------|
| **Agents Enabled** | How many agents you have (running / paused / errors) |
| **Tasks In Progress** | Active work items + how many are open or blocked |
| **Month Spend** | How much your agents have spent on API calls this month |
| **Pending Approvals** | Tasks that need your review before proceeding |

### Active Agents Panel

Shows each running agent with:
- **Status dot** — Blue pulsing = running, gray = finished
- **Agent name** and current task
- **Live transcript** — Real-time view of what the agent is doing

### Charts

- **Run Activity** — How many agent runs per day (14-day view)
- **Issues by Priority** — Distribution of your tasks
- **Issues by Status** — Pipeline overview (todo, in progress, done)
- **Success Rate** — How often agents complete tasks successfully

### Sidebar Navigation

| Section | What's Inside |
|---------|--------------|
| **Dashboard** | Overview and metrics |
| **Inbox** | Notifications and updates |
| **Issues** | All tasks across agents |
| **Routines** | Scheduled recurring tasks |
| **Goals** | High-level objectives |
| **Agents** | Manage your AI team |
| **Org** | Organization chart |
| **Skills** | Available agent capabilities |
| **Costs** | Spending breakdown |
| **Activity** | Event log |
| **Settings** | Workspace configuration |

---

## 10. Browser Automation

If your agents need to interact with websites (SEO audits, form filling, screenshots):

### Setup (One-Time)

1. Make sure **Google Chrome** is installed
2. Install the **Claude-in-Chrome** MCP extension
3. Keep Chrome open while agents are running

### What Agents Can Do

| Action | How It Looks |
|--------|-------------|
| Open a URL | Agent navigates Chrome to the page |
| Read page content | Extracts text, HTML, meta tags |
| Click buttons/links | Interacts with page elements |
| Fill forms | Types into input fields |
| Take screenshots | Captures the page for reports |
| Read console logs | Checks for JavaScript errors |

### Example: SEO Audit Flow

1. You create task: "Full SEO audit of mysite.com"
2. Agent opens Chrome, navigates to mysite.com
3. Reads page source, checks meta tags, analyzes headings
4. Navigates to sub-pages, checks internal links
5. Inspects Core Web Vitals, page speed
6. Writes a detailed report with screenshots
7. Task marked complete — report available in the task

---

## 11. Managing Costs

### How Billing Works

- **Platform fee:** Included in your subscription plan
- **AI API costs:** Billed separately by Anthropic based on usage
- **You control costs** through budgets and model selection

### Setting a Budget

1. Go to **Settings** in the sidebar
2. Set a **Monthly Budget** (e.g., $50)
3. When your agents hit the limit:
   - All agents pause automatically
   - You get a notification
   - You decide whether to increase the budget or wait

### Monitoring Spend

Go to **Costs** in the sidebar to see:
- Total spend this month
- Breakdown by agent
- Cost per task
- Daily/weekly trends

### Saving Money

| Strategy | Estimated Savings |
|----------|------------------|
| Use **Sonnet** instead of **Opus** for routine tasks | ~70% |
| Set thinking effort to **"low"** for simple tasks | ~40% |
| Set budget caps per agent | Prevents surprises |
| Review **Costs** weekly | Spot expensive patterns early |

---

## 12. Troubleshooting

### "Cannot connect to server"

Your local server isn't running.

**Fix:**
1. Open a terminal
2. Navigate to your architect-ai folder
3. Run `pnpm dev:server`
4. Wait for "Server listening on 127.0.0.1:3100"
5. Refresh the portal

### "Failed to load health (500)"

The server crashed, usually due to a stale database process.

**Fix:**
```bash
# Windows:
taskkill /IM postgres.exe /F

# macOS/Linux:
pkill postgres

# Then restart:
pnpm dev:server
```

### "EPERM: operation not permitted, symlink" (Windows)

Already fixed in the latest version. If you see it, update your installation:
```bash
cd architect-ai
git pull
pnpm install
pnpm dev:server
```

### Agent stuck on "Running"

1. Go to **Agents** > click the agent > **Runs** tab
2. Click **Stop** on the active run
3. Check the transcript for error messages
4. Create a new task to retry

### "API Connection Timeout"

Your Anthropic API key may be invalid or out of credit.

1. Check your key at **https://console.anthropic.com**
2. Verify you have credit remaining
3. Go to Dashboard > "Update Key" if needed

### Slow performance

- Close unnecessary Chrome tabs (browser automation uses resources)
- Check Task Manager / Activity Monitor for high CPU usage
- Consider using a lighter model (Haiku for simple tasks)

### Data not updating

Hard refresh your browser:
- **Windows:** `Ctrl + Shift + R`
- **macOS:** `Cmd + Shift + R`

---

## 13. FAQ

**Q: Do I need to keep my computer on?**
Yes. Agents run locally on your machine. When you shut down, agents pause. They resume when you restart the server.

**Q: Is my data private?**
Absolutely. All data stays on your computer. We never see your files, API keys, or agent output. The portal is just a remote control.

**Q: What happens if my internet drops?**
Running agents will pause because they can't reach the AI API. They'll retry automatically when connectivity returns.

**Q: Can I use this on multiple computers?**
Yes. Install the server on each computer and connect each one to your portal account.

**Q: Can I share access with my team?**
Yes. Team members sign up on the portal and you grant them access to your workspace. They'll need to run their own local server.

**Q: How many agents can run at once?**
Depends on your machine. Typically 2-4 concurrent agents on 8GB RAM. Each agent uses ~100-200MB.

**Q: What if I hit my API spending limit?**
Agents pause automatically. You get a notification. Increase your budget or wait for the next billing cycle.

**Q: Can agents access my entire computer?**
No. Agents work within configured workspace directories only. They cannot access files outside their workspace.

**Q: Which AI models are available?**
Claude Opus 4.6 (most capable), Claude Sonnet 4.6 (balanced), Claude Haiku 4.5 (fastest/cheapest), and OpenAI Codex.

**Q: Can I cancel anytime?**
Yes. No contracts. Cancel your subscription and your local data remains yours.

---

## 14. Quick Reference

| I want to... | Do this |
|--------------|---------|
| Start the server | `pnpm dev:server` in your terminal |
| Open the portal | Go to https://app.architectai.com |
| Create a task | Press `C` or click "New Issue" |
| Search anything | Press `Cmd+K` / `Ctrl+K` |
| See agent activity | Dashboard > Active Agents panel |
| Check costs | Sidebar > Costs |
| Update API key | Dashboard > Anthropic API Key > "Update Key" |
| Stop an agent | Agents > Click agent > Stop |
| Set a budget | Settings > Monthly Budget |
| Switch workspaces | Click icons in the left rail |

---

## Need Help?

- **Email:** support@architectai.com
- **Documentation:** https://docs.architectai.com
- **Discord Community:** https://discord.gg/architectai
- **Status Page:** https://status.architectai.com

---

*Architect AI v1.0 — Last updated April 2026*
