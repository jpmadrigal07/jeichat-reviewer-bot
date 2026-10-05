import { expect, test } from "bun:test";
import { parseReviewerCommand } from "./commands.js";

test("parses status after optional bot word", () => {
  expect(parseReviewerCommand("bot status").name).toBe("status");
  expect(parseReviewerCommand("status").name).toBe("status");
});

test("unknown command is not status", () => {
  expect(parseReviewerCommand("bot please").name).toBe("unknown");
});
