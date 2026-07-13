import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateKPIs,
  generateAttentionItems,
  generateMessages,
  mapToRacingEntries,
  type AryRaceData,
} from "./jumbotron/adapter";

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
    registrations: [],
    projections: [],
    teams: [
      { id: "team_1", name: "Alpha", captain: { id: "r1", username: "alice" } },
      { id: "team_2", name: "Beta", captain: { id: "r2", username: "bob" } },
    ],
    leaderboardEntries: [
      {
        id: "lb_1",
        registrationId: "reg_1",
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
        registrationId: "reg_2",
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
      { id: "sub_1", registrationId: "reg_1", teamId: "team_1", createdAt: now },
      { id: "sub_2", registrationId: "reg_2", teamId: "team_2", createdAt: now },
    ],
    teamArchives: [
      {
        registrationId: "reg_1",
        teamId: "team_1",
        agentType: "CLAUDE",
        tokenUsed: 1000,
        totalScore: 90,
        antiCheatPenalty: 0,
      },
      {
        registrationId: "reg_2",
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
  const now = new Date();
  const entries = mapToRacingEntries(
    buildRaceData({
      raceStart: new Date(now.getTime() - 2 * 3600_000),  // 2 hours ago
      raceEnd: new Date(now.getTime() + 2 * 3600_000),    // 2 hours from now
      registrations: [
        { id: "reg_1", userId: "r1", user: { id: "r1", username: "alice" }, raceProject: null, work: null },
        { id: "reg_2", userId: "r2", user: { id: "r2", username: "bob" }, raceProject: null, work: null },
      ],
    }),
  );

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

test("uses team name as projectName and riderName when teams exist", () => {
  const entries = mapToRacingEntries(
    buildRaceData({
      registrations: [
        {
          id: "reg_1",
          userId: "r1",
          user: { id: "r1", username: "alice" },
          raceProject: {
            id: "project_1",
            aggregateIngestionStatus: "ACTIVE",
            caConnections: [{ sessions: [{ id: "sess_1" }] }],
          },
          work: { id: "work_1", title: "Alpha Work", summary: "summary" },
        },
      ],
      teams: [
        { id: "team_1", name: "Team Alpha", captain: { id: "r1", username: "alice" } },
      ],
      leaderboardEntries: [
        {
          id: "lb_1",
          registrationId: "reg_1",
          teamId: "team_1",
          totalScore: 90,
          progress: null,
          taskScore: 81,
          tokenScore: 70,
          dialogueScore: 76,
          agentType: "CLAUDE",
          createdAt: new Date("2026-06-18T12:00:00.000Z"),
        },
      ],
      submissions: [{ id: "sub_1", registrationId: "reg_1", teamId: "team_1", createdAt: new Date("2026-06-18T12:00:00.000Z") }],
      teamArchives: [
        {
          registrationId: "reg_1",
          teamId: "team_1",
          agentType: "CLAUDE",
          tokenUsed: 1000,
          totalScore: 90,
          antiCheatPenalty: 0,
        },
      ],
    }),
  );

  assert.equal(entries.length, 1);
  // Jumbotron now uses team name, not work title
  assert.equal(entries[0].projectName, "Team Alpha");
  assert.equal(entries[0].riderName, "Team Alpha");
  assert.equal(entries[0].entryId, "team_1");
});

test("prefers screen feed projection items over mock messages when projection exists", () => {
  const messages = generateMessages(
    buildRaceData({
      projections: [
        {
          id: "proj_screen",
          type: "SCREEN_FEED",
          payloadJson: JSON.stringify({
            raceId: "race_active",
            items: [
              { type: "session_summary", summary: "Alice completed a routing checkpoint." },
              { type: "announcement", summary: "Leaderboard updated." },
            ],
          }),
        },
      ],
    }),
  );

  assert.equal(messages[0]?.summary, "Alice completed a routing checkpoint.");
  assert.equal(messages[1]?.summary, "Leaderboard updated.");
});

test("prefers current leaderboard projection progress when legacy leaderboard rows are absent", () => {
  const now = new Date();
  const entries = mapToRacingEntries(
    buildRaceData({
      raceStart: new Date(now.getTime() - 2 * 3600_000),
      raceEnd: new Date(now.getTime() + 2 * 3600_000),
      registrations: [
        { id: "reg_1", userId: "r1", user: { id: "r1", username: "alice" }, raceProject: null, work: null },
        { id: "reg_2", userId: "r2", user: { id: "r2", username: "bob" }, raceProject: null, work: null },
      ],
      projections: [
        {
          id: "proj_leader",
          type: "CURRENT_LEADERBOARD",
          payloadJson: JSON.stringify([
            {
              entryId: "team_1",
              progressPercent: 88,
              rank: 1,
              tokenCost: 900,
              username: "alice",
            },
            {
              entryId: "team_2",
              progressPercent: 42,
              rank: 2,
              tokenCost: 1200,
              username: "bob",
            },
          ]),
        },
      ],
      leaderboardEntries: [],
    }),
  );

  assert.equal(entries[0].roundProgress, 0.88);
  assert.equal(entries[1].roundProgress, 0.42);
  assert.equal(entries[0].rank, 1);
  assert.equal(entries[1].rank, 2);
});

test("prefers session token cost totals over legacy archive totals when registration sessions exist", () => {
  const kpis = calculateKPIs(
    buildRaceData({
      registrations: [
        {
          id: "reg_1",
          userId: "r1",
          user: { id: "r1", username: "alice" },
          raceProject: {
            id: "project_1",
            aggregateIngestionStatus: "ACTIVE",
            caConnections: [
              {
                sessions: [
                  { id: "sess_1", tokenCost: 600 },
                  { id: "sess_2", tokenCost: 400 },
                ],
              },
            ],
          },
          work: null,
        },
      ],
      teamArchives: [
        {
          registrationId: "reg_1",
          teamId: "team_1",
          agentType: "CLAUDE",
          tokenUsed: 5000,
          totalScore: 90,
          antiCheatPenalty: 0,
        },
      ],
    }),
  );

  assert.equal(kpis.totalTokens, 1000);
});

test("prefers failed aggregate ingestion status to create process attention items", () => {
  const items = generateAttentionItems(
    buildRaceData({
      registrations: [
        {
          id: "reg_1",
          userId: "r1",
          user: { id: "r1", username: "alice" },
          raceProject: {
            id: "project_1",
            aggregateIngestionStatus: "FAILED",
            caConnections: [],
          },
          work: null,
        },
      ],
      leaderboardEntries: [
        {
          id: "lb_1",
          registrationId: "reg_1",
          teamId: "team_1",
          totalScore: 90,
          progress: null,
          taskScore: 81,
          tokenScore: 70,
          dialogueScore: 76,
          agentType: "CLAUDE",
          createdAt: new Date("2026-06-18T12:00:00.000Z"),
        },
      ],
      teamArchives: [],
      teams: [
        { id: "team_1", name: "Alpha", captain: { id: "r1", username: "alice" } },
      ],
    }),
  );

  assert.equal(items.some((item) => item.summary.includes("CA 接入失败")), true);
  assert.equal(items[0].entryId, "team_1");
});

test("can derive jumbotron entries directly from registrations when team compatibility rows are absent", () => {
  const now = new Date();
  const entries = mapToRacingEntries(
    buildRaceData({
      raceStart: new Date(now.getTime() - 2 * 3600_000),
      raceEnd: new Date(now.getTime() + 2 * 3600_000),
      registrations: [
        {
          id: "reg_only",
          userId: "r1",
          user: { id: "r1", username: "alice" },
          raceProject: {
            id: "project_only",
            aggregateIngestionStatus: "ACTIVE",
            caConnections: [
              {
                sessions: [
                  {
                    id: "sess_only",
                    progressPercent: 75,
                    tokenCost: 900,
                  },
                ],
              },
            ],
          },
          work: { id: "work_only", title: "Alice Solo Work", summary: "summary" },
        },
      ],
      leaderboardEntries: [
        {
          id: "lb_only",
          registrationId: "reg_only",
          teamId: "reg_only",
          totalScore: 90,
          progress: null,
          taskScore: 81,
          tokenScore: 70,
          dialogueScore: 76,
          agentType: "CLAUDE",
          createdAt: now,
        },
      ],
      projections: [
        {
          id: "proj_only",
          type: "CURRENT_LEADERBOARD",
          payloadJson: JSON.stringify([
            {
              entryId: "reg_only",
              progressPercent: 75,
              rank: 1,
              tokenCost: 900,
              username: "alice",
            },
          ]),
        },
      ],
      teams: [],
      submissions: [],
      teamArchives: [],
    }),
  );

  assert.equal(entries.length, 1);
  assert.equal(entries[0].entryId, "reg_only");
  // When no teams, falls back to work title or username
  assert.equal(entries[0].projectName, "Alice Solo Work");
  assert.equal(entries[0].riderName, "Alice Solo Work");
  assert.equal(entries[0].roundProgress, 0.75);
});

test("prefers ca connection type, session token cost, and latest activity over legacy archive/feedback", () => {
  const entries = mapToRacingEntries(
    buildRaceData({
      registrations: [
        {
          id: "reg_proc",
          userId: "r1",
          user: { id: "r1", username: "alice" },
          raceProject: {
            id: "project_proc",
            aggregateIngestionStatus: "ACTIVE",
            caConnections: [
              {
                caType: "CODEX",
                sessions: [
                  {
                    id: "sess_proc",
                    latestActivity: "Alice completed the planning checkpoint.",
                    progressPercent: 61,
                    tokenCost: 777,
                  },
                ],
              },
            ],
          },
          work: { id: "work_proc", title: "Alice Work", summary: "summary" },
        },
      ],
      projections: [
        {
          id: "proj_proc",
          type: "CURRENT_LEADERBOARD",
          payloadJson: JSON.stringify([
            {
              entryId: "reg_proc",
              progressPercent: 61,
              rank: 1,
              tokenCost: 777,
              username: "alice",
            },
          ]),
        },
      ],
      teams: [],
      teamArchives: [],
      feedbackThreads: [],
      leaderboardEntries: [],
      submissions: [],
    }),
  );

  assert.equal(entries[0].caProvider, "codex");
  assert.equal(entries[0].costTokens, 777);
  assert.equal(entries[0].lastMessage?.summary, "Alice completed the planning checkpoint.");
});

test("uses team id as the primary jumbotron entry id when teams exist", () => {
  const entries = mapToRacingEntries(
    buildRaceData({
      registrations: [
        {
          id: "reg_primary",
          userId: "r1",
          user: { id: "r1", username: "alice" },
          raceProject: {
            id: "project_primary",
            aggregateIngestionStatus: "ACTIVE",
            caConnections: [],
          },
          work: { id: "work_primary", title: "Alice Work", summary: "summary" },
        },
      ],
      teams: [
        { id: "team_1", name: "Team Alpha", captain: { id: "r1", username: "alice" } },
      ],
      leaderboardEntries: [
        {
          id: "lb_1",
          registrationId: "reg_primary",
          teamId: "team_1",
          totalScore: 90,
          progress: null,
          taskScore: 81,
          tokenScore: 70,
          dialogueScore: 76,
          agentType: "CLAUDE",
          createdAt: new Date("2026-06-18T12:00:00.000Z"),
        },
      ],
    }),
  );

  // When teams exist, entryId is team.id
  assert.equal(entries[0].entryId, "team_1");
});

test("generates fallback process messages from session latestActivity when screen feed projection is absent", () => {
  const messages = generateMessages(
    buildRaceData({
      registrations: [
        {
          id: "reg_msg",
          userId: "r1",
          user: { id: "r1", username: "alice" },
          raceProject: {
            id: "project_msg",
            aggregateIngestionStatus: "ACTIVE",
            caConnections: [
              {
                caType: "CODEX",
                sessions: [
                  {
                    id: "sess_msg",
                    latestActivity: "Alice unblocked the core task.",
                    progressPercent: 52,
                    tokenCost: 500,
                  },
                ],
              },
            ],
          },
          work: null,
        },
      ],
      leaderboardEntries: [
        {
          id: "lb_1",
          registrationId: "reg_msg",
          teamId: "team_1",
          totalScore: 90,
          progress: null,
          taskScore: 81,
          tokenScore: 70,
          dialogueScore: 76,
          agentType: "CLAUDE",
          createdAt: new Date("2026-06-18T12:00:00.000Z"),
        },
      ],
      feedbackThreads: [],
      projections: [],
      teams: [
        { id: "team_1", name: "Team Alpha", captain: { id: "r1", username: "alice" } },
      ],
    }),
  );

  assert.equal(messages[0]?.summary, "Alice unblocked the core task.");
  assert.equal(messages[0]?.source, "session");
  assert.equal(messages[0]?.entryId, "team_1");
});

test("does not fabricate mock riding messages when no projection, feedback, or session activity exists", () => {
  const messages = generateMessages(
    buildRaceData({
      feedbackThreads: [],
      projections: [],
      registrations: [],
    }),
  );

  assert.equal(messages.length, 0);
});

test("does not fabricate low-risk attention items when no real risk source exists", () => {
  const items = generateAttentionItems(
    buildRaceData({
      registrations: [],
      teamArchives: [],
    }),
  );

  assert.equal(items.length, 0);
});

test("prefers registration and race-project presence over scored leaderboard rows for activity kpis", () => {
  const kpis = calculateKPIs(
    buildRaceData({
      leaderboardEntries: [],
      registrations: [
        {
          id: "reg_active",
          userId: "r1",
          user: { id: "r1", username: "alice" },
          raceProject: {
            id: "project_active",
            aggregateIngestionStatus: "ACTIVE",
            caConnections: [{ sessions: [{ id: "s1", tokenCost: 100 }] }],
          },
          work: null,
        },
        {
          id: "reg_connected",
          userId: "r2",
          user: { id: "r2", username: "bob" },
          raceProject: {
            id: "project_connected",
            aggregateIngestionStatus: "CONNECTED",
            caConnections: [],
          },
          work: null,
        },
      ],
      teamArchives: [],
      teams: [],
    }),
  );

  assert.equal(kpis.onlineRiders, 2);
  assert.equal(kpis.activeRiders, 1);
  assert.equal(kpis.activeCockpits, 2);
});
