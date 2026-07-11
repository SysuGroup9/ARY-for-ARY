import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ingestRidingSignalMessage } from "@/lib/services/ca-ingestion";

async function createLocalIntegrityConnection() {
  const raceProject = await prisma.raceProject.findFirstOrThrow({
    include: {
      registration: true,
    },
  });

  return prisma.cAConnection.create({
    data: {
      caProjectId: `integrity_project_${randomUUID()}`,
      caType: "CODEX",
      connectorBaseUrl: "http://127.0.0.1:4010",
      connectorId: `integrity_connector_${randomUUID()}`,
      connectorSecret: `integrity-secret-${randomUUID()}`,
      connectorVersion: "0.1.0",
      handshakeCompletedAt: new Date("2026-06-19T10:00:00.000Z"),
      ingestionSource: "MANUAL",
      ingestionStatus: "ACTIVE",
      raceProjectId: raceProject.id,
    },
    include: {
      raceProject: {
        include: {
          registration: true,
        },
      },
    },
  });
}

function buildSignalPayload(input: {
  connection: Awaited<ReturnType<typeof createLocalIntegrityConnection>>;
  idempotencyKey: string;
  messageId: string;
  progressPercent: number;
  sequence: number;
  sessionId: string;
  timestamp?: string;
}) {
  return {
    schemaVersion: "ary.ca.riding_signal.v0.1",
    messageId: input.messageId,
    idempotencyKey: input.idempotencyKey,
    sequence: input.sequence,
    timestamp: input.timestamp ?? new Date().toISOString(),
    ca: {
      caConnectionId: input.connection.id,
      caProjectId: input.connection.caProjectId,
      caSessionId: input.sessionId,
      caType: input.connection.caType,
      connectorId: input.connection.connectorId,
    },
    race: {
      raceId: input.connection.raceProject.registration.raceId,
      taskId: "DEV-5",
    },
    rider: {
      raceProjectId: input.connection.raceProjectId,
      registrationId: input.connection.raceProject.registrationId,
    },
    signal: {
      kind: "event",
      type: "task_progress",
      progressPercent: input.progressPercent,
    },
    counters: {
      messageCount: 9,
      toolCallCount: 2,
      tokens: 300,
    },
  };
}

test("duplicate idempotencyKey with the same payload is deduped without a second business write", async () => {
  const connection = await createLocalIntegrityConnection();

  const idempotencyKey = `same-digest-key-${randomUUID()}`;
  const sessionId = `session_same_digest_${randomUUID()}`;
  const payload = {
    schemaVersion: "ary.ca.riding_signal.v0.1",
    messageId: `msg_same_digest_${randomUUID()}`,
    idempotencyKey,
    sequence: 7,
    timestamp: "2026-06-19T10:00:00.000Z",
    ca: {
      caConnectionId: connection.id,
      caProjectId: connection.caProjectId,
      caSessionId: sessionId,
      caType: connection.caType,
      connectorId: connection.connectorId,
    },
    race: {
      raceId: connection.raceProject.registration.raceId,
      taskId: "DEV-5",
    },
    rider: {
      raceProjectId: connection.raceProjectId,
      registrationId: connection.raceProject.registrationId,
    },
    signal: {
      kind: "event",
      type: "task_progress",
      progressPercent: 33,
    },
    counters: {
      messageCount: 9,
      toolCallCount: 2,
      tokens: 300,
    },
  };

  const first = await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: payload,
  });
  const second = await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: payload,
  });

  assert.equal(first.accepted, true);
  assert.equal(second.deduped, true);

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "ca_signal.ingest",
      detailsJson: {
        contains: idempotencyKey,
      },
      result: "deduped",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  assert.equal(audit.actorKind, "CONNECTOR");
});

