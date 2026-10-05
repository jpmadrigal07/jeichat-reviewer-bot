/** Cursor Cloud stores run outputs under this directory (also visible via Agent.listArtifacts). */
export const CLOUD_ARTIFACTS_DIR = "/opt/cursor/artifacts";

export const VERIFICATION_SCREENSHOT_PREFIX = "after-fix";

/**
 * Prompt block: run the app, reproduce the checker brief, save proof screenshots.
 * @param {{ pageUrl?: string | null; runtime?: string }} ctx
 */
function lightVerifyEnabled() {
  const raw = process.env.REVIEWER_LIGHT_VERIFY?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "no") return false;
  if (raw === "1" || raw === "true" || raw === "yes") return true;
  return true;
}

export function verificationInstructions(ctx = {}) {
  const pageUrl = ctx.pageUrl?.trim();
  const isCloud = (ctx.runtime ?? process.env.CURSOR_RUNTIME ?? "cloud") === "cloud";
  const artifactDir = `${CLOUD_ARTIFACTS_DIR}/${VERIFICATION_SCREENSHOT_PREFIX}`;
  const light = lightVerifyEnabled();

  const lines = light
    ? [
        "Before you finish verification (keep this **lean** — aim to finish in under ~15 minutes):",
        "   - Read the PR diff first. Only run commands needed for the files you changed.",
        "   - Prefer targeted checks (e.g. `cd apps/web && bun run typecheck` or the nearest package test) instead of the full monorepo suite unless the diff is wide.",
        "   - Start `bun run dev` **only** if you must exercise UI in the browser; skip DB migrate unless the diff touches schema/migrations.",
        "   - Reproduce the checker report in the browser when the change is user-visible (browser MCP). Use REVIEWER_TEST_EMAIL / REVIEWER_TEST_PASSWORD when auth is required.",
        pageUrl
          ? `   - Open the ticket page when relevant: ${pageUrl}`
          : "   - Open the page or flow described in the checker report when UI is involved.",
      ]
    : [
        "Before you finish verification:",
        "   - Run `bun run test` from the monorepo root (or the smallest relevant package tests).",
        "   - Apply DB migrations if schema changed: `cd apps/api && bun run db:migrate`.",
        "   - Start the stack: `bun run dev` (API :3001, web :3000). Wait until `curl -sf http://localhost:3001/health` succeeds.",
        "   - Reproduce the checker report in the browser (use browser MCP / automation). Sign in with REVIEWER_TEST_EMAIL / REVIEWER_TEST_PASSWORD when the flow needs auth (cloud env secrets).",
        pageUrl
          ? `   - Open the ticket page when relevant: ${pageUrl}`
          : "   - Open the page or flow described in the checker report.",
      ];

  if (isCloud) {
    lines.push(
      `   - Save 1–3 PNG screenshots under \`${artifactDir}/\` (e.g. \`${artifactDir}/01-repro.png\`). The reviewer bot downloads these via Cursor artifacts and posts them to the ticket.`,
    );
  } else {
    lines.push(
      `   - Save 1–3 PNG screenshots under \`./${VERIFICATION_SCREENSHOT_PREFIX}/\` in the repo root (e.g. \`./${VERIFICATION_SCREENSHOT_PREFIX}/01-repro.png\`).`,
    );
  }

  lines.push(
    "   - In your final reply, include a **Verification** section listing what you ran and the screenshot filenames.",
  );

  return lines.join("\n");
}
