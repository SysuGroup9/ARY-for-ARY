import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/app/actions.ts", "utf8");

const workLifecycleActions = [
  {
    name: "publishWorkAction",
    next: "hideWorkAction",
    serviceCall: "publishWorkForRace",
    roles: /if \(!hasRole\(user\.roles, "ADMIN"\) && !hasRole\(user\.roles, "ORGANIZER"\)\)/,
  },
  {
    name: "hideWorkAction",
    next: "lockWorkAction",
    serviceCall: "hideWorkForRace",
    roles: /if \(\s*!hasRole\(user\.roles, "ADMIN"\)\s*&&\s*!hasRole\(user\.roles, "ORGANIZER"\)\s*&&\s*!hasRole\(user\.roles, "RIDER"\)\s*\)/,
  },
  {
    name: "lockWorkAction",
    next: "sendFeedbackAction",
    serviceCall: "lockWorkForRace",
    roles: /if \(!hasRole\(user\.roles, "ADMIN"\) && !hasRole\(user\.roles, "ORGANIZER"\)\)/,
  },
] as const;

function getFunctionSource(name: string, next: string) {
  const start = source.indexOf(`export async function ${name}(formData: FormData)`);
  const end = source.indexOf(`export async function ${next}(`, start);

  assert.notEqual(start, -1, `${name} should exist in actions.ts`);
  assert.notEqual(end, -1, `${next} should exist after ${name}`);

  return source.slice(start, end);
}

test("work lifecycle actions follow expected role gates and pass actor/system scope", () => {
  for (const action of workLifecycleActions) {
    const functionSource = getFunctionSource(action.name, action.next);

    assert.match(functionSource, /const user = await loadDatabaseUser\(\);/);
    assert.match(functionSource, /if \(!user\.profileCompleted\)/);
    assert.match(functionSource, action.roles);
    assert.match(
      functionSource,
      new RegExp(
        `await ${action.serviceCall}\\([\\s\\S]*?actorUserId: user\\.id[\\s\\S]*?allowSystem: hasRole\\(user\\.roles, "ADMIN"\\)`,
      ),
    );
  }
});
