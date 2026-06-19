import assert from "node:assert/strict";
import test from "node:test";
import { hasRole, normalizeRoles, parseRolesJson, serializeRoles } from "../user-roles";

test("[CR-01] normalizeRoles 去重排序过滤", () => {
  assert.deepStrictEqual(
    normalizeRoles(["RIDER", "JUDGE", "ADMIN", "ORGANIZER", "INVALID"]),
    ["ADMIN", "JUDGE", "ORGANIZER", "RIDER"],
  );
  assert.deepStrictEqual(normalizeRoles([]), ["RIDER"]);
  assert.deepStrictEqual(normalizeRoles(["UNKNOWN"]), ["RIDER"]);
});

test("[CR-02] hasRole 正反判断", () => {
  const roles = normalizeRoles(["ADMIN", "ORGANIZER"]);
  assert.equal(hasRole(roles, "ADMIN"), true);
  assert.equal(hasRole(roles, "ORGANIZER"), true);
  assert.equal(hasRole(roles, "JUDGE"), false);
  assert.equal(hasRole(roles, "RIDER"), false);
});

test("[CR-03] parseRolesJson 合法/非法/往返", () => {
  assert.deepStrictEqual(parseRolesJson('["ADMIN", "JUDGE"]'), ["ADMIN", "JUDGE"]);
  assert.deepStrictEqual(parseRolesJson("invalid-json"), ["RIDER"]);
  assert.deepStrictEqual(parseRolesJson(""), ["RIDER"]);
  // serializeRoles 往返
  assert.deepStrictEqual(
    parseRolesJson(serializeRoles(["ADMIN", "RIDER"])),
    ["ADMIN", "RIDER"],
  );
});

test("[CR-04] serializeRoles 去重排序", () => {
  assert.equal(serializeRoles(["RIDER", "ADMIN", "ADMIN"]), JSON.stringify(["ADMIN", "RIDER"]));
});
