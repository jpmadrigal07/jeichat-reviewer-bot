import { afterEach, expect, test } from "bun:test";
import { verificationInstructions } from "./verify-instructions.js";

const keys = ["CURSOR_RUNTIME", "REVIEWER_LIGHT_VERIFY"];
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

test("cloud verification block mentions artifact dir and reviewer bot", () => {
  process.env.CURSOR_RUNTIME = "cloud";
  process.env.REVIEWER_LIGHT_VERIFY = "false";
  const block = verificationInstructions({
    pageUrl: "http://localhost:3000/w/ws-1/c/ticket-1",
  });
  expect(block).toContain("/opt/cursor/artifacts/after-fix");
  expect(block).toContain("reviewer bot");
  expect(block).toContain("**Verification**");
  expect(block).toContain("bun run test");
});
