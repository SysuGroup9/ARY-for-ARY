import { RegistrationStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getRaceProjectInitialStatus,
  planRegistrationBridgeFlow,
} from "@/lib/registration-helpers";
import { getRacePhase } from "@/lib/race-phase";
import { hasRole, parseRolesJson } from "@/lib/user-roles";

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

async function ensureCompatibilityTeamForRegistration(input: {
  raceId: string;
  tx: Prisma.TransactionClient;
  userId: string;
  username: string;
}) {
  const existingTeam = await input.tx.team.findFirst({
    where: {
      captainId: input.userId,
      raceId: input.raceId,
    },
    include: {
      members: true,
    },
  });

  if (existingTeam) {
    return existingTeam;
  }

  return input.tx.team.create({
    data: {
      captainId: input.userId,
      members: {
        create: [
          {
            displayName: input.username,
            userId: input.userId,
          },
        ],
      },
      name: `${input.username} solo`,
      raceId: input.raceId,
    },
  });
}

export async function ensureCompatibilityContainerForApprovedRegistration(input: {
  raceId: string;
  userId: string;
}) {
  const registration = await prisma.registration.findUnique({
    where: {
      raceId_userId: {
        raceId: input.raceId,
        userId: input.userId,
      },
    },
    include: {
      user: true,
    },
  });

  if (!registration) {
    throw new Error("请先完成个人报名");
  }

  if (registration.status !== "APPROVED") {
    throw new Error("当前报名尚未通过审核");
  }

  return prisma.$transaction((tx) =>
    ensureCompatibilityTeamForRegistration({
      raceId: input.raceId,
      tx,
      userId: input.userId,
      username: registration.user.username,
    }),
  );
}

async function getManagedRegistrationForAction(input: {
  allowSystem?: boolean;
  errorMessage: string;
  organizerId: string;
  registrationId: string;
}) {
  const [registration, user] = await Promise.all([
    prisma.registration.findUnique({
      where: {
        id: input.registrationId,
      },
      include: {
        race: true,
        raceProject: true,
        user: true,
      },
    }),
    prisma.user.findUnique({
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
    !registration ||
    (registration.race.organizerId !== input.organizerId && !canUseSystem)
  ) {
    throw new Error(input.errorMessage);
  }

  return registration;
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
      await ensureCompatibilityTeamForRegistration({
        raceId,
        tx,
        userId,
        username: user.username,
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

export async function approveRegistrationForRace(input: {
  allowSystem?: boolean;
  organizerId: string;
  registrationId: string;
}) {
  const registration = await getManagedRegistrationForAction({
    allowSystem: input.allowSystem,
    errorMessage: "无权批准这条报名",
    organizerId: input.organizerId,
    registrationId: input.registrationId,
  });

  if (registration.status === "WITHDRAWN") {
    throw new Error("已撤回的报名不能直接批准");
  }

  return prisma.$transaction(async (tx) => {
    await tx.registration.update({
      where: {
        id: registration.id,
      },
      data: {
        approvedAt: registration.approvedAt ?? new Date(),
        rejectedAt: null,
        status: "APPROVED",
      },
    });

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

    await ensureCompatibilityTeamForRegistration({
      raceId: registration.raceId,
      tx,
      userId: registration.userId,
      username: registration.user.username,
    });

    return tx.registration.findUnique({
      where: {
        id: registration.id,
      },
      include: {
        raceProject: true,
        user: true,
      },
    });
  });
}

export async function rejectRegistrationForRace(input: {
  allowSystem?: boolean;
  organizerId: string;
  registrationId: string;
}) {
  const registration = await getManagedRegistrationForAction({
    allowSystem: input.allowSystem,
    errorMessage: "无权拒绝这条报名",
    organizerId: input.organizerId,
    registrationId: input.registrationId,
  });

  if (registration.status === "APPROVED") {
    throw new Error("已通过的报名不能直接拒绝");
  }

  if (registration.status === "WITHDRAWN") {
    throw new Error("已撤回的报名不能再拒绝");
  }

  return prisma.registration.update({
    where: {
      id: registration.id,
    },
    data: {
      rejectedAt: registration.rejectedAt ?? new Date(),
      status: "REJECTED",
    },
    include: {
      raceProject: true,
      user: true,
    },
  });
}

export async function withdrawRegistrationForRace(input: {
  allowSystem?: boolean;
  actorUserId: string;
  registrationId: string;
}) {
  const [registration, actor] = await Promise.all([
    prisma.registration.findUnique({
      where: {
        id: input.registrationId,
      },
      include: {
        race: true,
      },
    }),
    prisma.user.findUnique({
      where: {
        id: input.actorUserId,
      },
      select: {
        rolesJson: true,
      },
    }),
  ]);

  const actorRoles = actor ? parseRolesJson(actor.rolesJson) : [];
  const isOwnerRider = registration
    ? registration.userId === input.actorUserId && hasRole(actorRoles, "RIDER")
    : false;
  const isManagedOrganizer = registration
    ? registration.race.organizerId === input.actorUserId &&
      hasRole(actorRoles, "ORGANIZER")
    : false;
  const canUseSystem = registration
    ? Boolean(input.allowSystem) && hasRole(actorRoles, "ADMIN")
    : false;

  if (!registration || (!isOwnerRider && !isManagedOrganizer && !canUseSystem)) {
    throw new Error("无权撤回这条报名");
  }

  if (registration.status === "WITHDRAWN") {
    throw new Error("这条报名已经撤回");
  }

  if (registration.status === "REJECTED") {
    throw new Error("已拒绝的报名不能再撤回");
  }

  if (isOwnerRider && getRacePhase(registration.race) !== "registration") {
    throw new Error("报名锁定后不能自行撤回");
  }

  return prisma.registration.update({
    where: {
      id: registration.id,
    },
    data: {
      status: "WITHDRAWN",
      withdrawnAt: registration.withdrawnAt ?? new Date(),
    },
    include: {
      raceProject: true,
      user: true,
    },
  });
}
