import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import type { Prisma } from "@/generated/prisma/client";
import { buildWorkSourceRef, verifyWorkReadIntegrity } from "@/lib/material-integrity-helpers";
import { getRacePhase } from "@/lib/race-phase";
import { prisma } from "@/lib/prisma";
import { saveWorkDraftSchema } from "@/lib/validation";
import { hasRole, parseRolesJson } from "@/lib/user-roles";

type WorkMaterialInput = {
  demoUrl: string;
  repoUrl: string;
  summary: string;
  techNotes: string;
  title: string;
  videoUrl: string;
};

function buildWorkAssetData(input: {
  fallbackRepoUrl?: string;
  material: WorkMaterialInput;
}) {
  const repoUrl = input.material.repoUrl.trim() || input.fallbackRepoUrl?.trim() || "";
  const normalizedMaterial = {
    demoUrl: input.material.demoUrl.trim(),
    repoUrl,
    summary: input.material.summary.trim(),
    techNotes: input.material.techNotes.trim(),
    title: input.material.title.trim(),
    videoUrl: input.material.videoUrl.trim(),
  };

  return {
    contentHash: buildPayloadDigest({
      demoUrl: normalizedMaterial.demoUrl,
      repoUrl: normalizedMaterial.repoUrl,
      summary: normalizedMaterial.summary,
      techNotes: normalizedMaterial.techNotes,
      title: normalizedMaterial.title,
      videoUrl: normalizedMaterial.videoUrl,
    }),
    demoUrl: normalizedMaterial.demoUrl,
    repoUrl: normalizedMaterial.repoUrl,
    sourceRefJson: JSON.stringify(
      buildWorkSourceRef({
        demoUrl: normalizedMaterial.demoUrl,
        repoUrl: normalizedMaterial.repoUrl,
        techNotes: normalizedMaterial.techNotes,
        videoUrl: normalizedMaterial.videoUrl,
      }),
    ),
    summary: normalizedMaterial.summary,
    techNotes: normalizedMaterial.techNotes,
    title: normalizedMaterial.title,
    videoUrl: normalizedMaterial.videoUrl,
  };
}

async function upsertWorkAssetForTeamWithDb(
  db: Prisma.TransactionClient,
  input: {
    fallbackRepoUrl?: string;
    teamId: string;
    status: "DRAFT" | "SUBMITTED";
    visibility: "PRIVATE" | "PUBLIC";
    work: WorkMaterialInput;
  },
) {
  const existing = await db.work.findUnique({
    where: {
      teamId: input.teamId,
    },
  });

  if (existing?.status === "LOCKED") {
    throw new Error("当前作品已锁定，不能继续修改");
  }

  const workData = {
    ...buildWorkAssetData({
      fallbackRepoUrl: input.fallbackRepoUrl,
      material: input.work,
    }),
    status: input.status,
    visibility: input.visibility,
  };

  if (existing) {
    return db.work.update({
      where: {
        id: existing.id,
      },
      data: workData,
    });
  }

  return db.work.create({
    data: {
      teamId: input.teamId,
      ...workData,
    },
  });
}

export async function upsertSubmittedWorkForTeam(
  db: Prisma.TransactionClient,
  input: {
    fallbackRepoUrl?: string;
    teamId: string;
    work: WorkMaterialInput;
  },
) {
  return upsertWorkAssetForTeamWithDb(db, {
    fallbackRepoUrl: input.fallbackRepoUrl,
    teamId: input.teamId,
    status: "SUBMITTED",
    visibility: "PRIVATE",
    work: input.work,
  });
}

// [GRS004] 向后兼容：保留旧函数签名，内部委托到新实现
export async function upsertWorkAssetForRegistrationWithDb(
  db: Prisma.TransactionClient,
  input: {
    fallbackRepoUrl?: string;
    registrationId: string;
    status: "DRAFT" | "SUBMITTED";
    visibility: "PRIVATE" | "PUBLIC";
    work: WorkMaterialInput;
  },
) {
  // 通过 registrationId 找到对应的 teamId
  const reg = await (db as Prisma.TransactionClient).registration.findUnique({
    where: { id: input.registrationId },
    select: { teamId: true },
  });
  if (reg?.teamId) {
    return upsertWorkAssetForTeamWithDb(db, {
      fallbackRepoUrl: input.fallbackRepoUrl,
      teamId: reg.teamId,
      status: input.status,
      visibility: input.visibility,
      work: input.work,
    });
  }
  // 兜底：无 teamId 时按 registrationId 查找
  const existing = await db.work.findFirst({
    where: { registrationId: input.registrationId },
  });
  if (existing?.status === "LOCKED") {
    throw new Error("当前作品已锁定，不能继续修改");
  }
  const workData = {
    ...buildWorkAssetData({
      fallbackRepoUrl: input.fallbackRepoUrl,
      material: input.work,
    }),
    status: input.status,
    visibility: input.visibility,
  };
  if (existing) {
    return db.work.update({ where: { id: existing.id }, data: workData });
  }
  return db.work.create({
    data: { registrationId: input.registrationId, ...workData },
  });
}

