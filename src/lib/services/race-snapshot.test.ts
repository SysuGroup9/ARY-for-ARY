import assert from "node:assert/strict";
import test from "node:test";
import type { RaceSnapshot } from "@/lib/jumbotron/track-runtime/types";
import { resolveRaceSnapshotForDisplay } from "@/lib/services/race-snapshot";

function buildSnapshot(overrides?: Partial<RaceSnapshot>): RaceSnapshot {
  return {
    attentionItems: [],
    competition: {
      competitionId: "race_active",
      currentPhase: "DEV",
      currentRound: 1,
      elapsedTime: 120,
      liveStatus: "live",
      nextPhase: "REL",
      organizer: "organizer_demo",
      subtitle: "subtitle",
      systemTime: "2026-07-11T10:00:00.000Z",
      theme: "ary",
      title: "Sorting Challenge",
    },
    entries: [],
    generatedAt: "2026-07-11T10:00:00.000Z",
    kpis: {
      activeCockpits: 0,
      activeRiders: 0,
      claudeShare: 0,
      claudeTokens: 0,
      codexShare: 0,
      codexTokens: 0,
      completionRate: 0,
      obstacleCount: 0,
      onlineRiders: 0,
      riskCount: 0,
      totalTokens: 0,
      violationCount: 0,
    },
    messages: [],
    raceId: "race_active",
    trackId: "oval-track",
    ...overrides,
  };
}

test("resolveRaceSnapshotForDisplay returns a live snapshot and persists it when build succeeds", async () => {
  const liveSnapshot = buildSnapshot();
  const saved: Array<{ raceId: string; snapshot: RaceSnapshot }> = [];

  const result = await resolveRaceSnapshotForDisplay("race_active", {
    buildSnapshot: async () => liveSnapshot,
    loadSnapshot: () => null,
    saveSnapshot: (raceId, snapshot) => {
      saved.push({ raceId, snapshot });
    },
  });

  assert.equal(result.source, "live");
  assert.equal(result.snapshot, liveSnapshot);
  assert.equal(result.fallbackReason, null);
  assert.deepEqual(saved, [{ raceId: "race_active", snapshot: liveSnapshot }]);
});

test("resolveRaceSnapshotForDisplay falls back to the latest stable snapshot when live build fails", async () => {
  const stableSnapshot = buildSnapshot({
    generatedAt: "2026-07-11T09:30:00.000Z",
  });
  const saved: Array<{ raceId: string; snapshot: RaceSnapshot }> = [];

  const result = await resolveRaceSnapshotForDisplay("race_active", {
    buildSnapshot: async () => {
      throw new Error("projection_rebuild_failed");
    },
    loadSnapshot: () => stableSnapshot,
    saveSnapshot: (raceId, snapshot) => {
      saved.push({ raceId, snapshot });
    },
  });

  assert.equal(result.source, "stable");
  assert.equal(result.snapshot, stableSnapshot);
  assert.equal(result.fallbackReason, "projection_rebuild_failed");
  assert.equal(saved.length, 0);
});

test("resolveRaceSnapshotForDisplay reports a static fallback when no stable snapshot is available", async () => {
  const result = await resolveRaceSnapshotForDisplay("race_active", {
    buildSnapshot: async () => {
      throw new Error("track_runtime_missing");
    },
    loadSnapshot: () => null,
    saveSnapshot: () => {
      throw new Error("should_not_save");
    },
  });

  assert.equal(result.source, "static");
  assert.equal(result.snapshot, null);
  assert.equal(result.fallbackReason, "track_runtime_missing");
});
