import { z } from "zod";
import { IngestionStatus } from "@/generated/prisma/enums";
import {
  buildSessionPatchFromSignal,
  getNextConnectionStatusFromSignal,
  isFailureSignalPayload,
  type RidingSignalInput,
} from "@/lib/ca-runtime-helpers";
import {
  buildPayloadDigest,
  classifyDuplicatePayload,
  evaluateObservedAtWindow,
  evaluateSequenceProgression,
} from "@/lib/ca-integrity-helpers";
import {
  requiresProductionConnectorSignature,
  verifySignedPayload,
} from "@/lib/ca-signature-helpers";
import { getAggregateIngestionStatus } from "@/lib/ca-helpers";
import { prisma } from "@/lib/prisma";
import { rebuildSessionSummaryEvidenceForRace } from "@/lib/services/evidence";
import { rebuildRaceProcessProjections } from "@/lib/services/projections";
import { recordSecurityAudit } from "@/lib/services/security-audit";

const ridingSignalSchema = z.object({
  schemaVersion: z.string().min(1),
  ca: z.object({
    caConnectionId: z.string().min(1),
    caProjectId: z.string().min(1),
    caSessionId: z.string().min(1),
    caType: z.enum(["CLAUDE_CODE", "CODEX", "OTHER"]),
    connectorId: z.string().min(1),
    connectorVersion: z.string().optional(),
  }),
  counters: z
    .object({
      allRidingMessageLength: z.number().int().nonnegative().optional(),
      messageCount: z.number().int().nonnegative().optional(),
      sessionCount: z.number().int().nonnegative().optional(),
      tokens: z.number().int().nonnegative().optional(),
      toolCallCount: z.number().int().nonnegative().optional(),
    })
    .default({}),
  idempotencyKey: z.string().min(1),
  sequence: z.number().int().nonnegative().optional(),
  ingestion: z
    .object({
      scope: z.string().optional(),
      status: z.nativeEnum(IngestionStatus),
      statusReason: z.string().default(""),
    })
    .nullable()
    .optional(),
  summary: z
    .object({
      currentGoal: z.string().optional(),
      latestActivity: z.string().optional(),
      riskLevel: z.string().optional(),
      riskReason: z.string().optional(),
    })
    .optional(),
  messageId: z.string().min(1),
  race: z.object({
    raceId: z.string().min(1),
    taskId: z.string().min(1),
  }),
  signedAt: z.string().datetime().optional(),
  signature: z.string().optional(),
  signatureVersion: z.string().optional(),
  rider: z.object({
    raceProjectId: z.string().min(1),
    registrationId: z.string().min(1),
  }),
  signal: z.object({
    kind: z.enum(["event", "note"]),
    noteReason: z.string().optional(),
    phase: z.string().optional(),
    progressPercent: z.number().min(0).max(100).optional(),
    taskStatus: z.string().optional(),
    type: z.enum([
      "artifact_linked",
      "cost_updated",
      "milestone_reached",
      "riding_finished",
      "riding_paused",
      "riding_resumed",
      "riding_started",
      "risk_detected",
      "session_completed",
      "session_started",
      "task_blocked",
      "task_completed",
      "task_progress",
      "task_started",
      "validation_run",
    ]),
  }),
  technicalActions: z
    .array(
      z.object({
        count: z.number().int().nonnegative(),
        latestStatus: z.string().optional(),
        type: z.string().min(1),
      }),
    )
    .optional(),
  timestamp: z.string().datetime(),
});