export async function upsertSubmittedWorkForRegistration(
  db: Prisma.TransactionClient,
  input: {
    fallbackRepoUrl?: string;
    registrationId: string;
    work: WorkMaterialInput;
  },
) {
  return upsertWorkAssetForRegistrationWithDb(db, {
    fallbackRepoUrl: input.fallbackRepoUrl,
    registrationId: input.registrationId,
    status: "SUBMITTED",
    visibility: "PRIVATE",
    work: input.work,
  });
}

export async function saveWorkDraftForRider(riderId: string, formData: FormData) {
  const parsed = saveWorkDraftSchema.parse({
    raceId: formData.get("raceId"),
    demoUrl: formData.get("demoUrl"),
    repoUrl: formData.get("repoUrl"),
    techNotes: formData.get("techNotes"),
    videoUrl: formData.get("videoUrl"),
    workSummary: formData.get("workSummary"),
    workTitle: formData.get("workTitle"),
  });

  const registration = await prisma.registration.findUnique({
    where: {
      raceId_userId: {
        raceId: parsed.raceId,
        userId: riderId,
      },
    },
    include: {
      race: true,
      raceProject: true,
    },
  });

  if (!registration) {
    throw new Error("请先完成个人报名");
  }

  if (registration.status !== "APPROVED") {
    throw new Error("当前报名尚未通过审核");
  }

  // GRS004: 双重校验 — 必须 Registration.approved + TeamMember.approved
  if (!registration.teamId) {
    throw new Error("请先创建或加入队伍后再提交作品");
  }
  const teamMember = await prisma.teamMember.findFirst({
    where: { teamId: registration.teamId, userId: riderId, status: "APPROVED" },
  });
  if (!teamMember) {
    throw new Error("请等待队长审批通过后再提交作品");
  }

  const phase = getRacePhase(registration.race);
  if (
    phase !== "active" &&
    phase !== "frozen" &&
    phase !== "running" &&
    phase !== "submitting" &&
    phase !== "finished" &&
    phase !== "completed"
  ) {
    throw new Error("当前阶段还不能保存作品草稿");
  }

  return prisma.$transaction((tx) =>
    upsertWorkAssetForRegistrationWithDb(tx, {
      fallbackRepoUrl: registration.raceProject?.githubRepoUrl ?? "",
      registrationId: registration.id,
      status: "DRAFT",
      visibility: "PRIVATE",
      work: {
        demoUrl: parsed.demoUrl,
        repoUrl: parsed.repoUrl,
        summary: parsed.workSummary,
        techNotes: parsed.techNotes,
        title: parsed.workTitle,
        videoUrl: parsed.videoUrl,
      },
    }),
  );
}

async function sanitizeWork<T extends {
  contentHash: string;
  demoUrl: string;
  repoUrl: string;
  sourceRefJson: string;
  status: string;
  summary: string;
  techNotes: string;
  title: string;
  videoUrl: string;
  visibility: string;
}>(work: null | T) {
  if (!work) {
    return null;
  }

  return (await verifyWorkReadIntegrity({ work })).ok ? work : null;
}

export function isWorkPublic(input: {
  status: string;
  visibility: string;
}) {
  const status = String(input.status).toUpperCase();
  const visibility = String(input.visibility).toUpperCase();
  return visibility === "PUBLIC" && status !== "DRAFT" && status !== "HIDDEN";
}

export async function sanitizePublicWork<T extends {
  contentHash: string;
  demoUrl: string;
  repoUrl: string;
  sourceRefJson: string;
  status: string;
  summary: string;
  techNotes: string;
  title: string;
  videoUrl: string;
  visibility: string;
}>(work: null | T) {
  if (!work || !isWorkPublic(work)) {
    return null;
  }

  return sanitizeWork(work);
}

