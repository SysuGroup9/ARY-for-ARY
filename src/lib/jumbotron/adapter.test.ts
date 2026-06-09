import assert from "node:assert/strict";
import test from "node:test";
import {
  buildJumbotronSnapshotFromRace,
  type DcrRaceInput,
} from "./adapter";
import { devcompassOvalTrack } from "./mock-racing-data";

test("builds mock snapshot when no DCR race exists", () => {
  const snapshot = buildJumbotronSnapshotFromRace(
    null,
    devcompassOvalTrack,
    new Date("2026-06-09T12:00:00.000Z"),
  );

  assert.equal(snapshot.track.trackId, "devcompass-oval");
  assert.ok(snapshot.entries.length > 0);
  assert.equal(snapshot.competition.liveStatus, "live");
});

test("maps DCR teams to racing entries with fallback progress source", () => {
  const race: DcrRaceInput = {
    cloudStudioUrl: "https://cloudstudio.example/race",
    evaluationNotes: "Runner evaluates correctness and reasoning.",
    feedbackThreads: [],
    id: "race-001",
    leaderboardEntries: [],
    notifications: [],
    organizer: { username: "organizer_demo" },
    phase: "active",
    raceEnd: new Date("2026-06-09T14:00:00.000Z"),
    raceStart: new Date("2026-06-09T10:00:00.000Z"),
    runnerTasks: [],
    submissions: [],
    summary: "Public live race",
    taskPackageLabel: "sort-task-v1.zip",
    teams: [
      {
        id: "team-a",
        members: [{ displayName: "Alice" }],
        name: "Alpha",
      },
      {
        id: "team-b",
        members: [{ displayName: "Bob" }],
        name: "Beta",
      },
    ],
    title: "排序算法挑战赛",
  };

  const snapshot = buildJumbotronSnapshotFromRace(
    race,
    devcompassOvalTrack,
    new Date("2026-06-09T12:00:00.000Z"),
  );

  assert.equal(snapshot.entries.length, 2);
  assert.equal(snapshot.entries[0]?.positionSource, "overallProgress_fallback");
  assert.equal(snapshot.entries[0]?.laneId, "lane-1");
  assert.equal(snapshot.entries[1]?.laneId, "lane-2");
  assert.equal(snapshot.kpis.activeRiders, 2);
});
