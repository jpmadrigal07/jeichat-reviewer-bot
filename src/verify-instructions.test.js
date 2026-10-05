import { afterEach, expect, test } from "bun:test";
import { verificationInstructions } from "./verify-instructions.js";

const runtimeKey = "CURSOR_RUNTIME";
const runtimeWas = process.env[runtimeKey];

afterEach(() => {
  if (runtimeWas === undefined) delete process.env[runtimeKey];
  else process.env[runtimeKey] = runtimeWas;
});

test("cloud verification block mentions artifact dir and reviewer bot", () => {
  process.env.CURSOR_RUNTIME = "cloud";
  const block = verificationInstructions({
    pageUrl: "http://localhost:3000/w/ws-1/c/ticket-1",
  });
  expect(block).toContain("/opt/cursor/artifacts/after-fix");
  expect(block).toContain("reviewer bot");
  expect(block).toContain("**Verification**");
  expect(block).toContain("bun run test");
});
