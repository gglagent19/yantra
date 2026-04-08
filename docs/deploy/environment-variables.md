---
title: Environment Variables
summary: Full environment variable reference
---

All environment variables that Yantra uses for server configuration.

## Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3100` | Server port |
| `HOST` | `127.0.0.1` | Server host binding |
| `DATABASE_URL` | (embedded) | PostgreSQL connection string |
| `YANTRA_HOME` | `~/.yantra` | Base directory for all Yantra data |
| `YANTRA_INSTANCE_ID` | `default` | Instance identifier (for multiple local instances) |
| `YANTRA_DEPLOYMENT_MODE` | `local_trusted` | Runtime mode override |

## Secrets

| Variable | Default | Description |
|----------|---------|-------------|
| `YANTRA_SECRETS_MASTER_KEY` | (from file) | 32-byte encryption key (base64/hex/raw) |
| `YANTRA_SECRETS_MASTER_KEY_FILE` | `~/.yantra/.../secrets/master.key` | Path to key file |
| `YANTRA_SECRETS_STRICT_MODE` | `false` | Require secret refs for sensitive env vars |

## Agent Runtime (Injected into agent processes)

These are set automatically by the server when invoking agents:

| Variable | Description |
|----------|-------------|
| `YANTRA_AGENT_ID` | Agent's unique ID |
| `YANTRA_COMPANY_ID` | Company ID |
| `YANTRA_API_URL` | Yantra API base URL |
| `YANTRA_API_KEY` | Short-lived JWT for API auth |
| `YANTRA_RUN_ID` | Current heartbeat run ID |
| `YANTRA_TASK_ID` | Issue that triggered this wake |
| `YANTRA_WAKE_REASON` | Wake trigger reason |
| `YANTRA_WAKE_COMMENT_ID` | Comment that triggered this wake |
| `YANTRA_APPROVAL_ID` | Resolved approval ID |
| `YANTRA_APPROVAL_STATUS` | Approval decision |
| `YANTRA_LINKED_ISSUE_IDS` | Comma-separated linked issue IDs |

## LLM Provider Keys (for adapters)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (for Claude Local adapter) |
| `OPENAI_API_KEY` | OpenAI API key (for Codex Local adapter) |
