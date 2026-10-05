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

`src/index.js` is a placeholder until ticket-trigger wiring is implemented.

## Run (local)

```bash
bun install
cp .env.example .env
bun test src
```

Use a **reviewer** bot token from JeiChat (not the fixer or checker token).
