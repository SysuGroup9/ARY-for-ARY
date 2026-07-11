import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("cooperation page reads submission and action feedback state from query params", () => {
  const source = readFileSync("src/app/cooperation/page.tsx", "utf8");

  assert.match(source, /submitted\?: string/);
  assert.match(source, /feedbackScope\?: string/);
  assert.match(source, /getActionFeedbackContent/);
  assert.match(source, /ErrorNotice/);
});
