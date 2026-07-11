import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("public register page consumes route-level action feedback params", () => {
  const source = readFileSync("src/app/races/[raceSlug]/register/page.tsx", "utf8");

  assert.match(source, /feedbackMessage\?: string/);
  assert.match(source, /feedbackScope\?: string/);
  assert.match(source, /getActionFeedbackContent/);
  assert.match(source, /feedback=\{feedback\}/);
});
