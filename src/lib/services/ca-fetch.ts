import { z } from "zod";
import { getAggregateIngestionStatus } from "@/lib/ca-helpers";
import {
  buildSessionPatchFromSnapshot,
  getNextConnectionStatusFromSignal,
  shouldApplyFetchedSnapshot,
} from "@/lib/ca-runtime-helpers";
import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import {
  buildCredentialFingerprint,
  requiresProductionConnectorSignature,
  verifySignedPayload,
} from "@/lib/ca-signature-helpers";
import { prisma } from "@/lib/prisma";
import { rebuildSessionSummaryEvidenceForRace } from "@/lib/services/evidence";
import { rebuildRaceProcessProjections } from "@/lib/services/projections";
import { recordSecurityAudit } from "@/lib/services/security-audit";

const handshakeSchema = z.object({
  caConnectionId: z.string().min(1),
  caProjectId: z.string().min(1),
  credentialFingerprint: z.string().optional(),
  connectorId: z.string().min(1),
  connectorVersion: z.string().optional(),
  publicKeyPem: z.string().optional(),
  signatureVersion: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

const snapshotSchema = z.object({
  ca: z.object({
    caConnectionId: z.string().min(1),
    caType: z.enum(["CLAUDE_CODE", "CODEX", "OTHER"]),
    caProjectId: z.string().min(1),
    caSessionId: z.string().min(1),
  }),
  fetchedAt: z.string().datetime(),
  signature: z.string().optional(),
  signedAt: z.string().datetime().optional(),
  schemaVersion: z.string().min(1),
  signatureVersion: z.string().optional(),
  summary: z.object({
    currentGoal: z.string(),
    latestActivity: z.string(),
    riskLevel: z.string(),
    riskReason: z.string(),
  }),
  task: z.object({
    taskId: z.string().min(1),
    progressPercent: z.number().min(0).max(100),
    taskStatus: z.string(),
  }),
  session: z.object({
    allRidingMessageLength: z.number().int().nonnegative().default(0),
    endedAt: z.string().datetime().nullable(),
    lastActiveAt: z.string().datetime().nullable(),
    messageCount: z.number().int().nonnegative(),
    startedAt: z.string().datetime(),
    tokens: z.number().int().nonnegative(),
    toolCallCount: z.number().int().nonnegative(),
  }),
});

export async function completeCAConnectionHandshake(input: {
  authToken: string;
  body: unknown;
}) {
  const parsed = handshakeSchema.parse(input.body);
  const connection = await prisma.cAConnection.findUnique({
    where: { id: parsed.caConnectionId },
    include: {
      raceProject: {
        include: {
          registration: true,
        },
      },
    },
  });
  const details = {
    caProjectId: parsed.caProjectId,
    credentialFingerprint: parsed.credentialFingerprint ?? "",
    connectorId: parsed.connectorId,
    connectorVersion: parsed.connectorVersion ?? "",
    signatureVersion: parsed.signatureVersion ?? "",
    timestamp: parsed.timestamp ?? null,
  };

  if (!connection) {
    await recordSecurityAudit(prisma, {
      action: "ca_connection.handshake",
      actorKind: "CONNECTOR",
      details,
      reason: "connection_not_found",
      result: "rejected",
      targetId: parsed.caConnectionId,
      targetType: "CAConnection",
    });
    return { accepted: false as const, reason: "connection_not_found" };
  }

  if (connection.connectorSecret !== input.authToken) {
    await recordSecurityAudit(prisma, {
      action: "ca_connection.handshake",
      actorKind: "CONNECTOR",
      caConnectionId: connection.id,
      details,
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      reason: "unauthorized",
      registrationId: connection.raceProject.registrationId,
      result: "rejected",
      targetId: connection.id,
      targetType: "CAConnection",
      userId: connection.raceProject.registration.userId,
    });
    return { accepted: false as const, reason: "unauthorized" };
  }

  if (
    connection.connectorId !== parsed.connectorId ||
    connection.caProjectId !== parsed.caProjectId ||
    connection.disabledAt
  ) {
    await recordSecurityAudit(prisma, {
      action: "ca_connection.handshake",
      actorKind: "CONNECTOR",
      caConnectionId: connection.id,
      details,
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      reason: "scope_mismatch",
      registrationId: connection.raceProject.registrationId,
      result: "rejected",
      targetId: connection.id,
      targetType: "CAConnection",
      userId: connection.raceProject.registration.userId,
    });
    return { accepted: false as const, reason: "scope_mismatch" };
  }

  const hasIncomingCredential =
    typeof parsed.credentialFingerprint === "string" &&
    parsed.credentialFingerprint.length > 0 &&
    typeof parsed.publicKeyPem === "string" &&
    parsed.publicKeyPem.length > 0 &&
    typeof parsed.signatureVersion === "string" &&
    parsed.signatureVersion.length > 0;
  const hasRegisteredCredential =
    connection.credentialFingerprint.length > 0 &&
    connection.publicKeyPem.length > 0 &&
    connection.signatureVersion.length > 0;
  const credentialRequired = requiresProductionConnectorSignature({
    connectorBaseUrl: connection.connectorBaseUrl,
    ingestionSource: connection.ingestionSource,
  });

  if (credentialRequired && !hasIncomingCredential && !hasRegisteredCredential) {
    await recordSecurityAudit(prisma, {
      action: "ca_connection.handshake",
      actorKind: "CONNECTOR",
      caConnectionId: connection.id,
      details,
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      reason: "credential_required",
      registrationId: connection.raceProject.registrationId,
      result: "rejected",
      targetId: connection.id,
      targetType: "CAConnection",
      userId: connection.raceProject.registration.userId,
    });
    return {
      accepted: false as const,
      reason: "credential_required",
    };
  }

  if (hasIncomingCredential) {
    const derivedFingerprint = buildCredentialFingerprint(parsed.publicKeyPem!);
    if (derivedFingerprint !== parsed.credentialFingerprint) {
      await recordSecurityAudit(prisma, {
        action: "ca_connection.handshake",
        actorKind: "CONNECTOR",
        caConnectionId: connection.id,
        details,
        raceId: connection.raceProject.registration.raceId,
        raceProjectId: connection.raceProjectId,
        reason: "credential_fingerprint_mismatch",
        registrationId: connection.raceProject.registrationId,
        result: "rejected",
        targetId: connection.id,
        targetType: "CAConnection",
        userId: connection.raceProject.registration.userId,
      });
      return {
        accepted: false as const,
        reason: "credential_fingerprint_mismatch",
      };
    }

    if (
      connection.credentialFingerprint &&
      (connection.credentialFingerprint !== parsed.credentialFingerprint ||
        connection.publicKeyPem !== parsed.publicKeyPem ||
        connection.signatureVersion !== parsed.signatureVersion)
    ) {
      await recordSecurityAudit(prisma, {
        action: "ca_connection.handshake",
        actorKind: "CONNECTOR",
        caConnectionId: connection.id,
        details,
        raceId: connection.raceProject.registration.raceId,
        raceProjectId: connection.raceProjectId,
        reason: "credential_mismatch",
        registrationId: connection.raceProject.registrationId,
        result: "rejected",
        targetId: connection.id,
        targetType: "CAConnection",
        userId: connection.raceProject.registration.userId,
      });
      return {
        accepted: false as const,
        reason: "credential_mismatch",
      };
    }
  }

  const timestamp = parsed.timestamp ? new Date(parsed.timestamp) : new Date();
  const nextStatus =
    connection.ingestionStatus === "ACTIVE"
      ? "ACTIVE"
      : getNextConnectionStatusFromSignal({
          currentStatus: connection.ingestionStatus,
          signal: {
            counters: {},
            ingestion: null,
            timestamp,
            type: "session_started",
          },
        }) === "ACTIVE"
      ? "CONNECTED"
      : "CONNECTED";

  const updated = await prisma.$transaction(async (tx) => {
    const updatedConnection = await tx.cAConnection.update({
      where: { id: connection.id },
      data: {
        credentialFingerprint:
          parsed.credentialFingerprint ?? connection.credentialFingerprint,
        connectorVersion: parsed.connectorVersion ?? connection.connectorVersion,
        handshakeCompletedAt: connection.handshakeCompletedAt ?? timestamp,
        ingestionStatus: nextStatus,
        lastSyncedAt: timestamp,
        publicKeyPem: parsed.publicKeyPem ?? connection.publicKeyPem,
        signatureVersion: parsed.signatureVersion ?? connection.signatureVersion,
      },
    });

    await recordSecurityAudit(tx, {
      action: "ca_connection.handshake",
      actorKind: "CONNECTOR",
      caConnectionId: connection.id,
      details,
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      registrationId: connection.raceProject.registrationId,
      result: "accepted",
      targetId: connection.id,
      targetType: "CAConnection",
      userId: connection.raceProject.registration.userId,
    });

    return updatedConnection;
  });

  return {
    accepted: true as const,
    connectionId: updated.id,
    ingestionStatus: updated.ingestionStatus,
  };
}

export async function fetchCASessionSnapshotForConnection(input: {
  caConnectionId: string;
  caSessionId: string;
  fetchImpl?: typeof fetch;
  userId?: string;
}) {
  const fetchImpl = input.fetchImpl ?? fetch;
  const connection = await prisma.cAConnection.findUnique({
    where: { id: input.caConnectionId },
    include: {
      raceProject: {
        include: {
          registration: true,
        },
      },
    },
  });

  if (!connection) {
    await recordSecurityAudit(prisma, {
      action: "ca_snapshot.fetch",
      actorKind: "CONNECTOR",
      details: {
        caSessionId: input.caSessionId,
      },
      reason: "connection_not_found",
      result: "rejected",
      targetId: input.caSessionId,
      targetType: "Session",
    });
    throw new Error("CAConnection not found");
  }

  if (
    input.userId &&
    connection.raceProject.registration.userId !== input.userId
  ) {
    throw new Error("CAConnection not found for current rider");
  }

  if (
    input.userId &&
    connection.raceProject.registration.status !== "APPROVED"
  ) {
    throw new Error("当前报名尚未通过审核");
  }

  if (!connection.handshakeCompletedAt || connection.disabledAt) {
    await recordSecurityAudit(prisma, {
      action: "ca_snapshot.fetch",
      actorKind: "CONNECTOR",
      caConnectionId: connection.id,
      details: {
        caSessionId: input.caSessionId,
      },
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      reason: "connection_not_ready",
      registrationId: connection.raceProject.registrationId,
      result: "rejected",
      targetId: input.caSessionId,
      targetType: "Session",
      userId: connection.raceProject.registration.userId,
    });
    throw new Error("CAConnection is not eligible for snapshot fetch");
  }

  if (!connection.connectorBaseUrl) {
    await recordSecurityAudit(prisma, {
      action: "ca_snapshot.fetch",
      actorKind: "CONNECTOR",
      caConnectionId: connection.id,
      details: {
        caSessionId: input.caSessionId,
      },
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      reason: "missing_connector_base_url",
      registrationId: connection.raceProject.registrationId,
      result: "rejected",
      targetId: input.caSessionId,
      targetType: "Session",
      userId: connection.raceProject.registration.userId,
    });
    throw new Error("CAConnection has no connectorBaseUrl");
  }

  const url = `${connection.connectorBaseUrl.replace(/\/$/, "")}/ary/ca/connections/${connection.id}/sessions/${input.caSessionId}/snapshot`;
  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${connection.connectorSecret}`,
    },
  });

  if (!response.ok) {
    await recordSecurityAudit(prisma, {
      action: "ca_snapshot.fetch",
      actorKind: "CONNECTOR",
      caConnectionId: connection.id,
      details: {
        caSessionId: input.caSessionId,
        status: response.status,
      },
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      reason: "fetch_failed",
      registrationId: connection.raceProject.registrationId,
      result: "rejected",
      targetId: input.caSessionId,
      targetType: "Session",
      userId: connection.raceProject.registration.userId,
    });
    throw new Error(`Snapshot fetch failed with status ${response.status}`);
  }

  const parsed = snapshotSchema.parse(await response.json());
  const receivedAt = new Date();
  const payloadDigest = buildPayloadDigest(parsed);

  if (
    parsed.ca.caConnectionId !== connection.id ||
    parsed.ca.caProjectId !== connection.caProjectId ||
    parsed.ca.caSessionId !== input.caSessionId
  ) {
    await recordSecurityAudit(prisma, {
      action: "ca_snapshot.fetch",
      actorKind: "CONNECTOR",
      caConnectionId: connection.id,
      details: {
        caConnectionId: parsed.ca.caConnectionId,
        caProjectId: parsed.ca.caProjectId,
        caSessionId: parsed.ca.caSessionId,
        fetchedAt: parsed.fetchedAt,
      },
      payloadDigest,
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      reason: "scope_mismatch",
      registrationId: connection.raceProject.registrationId,
      result: "rejected",
      targetId: input.caSessionId,
      targetType: "Session",
      userId: connection.raceProject.registration.userId,
    });
    throw new Error("Snapshot payload scope mismatch");
  }

  const fetchedAt = new Date(parsed.fetchedAt);
  const hasRegisteredCredential =
    connection.credentialFingerprint.length > 0 &&
    connection.publicKeyPem.length > 0 &&
    connection.signatureVersion.length > 0;
  const credentialRequired = requiresProductionConnectorSignature({
    connectorBaseUrl: connection.connectorBaseUrl,
    ingestionSource: connection.ingestionSource,
  });

  if (credentialRequired && !hasRegisteredCredential) {
    await recordSecurityAudit(prisma, {
      action: "ca_snapshot.fetch",
      actorKind: "CONNECTOR",
      caConnectionId: connection.id,
      details: {
        caSessionId: input.caSessionId,
        fetchedAt: parsed.fetchedAt,
      },
      payloadDigest,
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      reason: "credential_required",
      registrationId: connection.raceProject.registrationId,
      result: "rejected",
      targetId: input.caSessionId,
      targetType: "Session",
      userId: connection.raceProject.registration.userId,
    });
    throw new Error("Snapshot credential required");
  }

  const signatureRequired = hasRegisteredCredential;
  if (signatureRequired && !parsed.signature) {
    await recordSecurityAudit(prisma, {
      action: "ca_snapshot.fetch",
      actorKind: "CONNECTOR",
      caConnectionId: connection.id,
      details: {
        caSessionId: input.caSessionId,
        fetchedAt: parsed.fetchedAt,
      },
      payloadDigest,
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      reason: "signature_missing",
      registrationId: connection.raceProject.registrationId,
      result: "rejected",
      targetId: input.caSessionId,
      targetType: "Session",
      userId: connection.raceProject.registration.userId,
    });
    throw new Error("Snapshot signature missing");
  }
  if (
    signatureRequired &&
    parsed.signatureVersion !== connection.signatureVersion
  ) {
    await recordSecurityAudit(prisma, {
      action: "ca_snapshot.fetch",
      actorKind: "CONNECTOR",
      caConnectionId: connection.id,
      details: {
        caSessionId: input.caSessionId,
        fetchedAt: parsed.fetchedAt,
        signatureVersion: parsed.signatureVersion ?? "",
      },
      payloadDigest,
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      reason: "signature_version_mismatch",
      registrationId: connection.raceProject.registrationId,
      result: "rejected",
      targetId: input.caSessionId,
      targetType: "Session",
      userId: connection.raceProject.registration.userId,
    });
    throw new Error("Snapshot signature version mismatch");
  }
  if (
    signatureRequired &&
    !verifySignedPayload({
      payload: parsed,
      publicKeyPem: connection.publicKeyPem,
    })
  ) {
    await recordSecurityAudit(prisma, {
      action: "ca_snapshot.fetch",
      actorKind: "CONNECTOR",
      caConnectionId: connection.id,
      details: {
        caSessionId: input.caSessionId,
        fetchedAt: parsed.fetchedAt,
        signatureVersion: parsed.signatureVersion ?? "",
      },
      payloadDigest,
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      reason: "signature_invalid",
      registrationId: connection.raceProject.registrationId,
      result: "rejected",
      targetId: input.caSessionId,
      targetType: "Session",
      userId: connection.raceProject.registration.userId,
    });
    throw new Error("Snapshot signature invalid");
  }

  const existing = await prisma.session.findUnique({
    where: {
      caConnectionId_caSessionId: {
        caConnectionId: connection.id,
        caSessionId: input.caSessionId,
      },
    },
  });

  if (
    !shouldApplyFetchedSnapshot({
      fetchedAt,
      snapshotFetchedAt: existing?.snapshotFetchedAt ?? null,
    })
  ) {
    await recordSecurityAudit(prisma, {
      action: "ca_snapshot.fetch",
      actorKind: "CONNECTOR",
      caConnectionId: connection.id,
      details: {
        caSessionId: input.caSessionId,
        fetchedAt: parsed.fetchedAt,
      },
      payloadDigest,
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      reason: "stale_snapshot",
      registrationId: connection.raceProject.registrationId,
      result: "stale",
      targetId: input.caSessionId,
      targetType: "Session",
      userId: connection.raceProject.registration.userId,
    });
    return { applied: false as const, reason: "stale_snapshot" };
  }

  const patch = buildSessionPatchFromSnapshot({
    snapshot: {
      fetchedAt,
      summary: parsed.summary,
      task: parsed.task,
      session: {
        allRidingMessageLength: parsed.session.allRidingMessageLength,
        endedAt: parsed.session.endedAt ? new Date(parsed.session.endedAt) : null,
        lastActiveAt: parsed.session.lastActiveAt
          ? new Date(parsed.session.lastActiveAt)
          : null,
        messageCount: parsed.session.messageCount,
        startedAt: new Date(parsed.session.startedAt),
        tokens: parsed.session.tokens,
        toolCallCount: parsed.session.toolCallCount,
      },
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.session.upsert({
      where: {
        caConnectionId_caSessionId: {
          caConnectionId: connection.id,
          caSessionId: input.caSessionId,
        },
      },
      update: patch,
      create: {
        ...patch,
        caConnectionId: connection.id,
        caSessionId: input.caSessionId,
      },
    });

    await tx.cAConnection.update({
      where: { id: connection.id },
      data: {
        ingestionStatus: patch.endedAt ? "ACTIVE" : "ACTIVE",
        lastSyncedAt: fetchedAt,
      },
    });

    const allConnections = await tx.cAConnection.findMany({
      where: {
        raceProjectId: connection.raceProjectId,
      },
      select: {
        ingestionStatus: true,
      },
    });

    await tx.raceProject.update({
      where: { id: connection.raceProjectId },
      data: {
        aggregateIngestionStatus: getAggregateIngestionStatus(
          allConnections.map((item) => item.ingestionStatus),
        ),
      },
    });

    await tx.cAIngestionEvent.create({
      data: {
        caConnectionId: connection.id,
        caSessionId: input.caSessionId,
        idempotencyKey: `fetch:${connection.id}:${input.caSessionId}:${parsed.fetchedAt}`,
        integrityStatus: "OK",
        messageId: `fetch:${connection.id}:${input.caSessionId}:${parsed.fetchedAt}`,
        observedAt: fetchedAt,
        payloadDigest,
        payloadJson: JSON.stringify(parsed),
        receivedAt,
        sequence: null,
        signalKind: "snapshot",
        signalType: "snapshot_fetch",
      },
    });

    await recordSecurityAudit(tx, {
      action: "ca_snapshot.fetch",
      actorKind: "CONNECTOR",
      caConnectionId: connection.id,
      details: {
        caSessionId: input.caSessionId,
        fetchedAt: parsed.fetchedAt,
      },
      payloadDigest,
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      registrationId: connection.raceProject.registrationId,
      result: "accepted",
      targetId: input.caSessionId,
      targetType: "Session",
      userId: connection.raceProject.registration.userId,
    });
  });

  await rebuildSessionSummaryEvidenceForRace(connection.raceProject.registration.raceId);
  await rebuildRaceProcessProjections(connection.raceProject.registration.raceId);

  return {
    applied: true as const,
    caConnectionId: connection.id,
    fetchedAt: parsed.fetchedAt,
    sessionId: input.caSessionId,
  };
}
