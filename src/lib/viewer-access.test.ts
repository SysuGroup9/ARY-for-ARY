import test from "node:test";
import assert from "node:assert/strict";
import {
  getConsoleAdminAccess,
  getConsoleDefaultHref,
  getConsoleEntryTarget,
  getConsoleHomeSections,
  getConsoleRaceViewAccess,
  getConsoleScreenAccess,
  getCreateRaceBackTarget,
  getCreateRacePageAccess,
  getHomeRedirectTarget,
  getLoginRedirectTarget,
  getPublicAuthAction,
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
  assert.deepEqual(getRoleCapabilities(["ORGANIZER"]), {
    canAdmin: false,
    canJudge: false,
    canManage: true,
    canRide: false,
    canUseScreen: false,
  });

  assert.deepEqual(getRoleCapabilities(["RIDER"]), {
    canAdmin: false,
    canJudge: false,
    canManage: false,
    canRide: true,
    canUseScreen: false,
  });

  assert.deepEqual(getRoleCapabilities(["ADMIN", "ORGANIZER"]), {
    canAdmin: true,
    canJudge: false,
    canManage: true,
    canRide: false,
    canUseScreen: true,
  });

  assert.deepEqual(getRoleCapabilities(null), {
    canAdmin: false,
    canJudge: false,
    canManage: false,
    canRide: false,
    canUseScreen: false,
  });
});

test("allows only organizers to access the dedicated create-race page", () => {
  assert.deepEqual(getCreateRacePageAccess(["ORGANIZER"]), {
    allowed: true,
    redirectTo: null,
  });

  assert.deepEqual(getCreateRacePageAccess(["RIDER"]), {
    allowed: false,
    redirectTo: "/console",
  });

  assert.deepEqual(getCreateRacePageAccess(null), {
    allowed: false,
    redirectTo: "/login",
  });
});

test("uses the home page as the back target for create-race flow", () => {
  assert.equal(getCreateRaceBackTarget(), "/");
});

test("keeps the public auth action understandable", () => {
  assert.deepEqual(getPublicAuthAction({ roles: null }), {
    href: "/login",
    label: "登录 / 注册",
  });
  assert.deepEqual(getPublicAuthAction({ roles: ["RIDER"] }), {
    href: "/login",
    label: "身份入口",
  });
});

test("shows console entry only for users with actual console sections", () => {
  assert.equal(getConsoleEntryTarget(null), null);
  assert.equal(getConsoleEntryTarget(["RIDER"]), "/console");
  assert.equal(getConsoleEntryTarget(["ORGANIZER"]), "/console");
});

test("maps console home sections from the current role", () => {
  assert.deepEqual(getConsoleHomeSections(["ORGANIZER"]), ["races"]);
  assert.deepEqual(getConsoleHomeSections(["RIDER"]), ["races"]);
  assert.deepEqual(getConsoleHomeSections(["JUDGE"]), ["races"]);
  assert.deepEqual(getConsoleHomeSections(["ADMIN"]), ["admin", "screen"]);
  assert.deepEqual(getConsoleHomeSections(["ADMIN", "ORGANIZER"]), [
    "admin",
    "races",
    "screen",
  ]);
  assert.deepEqual(getConsoleHomeSections(null), []);
});

test("picks a default console landing route from the current role", () => {
  assert.equal(getConsoleDefaultHref(["ORGANIZER"]), "/console/races");
  assert.equal(getConsoleDefaultHref(["RIDER"]), "/console/races");
  assert.equal(getConsoleDefaultHref(["JUDGE"]), "/console/races");
  assert.equal(getConsoleDefaultHref(["ADMIN"]), "/console/admin/users");
  assert.equal(getConsoleDefaultHref(["ADMIN", "RIDER"]), "/console/admin/users");
  assert.equal(getConsoleDefaultHref(null), "/login");
});

test("guards organizer and rider race workspace views by race scope", () => {
  assert.deepEqual(
    getConsoleRaceViewAccess({
      roles: ["ORGANIZER"],
      view: "organizer",
      isRaceOrganizer: true,
      isRaceJudge: false,
      isRaceRider: false,
    }),
    { allowed: true, redirectTo: null },
  );

  assert.deepEqual(
    getConsoleRaceViewAccess({
      roles: ["ORGANIZER"],
      view: "organizer",
      isRaceOrganizer: false,
      isRaceJudge: false,
      isRaceRider: false,
    }),
    { allowed: false, redirectTo: "/console/races" },
  );

  assert.deepEqual(
    getConsoleRaceViewAccess({
      roles: ["RIDER"],
      view: "rider",
      isRaceOrganizer: false,
      isRaceJudge: false,
      isRaceRider: true,
    }),
    { allowed: true, redirectTo: null },
  );

  assert.deepEqual(
    getConsoleRaceViewAccess({
      roles: ["RIDER"],
      view: "rider",
      isRaceOrganizer: false,
      isRaceJudge: false,
      isRaceRider: false,
    }),
    { allowed: false, redirectTo: "/console/races" },
  );

  assert.deepEqual(
    getConsoleRaceViewAccess({
      roles: null,
      view: "organizer",
      isRaceOrganizer: false,
      isRaceJudge: false,
      isRaceRider: false,
    }),
    { allowed: false, redirectTo: "/login" },
  );

  assert.deepEqual(
    getConsoleRaceViewAccess({
      roles: ["JUDGE"],
      view: "judge",
      isRaceOrganizer: false,
      isRaceJudge: true,
      isRaceRider: false,
    }),
    { allowed: true, redirectTo: null },
  );

  assert.deepEqual(
    getConsoleRaceViewAccess({
      roles: ["JUDGE"],
      view: "judge",
      isRaceOrganizer: false,
      isRaceJudge: false,
      isRaceRider: false,
    }),
    { allowed: false, redirectTo: "/console/races" },
  );
});

test("keeps admin and screen console access explicit", () => {
  assert.deepEqual(getConsoleAdminAccess(["ADMIN"]), {
    allowed: true,
    redirectTo: null,
  });
  assert.deepEqual(getConsoleAdminAccess(["ORGANIZER"]), {
    allowed: false,
    redirectTo: "/console",
  });
  assert.deepEqual(getConsoleScreenAccess(["ORGANIZER"]), {
    allowed: false,
    redirectTo: "/console",
  });
  assert.deepEqual(getConsoleScreenAccess(["ADMIN"]), {
    allowed: true,
    redirectTo: null,
  });
  assert.deepEqual(getConsoleScreenAccess(["RIDER"]), {
    allowed: false,
    redirectTo: "/console",
  });
});
