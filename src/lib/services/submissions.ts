import {
  AgentType,
  SubmissionStatus,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getRacePhase } from "@/lib/race-phase";
import {
  buildHarnessScore,
  buildScoreResult,
  extractCodeSnippet,
  extractHighlight,
  parseKeywords,
} from "@/lib/services/scoring";
import {
  createSubmissionSchema,
  runnerScoreSchema,
} from "@/lib/validation";

export async function createSubmission(riderId: string, formData: FormData) {
  const parsed = createSubmissionSchema.parse({
    raceId: formData.get("raceId"),
    codeLabel: formData.get("codeLabel"),
    codeContent: formData.get("codeContent"),
    recordLabel: formData.get("recordLabel"),
    ridingRecord: formData.get("ridingRecord"),
    tokenUsed: formData.get("tokenUsed"),
    agentType: formData.get("agentType"),
  });

  const team = await prisma.team.findFirst({
    where: {
      raceId: parsed.raceId,
      captainId: riderId,
    },
  });

  if (!team) {
    throw new Error("请先报名参赛");
  }

  const race = await prisma.race.findUnique({
    where: {
      id: parsed.raceId,
    },
  });

  if (!race) {
    throw new Error("赛事不存在");
  }

  const phase = getRacePhase(race);
  if (phase !== "active" && phase !== "frozen") {
    throw new Error("只有比赛中或封榜期才能提交");
  }

  const lastSubmission = await prisma.submission.findFirst({
    where: {
      teamId: team.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (lastSubmission) {
    const cooldownMs = race.submissionIntervalHours * 60 * 60 * 1000;
    const elapsed = Date.now() - lastSubmission.createdAt.getTime();
    if (elapsed < cooldownMs) {
      const minutes = Math.ceil((cooldownMs - elapsed) / 60000);
      throw new Error(`提交过于频繁，请 ${minutes} 分钟后再试`);
    }
  }

  return prisma.submission.create({
    data: {
      raceId: parsed.raceId,
      teamId: team.id,
      codeLabel: parsed.codeLabel,
      codeContent: parsed.codeContent,
      recordLabel: parsed.recordLabel,
      ridingRecord: parsed.ridingRecord,
      tokenUsed: parsed.tokenUsed,
      agentType: parsed.agentType,
      status: SubmissionStatus.QUEUED,
    },
  });
}

export async function pullRunnerTask(raceId: string) {
  const task = await prisma.submission.findFirst({
    where: {
      raceId,
      status: SubmissionStatus.QUEUED,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      team: true,
      race: true,
    },
  });

  if (!task) {
    return null;
  }

  const updated = await prisma.submission.update({
    where: {
      id: task.id,
    },
    data: {
      status: SubmissionStatus.PULLED,
      pulledAt: new Date(),
    },
    include: {
      team: true,
      race: true,
    },
  });

  return {
    submissionId: updated.id,
    teamId: updated.teamId,
    teamName: updated.team.name,
    taskPackageLabel: updated.race.taskPackageLabel,
    taskDescription: updated.race.taskDescription,
    keywords: parseKeywords(updated.race.keywordsJson),
    codeLabel: updated.codeLabel,
    codeContent: updated.codeContent ?? "",
    recordLabel: updated.recordLabel,
    ridingRecord: updated.ridingRecord ?? "",
    tokenUsed: updated.tokenUsed,
    agentType: updated.agentType,
  };
}

export async function scoreRunnerTask(formData: FormData) {
  const parsed = runnerScoreSchema.parse({
    submissionId: formData.get("submissionId"),
    passRate: formData.get("passRate"),
    codeReviewScore: formData.get("codeReviewScore"),
    reasoningScore: formData.get("reasoningScore"),
    runnerComment: formData.get("runnerComment"),
    status: formData.get("status"),
  });

  const submission = await prisma.submission.findUnique({
    where: {
      id: parsed.submissionId,
    },
    include: {
      team: true,
      race: true,
    },
  });

  if (!submission || !submission.codeContent || !submission.ridingRecord) {
    throw new Error("未找到可评分的提交");
  }

  if (submission.status !== SubmissionStatus.PULLED) {
    throw new Error("只能回传已拉取任务的结果");
  }

  const artifactCodeContent = submission.codeContent;
  const artifactRidingRecord = submission.ridingRecord;

  const result = buildScoreResult({
    tokenLimit: submission.race.tokenLimit,
    keywords: parseKeywords(submission.race.keywordsJson),
    weights: {
      taskPassRate: submission.race.weightTaskPassRate,
      codeReview: submission.race.weightCodeReview,
      reasoning: submission.race.weightReasoning,
      keywords: submission.race.weightKeywords,
      totalTask: submission.race.weightTotalTask,
      totalToken: submission.race.weightTotalToken,
      totalDialogue: submission.race.weightTotalDialogue,
    },
    artifact: {
      codeLabel: submission.codeLabel,
      codeContent: artifactCodeContent,
      recordLabel: submission.recordLabel,
      ridingRecord: artifactRidingRecord,
      tokenUsed: submission.tokenUsed,
      agentType: submission.agentType,
    },
    runner: parsed,
  });

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: {
        id: submission.id,
      },
      data: {
        status: SubmissionStatus.SCORED,
        passRate: result.passRate,
        codeReviewScore: result.codeReviewScore,
        reasoningScore: result.reasoningScore,
        keywordScore: result.keywordScore,
        tokenScore: result.tokenScore,
        taskScore: result.taskScore,
        dialogueScore: result.dialogueScore,
        totalScore: result.totalScore,
        antiCheatPenalty: result.antiCheatPenalty,
        runnerComment: result.runnerComment,
        runnerStatus: result.runnerStatus,
        scoredAt: new Date(),
        codeContent: null,
        ridingRecord: null,
      },
    });

    const previousArchive = await tx.teamArchive.findUnique({
      where: {
        raceId_teamId: {
          raceId: submission.raceId,
          teamId: submission.teamId,
        },
      },
    });

    if (!previousArchive || previousArchive.totalScore < result.totalScore) {
      await tx.teamArchive.upsert({
        where: {
          raceId_teamId: {
            raceId: submission.raceId,
            teamId: submission.teamId,
          },
        },
        update: {
          submissionId: submission.id,
          codeLabel: submission.codeLabel,
          codeContent: artifactCodeContent,
          recordLabel: submission.recordLabel,
          ridingRecord: artifactRidingRecord,
          tokenUsed: submission.tokenUsed,
          agentType: submission.agentType,
          taskScore: result.taskScore,
          dialogueScore: result.dialogueScore,
          tokenScore: result.tokenScore,
          reasoningScore: result.reasoningScore,
          keywordScore: result.keywordScore,
          totalScore: result.totalScore,
          antiCheatPenalty: result.antiCheatPenalty,
        },
        create: {
          raceId: submission.raceId,
          teamId: submission.teamId,
          submissionId: submission.id,
          codeLabel: submission.codeLabel,
          codeContent: artifactCodeContent,
          recordLabel: submission.recordLabel,
          ridingRecord: artifactRidingRecord,
          tokenUsed: submission.tokenUsed,
          agentType: submission.agentType,
          taskScore: result.taskScore,
          dialogueScore: result.dialogueScore,
          tokenScore: result.tokenScore,
          reasoningScore: result.reasoningScore,
          keywordScore: result.keywordScore,
          totalScore: result.totalScore,
          antiCheatPenalty: result.antiCheatPenalty,
        },
      });
    }
  });
}

