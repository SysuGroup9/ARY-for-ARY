import assert from "node:assert/strict";
import test from "node:test";
import {
  buildJumbotronSnapshotFromRace,
  type DcrRaceInput,
} from "./adapter";
import {
  buildMockJumbotronSnapshot,
  devcompassOvalTrack,
} from "./mock-racing-data";

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

test("builds live mock snapshots with current timestamps", () => {
  const now = new Date("2026-06-13T12:00:00.000Z");
  const snapshot = buildMockJumbotronSnapshot(devcompassOvalTrack, now);

  assert.equal(snapshot.entries[0]?.updatedAt, now.toISOString());
  assert.equal(snapshot.messages[0]?.createdAt, now.toISOString());
});

test("keeps scored DCR entries finished even when submission is old", () => {
  const race: DcrRaceInput = {
    cloudStudioUrl: "/races/race-002",
    evaluationNotes: "Runner evaluates correctness and reasoning.",
    feedbackThreads: [],
    id: "race-002",
    leaderboardEntries: [
      {
        agentType: "OPENAI",
        createdAt: new Date("2026-06-09T10:20:00.000Z"),
        rank: 1,
        team: {
          id: "team-a",
          members: [{ displayName: "Alice" }],
          name: "Alpha",
        },
        teamId: "team-a",
        totalScore: 94,
      },
    ],
    notifications: [],
    organizer: { username: "organizer_demo" },
    phase: "active",
    raceEnd: new Date("2026-06-09T14:00:00.000Z"),
    raceStart: new Date("2026-06-09T10:00:00.000Z"),
    runnerTasks: [],
    submissions: [
      {
        agentType: "OPENAI",
        createdAt: new Date("2026-06-09T10:20:00.000Z"),
        runnerStatus: "SCORED",
        status: "SCORED",
        teamId: "team-a",
        tokenUsed: 12000,
        totalScore: 94,
      },
    ],
    summary: "Public live race",
    taskPackageLabel: "sort-task-v1.zip",
    teams: [
      {
        id: "team-a",
        members: [{ displayName: "Alice" }],
        name: "Alpha",
      },
    ],
    title: "排序算法挑战赛",
  };

  const snapshot = buildJumbotronSnapshotFromRace(
    race,
    devcompassOvalTrack,
    new Date("2026-06-09T12:00:00.000Z"),
  );

  assert.equal(snapshot.entries[0]?.status, "finished");
});

test("keeps live runner submissions running even when seed time is old", () => {
  const race: DcrRaceInput = {
    cloudStudioUrl: "/races/race-003",
    evaluationNotes: "Runner evaluates correctness and reasoning.",
    feedbackThreads: [],
    id: "race-003",
    leaderboardEntries: [],
    notifications: [],
    organizer: { username: "organizer_demo" },
    phase: "active",
    raceEnd: new Date("2026-06-09T14:00:00.000Z"),
    raceStart: new Date("2026-06-09T10:00:00.000Z"),
    runnerTasks: [],
    submissions: [
      {
        agentType: "OPENAI",
        createdAt: new Date("2026-06-09T10:20:00.000Z"),
        runnerStatus: "LIVE_RUNNING",
        status: "PULLED",
        teamId: "team-a",
        tokenUsed: 12000,
        totalScore: 86,
      },
    ],
    summary: "Public live race",
    taskPackageLabel: "sort-task-v1.zip",
    teams: [
      {
        id: "team-a",
        members: [{ displayName: "Alice" }],
        name: "Alpha",
      },
    ],
    title: "排序算法挑战赛",
  };

  const snapshot = buildJumbotronSnapshotFromRace(
    race,
    devcompassOvalTrack,
    new Date("2026-06-09T12:00:00.000Z"),
  );

  assert.equal(snapshot.entries[0]?.status, "running");
});
