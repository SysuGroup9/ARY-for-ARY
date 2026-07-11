import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/app/actions.ts", "utf8");

const screenDisplayActions = [
  {
    name: "updateScreenDisplayModeAction",
    next: "updateScreenDisplayThemeAction",
    serviceCall: "updateScreenDisplayModeForRace",
  },
  {
    name: "updateScreenDisplayThemeAction",
    next: "saveRaceTrackCalibrationAction",
    serviceCall: "updateScreenDisplayThemeForRace",
  },
  {
    name: "fallbackScreenDisplayToStableAction",
    next: "fallbackScreenDisplayToStaticAction",
    serviceCall: "fallbackScreenDisplayToStableProjection",
  },
  {
    name: "fallbackScreenDisplayToStaticAction",
    next: "scoreRunnerTaskAction",
    serviceCall: "fallbackScreenDisplayToStaticNotice",
  },
] as const;

function getFunctionSource(name: string, next: string) {
  const start = source.indexOf(`export async function ${name}(formData: FormData)`);
  const end = source.indexOf(`export async function ${next}(`, start);

  assert.notEqual(start, -1, `${name} should exist in actions.ts`);
  assert.notEqual(end, -1, `${next} should exist after ${name}`);

  return source.slice(start, end);
}

test("screen display actions follow managed-race organizer and system admin boundaries", () => {
  for (const action of screenDisplayActions) {
    const functionSource = getFunctionSource(action.name, action.next);

    assert.doesNotMatch(functionSource, /requireRole\("ORGANIZER"\)/);
    assert.match(functionSource, /const user = await loadDatabaseUser\(\);/);
    assert.match(functionSource, /if \(!user\.profileCompleted\)/);
    assert.match(
      functionSource,
      /if \(!hasRole\(user\.roles, "ADMIN"\) && !hasRole\(user\.roles, "ORGANIZER"\)\)/,
    );
    assert.match(
      functionSource,
      new RegExp(
        `await ${action.serviceCall}\\([\\s\\S]*?allowSystem: hasRole\\(user\\.roles, "ADMIN"\\)`,
      ),
    );
  }
});
