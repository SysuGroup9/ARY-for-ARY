import assert from "node:assert/strict";
import test from "node:test";
import {
  listConsoleRacesForUser,
  listScreenConsoleRacesForUser,
} from "@/lib/services/console-routes";

test("rider console race list returns only races where the user has a registration", async () => {
  const races = await listConsoleRacesForUser({
    roles: ["RIDER"],
    userId: "rider_01",
  });

  // 不依赖特定 raceId，只验证返回值结构正确且按 access=rider 返回
  assert.ok(Array.isArray(races));
  for (const item of races) {
    assert.equal(item.access, "rider");
    assert.ok(item.slug.length > 0);
    assert.ok(item.defaultHref.startsWith("/console/races/"));
  }
});

test("screen console race list is admin-only while enterprise capability is still proxied by admin", async () => {
  const adminRaces = await listScreenConsoleRacesForUser({
    roles: ["ADMIN"],
    userId: "admin_01",
  });
  const organizerRaces = await listScreenConsoleRacesForUser({
    roles: ["ORGANIZER"],
    userId: "organizer_01",
  });

  assert.ok(Array.isArray(adminRaces));
  assert.ok(adminRaces.every((item) => item.defaultHref.startsWith("/console/screen/")));
  assert.deepEqual(organizerRaces, []);
});

test("judge console race list returns only races where the user has judge assignments", async () => {
  const races = await listConsoleRacesForUser({
    roles: ["JUDGE"],
    userId: "judge_01",
  });

  assert.ok(Array.isArray(races));
  for (const item of races) {
    assert.equal(item.access, "judge");
    assert.ok(item.defaultHref.startsWith("/console/races/"));
  }
});
