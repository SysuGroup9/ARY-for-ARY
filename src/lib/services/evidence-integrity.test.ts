import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { rebuildSessionSummaryEvidenceForRace } from "@/lib/services/evidence";

test("rebuildSessionSummaryEvidenceForRace writes confidence and review flags from source ingestion events", async () => {
  const connection = await prisma.cAConnection.findFirstOrThrow({
    where: {
      connectorId: "codex_connector_active_0",
    },
    include: {
      sessions: true,
      raceProject: {
        include: {
          registration: true,
        },
      },
    },
  });

  const session = connection.sessions[0];
  assert.ok(session, "expected seeded active session");

  const conflictEvent = await prisma.cAIngestionEvent.create({
    data: {
      caConnectionId: connection.id,
      caSessionId: session.caSessionId,
      idempotencyKey: `evidence-gap-${randomUUID()}`,
      integrityStatus: "INTEGRITY_GAP",
      messageId: `evt_${randomUUID()}`,
      observedAt: new Date("2026-06-19T10:21:00.000Z"),
      payloadDigest: "digest_conflict_source",
      payloadJson: JSON.stringify({
        ca: {
          caConnectionId: connection.id,
          caProjectId: connection.caProjectId,
          caSessionId: session.caSessionId,
        },
      }),
      receivedAt: new Date("2026-06-19T10:21:02.000Z"),
      signalKind: "event",
      signalType: "task_progress",
    },
  });

  await rebuildSessionSummaryEvidenceForRace("race_active");

  const evidence = await prisma.evidence.findFirstOrThrow({
    where: {
      registration: {
        raceId: "race_active",
      },
      type: "SESSION_SUMMARY",
      sourceRefJson: {
        contains: session.caSessionId,
      },
    },
  });

  assert.equal(evidence.integrityStatus, "REVIEW_NEEDED");
  assert.equal(evidence.confidenceLevel, "MEDIUM");
  assert.match(evidence.generatedFromEventIdsJson, new RegExp(conflictEvent.id));
  assert.match(evidence.reviewFlagJson, /integrity_gap|review_needed/);
});
