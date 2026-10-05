export function helpText(botName) {
  const tag = `@${String(botName ?? "Review Bot").trim() || "Review Bot"}`;
  return [
    "Move the ticket to **In review** (or assign me on an In review ticket) after the fixer posts `PR:` / `Branch:`.",
    `\`${tag} retry\` — run verification again`,
    `\`${tag} status\` — am I busy on this ticket?`,
    `\`${tag} help\` — this list`,
  ].join("\n");
}

export function parseReviewerCommand(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return { name: "help" };

  const [head] = trimmed.split(/\s+/);
  const name = head.toLowerCase().replace(/[.,!?]+$/g, "");
  if (name === "help") return { name: "help" };
  if (name === "retry") return { name: "retry" };
  if (name === "status") return { name: "status" };
  return { name: "unknown", raw: trimmed };
}
