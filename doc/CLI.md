# CLI Reference

Yantra CLI now supports both:

- instance setup/diagnostics (`onboard`, `doctor`, `configure`, `env`, `allowed-hostname`)
- control-plane client operations (issues, approvals, agents, activity, dashboard)

## Base Usage

Use repo script in development:

```sh
pnpm yantraai --help
```

First-time local bootstrap + run:

```sh
pnpm yantraai run
```

Choose local instance:

```sh
pnpm yantraai run --instance dev
```

## Deployment Modes

Mode taxonomy and design intent are documented in `doc/DEPLOYMENT-MODES.md`.

Current CLI behavior:

- `yantraai onboard` and `yantraai configure --section server` set deployment mode in config
- runtime can override mode with `YANTRA_DEPLOYMENT_MODE`
- `yantraai run` and `yantraai doctor` do not yet expose a direct `--mode` flag

Target behavior (planned) is documented in `doc/DEPLOYMENT-MODES.md` section 5.

Allow an authenticated/private hostname (for example custom Tailscale DNS):

```sh
pnpm yantraai allowed-hostname dotta-macbook-pro
```

All client commands support:

- `--data-dir <path>`
- `--api-base <url>`
- `--api-key <token>`
- `--context <path>`
- `--profile <name>`
- `--json`

Company-scoped commands also support `--company-id <id>`.

Use `--data-dir` on any CLI command to isolate all default local state (config/context/db/logs/storage/secrets) away from `~/.yantra`:

```sh
pnpm yantraai run --data-dir ./tmp/yantra-dev
pnpm yantraai issue list --data-dir ./tmp/yantra-dev
```

## Context Profiles

Store local defaults in `~/.yantra/context.json`:

```sh
pnpm yantraai context set --api-base http://localhost:3100 --company-id <company-id>
pnpm yantraai context show
pnpm yantraai context list
pnpm yantraai context use default
```

To avoid storing secrets in context, set `apiKeyEnvVarName` and keep the key in env:

```sh
pnpm yantraai context set --api-key-env-var-name YANTRA_API_KEY
export YANTRA_API_KEY=...
```

## Company Commands

```sh
pnpm yantraai company list
pnpm yantraai company get <company-id>
pnpm yantraai company delete <company-id-or-prefix> --yes --confirm <same-id-or-prefix>
```

Examples:

```sh
pnpm yantraai company delete PAP --yes --confirm PAP
pnpm yantraai company delete 5cbe79ee-acb3-4597-896e-7662742593cd --yes --confirm 5cbe79ee-acb3-4597-896e-7662742593cd
```

Notes:

- Deletion is server-gated by `YANTRA_ENABLE_COMPANY_DELETION`.
- With agent authentication, company deletion is company-scoped. Use the current company ID/prefix (for example via `--company-id` or `YANTRA_COMPANY_ID`), not another company.

## Issue Commands

```sh
pnpm yantraai issue list --company-id <company-id> [--status todo,in_progress] [--assignee-agent-id <agent-id>] [--match text]
pnpm yantraai issue get <issue-id-or-identifier>
pnpm yantraai issue create --company-id <company-id> --title "..." [--description "..."] [--status todo] [--priority high]
pnpm yantraai issue update <issue-id> [--status in_progress] [--comment "..."]
pnpm yantraai issue comment <issue-id> --body "..." [--reopen]
pnpm yantraai issue checkout <issue-id> --agent-id <agent-id> [--expected-statuses todo,backlog,blocked]
pnpm yantraai issue release <issue-id>
```

## Agent Commands

```sh
pnpm yantraai agent list --company-id <company-id>
pnpm yantraai agent get <agent-id>
pnpm yantraai agent local-cli <agent-id-or-shortname> --company-id <company-id>
```

`agent local-cli` is the quickest way to run local Claude/Codex manually as a Yantra agent:

- creates a new long-lived agent API key
- installs missing Yantra skills into `~/.codex/skills` and `~/.claude/skills`
- prints `export ...` lines for `YANTRA_API_URL`, `YANTRA_COMPANY_ID`, `YANTRA_AGENT_ID`, and `YANTRA_API_KEY`

Example for shortname-based local setup:

```sh
pnpm yantraai agent local-cli codexcoder --company-id <company-id>
pnpm yantraai agent local-cli claudecoder --company-id <company-id>
```

## Approval Commands

```sh
pnpm yantraai approval list --company-id <company-id> [--status pending]
pnpm yantraai approval get <approval-id>
pnpm yantraai approval create --company-id <company-id> --type hire_agent --payload '{"name":"..."}' [--issue-ids <id1,id2>]
pnpm yantraai approval approve <approval-id> [--decision-note "..."]
pnpm yantraai approval reject <approval-id> [--decision-note "..."]
pnpm yantraai approval request-revision <approval-id> [--decision-note "..."]
pnpm yantraai approval resubmit <approval-id> [--payload '{"...":"..."}']
pnpm yantraai approval comment <approval-id> --body "..."
```

## Activity Commands

```sh
pnpm yantraai activity list --company-id <company-id> [--agent-id <agent-id>] [--entity-type issue] [--entity-id <id>]
```

## Dashboard Commands

```sh
pnpm yantraai dashboard get --company-id <company-id>
```

## Heartbeat Command

`heartbeat run` now also supports context/api-key options and uses the shared client stack:

```sh
pnpm yantraai heartbeat run --agent-id <agent-id> [--api-base http://localhost:3100] [--api-key <token>]
```

## Local Storage Defaults

Default local instance root is `~/.yantra/instances/default`:

- config: `~/.yantra/instances/default/config.json`
- embedded db: `~/.yantra/instances/default/db`
- logs: `~/.yantra/instances/default/logs`
- storage: `~/.yantra/instances/default/data/storage`
- secrets key: `~/.yantra/instances/default/secrets/master.key`

Override base home or instance with env vars:

```sh
YANTRA_HOME=/custom/home YANTRA_INSTANCE_ID=dev pnpm yantraai run
```

## Storage Configuration

Configure storage provider and settings:

```sh
pnpm yantraai configure --section storage
```

Supported providers:

- `local_disk` (default; local single-user installs)
- `s3` (S3-compatible object storage)
