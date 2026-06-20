import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("race registration and submission actions consume returnTo redirects", () => {
  const source = readFileSync("src/app/actions.ts", "utf8");

  assert.match(
    source,
    /export async function registerForRaceAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\);[\s\S]*?redirect\(returnTo \|\| /,
  );
  assert.match(
    source,
    /export async function submitEntryAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\);[\s\S]*?redirect\(returnTo \|\| "\/"\)/,
  );
  assert.match(
    source,
    /export async function submitEntryForTestAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\);[\s\S]*?createSubmission\(user\.id, formData, \{ enqueueSubmissionTest: true \}\);[\s\S]*?redirect\(returnTo \|\| "\/"\)/,
  );
  assert.match(
    source,
    /export async function submitFinalEntryAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\);[\s\S]*?redirect\(returnTo \|\| "\/"\)/,
  );
});
