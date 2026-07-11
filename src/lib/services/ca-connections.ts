import {
  type CAType,
  IngestionSource,
  type IngestionStatus,
} from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  getAggregateIngestionStatus,
  getDefaultCAConnectionStatus,
} from "@/lib/ca-helpers";
import { recordSecurityAudit } from "@/lib/services/security-audit";
import { hasRole, parseRolesJson } from "@/lib/user-roles";

export async function listCAConnectionsForRaceProject(raceProjectId: string) {
  return prisma.cAConnection.findMany({
    where: { raceProjectId },
    include: {
      sessions: {
        orderBy: {
          startedAt: "desc",
        },
      },
    },
    orderBy: {
      registeredAt: "desc",
    },
  });
}

export async function listRaceProjectCAStatusForRace(raceId: string) {
  return prisma.registration.findMany({
    where: { raceId },
    include: {
      raceProject: {
        include: {
          caConnections: {
            include: {
              sessions: {
                orderBy: {
                  startedAt: "desc",
                },
              },
            },
            orderBy: {
              registeredAt: "desc",
            },
          },
        },
      },
      user: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function createCAConnectionForRaceProject(input: {
  caProjectId: string;
  caType: CAType;
  connectorBaseUrl?: string;
  connectorId: string;
  connectorVersion: string;
  raceProjectId: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const raceProject = await tx.raceProject.findUnique({
      where: {
        id: input.raceProjectId,
      },
      include: {
        registration: true,
      },
    });

    if (!raceProject || raceProject.registration.userId !== input.userId) {
      throw new Error("RaceProject not found for current rider");
    }

    if (raceProject.registration.status !== "APPROVED") {
      throw new Error("当前报名尚未通过审核");
    }

    const connection = await tx.cAConnection.create({
      data: {
        caProjectId: input.caProjectId.trim(),
        caType: input.caType,
        connectorBaseUrl: input.connectorBaseUrl?.trim() ?? "",
        connectorId: input.connectorId.trim(),
        connectorVersion: input.connectorVersion.trim(),
        ingestionSource: IngestionSource.MANUAL,
        ingestionStatus: getDefaultCAConnectionStatus(),
        raceProjectId: raceProject.id,
      },
    });

    const allConnections = await tx.cAConnection.findMany({
      where: {
        raceProjectId: raceProject.id,
      },
      select: {
        ingestionStatus: true,
      },
    });

    await tx.raceProject.update({
      where: {
        id: raceProject.id,
      },
      data: {
        aggregateIngestionStatus: getAggregateIngestionStatus(
          allConnections.map((item) => item.ingestionStatus as IngestionStatus),
        ),
      },
    });

    await recordSecurityAudit(tx, {
      action: "ca_connection.register",
      actorKind: "USER",
      caConnectionId: connection.id,
      details: {
        caProjectId: connection.caProjectId,
        caType: connection.caType,
        connectorId: connection.connectorId,
      },
      raceId: raceProject.registration.raceId,
      raceProjectId: raceProject.id,
      registrationId: raceProject.registrationId,
      result: "accepted",
      targetId: connection.id,
      targetType: "CAConnection",
      userId: input.userId,
    });

    return connection;
  });
}

export async function rotateCAConnectionSecretForRider(input: {
  caConnectionId: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const connection = await tx.cAConnection.findUnique({
      where: {
        id: input.caConnectionId,
      },
      include: {
        raceProject: {
          include: {
            registration: true,
          },
        },
      },
    });

    if (!connection || connection.raceProject.registration.userId !== input.userId) {
      throw new Error("CAConnection not found for current rider");
    }

    if (connection.raceProject.registration.status !== "APPROVED") {
      throw new Error("当前报名尚未通过审核");
    }

    const rotated = await tx.cAConnection.update({
      where: {
        id: connection.id,
      },
      data: {
        connectorSecret: randomUUID(),
        disabledAt: null,
        disabledReason: "",
        handshakeCompletedAt: null,
        ingestionStatus: "CONNECTED",
        secretRotatedAt: new Date(),
        secretVersion: connection.secretVersion + 1,
      },
    });

    await recordSecurityAudit(tx, {
      action: "ca_connection.secret_rotated",
      actorKind: "USER",
      caConnectionId: rotated.id,
      details: {
        connectorId: rotated.connectorId,
        secretVersion: rotated.secretVersion,
      },
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      registrationId: connection.raceProject.registrationId,
      result: "accepted",
      targetId: rotated.id,
      targetType: "CAConnection",
      userId: input.userId,
    });

    return rotated;
  });
}

async function getManagedCAConnectionForAction(tx: Prisma.TransactionClient, input: {
  allowSystem?: boolean;
  caConnectionId: string;
  organizerId: string;
}) {
  const [connection, user] = await Promise.all([
    tx.cAConnection.findUnique({
      where: {
        id: input.caConnectionId,
      },
      include: {
        raceProject: {
          include: {
            registration: {
              include: {
                race: true,
              },
            },
          },
        },
      },
    }),
    tx.user.findUnique({
      where: {
        id: input.organizerId,
      },
      select: {
        rolesJson: true,
      },
    }),
  ]);

  const userRoles = user ? parseRolesJson(user.rolesJson) : [];
  const canUseSystem =
    Boolean(input.allowSystem) && hasRole(userRoles, "ADMIN");

  if (
    !connection ||
    (connection.raceProject.registration.race.organizerId !== input.organizerId &&
      !canUseSystem)
  ) {
    throw new Error("CAConnection not found for current operator");
  }

  return connection;
}

export async function disableCAConnectionForOrganizer(input: {
  allowSystem?: boolean;
  caConnectionId: string;
  organizerId: string;
  reason: string;
}) {
  return prisma.$transaction(async (tx) => {
    const connection = await getManagedCAConnectionForAction(tx, input);

    const disabled = await tx.cAConnection.update({
      where: {
        id: connection.id,
      },
      data: {
        disabledAt: new Date(),
        disabledReason: input.reason.trim(),
      },
    });

    await recordSecurityAudit(tx, {
      action: "ca_connection.disabled",
      actorKind: "USER",
      caConnectionId: disabled.id,
      details: {
        connectorId: disabled.connectorId,
        reason: disabled.disabledReason,
      },
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      registrationId: connection.raceProject.registrationId,
      result: "accepted",
      targetId: disabled.id,
      targetType: "CAConnection",
      userId: input.organizerId,
    });

    return disabled;
  });
}

export async function enableCAConnectionForOrganizer(input: {
  allowSystem?: boolean;
  caConnectionId: string;
  organizerId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const connection = await getManagedCAConnectionForAction(tx, input);

    const enabled = await tx.cAConnection.update({
      where: {
        id: connection.id,
      },
      data: {
        disabledAt: null,
        disabledReason: "",
      },
    });

    await recordSecurityAudit(tx, {
      action: "ca_connection.enabled",
      actorKind: "USER",
      caConnectionId: enabled.id,
      details: {
        connectorId: enabled.connectorId,
      },
      raceId: connection.raceProject.registration.raceId,
      raceProjectId: connection.raceProjectId,
      registrationId: connection.raceProject.registrationId,
      result: "accepted",
      targetId: enabled.id,
      targetType: "CAConnection",
      userId: input.organizerId,
    });

    return enabled;
  });
}
