# JeiChat reviewer bot

Companion to [jeichat-fixer-bot](https://github.com/jpmadrigal07/jeichat-fixer-bot). This repo owns **post-fix verification**: Cursor prompt instructions, artifact download helpers, and JeiChat attachment upload utilities. The fixer bot should only implement the code change and open a PR; verification screenshots and the **Verification** checklist live here.

The tester bot is `jeichat-sample-bot`. Live-site QA is `jeichat-bug-checker-bot`.

## E2E smoke test (fixer + checker + verification)

Copy-paste templates and a step-by-step checklist:

- [`docs/fixer-pipeline-e2e-test.md`](docs/fixer-pipeline-e2e-test.md)
- [`templates/ticket-bug-fixer-e2e.md`](templates/ticket-bug-fixer-e2e.md)
- [`templates/checker-confirm-fixer-e2e.md`](templates/checker-confirm-fixer-e2e.md)
- [`templates/checker-refute-example.md`](templates/checker-refute-example.md)

## Library modules

| Module | Role |
|--------|------|
| `src/verify-instructions.js` | Prompt block: tests, dev server, browser repro, PNG paths under `/opt/cursor/artifacts/after-fix/` |
| `src/verification-artifacts.js` | List/download Cursor artifacts; `REVIEWER_POST_SCREENSHOTS` gate |
| `src/attachments.js` | Presign → R2 → post message with `attachmentIds` |
| `src/screenshots.js` | Shared image helpers (`MAX_SCREENSHOTS`, content types) |
| `src/client.js` | Minimal JeiChat REST + Socket.IO client |
| `src/cursor.js` | Cursor SDK options (cloud env binding, no auto-PR) |

`src/index.js` connects to JeiChat and runs when a ticket moves to **In review** (or is assigned to the reviewer bot while In review).

## Run (local)

```bash
bun install
cp .env.example .env
bun run start
bun test src
```

Use a **reviewer** bot token from JeiChat (not the fixer or checker token).

## Docker

```bash
cp .env.example .env   # fill in tokens
docker compose up --build
```

Or build and run without Compose:

```bash
docker build -t jeichat-reviewer-bot .
docker run --rm --env-file .env jeichat-reviewer-bot
```

## Deploy (Coolify)

This bot is one long-running process. It is **not** a website — no domain or HTTP proxy.

1. Push this repo to GitHub.
2. **New resource → Application** → this repo, build pack **Dockerfile**.
3. Set env vars from `.env.example` (live `JEICHAT_API_URL`, reviewer token, `CURSOR_*`, optional `FIXER_BOT_USER_ID`).

`docker-compose.yml` is a one-service wrapper for hosts that prefer Compose over a plain Dockerfile.
