import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPairSync, randomUUID, sign } from "node:crypto";
import {
  buildCredentialFingerprint,
  buildSignedPayloadDigest,
} from "@/lib/ca-signature-helpers";
import { prisma } from "@/lib/prisma";
import {
  completeCAConnectionHandshake,
  fetchCASessionSnapshotForConnection,
} from "@/lib/services/ca-fetch";
import { ingestRidingSignalMessage } from "@/lib/services/ca-ingestion";

async function createPolicyTestConnection(options: {
  connectorBaseUrl: string;
  ingestionSource: "CONNECTOR" | "MANUAL";
}) {
  const raceProject = await prisma.raceProject.findFirstOrThrow({
    include: {
      registration: true,
    },
  });

  return prisma.cAConnection.create({
    data: {
      caProjectId: `policy_project_${randomUUID()}`,
      caType: "CODEX",
      connectorBaseUrl: options.connectorBaseUrl,
      connectorId: `policy_connector_${randomUUID()}`,
      connectorSecret: `policy-secret-${randomUUID()}`,
      connectorVersion: "0.1.0",
      handshakeCompletedAt: new Date("2026-06-19T10:00:00.000Z"),
      ingestionSource: options.ingestionSource,
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

async function prepareSignedConnection(connectorId: string) {
  const original = await prisma.cAConnection.findFirstOrThrow({
    where: { connectorId },
    include: {
      raceProject: {
        include: {
          registration: true,
        },
      },
    },
  });
  const connection = await prisma.cAConnection.update({
    where: { id: original.id },
    data: {
      credentialFingerprint: "",
      publicKeyPem: "",
      signatureVersion: "",
    },
  });

  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ format: "pem", type: "spki" }).toString();
  const credentialFingerprint = buildCredentialFingerprint(publicKeyPem);
  const handshake = await completeCAConnectionHandshake({
    authToken: connection.connectorSecret,
    body: {
      caConnectionId: connection.id,
      caProjectId: connection.caProjectId,
      credentialFingerprint,
      connectorId: connection.connectorId,
      connectorVersion: "0.2.0",
      publicKeyPem,
      signatureVersion: "ed25519:v1",
      timestamp: "2026-06-19T11:00:00.000Z",
    },
  });

  assert.equal(handshake.accepted, true);

  return {
    connection: {
      ...connection,
      raceProject: original.raceProject,
    },
    privateKey,
    publicKeyPem,
  };
}

function signPayload<T extends Record<string, unknown>>(payload: T, privateKey: CryptoKey | import("node:crypto").KeyObject) {
  const digest = buildSignedPayloadDigest(payload);
  return sign(null, Buffer.from(digest, "utf8"), privateKey).toString("base64");
}

test("signed signal is accepted when a credential is registered", async () => {
  const { connection, privateKey } = await prepareSignedConnection(
    "codex_connector_active_3",
  );
  const payload = {
    schemaVersion: "ary.ca.riding_signal.v0.1",
    messageId: `msg_signed_${randomUUID()}`,
    idempotencyKey: `signed-signal-${randomUUID()}`,
    sequence: 9,
    timestamp: "2026-06-19T10:00:00.000Z",
    signedAt: "2026-06-19T10:00:00.000Z",
    signatureVersion: "ed25519:v1",
    ca: {
      caConnectionId: connection.id,
      caProjectId: connection.caProjectId,
      caSessionId: `signed_session_${randomUUID()}`,
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
      progressPercent: 55,
    },
    counters: {
      messageCount: 11,
      toolCallCount: 3,
      tokens: 400,
    },
  };

  const result = await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: {
      ...payload,
      signature: signPayload(payload, privateKey),
    },
  });

  assert.equal(result.accepted, true);
});

