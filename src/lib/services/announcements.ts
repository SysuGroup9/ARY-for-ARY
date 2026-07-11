import { prisma } from "@/lib/prisma";
import { hasRole, parseRolesJson } from "@/lib/user-roles";

async function getRaceForManagedAnnouncementAction(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
}) {
  const [race, user] = await Promise.all([
    prisma.race.findUnique({
      where: {
        id: input.raceId,
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

  if (!race || (race.organizerId !== input.organizerId && !canUseSystem)) {
    throw new Error("无权操作这场比赛的公告");
  }

  return race;
}

async function getManagedAnnouncementForAction(input: {
  allowSystem?: boolean;
  announcementId: string;
  organizerId: string;
}) {
  const [announcement, user] = await Promise.all([
    prisma.announcement.findUnique({
      where: {
        id: input.announcementId,
      },
      include: {
        race: true,
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
    !announcement ||
    (announcement.race.organizerId !== input.organizerId &&
      !canUseSystem)
  ) {
    throw new Error("无权操作这条公告");
  }

  return announcement;
}

export async function listAnnouncementsForRace(raceId: string) {
  return prisma.announcement.findMany({
    where: {
      raceId,
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

export async function listPublishedAnnouncementsForRace(raceId: string) {
  return prisma.announcement.findMany({
    where: {
      raceId,
      publishedAt: {
        not: null,
      },
      visibility: "PUBLIC",
    },
    orderBy: [
      {
        publishedAt: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
  });
}

export async function getLatestPublishedAnnouncementForRace(raceId: string) {
  return prisma.announcement.findFirst({
    where: {
      raceId,
      publishedAt: {
        not: null,
      },
      visibility: "PUBLIC",
    },
    orderBy: [
      {
        publishedAt: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
  });
}

export async function createAnnouncementDraftForRace(input: {
  allowSystem?: boolean;
  body: string;
  organizerId: string;
  raceId: string;
  title: string;
}) {
  await getRaceForManagedAnnouncementAction(input);

  return prisma.announcement.create({
    data: {
      body: input.body.trim(),
      raceId: input.raceId,
      title: input.title.trim(),
      visibility: "PRIVATE",
    },
  });
}

export async function updateAnnouncementDraftForRace(input: {
  allowSystem?: boolean;
  announcementId: string;
  body: string;
  organizerId: string;
  title: string;
}) {
  const announcement = await getManagedAnnouncementForAction(input);

  if (announcement.visibility === "PUBLIC") {
    throw new Error("已发布公告不能直接编辑，请先隐藏");
  }

  return prisma.announcement.update({
    where: {
      id: announcement.id,
    },
    data: {
      body: input.body.trim(),
      title: input.title.trim(),
      visibility: "PRIVATE",
    },
  });
}

export async function publishAnnouncementForRace(input: {
  allowSystem?: boolean;
  announcementId: string;
  organizerId: string;
}) {
  const announcement = await getManagedAnnouncementForAction(input);

  return prisma.announcement.update({
    where: {
      id: announcement.id,
    },
    data: {
      publishedAt: new Date(),
      visibility: "PUBLIC",
    },
  });
}

export async function hideAnnouncementForRace(input: {
  allowSystem?: boolean;
  announcementId: string;
  organizerId: string;
}) {
  const announcement = await getManagedAnnouncementForAction(input);

  return prisma.announcement.update({
    where: {
      id: announcement.id,
    },
    data: {
      visibility: "PRIVATE",
    },
  });
}
