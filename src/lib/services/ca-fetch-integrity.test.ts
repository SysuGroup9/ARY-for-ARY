import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { fetchCASessionSnapshotForConnection } from "@/lib/services/ca-fetch";

async function createLocalSnapshotIntegrityConnection() {
  const raceProject = await prisma.raceProject.findFirstOrThrow({
    include: {
      registration: true,
    },
  });

  return prisma.cAConnection.create({
    data: {
      caProjectId: `snapshot_integrity_project_${randomUUID()}`,
      caType: "CODEX",
      connectorBaseUrl: "http://127.0.0.1:4010",
      connectorId: `snapshot_integrity_connector_${randomUUID()}`,
      connectorSecret: `snapshot-integrity-secret-${randomUUID()}`,
      connectorVersion: "0.1.0",
      handshakeCompletedAt: new Date("2026-06-19T10:00:00.000Z"),
      ingestionSource: "MANUAL",
      ingestionStatus: "ACTIVE",
      raceProjectId: raceProject.id,
    },
  });
}

test("snapshot fetch writes payloadDigest and integrity metadata to CAIngestionEvent", async () => {
  const connection = await createLocalSnapshotIntegrityConnection();

  const sessionId = `snapshot_integrity_session_${randomUUID()}`;
  const fetchedAt = "2026-06-19T10:18:36.000Z";

  await fetchCASessionSnapshotForConnection({
    caConnectionId: connection.id,
    caSessionId: sessionId,
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          schemaVersion: "ary.ca.session_snapshot.v0.1",
          fetchedAt,
          ca: {
            caConnectionId: connection.id,
            caType: "CODEX",
            caProjectId: connection.caProjectId,
            caSessionId: sessionId,
          },
          summary: {
            currentGoal: "Implement DEV-5",
            latestActivity: "Fetched snapshot for integrity coverage",
            riskLevel: "low",
            riskReason: "none",
          },
          task: {
            taskId: "DEV-5",
            progressPercent: 50,
            taskStatus: "in_progress",
          },
          session: {
            allRidingMessageLength: 123,
            endedAt: null,
            lastActiveAt: "2026-06-19T10:17:58.000Z",
            messageCount: 14,
            startedAt: "2026-06-19T09:02:11.000Z",
            tokens: 880,
            toolCallCount: 5,
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
  });

  const event = await prisma.cAIngestionEvent.findFirstOrThrow({
    where: {
      idempotencyKey: `fetch:${connection.id}:${sessionId}:${fetchedAt}`,
    },
  });

  assert.match(event.payloadDigest, /^[a-f0-9]{64}$/);
  assert.equal(event.integrityStatus, "OK");
});

test("snapshot payload requires task.taskId", async () => {
  const connection = await createLocalSnapshotIntegrityConnection();

  await assert.rejects(
    () =>
      fetchCASessionSnapshotForConnection({
        caConnectionId: connection.id,
        caSessionId: `snapshot_missing_task_${randomUUID()}`,
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              schemaVersion: "ary.ca.session_snapshot.v0.1",
              fetchedAt: "2026-06-19T10:18:36.000Z",
              ca: {
                caConnectionId: connection.id,
                caType: "CODEX",
                caProjectId: connection.caProjectId,
                caSessionId: `snapshot_missing_task_${randomUUID()}`,
              },
              summary: {
                currentGoal: "missing task id",
                latestActivity: "payload missing task.taskId",
                riskLevel: "low",
                riskReason: "none",
              },
              task: {
                progressPercent: 10,
                taskStatus: "in_progress",
              },
              session: {
                allRidingMessageLength: 12,
                endedAt: null,
                lastActiveAt: "2026-06-19T10:17:58.000Z",
                messageCount: 1,
                startedAt: "2026-06-19T09:02:11.000Z",
                tokens: 10,
                toolCallCount: 1,
              },
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            },
          ),
      }),
    /taskId/i,
  );
});
