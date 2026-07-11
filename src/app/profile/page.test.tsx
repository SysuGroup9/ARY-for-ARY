import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("profile completion page requires a session and wires the completion action", () => {
  const source = readFileSync("src/app/profile/page.tsx", "utf8");

  assert.match(source, /loadDatabaseUser/);
  assert.match(source, /redirect\("\/login"\)/);
  assert.match(source, /completeProfileAction/);
  assert.match(source, /feedbackCode/);
  assert.match(source, /getEntryFeedbackContent/);
  assert.match(source, /ErrorNotice/);
  assert.match(source, /returnTo/);
  assert.match(source, /资料补全/);
});
