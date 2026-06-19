import { z } from "zod";
import { IngestionStatus } from "@/generated/prisma/enums";
import {
  buildSessionPatchFromSignal,
  getNextConnectionStatusFromSignal,
  isFailureSignalPayload,
  type RidingSignalInput,
} from "@/lib/ca-runtime-helpers";
import { getAggregateIngestionStatus } from "@/lib/ca-helpers";
import { prisma } from "@/lib/prisma";
import { rebuildSessionSummaryEvidenceForRace } from "@/lib/services/evidence";
import { rebuildRaceProcessProjections } from "@/lib/services/projections";

const ridingSignalSchema = z.object({
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
    taskId: z.string().optional(),
  }),
  rider: z.object({
    raceProjectId: z.string().min(1),
    registrationId: z.string().min(1),
  }),
  signal: z.object({
    kind: z.enum(["event", "note"]),
    phase: z.string().optional(),
    progressPercent: z.number().min(0).max(100).optional(),
    taskStatus: z.string().optional(),
    type: z.enum([
      "risk_detected",
      "session_completed",
      "session_started",
      "task_progress",
    ]),
  }),
  timestamp: z.string().datetime(),
});

export async function ingestRidingSignalMessage(input: {
  authToken: string;
  body: unknown;
}) {
  const parsed = ridingSignalSchema.parse(input.body);
  const observedAt = new Date(parsed.timestamp);

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
    return { accepted: false as const, reason: "connection_not_found" };
  }

  if (event.connectorSecret !== input.authToken) {
    return { accepted: false as const, reason: "unauthorized" };
  }

  if (event.disabledAt || !event.handshakeCompletedAt) {
    return { accepted: false as const, reason: "connection_not_ready" };
  }

  if (
    event.raceProject.id !== parsed.rider.raceProjectId ||
    event.raceProject.registrationId !== parsed.rider.registrationId ||
    event.raceProject.registration.raceId !== parsed.race.raceId ||
    event.caProjectId !== parsed.ca.caProjectId ||
    event.connectorId !== parsed.ca.connectorId
  ) {
    return { accepted: false as const, reason: "scope_mismatch" };
  }

  const existingEvent = await prisma.cAIngestionEvent.findUnique({
    where: {
      idempotencyKey: parsed.idempotencyKey,
    },
  });

  if (existingEvent) {
    return { accepted: true as const, deduped: true as const };
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
        idempotencyKey: parsed.idempotencyKey,
        messageId: parsed.messageId,
        observedAt,
        payloadJson: JSON.stringify(parsed),
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
    sessionId: updated.sessionId,
  };
}
