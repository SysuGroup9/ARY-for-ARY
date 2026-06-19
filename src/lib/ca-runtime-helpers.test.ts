import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSessionPatchFromSnapshot,
  buildSessionPatchFromSignal,
  getNextConnectionStatusFromSignal,
  isFailureSignalPayload,
  shouldApplyFetchedSnapshot,
  type RidingSignalInput,
} from "./ca-runtime-helpers";

function buildSignal(overrides?: Partial<RidingSignalInput>): RidingSignalInput {
  return {
    counters: {
      messageCount: 12,
      sessionCount: 1,
      tokens: 800,
      toolCallCount: 4,
    },
    ingestion: null,
    latestActivity: "Working on ranking logic.",
    progressPercent: 44,
    riskLevel: "medium",
    riskReason: "One pending blocker remains.",
    taskStatus: "in_progress",
    timestamp: new Date("2026-06-19T10:00:00Z"),
    type: "session_started",
    ...overrides,
  };
}

test("marks a connection active when a live session starts", () => {
  assert.equal(
    getNextConnectionStatusFromSignal({
      currentStatus: "CONNECTED",
      signal: buildSignal({ type: "session_started" }),
    }),
    "ACTIVE",
  );
});

test("marks a connection failed when the signal carries ingestion failure", () => {
  assert.equal(
    getNextConnectionStatusFromSignal({
      currentStatus: "ACTIVE",
      signal: buildSignal({
        ingestion: {
          status: "FAILED",
          statusReason: "permission_denied",
        },
        type: "risk_detected",
      }),
    }),
    "FAILED",
  );
});

test("builds a new session patch from a session_started signal", () => {
  const patch = buildSessionPatchFromSignal({
    existingSession: null,
    signal: buildSignal({
      type: "session_started",
    }),
  });

  assert.deepEqual(patch, {
    caSessionId: null,
    currentGoal: null,
    endedAt: null,
    lastActiveAt: new Date("2026-06-19T10:00:00Z"),
    latestActivity: "Working on ranking logic.",
    messageCount: 12,
    progressPercent: 44,
    riskLevel: "medium",
    riskReason: "One pending blocker remains.",
    startedAt: new Date("2026-06-19T10:00:00Z"),
    taskStatus: "in_progress",
    tokenCost: 800,
    toolCallCount: 4,
  });
});

test("updates an existing session from a progress signal without resetting startedAt", () => {
  const patch = buildSessionPatchFromSignal({
      existingSession: {
        caSessionId: "session_01",
        currentGoal: "Old goal",
        endedAt: null,
        lastActiveAt: new Date("2026-06-19T09:30:00Z"),
        latestActivity: "Old activity",
        messageCount: 8,
        progressPercent: 10,
        riskLevel: "low",
        riskReason: "none",
        startedAt: new Date("2026-06-19T09:00:00Z"),
        taskStatus: "not_started",
        tokenCost: 600,
        toolCallCount: 3,
      },
    signal: buildSignal({
      type: "task_progress",
    }),
  });

  assert.deepEqual(patch, {
    caSessionId: "session_01",
    currentGoal: "Old goal",
    endedAt: null,
    lastActiveAt: new Date("2026-06-19T10:00:00Z"),
    latestActivity: "Working on ranking logic.",
    messageCount: 12,
    progressPercent: 44,
    riskLevel: "medium",
    riskReason: "One pending blocker remains.",
    startedAt: new Date("2026-06-19T09:00:00Z"),
    taskStatus: "in_progress",
    tokenCost: 800,
    toolCallCount: 4,
  });
});

test("recognizes failure payloads explicitly", () => {
  assert.equal(
    isFailureSignalPayload(
      buildSignal({
        ingestion: {
          status: "FAILED",
          statusReason: "permission_denied",
        },
      }),
    ),
    true,
  );
  assert.equal(isFailureSignalPayload(buildSignal()), false);
});

test("only applies fetched snapshots when they are newer than the stored one", () => {
  assert.equal(
    shouldApplyFetchedSnapshot({
      fetchedAt: new Date("2026-06-19T10:00:00Z"),
      snapshotFetchedAt: null,
    }),
    true,
  );
  assert.equal(
    shouldApplyFetchedSnapshot({
      fetchedAt: new Date("2026-06-19T10:00:00Z"),
      snapshotFetchedAt: new Date("2026-06-19T09:00:00Z"),
    }),
    true,
  );
  assert.equal(
    shouldApplyFetchedSnapshot({
      fetchedAt: new Date("2026-06-19T10:00:00Z"),
      snapshotFetchedAt: new Date("2026-06-19T11:00:00Z"),
    }),
    false,
  );
});

test("builds a session patch from a fetched snapshot", () => {
  const patch = buildSessionPatchFromSnapshot({
    snapshot: {
      fetchedAt: new Date("2026-06-19T10:18:36Z"),
      summary: {
        currentGoal: "Implement DEV-12",
        latestActivity: "Added status transition check and ran tests",
        riskLevel: "medium",
        riskReason: "One failing test remains near task deadline",
      },
      task: {
        progressPercent: 43,
        taskStatus: "in_progress",
      },
      session: {
        allRidingMessageLength: 122222,
        endedAt: null,
        lastActiveAt: new Date("2026-06-19T10:17:58Z"),
        messageCount: 318,
        startedAt: new Date("2026-06-19T09:02:11Z"),
        tokenCost: 12344,
        toolCallCount: 57,
      },
    },
  });

  assert.deepEqual(patch, {
    allRidingMessageLength: 122222,
    currentGoal: "Implement DEV-12",
    endedAt: null,
    lastActiveAt: new Date("2026-06-19T10:17:58Z"),
    latestActivity: "Added status transition check and ran tests",
    messageCount: 318,
    progressPercent: 43,
    riskLevel: "medium",
    riskReason: "One failing test remains near task deadline",
    snapshotFetchedAt: new Date("2026-06-19T10:18:36Z"),
    startedAt: new Date("2026-06-19T09:02:11Z"),
    taskStatus: "in_progress",
    tokenCost: 12344,
    toolCallCount: 57,
  });
});