test("signed milestone signal preserves noteReason and technicalActions", async () => {
  const { connection, privateKey } = await prepareSignedConnection(
    "codex_connector_active_3",
  );
  const idempotencyKey = `milestone-signal-${randomUUID()}`;
  const payload = {
    schemaVersion: "ary.ca.riding_signal.v0.1",
    messageId: `msg_milestone_${randomUUID()}`,
    idempotencyKey,
    sequence: 14,
    timestamp: new Date().toISOString(),
    signedAt: new Date().toISOString(),
    signatureVersion: "ed25519:v1",
    ca: {
      caConnectionId: connection.id,
      caProjectId: connection.caProjectId,
      caSessionId: `milestone_session_${randomUUID()}`,
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
      kind: "note",
      type: "milestone_reached",
      noteReason: "checkpoint_unblocked",
      progressPercent: 61,
    },
    counters: {
      messageCount: 15,
      toolCallCount: 5,
      tokens: 520,
    },
    technicalActions: [
      {
        type: "test_run",
        count: 2,
        latestStatus: "passed",
      },
      {
        type: "file_changed",
        count: 4,
      },
    ],
  };

  const result = await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: {
      ...payload,
      signature: signPayload(payload, privateKey),
    },
  });

  assert.equal(result.accepted, true);
  assert.equal(result.connectionStatus, "ACTIVE");

  const event = await prisma.cAIngestionEvent.findFirstOrThrow({
    where: {
      idempotencyKey,
    },
  });
  assert.match(event.payloadJson, /milestone_reached/);
  assert.match(event.payloadJson, /checkpoint_unblocked/);
  assert.match(event.payloadJson, /technicalActions/);
});

test("missing signal signature is rejected when a credential is registered", async () => {
  const { connection } = await prepareSignedConnection("codex_connector_active_4");
  const result = await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: {
      schemaVersion: "ary.ca.riding_signal.v0.1",
      messageId: `msg_unsigned_${randomUUID()}`,
      idempotencyKey: `unsigned-signal-${randomUUID()}`,
      sequence: 10,
      timestamp: "2026-06-19T10:00:00.000Z",
      signedAt: "2026-06-19T10:00:00.000Z",
      signatureVersion: "ed25519:v1",
      ca: {
        caConnectionId: connection.id,
        caProjectId: connection.caProjectId,
        caSessionId: `unsigned_session_${randomUUID()}`,
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
        progressPercent: 10,
      },
      counters: {
        messageCount: 1,
      },
    },
  });

  assert.equal(result.accepted, false);
  assert.equal(result.reason, "signature_missing");
});

test("invalid signal signature is rejected when a credential is registered", async () => {
  const { connection } = await prepareSignedConnection("codex_connector_active_7");
  const result = await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: {
      schemaVersion: "ary.ca.riding_signal.v0.1",
      messageId: `msg_invalid_${randomUUID()}`,
      idempotencyKey: `invalid-signal-${randomUUID()}`,
      sequence: 11,
      timestamp: "2026-06-19T10:00:00.000Z",
      signedAt: "2026-06-19T10:00:00.000Z",
      signatureVersion: "ed25519:v1",
      signature: "bad_signature",
      ca: {
        caConnectionId: connection.id,
        caProjectId: connection.caProjectId,
        caSessionId: `invalid_session_${randomUUID()}`,
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
        progressPercent: 12,
      },
      counters: {
        messageCount: 2,
      },
    },
  });

  assert.equal(result.accepted, false);
  assert.equal(result.reason, "signature_invalid");
});

test("production signal is rejected when no credential has been registered", async () => {
  const connection = await createPolicyTestConnection({
    connectorBaseUrl: "https://connector.example/production",
    ingestionSource: "CONNECTOR",
  });

  const result = await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: {
      schemaVersion: "ary.ca.riding_signal.v0.1",
      messageId: `msg_policy_${randomUUID()}`,
      idempotencyKey: `policy-signal-${randomUUID()}`,
      sequence: 12,
      timestamp: "2026-06-19T10:00:00.000Z",
      ca: {
        caConnectionId: connection.id,
        caProjectId: connection.caProjectId,
        caSessionId: `policy_session_${randomUUID()}`,
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
        progressPercent: 15,
      },
      counters: {
        messageCount: 1,
      },
    },
  });

  assert.equal(result.accepted, false);
  assert.equal(result.reason, "credential_required");
});

