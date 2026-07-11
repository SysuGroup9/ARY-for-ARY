import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import type { Prisma } from "@/generated/prisma/client";
import { buildWorkSourceRef, verifyWorkReadIntegrity } from "@/lib/material-integrity-helpers";
import { getRacePhase } from "@/lib/race-phase";
import { prisma } from "@/lib/prisma";
import { ensureCompatibilityContainerForApprovedRegistration } from "@/lib/services/registrations";
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

async function upsertWorkAssetForRegistrationWithDb(
  db: Prisma.TransactionClient,
  input: {
    fallbackRepoUrl?: string;
    registrationId: string;
    status: "DRAFT" | "SUBMITTED";
    visibility: "PRIVATE" | "PUBLIC";
    work: WorkMaterialInput;
  },
) {
  const existing = await db.work.findUnique({
    where: {
      registrationId: input.registrationId,
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
      registrationId: input.registrationId,
      ...workData,
    },
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

  await ensureCompatibilityContainerForApprovedRegistration({
    raceId: parsed.raceId,
    userId: riderId,
  });

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
      registration: {
        raceId: input.raceId,
      },
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
      registration: {
        include: {
          evidences: true,
          race: true,
          user: true,
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

  const work = await prisma.work.findUnique({
    where: {
      registrationId: registration.id,
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
      registration: {
        include: {
          evidences: true,
          race: true,
          user: true,
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
        registration: {
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
  const canManageRace = work
    ? hasRole(actorRoles, "ORGANIZER") &&
      work.registration.race.organizerId === input.actorUserId
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
      where: {
        id: input.workId,
      },
      include: {
        registration: {
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
  const isOrganizer = hasRole(actorRoles, "ORGANIZER");
  const isOwnerRider = work
    ? work.registration.userId === input.actorUserId &&
      hasRole(actorRoles, "RIDER")
    : false;
  const canUseSystem = Boolean(input.allowSystem) && isAdmin;
  const canManageRace = work
    ? work.registration.race.organizerId === input.actorUserId && isOrganizer
    : false;

  if (!work || (!isOwnerRider && !canManageRace && !canUseSystem)) {
    throw new Error("无权隐藏这份作品");
  }

  if (isOwnerRider && work.status !== "DRAFT") {
    throw new Error("只有草稿作品才能由骑手自行隐藏");
  }

  return prisma.work.update({
    where: {
      id: work.id,
    },
    data: {
      status: "HIDDEN",
      visibility: "PRIVATE",
    },
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
