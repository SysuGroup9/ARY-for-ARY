import assert from "node:assert/strict";
import test from "node:test";
import { listConsoleRacesForUser } from "@/lib/services/console-routes";

test("rider console race list is driven by registration presence", async () => {
  const riderRaces = await listConsoleRacesForUser({
    roles: ["RIDER"],
    userId: "rider_01",
  });

  assert.equal(riderRaces.some((item) => item.race.id === "race_active"), true);
});

test("judge console race list only includes races with assigned judging work", async () => {
  const judgeRaces = await listConsoleRacesForUser({
    roles: ["JUDGE"],
    userId: "judge_01",
  });

  assert.equal(judgeRaces.some((item) => item.race.id === "race_finished"), true);
  assert.equal(judgeRaces.some((item) => item.race.id === "race_active"), false);
});
