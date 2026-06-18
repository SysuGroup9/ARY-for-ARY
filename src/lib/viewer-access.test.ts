import test from "node:test";
import assert from "node:assert/strict";
import {
  getCreateRaceBackTarget,
  getCreateRacePageAccess,
  getHomeRedirectTarget,
  getLoginRedirectTarget,
  getRoleCapabilities,
} from "./viewer-access";

test("keeps the home page public for both anonymous and authenticated visitors", () => {
  assert.equal(getHomeRedirectTarget(false), null);
  assert.equal(getHomeRedirectTarget(true), null);
});

test("redirects authenticated login visitors to /", () => {
  assert.equal(getLoginRedirectTarget(true), "/");
  assert.equal(getLoginRedirectTarget(false), null);
});

test("maps organizer and rider capabilities without audience session", () => {
  assert.deepEqual(getRoleCapabilities("ORGANIZER"), {
    canManage: true,
    canRide: false,
  });

  assert.deepEqual(getRoleCapabilities("RIDER"), {
    canManage: false,
    canRide: true,
  });

  assert.deepEqual(getRoleCapabilities(null), {
    canManage: false,
    canRide: false,
  });
});

test("allows only organizers to access the dedicated create-race page", () => {
  assert.deepEqual(getCreateRacePageAccess("ORGANIZER"), {
    allowed: true,
    redirectTo: null,
  });

  assert.deepEqual(getCreateRacePageAccess("RIDER"), {
    allowed: false,
    redirectTo: "/",
  });

  assert.deepEqual(getCreateRacePageAccess(null), {
    allowed: false,
    redirectTo: "/login",
  });
});

test("uses the home page as the back target for create-race flow", () => {
  assert.equal(getCreateRaceBackTarget(), "/");
});
