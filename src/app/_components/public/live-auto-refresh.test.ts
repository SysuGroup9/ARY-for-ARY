import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { shouldEnableLiveAutoRefresh } from "./live-auto-refresh-phase";

test("shouldEnableLiveAutoRefresh only enables refresh for live phases", () => {
  assert.equal(shouldEnableLiveAutoRefresh("registration"), true);
  assert.equal(shouldEnableLiveAutoRefresh("running"), true);
  assert.equal(shouldEnableLiveAutoRefresh("submitting"), true);
  assert.equal(shouldEnableLiveAutoRefresh("judging"), true);
  assert.equal(shouldEnableLiveAutoRefresh("active"), true);
  assert.equal(shouldEnableLiveAutoRefresh("frozen"), true);

  assert.equal(shouldEnableLiveAutoRefresh("draft"), false);
  assert.equal(shouldEnableLiveAutoRefresh("published"), false);
  assert.equal(shouldEnableLiveAutoRefresh("completed"), false);
  assert.equal(shouldEnableLiveAutoRefresh("archived"), false);
  assert.equal(shouldEnableLiveAutoRefresh("finished"), false);
  assert.equal(shouldEnableLiveAutoRefresh("preparation"), false);
});

test("live hall and live display source wire the shared auto-refresh helper", () => {
  const raceLivePageSource = readFileSync(
    new URL("../../races/[raceSlug]/live/page.tsx", import.meta.url),
    "utf8",
  );
  const screenLivePageSource = readFileSync(
    new URL("../../screen/[raceSlug]/live/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(raceLivePageSource, /LiveAutoRefresh/);
  assert.match(raceLivePageSource, /shouldEnableLiveAutoRefresh\(race\.phase\)/);
  assert.match(screenLivePageSource, /LiveAutoRefresh/);
  assert.match(screenLivePageSource, /shouldEnableLiveAutoRefresh\(race\.phase\)/);
});
