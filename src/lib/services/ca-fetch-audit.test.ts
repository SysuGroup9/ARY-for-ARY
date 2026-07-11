import assert from "node:assert/strict";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import test from "node:test";
import { buildCredentialFingerprint } from "@/lib/ca-signature-helpers";
import { prisma } from "@/lib/prisma";
import { rotateCAConnectionSecretForRider } from "@/lib/services/ca-connections";
import {
  completeCAConnectionHandshake,
  fetchCASessionSnapshotForConnection,
} from "@/lib/services/ca-fetch";

async function createAuditTestConnection(options?: {
  connectorBaseUrl?: string;
  disabledAt?: Date | null;
  disabledReason?: string;
  handshakeCompletedAt?: Date | null;
  ingestionStatus?: "ACTIVE" | "CONNECTED";
  ingestionSource?: "CONNECTOR" | "MANUAL";
}) {
  const raceProject = await prisma.raceProject.findFirstOrThrow({
    include: {
      registration: true,
    },
  });

  return prisma.cAConnection.create({
    data: {
      caProjectId: `audit_project_${randomUUID()}`,
      caType: "CODEX",
      connectorBaseUrl:
        options?.connectorBaseUrl ?? "https://connector.example/active",
      connectorId: `audit_connector_${randomUUID()}`,
      connectorSecret: `audit-secret-${randomUUID()}`,
      connectorVersion: "0.1.0",
      disabledAt: options?.disabledAt ?? null,
      disabledReason: options?.disabledReason ?? "",
      handshakeCompletedAt:
        options?.handshakeCompletedAt ?? new Date("2026-06-19T10:00:00.000Z"),
      ingestionSource: options?.ingestionSource ?? "CONNECTOR",
      ingestionStatus: options?.ingestionStatus ?? "ACTIVE",
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

test("completeCAConnectionHandshake rejects missing credentials for production connectors", async () => {
  const connection = await createAuditTestConnection({
    connectorBaseUrl: "https://connector.example/production",
    handshakeCompletedAt: null,
    ingestionSource: "CONNECTOR",
    ingestionStatus: "CONNECTED",
  });

  const result = await completeCAConnectionHandshake({
    authToken: connection.connectorSecret,
    body: {
      caConnectionId: connection.id,
      caProjectId: connection.caProjectId,
      connectorId: connection.connectorId,
      connectorVersion: "0.2.0",
      timestamp: "2026-06-19T10:58:00.000Z",
    },
  });

  assert.equal(result.accepted, false);
  assert.equal(result.reason, "credential_required");
});

test("completeCAConnectionHandshake keeps localhost demo connectors compatible without credentials", async () => {
  const connection = await createAuditTestConnection({
    connectorBaseUrl: "http://127.0.0.1:4010",
    handshakeCompletedAt: null,
    ingestionSource: "MANUAL",
    ingestionStatus: "CONNECTED",
  });

  const result = await completeCAConnectionHandshake({
    authToken: connection.connectorSecret,
    body: {
      caConnectionId: connection.id,
      caProjectId: connection.caProjectId,
      connectorId: connection.connectorId,
      connectorVersion: "0.2.0",
      timestamp: "2026-06-19T10:59:00.000Z",
    },
  });

  assert.equal(result.accepted, true);
});

test("completeCAConnectionHandshake writes accepted and rejected security audits", async () => {
  const connection = await createAuditTestConnection({
    handshakeCompletedAt: null,
    ingestionStatus: "CONNECTED",
  });
  const { publicKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ format: "pem", type: "spki" }).toString();
  const credentialFingerprint = buildCredentialFingerprint(publicKeyPem);

  const accepted = await completeCAConnectionHandshake({
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
  const rejected = await completeCAConnectionHandshake({
    authToken: "wrong-token",
    body: {
      caConnectionId: connection.id,
      caProjectId: connection.caProjectId,
      connectorId: connection.connectorId,
      connectorVersion: "0.2.0",
      timestamp: "2026-06-19T11:01:00.000Z",
    },
  });

  assert.equal(accepted.accepted, true);
  assert.equal(rejected.accepted, false);

  const updated = await prisma.cAConnection.findUniqueOrThrow({
    where: { id: connection.id },
  });
  assert.equal(updated.credentialFingerprint, credentialFingerprint);
  assert.equal(updated.publicKeyPem, publicKeyPem);
  assert.equal(updated.signatureVersion, "ed25519:v1");

  const acceptedAudit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "ca_connection.handshake",
      result: "accepted",
      targetId: connection.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const rejectedAudit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "ca_connection.handshake",
      reason: "unauthorized",
      result: "rejected",
      targetId: connection.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  assert.equal(acceptedAudit.actorKind, "CONNECTOR");
  assert.equal(rejectedAudit.actorKind, "CONNECTOR");
});

test("completeCAConnectionHandshake rejects mismatched credential fingerprints", async () => {
  const connection = await createAuditTestConnection();
  const { publicKey } = generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ format: "pem", type: "spki" }).toString();

  const result = await completeCAConnectionHandshake({
    authToken: connection.connectorSecret,
    body: {
      caConnectionId: connection.id,
      caProjectId: connection.caProjectId,
      credentialFingerprint: "bad_fingerprint",
      connectorId: connection.connectorId,
      connectorVersion: "0.2.0",
      publicKeyPem,
      signatureVersion: "ed25519:v1",
      timestamp: "2026-06-19T11:02:00.000Z",
    },
  });

  assert.equal(result.accepted, false);
  assert.equal(result.reason, "credential_fingerprint_mismatch");
});

test("fetchCASessionSnapshotForConnection writes accepted and stale security audits", async () => {
  const connection = await createAuditTestConnection({
    connectorBaseUrl: "http://127.0.0.1:4010",
    ingestionSource: "MANUAL",
  });
  const sessionId = `snapshot_audit_${randomUUID()}`;

  await fetchCASessionSnapshotForConnection({
    caConnectionId: connection.id,
    caSessionId: sessionId,
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          schemaVersion: "ary.ca.session_snapshot.v0.1",
          fetchedAt: "2026-06-19T10:18:36.000Z",
          ca: {
            caConnectionId: connection.id,
            caType: "CODEX",
            caProjectId: connection.caProjectId,
            caSessionId: sessionId,
          },
          summary: {
            currentGoal: "accepted snapshot",
            latestActivity: "fresh snapshot",
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
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
  });

  const stale = await fetchCASessionSnapshotForConnection({
    caConnectionId: connection.id,
    caSessionId: sessionId,
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          schemaVersion: "ary.ca.session_snapshot.v0.1",
          fetchedAt: "2026-06-19T10:10:00.000Z",
          ca: {
            caConnectionId: connection.id,
            caType: "CODEX",
            caProjectId: connection.caProjectId,
            caSessionId: sessionId,
          },
          summary: {
            currentGoal: "stale snapshot",
            latestActivity: "older snapshot",
            riskLevel: "low",
            riskReason: "none",
          },
          task: {
            taskId: "DEV-5",
            progressPercent: 59,
            taskStatus: "in_progress",
          },
          session: {
            allRidingMessageLength: 98,
            endedAt: null,
            lastActiveAt: "2026-06-19T10:09:58.000Z",
            messageCount: 13,
            startedAt: "2026-06-19T09:02:11.000Z",
            tokens: 870,
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

  assert.equal(stale.applied, false);
  assert.equal(stale.reason, "stale_snapshot");

  const acceptedAudit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "ca_snapshot.fetch",
      result: "accepted",
      targetId: sessionId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const staleAudit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "ca_snapshot.fetch",
      result: "stale",
      targetId: sessionId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  assert.equal(acceptedAudit.actorKind, "CONNECTOR");
  assert.equal(staleAudit.reason, "stale_snapshot");
});

test("fetchCASessionSnapshotForConnection rejects production connectors without registered credentials", async () => {
  const connection = await createAuditTestConnection({
    connectorBaseUrl: "https://connector.example/production",
    ingestionSource: "CONNECTOR",
  });
  const sessionId = `unsigned_snapshot_${randomUUID()}`;

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
              ca: {
                caConnectionId: connection.id,
                caType: "CODEX",
                caProjectId: connection.caProjectId,
                caSessionId: sessionId,
              },
              summary: {
                currentGoal: "unsigned production snapshot",
                latestActivity: "missing credential",
                riskLevel: "low",
                riskReason: "none",
              },
              task: {
                taskId: "DEV-5",
                progressPercent: 10,
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
    /credential/i,
  );
});

test("completeCAConnectionHandshake rejects the old secret after rotation and accepts the new one", async () => {
  const connection = await createAuditTestConnection({
    connectorBaseUrl: "http://127.0.0.1:4010",
    ingestionSource: "MANUAL",
  });
  const oldSecret = connection.connectorSecret;

  const rotated = await rotateCAConnectionSecretForRider({
    caConnectionId: connection.id,
    userId: connection.raceProject.registration.userId,
  });

  const rejected = await completeCAConnectionHandshake({
    authToken: oldSecret,
    body: {
      caConnectionId: connection.id,
      caProjectId: connection.caProjectId,
      connectorId: connection.connectorId,
      connectorVersion: "0.2.0",
      timestamp: "2026-06-19T11:06:00.000Z",
    },
  });
  const accepted = await completeCAConnectionHandshake({
    authToken: rotated.connectorSecret,
    body: {
      caConnectionId: connection.id,
      caProjectId: connection.caProjectId,
      connectorId: connection.connectorId,
      connectorVersion: "0.2.1",
      timestamp: "2026-06-19T11:07:00.000Z",
    },
  });

  assert.equal(rejected.accepted, false);
  assert.equal(rejected.reason, "unauthorized");
  assert.equal(accepted.accepted, true);
});
