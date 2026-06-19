import { z } from "zod";
import { getAggregateIngestionStatus } from "@/lib/ca-helpers";
import {
  buildSessionPatchFromSnapshot,
  getNextConnectionStatusFromSignal,
  shouldApplyFetchedSnapshot,
} from "@/lib/ca-runtime-helpers";
import { prisma } from "@/lib/prisma";
import { rebuildSessionSummaryEvidenceForRace } from "@/lib/services/evidence";
import { rebuildRaceProcessProjections } from "@/lib/services/projections";

const handshakeSchema = z.object({
  caConnectionId: z.string().min(1),
  caProjectId: z.string().min(1),
  connectorId: z.string().min(1),
  connectorVersion: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

const snapshotSchema = z.object({
  ca: z.object({
    caConnectionId: z.string().min(1),
    caProjectId: z.string().min(1),
    caSessionId: z.string().min(1),
  }),
  fetchedAt: z.string().datetime(),
  schemaVersion: z.string().min(1),
  summary: z.object({
    currentGoal: z.string(),
    latestActivity: z.string(),
    riskLevel: z.string(),
    riskReason: z.string(),
  }),
  task: z.object({
    progressPercent: z.number().min(0).max(100),
    taskStatus: z.string(),
  }),
  session: z.object({
    allRidingMessageLength: z.number().int().nonnegative().default(0),
    endedAt: z.string().datetime().nullable(),
    lastActiveAt: z.string().datetime().nullable(),
    messageCount: z.number().int().nonnegative(),
    startedAt: z.string().datetime(),
    tokenCost: z.number().int().nonnegative(),
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
  });

  if (!connection) {
    return { accepted: false as const, reason: "connection_not_found" };
  }

  if (connection.connectorSecret !== input.authToken) {
    return { accepted: false as const, reason: "unauthorized" };
  }

  if (
    connection.connectorId !== parsed.connectorId ||
    connection.caProjectId !== parsed.caProjectId ||
    connection.disabledAt
  ) {
    return { accepted: false as const, reason: "scope_mismatch" };
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

  const updated = await prisma.cAConnection.update({
    where: { id: connection.id },
    data: {
      connectorVersion: parsed.connectorVersion ?? connection.connectorVersion,
      handshakeCompletedAt: connection.handshakeCompletedAt ?? timestamp,
      ingestionStatus: nextStatus,
      lastSyncedAt: timestamp,
    },
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
    throw new Error("CAConnection not found");
  }

  if (!connection.handshakeCompletedAt || connection.disabledAt) {
    throw new Error("CAConnection is not eligible for snapshot fetch");
  }

  if (!connection.connectorBaseUrl) {
    throw new Error("CAConnection has no connectorBaseUrl");
  }

  const url = `${connection.connectorBaseUrl.replace(/\/$/, "")}/ary/ca/connections/${connection.id}/sessions/${input.caSessionId}/snapshot`;
  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${connection.connectorSecret}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Snapshot fetch failed with status ${response.status}`);
  }

  const parsed = snapshotSchema.parse(await response.json());

  if (
    parsed.ca.caConnectionId !== connection.id ||
    parsed.ca.caProjectId !== connection.caProjectId ||
    parsed.ca.caSessionId !== input.caSessionId
  ) {
    throw new Error("Snapshot payload scope mismatch");
  }

  const fetchedAt = new Date(parsed.fetchedAt);
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
        tokenCost: parsed.session.tokenCost,
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
        idempotencyKey: `fetch:${connection.id}:${input.caSessionId}:${parsed.fetchedAt}`,
        messageId: `fetch:${connection.id}:${input.caSessionId}:${parsed.fetchedAt}`,
        observedAt: fetchedAt,
        payloadJson: JSON.stringify(parsed),
        signalKind: "snapshot",
        signalType: "snapshot_fetch",
      },
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