export async function ingestRidingSignalMessage(input: {
  authToken: string;
  body: unknown;
}) {
  const parsed = ridingSignalSchema.parse(input.body);
  const observedAt = new Date(parsed.timestamp);
  const receivedAt = new Date();
  const payloadDigest = buildPayloadDigest(parsed);
  const windowResult = evaluateObservedAtWindow({
    maxSkewMs: 5 * 60 * 1000,
    observedAt,
    receivedAt,
  });
  const auditDetails = {
    caConnectionId: parsed.ca.caConnectionId,
    caSessionId: parsed.ca.caSessionId,
    idempotencyKey: parsed.idempotencyKey,
    messageId: parsed.messageId,
    sequence: parsed.sequence ?? null,
    signalType: parsed.signal.type,
  };

  const event = await prisma.cAConnection.findUnique({
    where: {
      id: parsed.ca.caConnectionId,
    },
    include: {
      raceProject: {
        include: {
          registration: true,
        },
      },
    },
  });

  if (!event) {
    await recordSecurityAudit(prisma, {
      action: "ca_signal.ingest",
      actorKind: "CONNECTOR",
      details: auditDetails,
      payloadDigest,
      reason: "connection_not_found",
      result: "rejected",
      targetId: parsed.ca.caSessionId,
      targetType: "Session",
    });
    return { accepted: false as const, reason: "connection_not_found" };
  }

  if (event.connectorSecret !== input.authToken) {
    await recordSecurityAudit(prisma, {
      action: "ca_signal.ingest",
      actorKind: "CONNECTOR",
      caConnectionId: event.id,
      details: auditDetails,
      payloadDigest,
      raceId: event.raceProject.registration.raceId,
      raceProjectId: event.raceProjectId,
      reason: "unauthorized",
      registrationId: event.raceProject.registrationId,
      result: "rejected",
      targetId: parsed.ca.caSessionId,
      targetType: "Session",
      userId: event.raceProject.registration.userId,
    });
    return { accepted: false as const, reason: "unauthorized" };
  }

  if (event.disabledAt || !event.handshakeCompletedAt) {
    await recordSecurityAudit(prisma, {
      action: "ca_signal.ingest",
      actorKind: "CONNECTOR",
      caConnectionId: event.id,
      details: auditDetails,
      payloadDigest,
      raceId: event.raceProject.registration.raceId,
      raceProjectId: event.raceProjectId,
      reason: "connection_not_ready",
      registrationId: event.raceProject.registrationId,
      result: "rejected",
      targetId: parsed.ca.caSessionId,
      targetType: "Session",
      userId: event.raceProject.registration.userId,
    });
    return { accepted: false as const, reason: "connection_not_ready" };
  }

  if (
    event.raceProject.id !== parsed.rider.raceProjectId ||
    event.raceProject.registrationId !== parsed.rider.registrationId ||
    event.raceProject.registration.raceId !== parsed.race.raceId ||
    event.caProjectId !== parsed.ca.caProjectId ||
    event.connectorId !== parsed.ca.connectorId
  ) {
    await recordSecurityAudit(prisma, {
      action: "ca_signal.ingest",
      actorKind: "CONNECTOR",
      caConnectionId: event.id,
      details: auditDetails,
      payloadDigest,
      raceId: event.raceProject.registration.raceId,
      raceProjectId: event.raceProjectId,
      reason: "scope_mismatch",
      registrationId: event.raceProject.registrationId,
      result: "rejected",
      targetId: parsed.ca.caSessionId,
      targetType: "Session",
      userId: event.raceProject.registration.userId,
    });
    return { accepted: false as const, reason: "scope_mismatch" };
  }

  const hasRegisteredCredential =
    event.credentialFingerprint.length > 0 &&
    event.publicKeyPem.length > 0 &&
    event.signatureVersion.length > 0;
  const credentialRequired = requiresProductionConnectorSignature({
    connectorBaseUrl: event.connectorBaseUrl,
    ingestionSource: event.ingestionSource,
  });

  if (credentialRequired && !hasRegisteredCredential) {
    await recordSecurityAudit(prisma, {
      action: "ca_signal.ingest",
      actorKind: "CONNECTOR",
      caConnectionId: event.id,
      details: auditDetails,
      payloadDigest,
      raceId: event.raceProject.registration.raceId,
      raceProjectId: event.raceProjectId,
      reason: "credential_required",
      registrationId: event.raceProject.registrationId,
      result: "rejected",
      targetId: parsed.ca.caSessionId,
      targetType: "Session",
      userId: event.raceProject.registration.userId,
    });
    return { accepted: false as const, reason: "credential_required" };
  }

  const signatureRequired = hasRegisteredCredential;
  if (signatureRequired && !parsed.signature) {
    await recordSecurityAudit(prisma, {
      action: "ca_signal.ingest",
      actorKind: "CONNECTOR",
      caConnectionId: event.id,
      details: auditDetails,
      payloadDigest,
      raceId: event.raceProject.registration.raceId,
      raceProjectId: event.raceProjectId,
      reason: "signature_missing",
      registrationId: event.raceProject.registrationId,
      result: "rejected",
      targetId: parsed.ca.caSessionId,
      targetType: "Session",
      userId: event.raceProject.registration.userId,
    });
    return { accepted: false as const, reason: "signature_missing" };
  }

  if (
    signatureRequired &&
    parsed.signatureVersion !== event.signatureVersion
  ) {
    await recordSecurityAudit(prisma, {
      action: "ca_signal.ingest",
      actorKind: "CONNECTOR",
      caConnectionId: event.id,
      details: auditDetails,
      payloadDigest,
      raceId: event.raceProject.registration.raceId,
      raceProjectId: event.raceProjectId,
      reason: "signature_version_mismatch",
      registrationId: event.raceProject.registrationId,
      result: "rejected",
      targetId: parsed.ca.caSessionId,
      targetType: "Session",
      userId: event.raceProject.registration.userId,
    });
    return {
      accepted: false as const,
      reason: "signature_version_mismatch",
    };
  }

  if (
    signatureRequired &&
    !verifySignedPayload({
      payload: parsed,
      publicKeyPem: event.publicKeyPem,
    })
  ) {
    await recordSecurityAudit(prisma, {
      action: "ca_signal.ingest",
      actorKind: "CONNECTOR",
      caConnectionId: event.id,
      details: auditDetails,
      payloadDigest,
      raceId: event.raceProject.registration.raceId,
      raceProjectId: event.raceProjectId,
      reason: "signature_invalid",
      registrationId: event.raceProject.registrationId,
      result: "rejected",
      targetId: parsed.ca.caSessionId,
      targetType: "Session",
      userId: event.raceProject.registration.userId,
    });
    return { accepted: false as const, reason: "signature_invalid" };
  }

  const existingEvent = await prisma.cAIngestionEvent.findUnique({
    where: {
      idempotencyKey: parsed.idempotencyKey,
    },
  });

  if (existingEvent) {
    const existingDigest =
      existingEvent.payloadDigest ||
      buildPayloadDigest(JSON.parse(existingEvent.payloadJson));
    const duplicateResult = classifyDuplicatePayload({
      existingDigest,
      incomingDigest: payloadDigest,
    });

    if (duplicateResult.deduped) {
      await recordSecurityAudit(prisma, {
        action: "ca_signal.ingest",
        actorKind: "CONNECTOR",
        caConnectionId: event.id,
        details: auditDetails,
        payloadDigest,
        raceId: event.raceProject.registration.raceId,
        raceProjectId: event.raceProjectId,
        reason: "same_payload_duplicate",
        registrationId: event.raceProject.registrationId,
        result: "deduped",
        targetId: parsed.ca.caSessionId,
        targetType: "Session",
        userId: event.raceProject.registration.userId,
      });
      return { accepted: true as const, deduped: true as const };
    }

    await prisma.$transaction(async (tx) => {
      await tx.cAIngestionEvent.create({
        data: {
          caConnectionId: event.id,
          caSessionId: parsed.ca.caSessionId,
          idempotencyKey: `${parsed.idempotencyKey}:integrity_gap:${receivedAt.toISOString()}`,
          integrityStatus: "INTEGRITY_GAP",
          messageId: parsed.messageId,
          observedAt,
          payloadDigest,
          payloadJson: JSON.stringify(parsed),
          receivedAt,
          sequence: null,
          signalKind: parsed.signal.kind,
          signalType: parsed.signal.type,
        },
      });

      await recordSecurityAudit(tx, {
        action: "ca_signal.ingest",
        actorKind: "CONNECTOR",
        caConnectionId: event.id,
        details: auditDetails,
        payloadDigest,
        raceId: event.raceProject.registration.raceId,
        raceProjectId: event.raceProjectId,
        reason: "payload_digest_conflict",
        registrationId: event.raceProject.registrationId,
        result: "integrity_gap",
        targetId: parsed.ca.caSessionId,
        targetType: "Session",
        userId: event.raceProject.registration.userId,
      });
    });

    return {
      accepted: true as const,
      deduped: false as const,
      integrityStatus: "integrity_gap" as const,
    };
  }

  if (parsed.sequence !== undefined) {
    const latestSequenceEvent = await prisma.cAIngestionEvent.findFirst({
      where: {
        caConnectionId: event.id,
        caSessionId: parsed.ca.caSessionId,
        sequence: {
          not: null,
        },
      },
      orderBy: {
        sequence: "desc",
      },
      select: {
        sequence: true,
      },
    });

    const sequenceResult = evaluateSequenceProgression({
      incomingSequence: parsed.sequence,
      latestAcceptedSequence: latestSequenceEvent?.sequence ?? null,
    });

    if (!sequenceResult.shouldAdvance) {
      await prisma.$transaction(async (tx) => {
        await tx.cAIngestionEvent.create({
          data: {
            caConnectionId: event.id,
            caSessionId: parsed.ca.caSessionId,
            idempotencyKey: `${parsed.idempotencyKey}:integrity_gap:${receivedAt.toISOString()}`,
            integrityStatus: "INTEGRITY_GAP",
            messageId: parsed.messageId,
            observedAt,
            payloadDigest,
            payloadJson: JSON.stringify(parsed),
            receivedAt,
            sequence: null,
            signalKind: parsed.signal.kind,
            signalType: parsed.signal.type,
          },
        });

        await recordSecurityAudit(tx, {
          action: "ca_signal.ingest",
          actorKind: "CONNECTOR",
          caConnectionId: event.id,
          details: {
            ...auditDetails,
            latestAcceptedSequence: latestSequenceEvent?.sequence ?? null,
          },
          payloadDigest,
          raceId: event.raceProject.registration.raceId,
          raceProjectId: event.raceProjectId,
          reason: sequenceResult.reason,
          registrationId: event.raceProject.registrationId,
          result: "integrity_gap",
          targetId: parsed.ca.caSessionId,
          targetType: "Session",
          userId: event.raceProject.registration.userId,
        });
      });

      return {
        accepted: true as const,
        deduped: false as const,
        integrityStatus: "integrity_gap" as const,
      };
    }
  }

  const signalForHelpers: RidingSignalInput = {
    counters: parsed.counters,
    currentGoal: parsed.summary?.currentGoal ?? null,
    ingestion: parsed.ingestion
      ? {
          status: parsed.ingestion.status,
          statusReason: parsed.ingestion.statusReason,
        }
      : null,
    latestActivity: parsed.summary?.latestActivity ?? null,
    progressPercent: parsed.signal.progressPercent ?? null,
    riskLevel: parsed.summary?.riskLevel ?? null,
    riskReason: parsed.summary?.riskReason ?? null,
    taskStatus: parsed.signal.taskStatus ?? null,
    timestamp: observedAt,
    type: parsed.signal.type,
  };

  const updated = await prisma.$transaction(async (tx) => {
    await tx.cAIngestionEvent.create({
      data: {
        caConnectionId: event.id,
        caSessionId: parsed.ca.caSessionId,
        idempotencyKey: parsed.idempotencyKey,
        integrityStatus:
          windowResult.integrityStatus === "review_needed"
            ? "REVIEW_NEEDED"
            : "OK",
        messageId: parsed.messageId,
        observedAt,
        payloadDigest,
        payloadJson: JSON.stringify(parsed),
        receivedAt,
        sequence: parsed.sequence ?? null,
        signalKind: parsed.signal.kind,
        signalType: parsed.signal.type,
      },
    });

    const existingSession = await tx.session.findUnique({
      where: {
        caConnectionId_caSessionId: {
          caConnectionId: event.id,
          caSessionId: parsed.ca.caSessionId,
        },
      },
    });

    const sessionPatch = buildSessionPatchFromSignal({
      existingSession: existingSession
        ? {
            caSessionId: existingSession.caSessionId,
            currentGoal: existingSession.currentGoal,
            endedAt: existingSession.endedAt,
            lastActiveAt: existingSession.lastActiveAt,
            latestActivity: existingSession.latestActivity,
            messageCount: existingSession.messageCount,
            progressPercent: existingSession.progressPercent,
            riskLevel: existingSession.riskLevel,
            riskReason: existingSession.riskReason,
            startedAt: existingSession.startedAt,
            taskStatus: existingSession.taskStatus,
            tokenCost: existingSession.tokenCost,
            toolCallCount: existingSession.toolCallCount,
          }
        : null,
      signal: signalForHelpers,
    });

    await tx.session.upsert({
      where: {
        caConnectionId_caSessionId: {
          caConnectionId: event.id,
          caSessionId: parsed.ca.caSessionId,
        },
      },
      update: {
        endedAt: sessionPatch.endedAt,
        currentGoal: sessionPatch.currentGoal,
        lastActiveAt: sessionPatch.lastActiveAt,
        latestActivity: sessionPatch.latestActivity,
        messageCount: sessionPatch.messageCount,
        progressPercent: sessionPatch.progressPercent,
        riskLevel: sessionPatch.riskLevel,
        riskReason: sessionPatch.riskReason,
        tokenCost: sessionPatch.tokenCost,
        taskStatus: sessionPatch.taskStatus,
        toolCallCount: sessionPatch.toolCallCount,
      },
      create: {
        caConnectionId: event.id,
        caSessionId: parsed.ca.caSessionId,
        currentGoal: sessionPatch.currentGoal,
        endedAt: sessionPatch.endedAt,
        lastActiveAt: sessionPatch.lastActiveAt,
        latestActivity: sessionPatch.latestActivity,
        messageCount: sessionPatch.messageCount,
        progressPercent: sessionPatch.progressPercent,
        riskLevel: sessionPatch.riskLevel,
        riskReason: sessionPatch.riskReason,
        startedAt: sessionPatch.startedAt,
        taskStatus: sessionPatch.taskStatus,
        tokenCost: sessionPatch.tokenCost,
        toolCallCount: sessionPatch.toolCallCount,
      },
    });

    const nextStatus = getNextConnectionStatusFromSignal({
      currentStatus: event.ingestionStatus,
      signal: signalForHelpers,
    });

    await tx.cAConnection.update({
      where: {
        id: event.id,
      },
      data: {
        connectorVersion: parsed.ca.connectorVersion ?? event.connectorVersion,
        ingestionStatus: nextStatus,
        lastSyncedAt: observedAt,
      },
    });

    const allConnections = await tx.cAConnection.findMany({
      where: {
        raceProjectId: event.raceProjectId,
      },
      select: {
        ingestionStatus: true,
      },
    });

    const aggregateStatus = getAggregateIngestionStatus(
      allConnections.map((item) => item.ingestionStatus),
    );

    await tx.raceProject.update({
      where: {
        id: event.raceProjectId,
      },
      data: {
        aggregateIngestionStatus: aggregateStatus,
      },
    });

    await recordSecurityAudit(tx, {
      action: "ca_signal.ingest",
      actorKind: "CONNECTOR",
      caConnectionId: event.id,
      details: auditDetails,
      payloadDigest,
      raceId: event.raceProject.registration.raceId,
      raceProjectId: event.raceProjectId,
      reason:
        windowResult.integrityStatus === "review_needed"
          ? "timestamp_window_exceeded"
          : "",
      registrationId: event.raceProject.registrationId,
      result:
        windowResult.integrityStatus === "review_needed"
          ? "review_needed"
          : "accepted",
      targetId: parsed.ca.caSessionId,
      targetType: "Session",
      userId: event.raceProject.registration.userId,
    });

    return {
      aggregateStatus,
      connectionStatus: nextStatus,
      failedSignal: isFailureSignalPayload(signalForHelpers),
      raceId: event.raceProject.registration.raceId,
      sessionId: parsed.ca.caSessionId,
    };
  });

  await rebuildSessionSummaryEvidenceForRace(updated.raceId);
  await rebuildRaceProcessProjections(updated.raceId);

  return {
    accepted: true as const,
    deduped: false as const,
    failedSignal: updated.failedSignal,
    aggregateStatus: updated.aggregateStatus,
    connectionStatus: updated.connectionStatus,
    integrityStatus: windowResult.integrityStatus,
    sessionId: updated.sessionId,
  };
}
