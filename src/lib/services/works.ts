import { prisma } from "@/lib/prisma";

export async function listWorksForRace(raceId: string) {
  return prisma.work.findMany({
    where: {
      registration: {
        raceId,
      },
    },
    include: {
      awards: true,
      judgeAssignments: {
        include: {
          judge: true,
          judgingRecord: true,
        },
      },
      registration: {
        include: {
          evidences: true,
          race: true,
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getWorkForPublicSlug(input: {
  raceId: string;
  workId: string;
}) {
  return prisma.work.findFirst({
    where: {
      id: input.workId,
      registration: {
        raceId: input.raceId,
      },
    },
    include: {
      awards: true,
      judgeAssignments: {
        include: {
          judge: true,
          judgingRecord: true,
        },
      },
      registration: {
        include: {
          evidences: true,
          race: true,
          user: true,
        },
      },
    },
  });
}

export async function getWorkForLegacyTeamSlug(input: {
  raceId: string;
  teamId: string;
}) {
  const team = await prisma.team.findUnique({
    where: {
      id: input.teamId,
    },
    select: {
      captainId: true,
      raceId: true,
    },
  });

  if (!team || team.raceId !== input.raceId) {
    return null;
  }

  const registration = await prisma.registration.findUnique({
    where: {
      raceId_userId: {
        raceId: input.raceId,
        userId: team.captainId,
      },
    },
  });

  if (!registration) {
    return null;
  }

  return prisma.work.findUnique({
    where: {
      registrationId: registration.id,
    },
    include: {
      awards: true,
      judgeAssignments: {
        include: {
          judge: true,
          judgingRecord: true,
        },
      },
      registration: {
        include: {
          evidences: true,
          race: true,
          user: true,
        },
      },
    },
  });
}