test("duplicate idempotencyKey with a different payload becomes integrity_gap", async () => {
  const connection = await createLocalIntegrityConnection();

  const idempotencyKey = `digest-conflict-key-${randomUUID()}`;
  const sessionId = `session_conflict_${randomUUID()}`;
  const base = {
    schemaVersion: "ary.ca.riding_signal.v0.1",
    messageId: `msg_conflict_a_${randomUUID()}`,
    idempotencyKey,
    sequence: 8,
    timestamp: "2026-06-19T10:00:00.000Z",
    ca: {
      caConnectionId: connection.id,
      caProjectId: connection.caProjectId,
      caSessionId: sessionId,
      caType: connection.caType,
      connectorId: connection.connectorId,
    },
    race: {
      raceId: connection.raceProject.registration.raceId,
      taskId: "DEV-5",
    },
    rider: {
      raceProjectId: connection.raceProjectId,
      registrationId: connection.raceProject.registrationId,
    },
    signal: {
      kind: "event",
      type: "task_progress",
      progressPercent: 40,
    },
    counters: {
      messageCount: 10,
      toolCallCount: 3,
      tokens: 320,
    },
  };

  await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: base,
  });

  const conflict = await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: {
      ...base,
      counters: {
        ...base.counters,
        messageCount: 99,
      },
      messageId: `msg_conflict_b_${randomUUID()}`,
    },
  });

  assert.equal(conflict.accepted, true);
  assert.equal(conflict.integrityStatus, "integrity_gap");

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "ca_signal.ingest",
      detailsJson: {
        contains: idempotencyKey,
      },
      result: "integrity_gap",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  assert.equal(audit.reason, "payload_digest_conflict");
});

test("replayed sequence becomes integrity_gap and does not advance session state", async () => {
  const connection = await createLocalIntegrityConnection();
  const sessionId = `session_replayed_${randomUUID()}`;

  await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: buildSignalPayload({
      connection,
      idempotencyKey: `sequence-initial-${randomUUID()}`,
      messageId: `msg_sequence_initial_${randomUUID()}`,
      progressPercent: 66,
      sequence: 11,
      sessionId,
    }),
  });

  const replay = await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: buildSignalPayload({
      connection,
      idempotencyKey: `sequence-replayed-${randomUUID()}`,
      messageId: `msg_sequence_replayed_${randomUUID()}`,
      progressPercent: 5,
      sequence: 11,
      sessionId,
    }),
  });

  assert.equal(replay.accepted, true);
  assert.equal(replay.integrityStatus, "integrity_gap");

  const session = await prisma.session.findUniqueOrThrow({
    where: {
      caConnectionId_caSessionId: {
        caConnectionId: connection.id,
        caSessionId: sessionId,
      },
    },
  });
  assert.equal(session.progressPercent, 66);

  const repeatedSequenceCount = await prisma.cAIngestionEvent.count({
    where: {
      caConnectionId: connection.id,
      sequence: 11,
    },
  });
  assert.equal(repeatedSequenceCount, 1);

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "ca_signal.ingest",
      detailsJson: {
        contains: sessionId,
      },
      reason: "sequence_replayed",
      result: "integrity_gap",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  assert.equal(audit.actorKind, "CONNECTOR");
});

test("out-of-order sequence becomes integrity_gap and does not rewind session state", async () => {
  const connection = await createLocalIntegrityConnection();
  const sessionId = `session_out_of_order_${randomUUID()}`;

  await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: buildSignalPayload({
      connection,
      idempotencyKey: `sequence-high-${randomUUID()}`,
      messageId: `msg_sequence_high_${randomUUID()}`,
      progressPercent: 72,
      sequence: 12,
      sessionId,
    }),
  });

  const outOfOrder = await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: buildSignalPayload({
      connection,
      idempotencyKey: `sequence-low-${randomUUID()}`,
      messageId: `msg_sequence_low_${randomUUID()}`,
      progressPercent: 9,
      sequence: 10,
      sessionId,
    }),
  });

  assert.equal(outOfOrder.accepted, true);
  assert.equal(outOfOrder.integrityStatus, "integrity_gap");

  const session = await prisma.session.findUniqueOrThrow({
    where: {
      caConnectionId_caSessionId: {
        caConnectionId: connection.id,
        caSessionId: sessionId,
      },
    },
  });
  assert.equal(session.progressPercent, 72);

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "ca_signal.ingest",
      detailsJson: {
        contains: sessionId,
      },
      reason: "sequence_out_of_order",
      result: "integrity_gap",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  assert.equal(audit.actorKind, "CONNECTOR");
});

test("signal payload requires race.taskId", async () => {
  const connection = await createLocalIntegrityConnection();

  await assert.rejects(
    () =>
      ingestRidingSignalMessage({
        authToken: connection.connectorSecret,
        body: {
          ...buildSignalPayload({
            connection,
            idempotencyKey: `missing-task-${randomUUID()}`,
            messageId: `msg_missing_task_${randomUUID()}`,
            progressPercent: 20,
            sequence: 1,
            sessionId: `session_missing_task_${randomUUID()}`,
          }),
          race: {
            raceId: connection.raceProject.registration.raceId,
          },
        },
      }),
    /taskId/i,
  );
});
