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

test("createRaceAction allows admin/system callers and reads organizerId for system create", () => {
  const functionSource = getFunctionSource("createRaceAction", "updateRaceAction");

  assert.doesNotMatch(functionSource, /requireRole\("ORGANIZER"\)/);
  assert.match(functionSource, /const user = await loadDatabaseUser\(\);/);
  assert.match(functionSource, /if \(!user\.profileCompleted\)/);
  assert.match(
    functionSource,
    /if \(!hasRole\(user\.roles, "ADMIN"\) && !hasRole\(user\.roles, "ORGANIZER"\)\)/,
  );
  assert.match(functionSource, /const organizerId = hasRole\(user\.roles, "ADMIN"\)/);
  assert.match(functionSource, /formData\.get\("organizerId"\)/);
  assert.match(
    functionSource,
    /await createRace\(\{[\s\S]*?actorUserId: user\.id[\s\S]*?allowSystem: hasRole\(user\.roles, "ADMIN"\)[\s\S]*?formData[\s\S]*?organizerId[\s\S]*?\}\)/,
  );
});
