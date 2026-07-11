import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("rider console section page consumes route-level action feedback params", () => {
  const source = readFileSync(
    "src/app/console/races/[raceSlug]/rider/[section]/page.tsx",
    "utf8",
  );

  assert.match(source, /feedbackMessage\?: string/);
  assert.match(source, /feedbackScope\?: string/);
  assert.match(source, /getActionFeedbackContent/);
  assert.match(source, /feedback=\{feedback\}/);
});
