import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/app/actions.ts", "utf8");

function getFunctionSource(name: string, next: string) {
  const start = source.indexOf(`export async function ${name}(formData: FormData)`);
  const end = source.indexOf(`export async function ${next}(`, start);

  assert.notEqual(start, -1, `${name} should exist in actions.ts`);
  assert.notEqual(end, -1, `${next} should exist after ${name}`);

  return source.slice(start, end);
}

test("assignJudgeToWorkAction allows admin/system callers and passes allowSystem into judging service", () => {
  const functionSource = getFunctionSource(
    "assignJudgeToWorkAction",
    "submitJudgingRecordAction",
  );

  assert.doesNotMatch(functionSource, /requireRole\("ORGANIZER"\)/);
  assert.match(functionSource, /const user = await loadDatabaseUser\(\);/);
  assert.match(functionSource, /if \(!user\.profileCompleted\)/);
  assert.match(
    functionSource,
    /if \(!hasRole\(user\.roles, "ADMIN"\) && !hasRole\(user\.roles, "ORGANIZER"\)\)/,
  );
  assert.match(
    functionSource,
    /await assignJudgeToWork\(\{[\s\S]*?allowSystem: hasRole\(user\.roles, "ADMIN"\)/,
  );
});
