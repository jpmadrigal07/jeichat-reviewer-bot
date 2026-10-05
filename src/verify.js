import { Agent, CursorAgentError } from "@cursor/sdk";
import { cursorAgentOptions } from "./cursor.js";
import { verificationInstructions } from "./verify-instructions.js";
import { ticketPageUrl } from "./ticket-link.js";
import { enrichGitContextFromPullRequest } from "./github-pr.js";
import { reviewRunTimeoutMs } from "./status.js";

const MAX_BODY = 3500;

function formatGitBlock(ctx) {
  const lines = [];
  if (ctx.prUrl) lines.push(`PR: ${ctx.prUrl}`);
  if (ctx.branch) lines.push(`Branch: ${ctx.branch}`);
  return lines.join("\n");
}

export function reviewPrompt(ticket, ctx) {
  const pageUrl = ticket.pageUrl || ticketPageUrl(ticket);
  const checkReport = ticket.checkReport?.trim() || "(none)";
  const accessBlock = ticket.accessContext?.trim();
  const verifyBlock = verificationInstructions({
    pageUrl,
    runtime: process.env.CURSOR_RUNTIME,
  });

  const checkoutNote =
    ctx.usedBaseRefFallback && ctx.branch
      ? `First run: \`git fetch origin ${ctx.branch} && git checkout ${ctx.branch}\`.`
      : ctx.branch
        ? `You should already be on **${ctx.branch}** (or the PR head commit).`
        : "Find the fixer's branch from the PR in the thread.";

  const branchLine = checkoutNote;

  return `You are the JeiChat **reviewer** bot. The fixer finished and opened a pull request.

Ticket: ${ticket.displayId} ${ticket.name}
${ctx.prUrl ? `Pull request: ${ctx.prUrl}` : ""}
${branchLine}

Checker report (what we are validating still works):
${checkReport}

Access / login (from ticket description and thread — treat as required when listed):
${accessBlock || "(none — if the UI needs auth, use REVIEWER_TEST_EMAIL / REVIEWER_TEST_PASSWORD from the Cursor cloud environment, or Result: FAIL explaining that login is required and credentials are missing.)"}

Your job:
1. Inspect the **diff** on this branch vs its merge base. Summarize user-visible and important code changes (files, behavior). Be specific; quote paths.
2. Run the verification checklist below. Treat the checker report as the reproduction brief.
3. Reply in Markdown with:
   - **Changes** — bullet summary of the PR diff
   - **Verification** — commands you ran and what you checked in the browser
   - **Result:** PASS or FAIL — one line why

${verifyBlock}

Do not open a new PR. Do not push.`;
}

export function composeReviewReply(modelText, ctx) {
  const body = String(modelText ?? "").trim();
  const gitBlock = formatGitBlock(ctx);
  if (!body && !gitBlock) {
    return "The review run finished but returned no explanation.";
  }
  if (!gitBlock) {
    if (body.length <= MAX_BODY) return body;
    return `${body.slice(0, MAX_BODY)}\n\n_(truncated)_`;
  }
  if (!body) return gitBlock;
  const budget = Math.max(0, MAX_BODY - gitBlock.length - 2);
  const trimmed =
    body.length <= budget ? body : `${body.slice(0, budget)}\n\n_(truncated)_`;
  return `${trimmed}\n\n${gitBlock}`;
}

async function disposeAgent(agent) {
  if (!agent) return;
  if (typeof agent[Symbol.asyncDispose] === "function") {
    await agent[Symbol.asyncDispose]();
    return;
  }
  agent.close();
}

function startingRefCandidates(ctx) {
  const seen = new Set();
  const list = [];
  for (const ref of [
    ctx.startingRef,
    ctx.headSha,
    ctx.branch,
    ctx.baseRef,
  ]) {
    const value = String(ref ?? "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    list.push(value);
  }
  return list;
}

function isMissingRefError(error) {
  if (!(error instanceof CursorAgentError)) return false;
  return /does not exist/i.test(error.message);
}

async function waitForRun(run, timeoutMs) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`review timed out after ${Math.round(timeoutMs / 60000)} minutes`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([run.wait(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function createReviewAgent(ticket, ctx) {
  const candidates = startingRefCandidates(ctx);
  if (candidates.length === 0) {
    throw new Error(
      "No git ref to clone (need PR link or Branch line in the ticket thread).",
    );
  }

  let lastError;
  for (const startingRef of candidates) {
    try {
      const agent = await Agent.create(
        cursorAgentOptions({
          repoUrl: ticket.repoUrl,
          startingRef,
        }),
      );
      return {
        agent,
        promptCtx: {
          ...ctx,
          usedBaseRefFallback: startingRef === ctx.baseRef,
        },
      };
    } catch (error) {
      if (isMissingRefError(error)) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * @param {object} ticket
 * @param {{ prUrl?: string | null; branch?: string | null }} ctx
 * @param {{ onAgent?: (agent: import("@cursor/sdk").SDKAgent) => void; onRunStarted?: (info: { agentId?: string | null }) => void }} options
 */
export async function verifyTicket(ticket, ctx, options = {}) {
  let enriched = { ...ctx };
  try {
    enriched = await enrichGitContextFromPullRequest(enriched, ticket.repoUrl);
  } catch (error) {
    console.error("could not resolve PR from GitHub", error);
  }

  if (!enriched.branch && !enriched.prUrl && !enriched.startingRef) {
    return "I need a `PR:` or `Branch:` line in this thread before I can review.";
  }

  let agent;
  let promptCtx = enriched;
  try {
    const created = await createReviewAgent(ticket, enriched);
    agent = created.agent;
    promptCtx = created.promptCtx;
    const agentId = agent.id ?? agent.agentId ?? null;
    if (typeof options.onAgent === "function") {
      options.onAgent(agent);
    }
    if (typeof options.onRunStarted === "function") {
      options.onRunStarted({ agentId });
    }
    const run = await agent.send(reviewPrompt(ticket, promptCtx));
    const result = await waitForRun(run, reviewRunTimeoutMs());
    if (result.status !== "finished") {
      return `I could not finish the review (${result.status}${
        result.error?.message ? `: ${result.error.message}` : ""
      }).`;
    }
    return composeReviewReply(result.result, promptCtx);
  } catch (error) {
    if (error instanceof CursorAgentError) {
      return `I could not start a Cursor review: ${error.message}`;
    }
    if (error instanceof Error && /timed out/i.test(error.message)) {
      return `${error.message}. The cloud agent may still be running on [Cursor](https://cursor.com/agents). Tag me with \`retry\` after it finishes, or raise \`REVIEWER_RUN_TIMEOUT_MS\`.`;
    }
    throw error;
  } finally {
    await disposeAgent(agent);
  }
}
