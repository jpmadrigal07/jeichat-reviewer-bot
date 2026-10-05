# Fixer pipeline — local E2E test

Checklist to validate **jeichat-fixer-bot** (fix + PR) and **jeichat-reviewer-bot** (verification assets) against local JeiChat.

## Prerequisites

- JeiChat: `bun run dev` (API `:3001`, web `:3000`)
- Fixer: `bun run start` in `jeichat-fixer-bot` with `JEICHAT_BOT_TOKEN`, `CURSOR_API_KEY`, `CURSOR_RUNTIME=cloud`
- Reviewer: `bun test src` in `jeichat-reviewer-bot` (runtime bot wiring is optional for this checklist)
- Optional: `CURSOR_CLOUD_ENVIRONMENT` on both bots = your Cursor Cloud env name for `jeichat`
- Board connected to GitHub; R2 configured if you want verification screenshots uploaded

## Steps

1. Create a ticket using [`templates/ticket-bug-fixer-e2e.md`](../templates/ticket-bug-fixer-e2e.md).
2. Label **Bug**, assign **Fix Bot**, confirm the fixer posts the linked repo.
3. Post the checker message from [`templates/checker-confirm-fixer-e2e.md`](../templates/checker-confirm-fixer-e2e.md).
4. Watch the ticket: **In progress** → fix summary → `PR:` / `Branch:` when cloud opens a PR.
5. Optional: assign **Review Bot** when verification automation is wired; until then, use reviewer modules in a manual Cursor run with `verificationInstructions()`.

## What you are testing

| Piece | Pass signal |
|--------|-------------|
| Repo resolution | Fixer quotes the board’s `owner/repo`, not only `CURSOR_REPO_URL` |
| Base branch | Cursor clones `Branch:` from the ticket description |
| Checker gate | No Cursor run until `Verdict: CONFIRM` |
| Cloud + PR | PR link in thread; ticket → **In review** on `Result: FIXED` |
| Verification | Reviewer bot posts images when agent saved PNGs under `/opt/cursor/artifacts/after-fix/` |

## Cheaper smoke (no Cursor spend)

- Assign fixer **without** checker CONFIRM → should wait.
- Post [`templates/checker-refute-example.md`](../templates/checker-refute-example.md) → fixer should stop.
- `bun test src` in both bot repos.

## After the test

Close or merge the smoke PR, or revert the sample change if you only wanted to exercise the bots.