export async function publishLeaderboard(raceId: string) {
  const archives = await prisma.teamArchive.findMany({
    where: {
      raceId,
    },
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
  });

  await prisma.$transaction(async (tx) => {
    await tx.leaderboardEntry.deleteMany({
      where: {
        raceId,
      },
    });

    if (archives.length > 0) {
      await tx.leaderboardEntry.createMany({
        data: archives.map((archive) => ({
          raceId,
          teamId: archive.teamId,
          submissionId: archive.submissionId,
          totalScore: archive.totalScore,
          taskScore: archive.taskScore,
          tokenScore: archive.tokenScore,
          dialogueScore: archive.dialogueScore,
          agentType: archive.agentType,
        })),
      });
    }

    await tx.race.update({
      where: {
        id: raceId,
      },
      data: {
        lastLeaderboardSyncAt: new Date(),
      },
    });
  });
}

export async function publishShowcase(raceId: string) {
  const race = await prisma.race.findUnique({
    where: {
      id: raceId,
    },
  });

  if (!race) {
    throw new Error("赛事不存在");
  }

  if (getRacePhase(race) !== "finished") {
    throw new Error("只有比赛结束后才能生成赛后展示");
  }

  const archives = await prisma.teamArchive.findMany({
    where: {
      raceId,
    },
    include: {
      team: true,
    },
    orderBy: {
      totalScore: "desc",
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.harnessEntry.deleteMany({
      where: {
        raceId,
      },
    });

    await tx.ridingHighlight.deleteMany({
      where: {
        raceId,
      },
    });

    if (archives.length > 0) {
      await tx.harnessEntry.createMany({
        data: archives.map((archive) => ({
          raceId,
          teamId: archive.teamId,
          harnessScore: buildHarnessScore(
            archive.reasoningScore,
            archive.keywordScore,
          ),
          reasoningScore: archive.reasoningScore,
          keywordScore: archive.keywordScore,
        })),
      });

      if (race.displayShowTopHighlights) {
        await tx.ridingHighlight.createMany({
          data: archives.slice(0, race.displayHighlightCount).map((archive) => ({
            raceId,
            teamId: archive.teamId,
            score: archive.totalScore,
            agentType: archive.agentType,
            excerpt: extractHighlight(archive.ridingRecord),
            codeSnippet: race.displayShowRiderCode
              ? extractCodeSnippet(archive.codeContent)
              : "Organizer 未公开 Rider 代码。",
          })),
        });
      }
    }

    await tx.race.update({
      where: {
        id: raceId,
      },
      data: {
        lastShowcaseSyncAt: new Date(),
      },
    });
  });
}

export function getAgentLabel(agent: AgentType): string {
  switch (agent) {
    case AgentType.CLAUDE:
      return "Claude";
    case AgentType.COPILOT:
      return "Copilot";
    case AgentType.DEEPSEEK:
      return "DeepSeek";
    case AgentType.ZHIPU:
      return "Zhipu";
    case AgentType.OPENAI:
      return "OpenAI";
    case AgentType.CUSTOM:
      return "Custom";
    default:
      return "Unknown";
  }
}
