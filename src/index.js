/**
 * Ticket event wiring (assign on In review, run Cursor verification, post screenshots)
 * will live here. For now this process only validates configuration at startup.
 */
const token = process.env.JEICHAT_BOT_TOKEN?.trim();
if (!token) {
  console.error("JEICHAT_BOT_TOKEN is required");
  process.exit(1);
}

console.log(
  "jeichat-reviewer-bot: verification helpers are in src/; ticket automation is not wired yet.",
);
