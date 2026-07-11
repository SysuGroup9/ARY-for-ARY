import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("console entry sends incomplete accounts to profile completion before showing console sections", () => {
  const source = readFileSync("src/app/console/page.tsx", "utf8");

  assert.match(source, /loadDatabaseUser/);
  assert.match(source, /buildProfileCompletionHref\("\/console"\)/);
  assert.match(source, /if \(!sessionUser\.profileCompleted\)/);
});

test("console entry page reads action feedback from query params", () => {
  const source = readFileSync("src/app/console/page.tsx", "utf8");

  assert.match(source, /feedbackMessage\?: string/);
  assert.match(source, /feedbackScope\?: string/);
  assert.match(source, /getActionFeedbackContent/);
  assert.match(source, /ErrorNotice/);
});
