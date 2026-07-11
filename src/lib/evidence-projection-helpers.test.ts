import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCurrentLeaderboardProjectionPayload,
  buildEventStreamProjectionPayload,
  buildRaceProgressProjectionPayload,
  buildRegistrationStatusProjectionPayload,
  buildScreenFeedProjectionPayload,
  buildSessionSummaryEvidenceRecord,
} from "./evidence-projection-helpers";

test("builds session summary evidence from a session and connection", () => {
  const evidence = buildSessionSummaryEvidenceRecord({
    caConnectionId: "conn_01",
    caProjectId: "codex_project_demo",
    caSessionId: "session_01",
    caType: "CODEX",
    confidenceLevel: "high",
    generatedFromEventIdsJson: JSON.stringify(["evt_01"]),
    integrityStatus: "ok",
    messageCount: 42,
    registrationId: "reg_01",
    reviewFlagJson: JSON.stringify([]),
    sourceDigest: "digest_01",
    startedAt: new Date("2026-06-19T09:00:00Z"),
    tokenCost: 1200,
    toolCallCount: 8,
  });

  assert.equal(evidence.registrationId, "reg_01");
  assert.equal(evidence.type, "SESSION_SUMMARY");
  assert.equal(evidence.visibility, "INTERNAL");
  assert.equal(evidence.integrityStatus, "ok");
  assert.equal(evidence.confidenceLevel, "high");
  assert.equal(evidence.sourceDigest, "digest_01");
  assert.equal(evidence.generatedFromEventIdsJson, JSON.stringify(["evt_01"]));
  assert.equal(evidence.reviewFlagJson, JSON.stringify([]));
  assert.match(evidence.summary, /42/);
  assert.match(evidence.sourceRefJson, /session_01/);
});

test("builds registration status projection payload from registration and race project state", () => {
  const payload = buildRegistrationStatusProjectionPayload({
    aggregateIngestionStatus: "ACTIVE",
    caConnectionCount: 2,
    raceProjectId: "project_01",
    registrationId: "reg_01",
    registrationStatus: "APPROVED",
    sessionCount: 3,
    username: "rider_alice",
  });

  assert.deepEqual(payload, {
    aggregateIngestionStatus: "ACTIVE",
    caConnectionCount: 2,
    raceProjectId: "project_01",
    registrationId: "reg_01",
    registrationStatus: "APPROVED",
    sessionCount: 3,
    username: "rider_alice",
  });
});

test("builds race progress projection payload from process counts", () => {
  const payload = buildRaceProgressProjectionPayload({
    activeConnections: 3,
    activeRegistrations: 5,
    activeSessions: 2,
    raceId: "race_active",
    totalRegistrations: 8,
  });

  assert.equal(payload.raceId, "race_active");
  assert.equal(payload.totalRegistrations, 8);
  assert.equal(payload.activeRegistrations, 5);
  assert.equal(payload.activeConnections, 3);
  assert.equal(payload.activeSessions, 2);
});

test("builds screen feed payload with explicit item types", () => {
  const payload = buildScreenFeedProjectionPayload({
    items: [
      {
        summary: "Alice completed a planning checkpoint.",
        type: "session_summary",
      },
      {
        summary: "Current leaderboard updated.",
        type: "current_leaderboard_projection",
      },
    ],
    raceId: "race_active",
  });

  assert.equal(payload.raceId, "race_active");
  assert.equal(payload.items[0]?.type, "session_summary");
  assert.equal(payload.items[1]?.type, "current_leaderboard_projection");
});

test("builds a process leaderboard from registration progress instead of legacy result rows", () => {
  const payload = buildCurrentLeaderboardProjectionPayload([
    {
      entryId: "reg_a",
      progressPercent: 88,
      tokenCost: 900,
      username: "alice",
    },
    {
      entryId: "reg_b",
      progressPercent: 42,
      tokenCost: 1200,
      username: "bob",
    },
  ]);

  assert.deepEqual(payload, [
    {
      entryId: "reg_a",
      progressPercent: 88,
      rank: 1,
      tokenCost: 900,
      username: "alice",
    },
    {
      entryId: "reg_b",
      progressPercent: 42,
      rank: 2,
      tokenCost: 1200,
      username: "bob",
    },
  ]);
});

test("builds an event stream payload sorted by recency for live hall consumption", () => {
  const payload = buildEventStreamProjectionPayload({
    items: [
      {
        createdAt: "2026-06-19T10:00:00.000Z",
        severity: "info",
        summary: "Alice started a new coding session.",
        type: "session_activity",
        username: "alice",
      },
      {
        createdAt: "2026-06-19T10:05:00.000Z",
        severity: "warning",
        summary: "Bob reported an ingestion failure.",
        type: "risk",
        username: "bob",
      },
    ],
    raceId: "race_active",
  });

  assert.equal(payload.raceId, "race_active");
  assert.equal(payload.items[0]?.summary, "Bob reported an ingestion failure.");
  assert.equal(payload.items[0]?.severity, "warning");
  assert.equal(payload.items[1]?.summary, "Alice started a new coding session.");
});
