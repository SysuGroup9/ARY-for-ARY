import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/app/actions.ts", "utf8");

test("updateUserRolesAction stays admin-only and normalizes submitted role sets", () => {
  const start = source.indexOf(
    "export async function updateUserRolesAction(formData: FormData)",
  );
  const end = source.indexOf(
    "export async function createRaceAction(",
    start,
  );

  assert.notEqual(start, -1, "updateUserRolesAction should exist in actions.ts");
  assert.notEqual(end, -1, "createRaceAction should follow updateUserRolesAction");

  const functionSource = source.slice(start, end);

  assert.match(functionSource, /await requireRole\("ADMIN"\);/);
  assert.match(functionSource, /await updateUserRoles\(\{/);
  assert.match(functionSource, /roles: normalizeRoles\(/);
  assert.match(functionSource, /revalidatePath\("\/console\/admin\/users"\)/);
  assert.match(functionSource, /revalidatePath\("\/console\/admin\/roles"\)/);
});
