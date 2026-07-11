import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/app/actions.ts", "utf8");
const organizerSource = readFileSync(
  "src/app/_components/console/organizer-console-page.tsx",
  "utf8",
);

function getFunctionSource(name: string, next: string) {
  const start = source.indexOf(`export async function ${name}(formData: FormData)`);
  const end = source.indexOf(`export async function ${next}(`, start);

  assert.notEqual(start, -1, `${name} should exist in actions.ts`);
  assert.notEqual(end, -1, `${next} should exist after ${name}`);

  return source.slice(start, end);
}

test("publishRaceAction allows admin/system callers and wires publishRace service", () => {
  const functionSource = getFunctionSource("publishRaceAction", "updateRaceAction");

  assert.doesNotMatch(functionSource, /requireRole\("ORGANIZER"\)/);
  assert.match(functionSource, /const user = await loadDatabaseUser\(\);/);
  assert.match(functionSource, /if \(!user\.profileCompleted\)/);
  assert.match(
    functionSource,
    /if \(!hasRole\(user\.roles, "ADMIN"\) && !hasRole\(user\.roles, "ORGANIZER"\)\)/,
  );
  assert.match(
    functionSource,
    /await publishRace\(\{[\s\S]*?allowSystem: hasRole\(user\.roles, "ADMIN"\)[\s\S]*?organizerId: user\.id[\s\S]*?raceId:/,
  );
});

test("organizer settings expose a localized race publish entry", () => {
  assert.match(organizerSource, /赛事发布/);
  assert.match(organizerSource, /发布赛事/);
  assert.match(organizerSource, /发布后赛事会进入公开页/);
});
