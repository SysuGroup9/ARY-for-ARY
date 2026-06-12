import { buildRankedLeaderboardEntries } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";
import { getRacePhase } from "@/lib/race-phase";
import { normalizeWeights, parseKeywords } from "@/lib/services/scoring";
import { createRaceSchema } from "@/lib/validation";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function listRaces() {
  const races = await prisma.race.findMany({
    include: {
      organizer: true,
      teams: {
        include: {
          members: true,
        },
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return races.map((race) => ({
    ...race,
    leaderboardEntries: buildRankedLeaderboardEntries(race.leaderboardEntries),
    phase: getRacePhase(race),
    keywords: parseKeywords(race.keywordsJson),
  }));
}

export async function getRaceById(raceId: string) {
  const races = await listRaces();
  return races.find((race) => race.id === raceId) ?? null;
}

export async function createRace(organizerId: string, formData: FormData) {
  // Handle background image upload (outside Zod — it's a File, not a text field)
  let trackBgImageUrl: string | null = null;
  const bgFile = formData.get("trackBgImage");
  if (bgFile instanceof File && bgFile.size > 0) {
    const rawExt = bgFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp"].includes(rawExt) ? rawExt : "jpg";
    const filename = `${crypto.randomUUID()}.${safeExt}`;
    const dir = path.join(process.cwd(), "public", "jumbotron-bg");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), Buffer.from(await bgFile.arrayBuffer()));
    trackBgImageUrl = `/jumbotron-bg/${filename}`;
  }

  const parsed = createRaceSchema.parse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    taskPackageLabel: formData.get("taskPackageLabel"),
    taskDescription: formData.get("taskDescription"),
    trainingDataSummary: formData.get("trainingDataSummary"),
    hasTrainingData: formData.get("hasTrainingData") === "on",
    evaluationNotes: formData.get("evaluationNotes"),
    keywordsText: formData.get("keywordsText"),
    tokenLimit: formData.get("tokenLimit"),
    signupStart: normalizeDateTimeInput(formData.get("signupStart")),
    signupEnd: normalizeDateTimeInput(formData.get("signupEnd")),
    raceStart: normalizeDateTimeInput(formData.get("raceStart")),
    raceEnd: normalizeDateTimeInput(formData.get("raceEnd")),
    enableFreeze: formData.get("enableFreeze") === "on",
    freezeMinutesBeforeEnd: formData.get("freezeMinutesBeforeEnd"),
    updateGranularityMinutes: formData.get("updateGranularityMinutes"),
    maxTeamSize: formData.get("maxTeamSize"),
    submissionIntervalHours: formData.get("submissionIntervalHours"),
    cloudStudioUrl: formData.get("cloudStudioUrl"),
    displayShowTrainingData: formData.get("displayShowTrainingData") === "on",
    displayShowOrganizerComment: formData.get("displayShowOrganizerComment") === "on",
    displayShowTopHighlights: formData.get("displayShowTopHighlights") === "on",
    displayHighlightCount: formData.get("displayHighlightCount"),
    displayShowRiderCode: formData.get("displayShowRiderCode") === "on",
    weightTaskPassRate: formData.get("weightTaskPassRate"),
    weightCodeReview: formData.get("weightCodeReview"),
    weightReasoning: formData.get("weightReasoning"),
    weightKeywords: formData.get("weightKeywords"),
    weightTotalTask: formData.get("weightTotalTask"),
    weightTotalToken: formData.get("weightTotalToken"),
    weightTotalDialogue: formData.get("weightTotalDialogue"),
    harnessWeightReasoning: formData.get("harnessWeightReasoning"),
    harnessWeightKeyword: formData.get("harnessWeightKeyword"),
    trackId: formData.get("trackId"),
    trackCenterlineJson: formData.get("trackCenterlineJson"),
    trackDirection: formData.get("trackDirection"),
    trackStartFinishS: formData.get("trackStartFinishS"),
    checkpointCount: formData.get("checkpointCount"),
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

  return prisma.race.create({
    data: {
      organizerId,
      title: parsed.title,
      summary: parsed.summary,
      taskPackageLabel: parsed.taskPackageLabel,
      taskDescription: parsed.taskDescription,
      trainingDataSummary: parsed.trainingDataSummary,
      hasTrainingData: parsed.hasTrainingData,
      evaluationNotes: parsed.evaluationNotes,
      keywordsJson: JSON.stringify(parseKeywords(parsed.keywordsText)),
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
      displayShowTrainingData: parsed.displayShowTrainingData,
      displayShowOrganizerComment: parsed.displayShowOrganizerComment,
      displayShowTopHighlights: parsed.displayShowTopHighlights,
      displayHighlightCount: parsed.displayHighlightCount,
      displayShowRiderCode: parsed.displayShowRiderCode,
      weightTaskPassRate: weights.taskPassRate,
      weightCodeReview: weights.codeReview,
      weightReasoning: weights.reasoning,
      weightKeywords: weights.keywords,
      weightTotalTask: weights.totalTask,
      weightTotalToken: weights.totalToken,
      weightTotalDialogue: weights.totalDialogue,
      harnessWeightReasoning: parsed.harnessWeightReasoning,
      harnessWeightKeyword: parsed.harnessWeightKeyword,
      trackId: parsed.trackId,
      trackCenterlineJson: parsed.trackCenterlineJson ?? null,
      trackDirection: parsed.trackDirection,
      trackStartFinishS: parsed.trackStartFinishS,
      checkpointCount: parsed.checkpointCount,
      trackBgImageUrl,
    },
  });
}

export async function updateRaceContent(input: {
  organizerId: string;
  raceId: string;
  taskDescription: string;
  trainingDataSummary: string;
}) {
  const race = await prisma.race.findUnique({
    where: {
      id: input.raceId,
    },
  });

  if (!race || race.organizerId !== input.organizerId) {
    throw new Error("无权修改这场比赛");
  }

  if (getRacePhase(race) === "finished") {
    throw new Error("比赛结束后不能再修改题目与训练数据");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.race.update({
      where: {
        id: input.raceId,
      },
      data: {
        taskDescription: input.taskDescription.trim(),
        trainingDataSummary: input.trainingDataSummary.trim(),
      },
    });

    await tx.notification.create({
      data: {
        raceId: input.raceId,
        title: "题目已更新",
        content: `Organizer 更新了 ${updated.title} 的题目描述或训练数据说明`,
        target: "ALL",
      },
    });

    return updated;
  });
}

export async function updateOrganizerComment(input: {
  organizerId: string;
  raceId: string;
  organizerComment: string;
}) {
  const race = await prisma.race.findUnique({
    where: {
      id: input.raceId,
    },
  });

  if (!race || race.organizerId !== input.organizerId) {
    throw new Error("无权修改这场比赛");
  }

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

export async function updateRaceDisplayOptions(input: {
  organizerId: string;
  raceId: string;
  displayShowTrainingData: boolean;
  displayShowOrganizerComment: boolean;
  displayShowTopHighlights: boolean;
  displayHighlightCount: number;
  displayShowRiderCode: boolean;
}) {
  const race = await prisma.race.findUnique({
    where: { id: input.raceId },
  });

  if (!race || race.organizerId !== input.organizerId) {
    throw new Error("无权修改这场比赛");
  }

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

export function groupRacesByPhase<T extends { phase: string }>(races: T[]) {
  return {
    registration: races.filter((race) => race.phase === "registration"),
    preparation: races.filter((race) => race.phase === "preparation"),
    active: races.filter((race) => race.phase === "active"),
    frozen: races.filter((race) => race.phase === "frozen"),
    finished: races.filter((race) => race.phase === "finished"),
  };
}

export type RaceListItem = Awaited<ReturnType<typeof listRaces>>[number];

function normalizeDateTimeInput(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }

  return new Date(value).toISOString();
}
