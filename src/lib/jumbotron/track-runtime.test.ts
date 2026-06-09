import assert from "node:assert/strict";
import test from "node:test";
import {
  devcompassOvalTrack,
  mockJumbotronSnapshot,
} from "./mock-racing-data";
import {
  buildTrackRuntime,
  calculateHorsePose,
  deriveHorseMotionState,
  selectMessageBubbles,
  validateTrackProfile,
} from "./track-runtime";

test("validates example track profile geometry", () => {
  const report = validateTrackProfile(devcompassOvalTrack);

  assert.equal(report.valid, true);
  assert.equal(report.errors.length, 0);
  assert.ok(report.metrics.pathLength > 120);
});

test("calculates horse pose from progress and lane offset", () => {
  const runtime = buildTrackRuntime(devcompassOvalTrack);
  const entry = mockJumbotronSnapshot.entries[0];
  const pose = calculateHorsePose(runtime, entry, {
    now: new Date("2026-06-09T12:00:15.000Z"),
  });

  assert.equal(pose.entryId, entry.entryId);
  assert.equal(pose.laneId, "lane-1");
  assert.ok(Number.isFinite(pose.x));
  assert.ok(Number.isFinite(pose.y));
  assert.ok(Number.isFinite(pose.rotation));
  assert.ok(pose.s >= 0 && pose.s <= 1);
});

test("marks stale entries when updatedAt exceeds threshold", () => {
  const state = deriveHorseMotionState(
    {
      ...mockJumbotronSnapshot.entries[0],
      updatedAt: "2026-06-09T11:00:00.000Z",
    },
    new Date("2026-06-09T12:00:00.000Z"),
    90_000,
  );

  assert.equal(state, "stale");
});

test("limits message bubbles and skips no-bubble zones", () => {
  const runtime = buildTrackRuntime(devcompassOvalTrack);
  const entries = mockJumbotronSnapshot.entries.map((entry) => ({
    ...entry,
    roundProgress: entry.entryId === "team-vector" ? 0.01 : entry.roundProgress,
  }));
  const poses = entries.map((entry) =>
    calculateHorsePose(runtime, entry, {
      now: new Date("2026-06-09T12:00:00.000Z"),
    }),
  );
  const bubbles = selectMessageBubbles(devcompassOvalTrack, poses, entries, 1);

  assert.equal(bubbles.length, 1);
  assert.notEqual(bubbles[0]?.entryId, "team-vector");
});
