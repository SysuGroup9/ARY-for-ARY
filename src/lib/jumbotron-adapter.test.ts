import assert from "node:assert/strict";
import test from "node:test";
import { mapToRacingEntries, type AryRaceData } from "./jumbotron/adapter";

function buildRaceData(overrides?: Partial<AryRaceData>): AryRaceData {
  const now = new Date("2026-06-18T12:00:00.000Z");

  return {
    id: "race_active",
    title: "Test Race",
    summary: "summary",
    signupStart: new Date("2026-06-15T00:00:00.000Z"),
    signupEnd: new Date("2026-06-16T00:00:00.000Z"),
    raceStart: new Date("2026-06-18T08:00:00.000Z"),
    raceEnd: new Date("2026-06-19T08:00:00.000Z"),
    organizer: { id: "org_1", username: "organizer" },
    teams: [
      { id: "team_1", name: "Alpha", captain: { id: "r1", username: "alice" } },
      { id: "team_2", name: "Beta", captain: { id: "r2", username: "bob" } },
    ],
    leaderboardEntries: [
      {
        id: "lb_1",
        teamId: "team_1",
        totalScore: 90,
        progress: null,
        taskScore: 81,
        tokenScore: 70,
        dialogueScore: 76,
        agentType: "CLAUDE",
        createdAt: now,
      },
      {
        id: "lb_2",
        teamId: "team_2",
        totalScore: 45,
        progress: null,
        taskScore: 40,
        tokenScore: 52,
        dialogueScore: 48,
        agentType: "OPENAI",
        createdAt: now,
      },
    ],
    submissions: [
      { id: "sub_1", teamId: "team_1", createdAt: now },
      { id: "sub_2", teamId: "team_2", createdAt: now },
    ],
    teamArchives: [
      {
        teamId: "team_1",
        agentType: "CLAUDE",
        tokenUsed: 1000,
        totalScore: 90,
        antiCheatPenalty: 0,
      },
      {
        teamId: "team_2",
        agentType: "OPENAI",
        tokenUsed: 1500,
        totalScore: 45,
        antiCheatPenalty: 0,
      },
    ],
    feedbackThreads: [],
    ...overrides,
  };
}

test("falls back to derived overall progress for active races when leaderboard progress is missing", () => {
  const entries = mapToRacingEntries(buildRaceData());

  assert.equal(entries.length, 2);
  assert.equal(entries[0].overallProgress, 1);
  assert.equal(entries[1].overallProgress, 0.5);
  assert.equal(entries[0].roundProgress, 1);
  assert.equal(entries[1].roundProgress, 0.5);
  assert.equal(entries[0].status, "sprinting");
  assert.equal(entries[1].status, "running");
});

test("still prefers explicit leaderboard progress over derived progress", () => {
  const entries = mapToRacingEntries(
    buildRaceData({
      leaderboardEntries: [
        {
          id: "lb_1",
          teamId: "team_1",
          totalScore: 90,
          progress: 0.2,
          taskScore: 81,
          tokenScore: 70,
          dialogueScore: 76,
          agentType: "CLAUDE",
          createdAt: new Date("2026-06-18T12:00:00.000Z"),
        },
        {
          id: "lb_2",
          teamId: "team_2",
          totalScore: 45,
          progress: 0.8,
          taskScore: 40,
          tokenScore: 52,
          dialogueScore: 48,
          agentType: "OPENAI",
          createdAt: new Date("2026-06-18T12:00:00.000Z"),
        },
      ],
    }),
  );

  assert.equal(entries[0].roundProgress, 0.2);
  assert.equal(entries[1].roundProgress, 0.8);
});

test("active races do not collapse every entry back to the start line when progress is missing", () => {
  const entries = mapToRacingEntries(buildRaceData());
  const allAtStart = entries.every((entry) => entry.roundProgress === 0);

  assert.equal(allAtStart, false);
});

test("active races do not trust all-zero leaderboard progress when scores clearly imply live spread", () => {
  const entries = mapToRacingEntries(
    buildRaceData({
      leaderboardEntries: [
        {
          id: "lb_1",
          teamId: "team_1",
          totalScore: 90,
          progress: 0,
          taskScore: 81,
          tokenScore: 70,
          dialogueScore: 76,
          agentType: "CLAUDE",
          createdAt: new Date("2026-06-18T12:00:00.000Z"),
        },
        {
          id: "lb_2",
          teamId: "team_2",
          totalScore: 45,
          progress: 0,
          taskScore: 40,
          tokenScore: 52,
          dialogueScore: 48,
          agentType: "OPENAI",
          createdAt: new Date("2026-06-18T12:00:00.000Z"),
        },
      ],
    }),
  );

  assert.equal(entries[0].overallProgress, 1);
  assert.equal(entries[1].overallProgress, 0.5);
  assert.equal(entries[0].roundProgress, 1);
  assert.equal(entries[1].roundProgress, 0.5);
});

test("finished races also ignore all-zero placeholder progress when ranked scores imply final spread", () => {
  const entries = mapToRacingEntries(
    buildRaceData({
      raceStart: new Date("2026-06-17T08:00:00.000Z"),
      raceEnd: new Date("2026-06-18T10:00:00.000Z"),
      leaderboardEntries: [
        {
          id: "lb_1",
          teamId: "team_1",
          totalScore: 90,
          progress: 0,
          taskScore: 81,
          tokenScore: 70,
          dialogueScore: 76,
          agentType: "CLAUDE",
          createdAt: new Date("2026-06-18T12:00:00.000Z"),
        },
        {
          id: "lb_2",
          teamId: "team_2",
          totalScore: 45,
          progress: 0,
          taskScore: 40,
          tokenScore: 52,
          dialogueScore: 48,
          agentType: "OPENAI",
          createdAt: new Date("2026-06-18T12:00:00.000Z"),
        },
      ],
    }),
  );

  assert.equal(entries[0].roundProgress, 1);
  assert.equal(entries[1].roundProgress, 0.5);
  assert.equal(entries[0].status, "finished");
  assert.equal(entries[1].status, "finished");
});
