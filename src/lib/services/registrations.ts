import { RegistrationStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  getRaceProjectInitialStatus,
  planRegistrationBridgeFlow,
} from "@/lib/registration-helpers";
import { getRacePhase } from "@/lib/race-phase";

export async function listRegistrationsForRace(raceId: string) {
  return prisma.registration.findMany({
    where: { raceId },
    include: {
      awards: true,
      evidences: {
        orderBy: {
          createdAt: "desc",
        },
      },
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
      work: true,
      user: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getRegistrationForUser(raceId: string, userId: string) {
  return prisma.registration.findUnique({
    where: {
      raceId_userId: {
        raceId,
        userId,
      },
    },
    include: {
      awards: true,
      evidences: {
        orderBy: {
          createdAt: "desc",
        },
      },
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
      work: true,
      user: true,
    },
  });
}

export async function ensureRaceProjectForRegistration(input: {
  registrationId: string;
}) {
  return prisma.raceProject.upsert({
    where: {
      registrationId: input.registrationId,
    },
    update: {},
    create: {
      aggregateIngestionStatus: getRaceProjectInitialStatus(),
      registrationId: input.registrationId,
    },
  });
}

export async function registerForRace(userId: string, raceId: string) {
  const race = await prisma.race.findUnique({
    where: { id: raceId },
  });

  if (!race) {
    throw new Error("Race not found");
  }

  if (getRacePhase(race) !== "registration") {
    throw new Error("Registration is only open during the registration phase");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return prisma.$transaction(async (tx) => {
    const existingRegistration = await tx.registration.findUnique({
      where: {
        raceId_userId: {
          raceId,
          userId,
        },
      },
      include: {
        raceProject: true,
      },
    });

    const existingTeam = await tx.team.findFirst({
      where: {
        captainId: userId,
        raceId,
      },
      include: {
        members: true,
      },
    });

    const flow = planRegistrationBridgeFlow({
      hasCompatibilityTeam: !!existingTeam,
      hasRaceProject: !!existingRegistration?.raceProject,
      registrationStatus: existingRegistration?.status ?? null,
    });

    let registration = existingRegistration;

    if (!registration && flow.shouldCreateRegistration) {
      registration = await tx.registration.create({
        data: {
          approvedAt: flow.nextRegistrationStatus === "APPROVED" ? new Date() : null,
          raceId,
          status: flow.nextRegistrationStatus as RegistrationStatus,
          userId,
        },
        include: {
          raceProject: true,
          user: true,
        },
      });
    } else if (
      registration &&
      registration.status !== flow.nextRegistrationStatus
    ) {
      registration = await tx.registration.update({
        where: { id: registration.id },
        data: {
          approvedAt:
            flow.nextRegistrationStatus === "APPROVED"
              ? registration.approvedAt ?? new Date()
              : registration.approvedAt,
          rejectedAt:
            flow.nextRegistrationStatus === "REJECTED"
              ? registration.rejectedAt ?? new Date()
              : registration.rejectedAt,
          status: flow.nextRegistrationStatus as RegistrationStatus,
          withdrawnAt:
            flow.nextRegistrationStatus === "WITHDRAWN"
              ? registration.withdrawnAt ?? new Date()
              : registration.withdrawnAt,
        },
        include: {
          raceProject: true,
          user: true,
        },
      });
    }

    if (!registration) {
      throw new Error("Registration could not be created");
    }

    if (flow.ensureRaceProject) {
      await tx.raceProject.upsert({
        where: {
          registrationId: registration.id,
        },
        update: {},
        create: {
          aggregateIngestionStatus: getRaceProjectInitialStatus(),
          registrationId: registration.id,
        },
      });
    }

    if (flow.ensureCompatibilityTeam) {
      await tx.team.create({
        data: {
          captainId: userId,
          members: {
            create: [
              {
                displayName: user.username,
                userId,
              },
            ],
          },
          name: `${user.username} solo`,
          raceId,
        },
      });
    }

    return tx.registration.findUnique({
      where: { id: registration.id },
      include: {
        raceProject: true,
        user: true,
      },
    });
  });
}