export async function listWorksForRace(raceId: string) {
  const works = await prisma.work.findMany({
    where: {
      team: { raceId },
    },
    include: {
      awards: true,
      judgeAssignments: {
        include: {
          judge: true,
          judgingRecord: true,
        },
      },
      team: {
        include: {
          members: {
            where: { status: { not: "REMOVED" } },
            include: { user: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const filteredWorks = await Promise.all(
    works.map(async (work) =>
      (await verifyWorkReadIntegrity({ work })).ok ? work : null,
    ),
  );

  return filteredWorks.filter((work): work is (typeof works)[number] => !!work);
}

export async function getWorkForPublicSlug(input: {
  raceId: string;
  workId: string;
}) {
  const work = await prisma.work.findFirst({
    where: {
      id: input.workId,
      team: { raceId: input.raceId },
    },
    include: {
      awards: {
        where: {
          publishedAt: {
            not: null,
          },
        },
      },
      judgeAssignments: {
        where: {
          judgingRecord: {
            submittedAt: {
              not: null,
            },
          },
        },
        include: {
          judge: true,
          judgingRecord: true,
        },
      },
      team: {
        include: {
          members: {
            where: { status: { not: "REMOVED" } },
            include: { user: true },
          },
          // GRS004: Team registrations for author/evidence/race context
          registrations: {
            where: { status: { not: "WITHDRAWN" } },
            include: {
              user: true,
              evidences: { where: { visibility: "PUBLIC" } },
              race: true,
            },
          },
        },
      },
    },
  });

  return sanitizePublicWork(work);
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

  const work = await prisma.work.findFirst({
    where: {
      registrationId: registration.id,
    },
    include: {
      awards: {
        where: {
          publishedAt: { not: null },
        },
      },
      judgeAssignments: {
        where: {
          judgingRecord: {
            submittedAt: { not: null },
          },
        },
        include: {
          judge: true,
          judgingRecord: true,
        },
      },
      team: {
        include: {
          members: {
            where: { status: { not: "REMOVED" } },
            include: { user: true },
          },
        },
      },
    },
  });

  return sanitizePublicWork(work);
}

async function getManagedWorkForAction(input: {
  actorUserId: string;
  allowSystem?: boolean;
  errorMessage: string;
  workId: string;
}) {
  const [work, actor] = await Promise.all([
    prisma.work.findUnique({
      where: {
        id: input.workId,
      },
      include: {
        team: {
          include: {
            race: true,
          },
        },
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
  const isAdmin = hasRole(actorRoles, "ADMIN");
  const canUseSystem = Boolean(input.allowSystem) && isAdmin;
  const canManageRace = work?.team
    ? hasRole(actorRoles, "ORGANIZER") &&
      work.team.race.organizerId === input.actorUserId
    : false;

  if (!work || (!canManageRace && !canUseSystem)) {
    throw new Error(input.errorMessage);
  }

  return { actorRoles, work };
}

export async function hideWorkForRace(input: {
  actorUserId: string;
  allowSystem?: boolean;
  workId: string;
}) {
  const [work, actor] = await Promise.all([
    prisma.work.findUnique({
      where: { id: input.workId },
      include: {
        team: {
          include: {
            race: true,
            members: { where: { status: "APPROVED" }, include: { user: true } },
          },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: input.actorUserId },
      select: { rolesJson: true },
    }),
  ]);

  const actorRoles = actor ? parseRolesJson(actor.rolesJson) : [];
  const isAdmin = hasRole(actorRoles, "ADMIN");
  const isOrganizer = hasRole(actorRoles, "ORGANIZER");
  const isTeamMember = work?.team?.members.some(m => m.userId === input.actorUserId) ?? false;
  const canUseSystem = Boolean(input.allowSystem) && isAdmin;
  const canManageRace = work?.team
    ? work.team.race.organizerId === input.actorUserId && isOrganizer
    : false;

  if (!work || (!isTeamMember && !canManageRace && !canUseSystem)) {
    throw new Error("无权隐藏这份作品");
  }

  if (isTeamMember && work.status !== "DRAFT") {
    throw new Error("只有草稿作品才能由骑手自行隐藏");
  }

  return prisma.work.update({
    where: { id: work.id },
    data: { status: "HIDDEN", visibility: "PRIVATE" },
  });
}

export async function publishWorkForRace(input: {
  actorUserId: string;
  allowSystem?: boolean;
  workId: string;
}) {
  const { work } = await getManagedWorkForAction({
    actorUserId: input.actorUserId,
    allowSystem: input.allowSystem,
    errorMessage: "无权公开这份作品",
    workId: input.workId,
  });

  if (work.status === "DRAFT") {
    throw new Error("草稿作品不能直接公开");
  }

  return prisma.work.update({
    where: {
      id: work.id,
    },
    data: {
      status: work.status === "HIDDEN" ? "SUBMITTED" : work.status,
      visibility: "PUBLIC",
    },
  });
}

export async function lockWorkForRace(input: {
  actorUserId: string;
  allowSystem?: boolean;
  workId: string;
}) {
  const { work } = await getManagedWorkForAction({
    actorUserId: input.actorUserId,
    allowSystem: input.allowSystem,
    errorMessage: "无权锁定这份作品",
    workId: input.workId,
  });

  return prisma.work.update({
    where: {
      id: work.id,
    },
    data: {
      status: "LOCKED",
    },
  });
}
