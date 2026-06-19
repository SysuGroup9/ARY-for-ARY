import {
  type CAType,
  IngestionSource,
  type IngestionStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  getAggregateIngestionStatus,
  getDefaultCAConnectionStatus,
} from "@/lib/ca-helpers";

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

    return connection;
  });
}
