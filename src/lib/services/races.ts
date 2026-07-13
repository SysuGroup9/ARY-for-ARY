import { buildRankedLeaderboardEntries } from "@/lib/leaderboard";
import {
  buildRaceEvaluationConfigDigest,
  verifyWorkReadIntegrity,
} from "@/lib/material-integrity-helpers";
import { prisma } from "@/lib/prisma";
import { getRacePhase } from "@/lib/race-phase";
import { normalizeTrackId, parseRaceTrackConfigJson, serializeRaceTrackConfig } from "@/lib/jumbotron/track-config";
import { deleteRaceSnapshot } from "@/lib/services/race-snapshot";
import { normalizeScreenDisplayState } from "@/lib/services/screen-display";
import { normalizeWeights, parseKeywords } from "@/lib/services/scoring";
import { hasRole, parseRolesJson } from "@/lib/user-roles";
import { createRaceSchema } from "@/lib/validation";

export async function listRaces() {
  const races = await prisma.race.findMany({
    include: {
      organizer: true,
      teams: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          works: true,
          captain: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
      registrations: {
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
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      awards: {
        include: {
          registration: {
            include: {
              user: true,
            },
          },
          work: true,
        },
        orderBy: [
          {
            awardName: "asc",
          },
          {
            rank: "asc",
          },
        ],
      },
      announcements: {
        orderBy: [
          {
            updatedAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
      leaderboardEntries: {
        include: {
          team: true,
        },
        orderBy: [
          {
            totalScore: "desc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
      harnessEntries: {
        include: {
          team: true,
        },
        orderBy: {
          harnessScore: "desc",
        },
      },
      highlights: {
        include: {
          team: true,
        },
        orderBy: {
          score: "desc",
        },
      },
      teamComments: {
        include: {
          team: true,
        },
      },
      notifications: {
        orderBy: {
          createdAt: "desc",
        },
      },
      feedbackThreads: {
        include: {
          team: true,
          messages: {
            include: {
              author: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      },
      teamArchives: {
        include: {
          team: true,
        },
        orderBy: {
          totalScore: "desc",
        },
      },
      submissions: {
        orderBy: {
          createdAt: "desc",
        },
      },
      runnerTasks: {
        orderBy: {
          createdAt: "desc",
        },
      },
      reports: {
        orderBy: {
          createdAt: "desc",
        },
      },
      screenDisplay: true,
      projections: {
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const securityAudits = races.length
    ? await prisma.securityAudit.findMany({
        where: {
          raceId: {
            in: races.map((race) => race.id),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    : [];

  const securityAuditsByRaceId = new Map<string, typeof securityAudits>();
  for (const audit of securityAudits) {
    if (!audit.raceId) {
      continue;
    }

    const grouped = securityAuditsByRaceId.get(audit.raceId) ?? [];
    grouped.push(audit);
    securityAuditsByRaceId.set(audit.raceId, grouped);
  }

  return Promise.all(
    races.map(async (race) => ({
      ...race,
      awards: await Promise.all(
        race.awards.map(async (award) => ({
          ...award,
          work:
            award.work && (await verifyWorkReadIntegrity({ work: award.work })).ok
              ? award.work
              : null,
        })),
      ),
      // GRS004: Work 属于 Team 维度，不再按 Registration.work 做完整性校验
      registrations: race.registrations,
      trackId: normalizeTrackId(race.trackId),
      trackConfig: parseRaceTrackConfigJson(race.trackConfigJson),
      screenDisplay: normalizeScreenDisplayState(race.screenDisplay),
      leaderboardEntries: buildRankedLeaderboardEntries(race.leaderboardEntries),
      phase: getRacePhase(race),
      keywords: parseKeywords(race.keywordsJson),
      securityAudits: securityAuditsByRaceId.get(race.id) ?? [],
    })),
  );
}

export async function getRaceById(raceId: string) {
  const races = await listRaces();
  return races.find((race) => race.id === raceId) ?? null;
}

export async function createRace(input: {
  actorUserId: string;
  allowSystem?: boolean;
  formData: FormData;
  organizerId: string;
}) {
  const [actorUser, organizerUser] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: input.actorUserId,
      },
      select: {
        rolesJson: true,
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

  const actorRoles = actorUser ? parseRolesJson(actorUser.rolesJson) : [];
  const organizerRoles = organizerUser ? parseRolesJson(organizerUser.rolesJson) : [];
  const isAdmin = Boolean(input.allowSystem) && hasRole(actorRoles, "ADMIN");
  const isSelfOrganizer =
    input.actorUserId === input.organizerId && hasRole(actorRoles, "ORGANIZER");

  if (!organizerUser || !hasRole(organizerRoles, "ORGANIZER")) {
    throw new Error("创建赛事时必须选择主办方账号");
  }

  if (input.actorUserId !== input.organizerId && !isAdmin) {
    throw new Error("无权为其他主办方创建比赛");
  }

  if (!isSelfOrganizer && !isAdmin) {
    throw new Error("无权创建这场比赛");
  }

  const parsed = createRaceSchema.parse({
    title: input.formData.get("title"),
    summary: input.formData.get("summary"),
    taskPackageLabel: input.formData.get("taskPackageLabel"),
    taskDescription: input.formData.get("taskDescription"),
    trainingDataSummary: input.formData.get("trainingDataSummary"),
    hasTrainingData: input.formData.get("hasTrainingData") === "on",
    evaluationNotes: input.formData.get("evaluationNotes"),
    keywordsText: input.formData.get("keywordsText"),
    tokenLimit: input.formData.get("tokenLimit"),
    signupStart: normalizeDateTimeInput(input.formData.get("signupStart")),
    signupEnd: normalizeDateTimeInput(input.formData.get("signupEnd")),
    raceStart: normalizeDateTimeInput(input.formData.get("raceStart")),
    raceEnd: normalizeDateTimeInput(input.formData.get("raceEnd")),
    enableFreeze: input.formData.get("enableFreeze") === "on",
    freezeMinutesBeforeEnd: input.formData.get("freezeMinutesBeforeEnd"),
    updateGranularityMinutes: input.formData.get("updateGranularityMinutes"),
    maxTeamSize: input.formData.get("maxTeamSize"),
    submissionIntervalHours: input.formData.get("submissionIntervalHours"),
    cloudStudioUrl: input.formData.get("cloudStudioUrl"),
    trackId: input.formData.get("trackId"),
    trackStartFinishS: input.formData.get("trackStartFinishS"),
    trackCheckpointsJson: String(input.formData.get("trackCheckpointsJson") ?? "[]"),
    displayShowTrainingData:
      input.formData.get("displayShowTrainingData") === "on",
    displayShowOrganizerComment:
      input.formData.get("displayShowOrganizerComment") === "on",
    displayShowTopHighlights:
      input.formData.get("displayShowTopHighlights") === "on",
    displayHighlightCount: input.formData.get("displayHighlightCount"),
    displayShowRiderCode: input.formData.get("displayShowRiderCode") === "on",
    weightTaskPassRate: input.formData.get("weightTaskPassRate"),
    weightCodeReview: input.formData.get("weightCodeReview"),
    weightReasoning: input.formData.get("weightReasoning"),
    weightKeywords: input.formData.get("weightKeywords"),
    weightTotalTask: input.formData.get("weightTotalTask"),
    weightTotalToken: input.formData.get("weightTotalToken"),
    weightTotalDialogue: input.formData.get("weightTotalDialogue"),
    harnessWeightReasoning: input.formData.get("harnessWeightReasoning"),
    harnessWeightKeyword: input.formData.get("harnessWeightKeyword"),
  });

  const weights = normalizeWeights({
    taskPassRate: parsed.weightTaskPassRate,
    codeReview: parsed.weightCodeReview,
    reasoning: parsed.weightReasoning,
    keywords: parsed.weightKeywords,
    totalTask: parsed.weightTotalTask,
    totalToken: parsed.weightTotalToken,
    totalDialogue: parsed.weightTotalDialogue,
  });

  const trackConfig = parseRaceTrackConfigJson(
    JSON.stringify({
      startFinish: { s: parsed.trackStartFinishS },
      checkpoints: JSON.parse(parsed.trackCheckpointsJson),
    }),
  );
  const keywordsJson = JSON.stringify(parseKeywords(parsed.keywordsText));
  const evaluationConfigHash = buildRaceEvaluationConfigDigest({
    harnessWeightKeyword: parsed.harnessWeightKeyword,
    harnessWeightReasoning: parsed.harnessWeightReasoning,
    keywordsJson,
    taskDescription: parsed.taskDescription,
    taskPackageLabel: parsed.taskPackageLabel,
    tokenLimit: parsed.tokenLimit,
    weightCodeReview: weights.codeReview,
    weightKeywords: weights.keywords,
    weightReasoning: weights.reasoning,
    weightTaskPassRate: weights.taskPassRate,
    weightTotalDialogue: weights.totalDialogue,
    weightTotalTask: weights.totalTask,
    weightTotalToken: weights.totalToken,
  });

  return prisma.race.create({
    data: {
      organizerId: input.organizerId,
      title: parsed.title,
      summary: parsed.summary,
      taskPackageLabel: parsed.taskPackageLabel,
      taskDescription: parsed.taskDescription,
      trainingDataSummary: parsed.trainingDataSummary,
      hasTrainingData: parsed.hasTrainingData,
      evaluationNotes: parsed.evaluationNotes,
      keywordsJson,
      tokenLimit: parsed.tokenLimit,
      signupStart: new Date(parsed.signupStart),
      signupEnd: new Date(parsed.signupEnd),
      raceStart: new Date(parsed.raceStart),
      raceEnd: new Date(parsed.raceEnd),
      enableFreeze: parsed.enableFreeze,
      freezeMinutesBeforeEnd: parsed.enableFreeze
        ? parsed.freezeMinutesBeforeEnd
        : 0,
      updateGranularityMinutes: parsed.updateGranularityMinutes,
      maxTeamSize: parsed.maxTeamSize,
      submissionIntervalHours: parsed.submissionIntervalHours,
      cloudStudioUrl: parsed.cloudStudioUrl,
      trackId: normalizeTrackId(parsed.trackId),
      trackConfigJson: serializeRaceTrackConfig(trackConfig),
      displayShowTrainingData: parsed.displayShowTrainingData,
      displayShowOrganizerComment: parsed.displayShowOrganizerComment,
      displayShowTopHighlights: parsed.displayShowTopHighlights,
      displayHighlightCount: parsed.displayHighlightCount,
      displayShowRiderCode: parsed.displayShowRiderCode,
      status: "draft",
      weightTaskPassRate: weights.taskPassRate,
      weightCodeReview: weights.codeReview,
      weightReasoning: weights.reasoning,
      weightKeywords: weights.keywords,
      weightTotalTask: weights.totalTask,
      weightTotalToken: weights.totalToken,
      weightTotalDialogue: weights.totalDialogue,
      harnessWeightReasoning: parsed.harnessWeightReasoning,
      harnessWeightKeyword: parsed.harnessWeightKeyword,
      evaluationConfigVersion: 1,
      evaluationConfigHash,
    },
  });
}

export async function publishRace(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
}) {
  const race = await assertManagedRaceActionAccess({
    allowSystem: input.allowSystem,
    errorMessage: "无权发布这场比赛",
    raceId: input.raceId,
    userId: input.organizerId,
  });

  if (getRacePhase(race) !== "draft") {
    throw new Error("只有草稿赛事可以发布");
  }

  return prisma.race.update({
    where: {
      id: input.raceId,
    },
    data: {
      status: "published",
    },
  });
}

export async function updateRaceContent(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
  taskDescription: string;
  trainingDataSummary: string;
}) {
  const race = await assertManagedRaceActionAccess({
    allowSystem: input.allowSystem,
    errorMessage: "无权修改这场比赛",
    raceId: input.raceId,
    userId: input.organizerId,
  });

  if (getRacePhase(race) === "finished") {
    throw new Error("比赛结束后不能再修改题目与训练数据");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const evaluationConfigHash = buildRaceEvaluationConfigDigest({
      harnessWeightKeyword: race.harnessWeightKeyword,
      harnessWeightReasoning: race.harnessWeightReasoning,
      keywordsJson: race.keywordsJson,
      taskDescription: input.taskDescription.trim(),
      taskPackageLabel: race.taskPackageLabel,
      tokenLimit: race.tokenLimit,
      weightCodeReview: race.weightCodeReview,
      weightKeywords: race.weightKeywords,
      weightReasoning: race.weightReasoning,
      weightTaskPassRate: race.weightTaskPassRate,
      weightTotalDialogue: race.weightTotalDialogue,
      weightTotalTask: race.weightTotalTask,
      weightTotalToken: race.weightTotalToken,
    });
    const updatedRace = await tx.race.update({
      where: {
        id: input.raceId,
      },
      data: {
        evaluationConfigHash,
        evaluationConfigVersion: race.evaluationConfigVersion + 1,
        taskDescription: input.taskDescription.trim(),
        trainingDataSummary: input.trainingDataSummary.trim(),
        lastLeaderboardSyncAt: null,
        lastShowcaseSyncAt: null,
      },
    });

    await tx.leaderboardEntry.deleteMany({
      where: { raceId: input.raceId },
    });

    await tx.runnerTask.deleteMany({
      where: { raceId: input.raceId, taskType: "PROGRESS_EVAL" },
    });

    await tx.notification.create({
      data: {
        raceId: input.raceId,
        title: "题目已更新",
        content: `Organizer 更新了 ${updatedRace.title} 的题目描述或训练数据说明，原进度投影已清空`,
        target: "ALL",
      },
    });

    return updatedRace;
  });

  deleteRaceSnapshot(input.raceId);
  return updated;
}

export async function updateOrganizerComment(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
  organizerComment: string;
}) {
  await assertManagedRaceActionAccess({
    allowSystem: input.allowSystem,
    errorMessage: "无权修改这场比赛",
    raceId: input.raceId,
    userId: input.organizerId,
  });

  return prisma.race.update({
    where: {
      id: input.raceId,
    },
    data: {
      organizerComment: input.organizerComment.trim(),
    },
  });
}

export async function clearRace(input: {
  organizerId: string;
  raceId: string;
}) {
  const race = await prisma.race.findUnique({
    where: {
      id: input.raceId,
    },
  });

  if (!race || race.organizerId !== input.organizerId) {
    throw new Error("无权清空这场比赛");
  }

  await prisma.race.delete({
    where: {
      id: input.raceId,
    },
  });
}

export async function archiveRace(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
}) {
  const race = await assertManagedRaceActionAccess({
    allowSystem: input.allowSystem,
    errorMessage: "无权归档这场比赛",
    raceId: input.raceId,
    userId: input.organizerId,
  });

  const phase = getRacePhase(race);
  if (
    phase !== "completed" &&
    phase !== "finished" &&
    phase !== "archived"
  ) {
    throw new Error("只能在比赛结束后归档");
  }

  return prisma.race.update({
    where: {
      id: input.raceId,
    },
    data: {
      status: "archived",
    },
  });
}

export async function updateRaceDisplayOptions(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
  displayShowTrainingData: boolean;
  displayShowOrganizerComment: boolean;
  displayShowTopHighlights: boolean;
  displayHighlightCount: number;
  displayShowRiderCode: boolean;
}) {
  const race = await assertManagedRaceActionAccess({
    allowSystem: input.allowSystem,
    errorMessage: "无权修改这场比赛",
    raceId: input.raceId,
    userId: input.organizerId,
  });

  const shouldClearTrainingData =
    race.displayShowTrainingData && !input.displayShowTrainingData;
  const shouldClearOrganizerComment =
    race.displayShowOrganizerComment && !input.displayShowOrganizerComment;
  const shouldClearHighlights =
    race.displayShowTopHighlights && !input.displayShowTopHighlights;
  const shouldClearRiderCode =
    race.displayShowRiderCode && !input.displayShowRiderCode;

  await prisma.$transaction(async (tx) => {
    await tx.race.update({
      where: { id: input.raceId },
      data: {
        displayShowTrainingData: input.displayShowTrainingData,
        displayShowOrganizerComment: input.displayShowOrganizerComment,
        displayShowTopHighlights: input.displayShowTopHighlights,
        displayHighlightCount: input.displayHighlightCount,
        displayShowRiderCode: input.displayShowRiderCode,
      },
    });

    if (shouldClearTrainingData) {
      await tx.race.update({
        where: { id: input.raceId },
        data: { trainingDataSummary: "" },
      });
    }

    if (shouldClearOrganizerComment) {
      await tx.race.update({
        where: { id: input.raceId },
        data: { organizerComment: "" },
      });
    }

    if (shouldClearHighlights) {
      await tx.ridingHighlight.deleteMany({
        where: { raceId: input.raceId },
      });
    }

    if (shouldClearRiderCode) {
      await tx.ridingHighlight.updateMany({
        where: { raceId: input.raceId },
        data: { codeSnippet: "Organizer 未公开 Rider 代码。" },
      });

      await tx.teamArchive.updateMany({
        where: { raceId: input.raceId },
        data: { codeContent: "" },
      });
    }
  });
}

export async function assertManagedRaceActionAccess(input: {
  allowSystem?: boolean;
  errorMessage: string;
  raceId: string;
  userId: string;
}) {
  const [race, user] = await Promise.all([
    prisma.race.findUnique({
      where: { id: input.raceId },
    }),
    prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        rolesJson: true,
      },
    }),
  ]);

  const userRoles = user ? parseRolesJson(user.rolesJson) : [];
  const canUseSystem =
    Boolean(input.allowSystem) && hasRole(userRoles, "ADMIN");

  if (!race || (race.organizerId !== input.userId && !canUseSystem)) {
    throw new Error(input.errorMessage);
  }

  return race;
}

export async function updateRaceTrackCalibration(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
  trackConfigJson: string;
}) {
  await assertManagedRaceActionAccess({
    allowSystem: input.allowSystem,
    errorMessage: "无权修改这场比赛的赛道校准",
    raceId: input.raceId,
    userId: input.organizerId,
  });

  const trackConfig = parseRaceTrackConfigJson(input.trackConfigJson);
  const updatedRace = await prisma.race.update({
    where: {
      id: input.raceId,
    },
    data: {
      trackConfigJson: serializeRaceTrackConfig(trackConfig),
    },
  });

  deleteRaceSnapshot(input.raceId);
  return updatedRace;
}

export function groupRacesByPhase<T extends { phase: string }>(races: T[]) {
  return {
    registration: races.filter((race) => race.phase === "registration"),
    preparation: races.filter((race) => race.phase === "preparation"),
    active: races.filter((race) => race.phase === "active"),
    frozen: races.filter((race) => race.phase === "frozen"),
    finished: races.filter(
      (race) =>
        race.phase === "finished" ||
        race.phase === "completed" ||
        race.phase === "archived",
    ),
  };
}

export type RaceListItem = Awaited<ReturnType<typeof listRaces>>[number];

function normalizeDateTimeInput(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }

  return new Date(value).toISOString();
}
