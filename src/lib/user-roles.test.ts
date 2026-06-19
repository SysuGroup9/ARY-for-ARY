import assert from "node:assert/strict";
import test from "node:test";
import {
  getDefaultActiveRole,
  hasRole,
  normalizeRoles,
  parseRolesJson,
  serializeRoles,
} from "./user-roles";

test("normalizes roles into stable unique order", () => {
  assert.deepEqual(normalizeRoles(["RIDER", "ADMIN", "RIDER", "JUDGE"]), [
    "ADMIN",
    "JUDGE",
    "RIDER",
  ]);
});

test("falls back to rider when roles are empty", () => {
  assert.deepEqual(normalizeRoles([]), ["RIDER"]);
});

test("parses roles json safely", () => {
  assert.deepEqual(parseRolesJson('["ORGANIZER","RIDER"]'), [
    "ORGANIZER",
    "RIDER",
  ]);
  assert.deepEqual(parseRolesJson("not-json"), ["RIDER"]);
});

test("serializes roles as stable json", () => {
  assert.equal(serializeRoles(["RIDER", "ADMIN", "RIDER"]), '["ADMIN","RIDER"]');
});

test("checks role membership and default active role", () => {
  const roles = ["ADMIN", "ORGANIZER", "RIDER"] as const;
  assert.equal(hasRole(roles, "ADMIN"), true);
  assert.equal(hasRole(roles, "JUDGE"), false);
  assert.equal(getDefaultActiveRole(roles), "ADMIN");
});
