---
title: Docker
summary: Docker Compose quickstart
---

Run Yantra in Docker without installing Node or pnpm locally.

## Compose Quickstart (Recommended)

```sh
docker compose -f docker/docker-compose.quickstart.yml up --build
```

Open [http://localhost:3100](http://localhost:3100).

Defaults:

- Host port: `3100`
- Data directory: `./data/docker-yantra`

Override with environment variables:

```sh
YANTRA_PORT=3200 YANTRA_DATA_DIR=../data/pc \
  docker compose -f docker/docker-compose.quickstart.yml up --build
```

**Note:** `YANTRA_DATA_DIR` is resolved relative to the compose file (`docker/`), so `../data/pc` maps to `data/pc` in the project root.

## Manual Docker Build

```sh
docker build -t yantra-local .
docker run --name yantra \
  -p 3100:3100 \
  -e HOST=0.0.0.0 \
  -e YANTRA_HOME=/yantra \
  -v "$(pwd)/data/docker-yantra:/yantra" \
  yantra-local
```

## Data Persistence

All data is persisted under the bind mount (`./data/docker-yantra`):

- Embedded PostgreSQL data
- Uploaded assets
- Local secrets key
- Agent workspace data

## Claude and Codex Adapters in Docker

The Docker image pre-installs:

- `claude` (Anthropic Claude Code CLI)
- `codex` (OpenAI Codex CLI)

Pass API keys to enable local adapter runs inside the container:

```sh
docker run --name yantra \
  -p 3100:3100 \
  -e HOST=0.0.0.0 \
  -e YANTRA_HOME=/yantra \
  -e OPENAI_API_KEY=sk-... \
  -e ANTHROPIC_API_KEY=sk-... \
  -v "$(pwd)/data/docker-yantra:/yantra" \
  yantra-local
```

Without API keys, the app runs normally — adapter environment checks will surface missing prerequisites.