test("localhost demo signal remains compatible without credential registration", async () => {
  const connection = await createPolicyTestConnection({
    connectorBaseUrl: "http://localhost:4010",
    ingestionSource: "MANUAL",
  });

  const result = await ingestRidingSignalMessage({
    authToken: connection.connectorSecret,
    body: {
      schemaVersion: "ary.ca.riding_signal.v0.1",
      messageId: `msg_local_${randomUUID()}`,
      idempotencyKey: `local-signal-${randomUUID()}`,
      sequence: 13,
      timestamp: "2026-06-19T10:00:00.000Z",
      ca: {
        caConnectionId: connection.id,
        caProjectId: connection.caProjectId,
        caSessionId: `local_session_${randomUUID()}`,
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
        progressPercent: 16,
      },
      counters: {
        messageCount: 1,
      },
    },
  });

  assert.equal(result.accepted, true);
});

test("signed snapshot is accepted when a credential is registered", async () => {
  const { connection, privateKey } = await prepareSignedConnection(
    "codex_connector_active_5",
  );
  const sessionId = `signed_snapshot_${randomUUID()}`;
  const payload = {
    schemaVersion: "ary.ca.session_snapshot.v0.1",
    fetchedAt: "2026-06-19T10:18:36.000Z",
    signedAt: "2026-06-19T10:18:36.000Z",
    signatureVersion: "ed25519:v1",
    ca: {
      caConnectionId: connection.id,
      caType: connection.caType,
      caProjectId: connection.caProjectId,
      caSessionId: sessionId,
    },
    summary: {
      currentGoal: "signed snapshot",
      latestActivity: "signed snapshot fetched",
      riskLevel: "low",
      riskReason: "none",
    },
    task: {
      taskId: "DEV-5",
      progressPercent: 60,
      taskStatus: "in_progress",
    },
    session: {
      allRidingMessageLength: 99,
      endedAt: null,
      lastActiveAt: "2026-06-19T10:17:58.000Z",
      messageCount: 14,
      startedAt: "2026-06-19T09:02:11.000Z",
      tokens: 880,
      toolCallCount: 5,
    },
  };

  const result = await fetchCASessionSnapshotForConnection({
    caConnectionId: connection.id,
    caSessionId: sessionId,
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          ...payload,
          signature: signPayload(payload, privateKey),
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
  });

  assert.equal(result.applied, true);
});

test("invalid snapshot signature is rejected when a credential is registered", async () => {
  const { connection } = await prepareSignedConnection("codex_connector_active_6");
  const sessionId = `invalid_snapshot_${randomUUID()}`;

  await assert.rejects(
    () =>
      fetchCASessionSnapshotForConnection({
        caConnectionId: connection.id,
        caSessionId: sessionId,
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              schemaVersion: "ary.ca.session_snapshot.v0.1",
              fetchedAt: "2026-06-19T10:18:36.000Z",
              signedAt: "2026-06-19T10:18:36.000Z",
              signatureVersion: "ed25519:v1",
              signature: "bad_signature",
              ca: {
                caConnectionId: connection.id,
                caType: connection.caType,
                caProjectId: connection.caProjectId,
                caSessionId: sessionId,
              },
              summary: {
                currentGoal: "invalid snapshot",
                latestActivity: "invalid signature",
                riskLevel: "low",
                riskReason: "none",
              },
              task: {
                taskId: "DEV-5",
                progressPercent: 30,
                taskStatus: "in_progress",
              },
              session: {
                allRidingMessageLength: 12,
                endedAt: null,
                lastActiveAt: "2026-06-19T10:17:58.000Z",
                messageCount: 2,
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
    /signature/i,
  );
});
