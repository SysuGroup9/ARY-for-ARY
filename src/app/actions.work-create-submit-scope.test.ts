import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/app/actions.ts", "utf8");

test("saveWorkDraftAction stays on the rider path and delegates to the work draft service", () => {
  const start = source.indexOf(
    "export async function saveWorkDraftAction(formData: FormData)",
  );
  const end = source.indexOf(
    "export async function publishWorkAction(",
    start,
  );

  assert.notEqual(start, -1, "saveWorkDraftAction should exist in actions.ts");
  assert.notEqual(end, -1, "publishWorkAction should follow saveWorkDraftAction");

  const functionSource = source.slice(start, end);

  assert.match(functionSource, /const user = await requireRole\("RIDER"\);/);
  assert.match(
    functionSource,
    /await saveWorkDraftForRider\(user\.id, formData\);/,
  );
});
