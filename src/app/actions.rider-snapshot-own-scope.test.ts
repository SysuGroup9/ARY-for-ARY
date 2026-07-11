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

test("fetchCASnapshotAction passes rider ownership into snapshot fetch service", () => {
  const functionSource = getFunctionSource(
    "fetchCASnapshotAction",
    "rotateCAConnectionSecretAction",
  );

  assert.match(functionSource, /const user = await requireRole\("RIDER"\);/);
  assert.match(
    functionSource,
    /await fetchCASessionSnapshotForConnection\(\{[\s\S]*?userId: user\.id[\s\S]*?\}\)/,
  );
});
