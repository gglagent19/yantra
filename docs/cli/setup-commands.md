---
title: Setup Commands
summary: Onboard, run, doctor, and configure
---

Instance setup and diagnostics commands.

## `yantraai run`

One-command bootstrap and start:

```sh
pnpm yantraai run
```

Does:

1. Auto-onboards if config is missing
2. Runs `yantraai doctor` with repair enabled
3. Starts the server when checks pass

Choose a specific instance:

```sh
pnpm yantraai run --instance dev
```

## `yantraai onboard`

Interactive first-time setup:

```sh
pnpm yantraai onboard
```

If Yantra is already configured, rerunning `onboard` keeps the existing config in place. Use `yantraai configure` to change settings on an existing install.

First prompt:

1. `Quickstart` (recommended): local defaults (embedded database, no LLM provider, local disk storage, default secrets)
2. `Advanced setup`: full interactive configuration

Start immediately after onboarding:

```sh
pnpm yantraai onboard --run
```

Non-interactive defaults + immediate start (opens browser on server listen):

```sh
pnpm yantraai onboard --yes
```

On an existing install, `--yes` now preserves the current config and just starts Yantra with that setup.

## `yantraai doctor`

Health checks with optional auto-repair:

```sh
pnpm yantraai doctor
pnpm yantraai doctor --repair
```

Validates:

- Server configuration
- Database connectivity
- Secrets adapter configuration
- Storage configuration
- Missing key files

## `yantraai configure`

Update configuration sections:

```sh
pnpm yantraai configure --section server
pnpm yantraai configure --section secrets
pnpm yantraai configure --section storage
```

## `yantraai env`

Show resolved environment configuration:

```sh
pnpm yantraai env
```

## `yantraai allowed-hostname`

Allow a private hostname for authenticated/private mode:

```sh
pnpm yantraai allowed-hostname my-tailscale-host
```

## Local Storage Paths

| Data | Default Path |
|------|-------------|
| Config | `~/.yantra/instances/default/config.json` |
| Database | `~/.yantra/instances/default/db` |
| Logs | `~/.yantra/instances/default/logs` |
| Storage | `~/.yantra/instances/default/data/storage` |
| Secrets key | `~/.yantra/instances/default/secrets/master.key` |

Override with:

```sh
YANTRA_HOME=/custom/home YANTRA_INSTANCE_ID=dev pnpm yantraai run
```

Or pass `--data-dir` directly on any command:

```sh
pnpm yantraai run --data-dir ./tmp/yantra-dev
pnpm yantraai doctor --data-dir ./tmp/yantra-dev
```
