import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("admin console section page reads action feedback from query params", () => {
  const source = readFileSync("src/app/console/admin/[section]/page.tsx", "utf8");

  assert.match(source, /feedbackScope\?: string/);
  assert.match(source, /getActionFeedbackContent/);
  assert.match(source, /ErrorNotice/);
});
