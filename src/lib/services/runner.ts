import {
  SubmissionStatus,
  type AgentType,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getRacePhase } from "@/lib/race-phase";
import {
  ACTIVE_RUNNER_TASK_STATUSES,
  buildRunnerTaskPayload,
  type RunnerTaskTypeValue,
} from "@/lib/runner-task-helpers";
import { parseKeywords } from "@/lib/services/scoring";
import { runnerPullSchema, runnerResultSchema } from "@/lib/validation";

type RunnerResultInput = ReturnType<typeof runnerResultSchema.parse>;

type LatestArtifactRecord = {
  id: string;
  raceId: string;
  teamId: string;
  submissionId: string;
  codeLabel: string;
  codeContent: string;
  recordLabel: null | string;
  ridingRecord: null | string;
  tokenUsed: number;
  agentType: AgentType;
  createdAt: Date;
};

export async function enqueueSubmissionTestTask(input: {
  artifactId: string;
  raceId: string;
  submissionId: string;
  teamId: string;
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
}) {
  await staleActiveRunnerTasks(input.tx, input.teamId, [
    "SUBMISSION_TEST",
    "PROGRESS_EVAL",
  ]);

  return input.tx.runnerTask.create({
    data: {
      artifactId: input.artifactId,
      raceId: input.raceId,
      submissionId: input.submissionId,
      taskType: "SUBMISSION_TEST",
      teamId: input.teamId,
    },
  });
}

export async function enqueueProgressEvalTasks(raceId: string) {
  const race = await prisma.race.findUnique({
    where: { id: raceId },
  });

  if (!race) {
    throw new Error("赛事不存在");
  }

  const phase = getRacePhase(race);
  if (phase !== "active" && phase !== "frozen") {
    throw new Error("只有比赛中或封榜期才能发起进度评测");
  }

  const latestArtifacts = await getLatestArtifactsForRace(raceId);
  if (latestArtifacts.length === 0) {
    throw new Error("当前还没有可评测提交");
  }

  await prisma.$transaction(async (tx) => {
    for (const artifact of latestArtifacts) {
      await staleActiveRunnerTasks(tx, artifact.teamId, ["PROGRESS_EVAL"]);
      await tx.runnerTask.create({
        data: {
          artifactId: artifact.id,
          raceId,
          submissionId: artifact.submissionId,
          taskType: "PROGRESS_EVAL",
          teamId: artifact.teamId,
        },
      });
    }
  });
}

export async function enqueueHarnessEvalTasks(raceId: string) {
  const race = await prisma.race.findUnique({
    where: { id: raceId },
  });

  if (!race) {
    throw new Error("赛事不存在");
  }

  if (getRacePhase(race) !== "finished") {
    throw new Error("只有比赛结束后才能发起 Harness 评测");
  }

  const latestArtifacts = await getLatestArtifactsForRace(raceId);
  const harnessArtifacts = latestArtifacts.filter(
    (artifact) => artifact.ridingRecord,
  );

  if (harnessArtifacts.length === 0) {
    throw new Error("当前没有可用于 Harness 评测的 Riding Record");
  }

  await prisma.$transaction(async (tx) => {
    for (const artifact of harnessArtifacts) {
      await staleActiveRunnerTasks(tx, artifact.teamId, ["HARNESS_EVAL"]);
      await tx.runnerTask.create({
        data: {
          artifactId: artifact.id,
          raceId,
          submissionId: artifact.submissionId,
          taskType: "HARNESS_EVAL",
          teamId: artifact.teamId,
        },
      });
    }
  });
}

export async function pullRunnerTask(raceId: string) {
  const parsed = runnerPullSchema.parse({ raceId });

  const task = await prisma.runnerTask.findFirst({
    where: {
      raceId: parsed.raceId,
      status: "QUEUED",
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      artifact: true,
      race: true,
      team: true,
    },
  });

  if (!task) {
    return null;
  }

  const claimed = await prisma.runnerTask.update({
    where: {
      id: task.id,
    },
    data: {
      claimedAt: new Date(),
      status: "CLAIMED",
    },
    include: {
      artifact: true,
      race: true,
      team: true,
    },
  });

  if (claimed.taskType === "SUBMISSION_TEST") {
    await prisma.submission.update({
      where: { id: claimed.submissionId },
      data: {
        pulledAt: new Date(),
        status: SubmissionStatus.PULLED,
      },
    });
  }

  const payload = buildRunnerTaskPayload(claimed.taskType, {
    agentType: claimed.artifact.agentType,
    codeContent: claimed.artifact.codeContent,
    codeLabel: claimed.artifact.codeLabel,
    recordLabel: claimed.artifact.recordLabel,
    ridingRecord: claimed.artifact.ridingRecord,
    tokenUsed: claimed.artifact.tokenUsed,
  });

  return {
    taskId: claimed.id,
    taskType: toRunnerWireTaskType(claimed.taskType),
    raceId: claimed.raceId,
    teamId: claimed.teamId,
    teamName: claimed.team.name,
    submissionId: claimed.submissionId,
    createdAt: claimed.createdAt.toISOString(),
    metadata: {
      attemptNo: 1,
      fileName: claimed.artifact.codeLabel,
      fileSize: Buffer.byteLength(claimed.artifact.codeContent, "utf8"),
      status: "queued",
      uploadedAt: claimed.artifact.createdAt.toISOString(),
    },
    taskPackageLabel: claimed.race.taskPackageLabel,
    taskDescription: claimed.race.taskDescription,
    keywords: parseKeywords(claimed.race.keywordsJson),
    ...payload,
  };
}

export async function completeRunnerTask(input: RunnerResultInput) {
  const task = await prisma.runnerTask.findUnique({
    where: { id: input.taskId },
    include: {
      artifact: true,
      race: true,
      submission: true,
      team: true,
    },
  });

  if (!task) {
    throw new Error("任务不存在");
  }

  if (task.submissionId !== input.submissionId) {
    throw new Error("任务与提交不匹配");
  }

  if (task.status === "STALE") {
    throw new Error("任务已失效，不能再回传结果");
  }

  if (task.status !== "CLAIMED") {
    throw new Error("只能回传已拉取任务的结果");
  }

  await prisma.$transaction(async (tx) => {
    await tx.runnerTask.update({
      where: { id: task.id },
      data: {
        finishedAt: input.finishedAt ? new Date(input.finishedAt) : new Date(),
        resultHash: input.resultHash ?? null,
        runnerComment: input.runnerComment || null,
        score: input.score,
        status: input.status === "succeeded" ? "SUCCEEDED" : "FAILED",
      },
    });

    if (input.status === "failed") {
      if (task.taskType === "SUBMISSION_TEST") {
        await tx.submission.update({
          where: { id: task.submissionId },
          data: {
            runnerComment: input.runnerComment || null,
            runnerStatus: "failed",
            scoredAt: new Date(),
            status: SubmissionStatus.FAILED,
          },
        });
      }
      return;
    }

    switch (task.taskType) {
      case "SUBMISSION_TEST":
        await projectSubmissionTestSuccess(tx, task, input);
        break;
      case "PROGRESS_EVAL":
        await projectProgressEvalSuccess(tx, task, input);
        break;
      case "HARNESS_EVAL":
        await projectHarnessEvalSuccess(tx, task, input);
        break;
    }
  });
}

async function projectSubmissionTestSuccess(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  task: Awaited<ReturnType<typeof prisma.runnerTask.findUnique>> & {
    artifact: LatestArtifactRecord;
    race: { id: string };
    submission: { id: string };
    team: { id: string };
  },
  input: RunnerResultInput,
) {
  await tx.submission.update({
    where: { id: task.submissionId },
    data: {
      codeContent: null,
      ridingRecord: null,
      runnerComment: input.runnerComment || null,
      runnerStatus: "succeeded",
      scoredAt: new Date(),
      status: SubmissionStatus.SCORED,
      totalScore: input.score,
      progress: input.progress ?? null,
    },
  });
}

async function projectProgressEvalSuccess(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  task: Awaited<ReturnType<typeof prisma.runnerTask.findUnique>> & {
    artifact: LatestArtifactRecord;
    race: { id: string };
    submission: { id: string; agentType: AgentType };
    team: { id: string };
  },
  input: RunnerResultInput,
) {
  await tx.teamArchive.upsert({
    where: {
      raceId_teamId: {
        raceId: task.raceId,
        teamId: task.teamId,
      },
    },
    update: {
      antiCheatPenalty: 0,
      codeContent: task.artifact.codeContent,
      codeLabel: task.artifact.codeLabel,
      dialogueScore: null,
      keywordScore: null,
      reasoningScore: null,
      recordLabel: task.artifact.recordLabel,
      ridingRecord: task.artifact.ridingRecord,
      submissionId: task.submissionId,
      taskScore: null,
      tokenScore: null,
      tokenUsed: task.artifact.tokenUsed,
      totalScore: input.score,
      progress: input.progress ?? null,
    },
    create: {
      agentType: task.artifact.agentType,
      antiCheatPenalty: 0,
      codeContent: task.artifact.codeContent,
      codeLabel: task.artifact.codeLabel,
      dialogueScore: null,
      keywordScore: null,
      raceId: task.raceId,
      reasoningScore: null,
      recordLabel: task.artifact.recordLabel,
      ridingRecord: task.artifact.ridingRecord,
      submissionId: task.submissionId,
      taskScore: null,
      teamId: task.teamId,
      tokenScore: null,
      tokenUsed: task.artifact.tokenUsed,
      totalScore: input.score,
      progress: input.progress ?? null,
    },
  });

  await tx.leaderboardEntry.upsert({
    where: {
      raceId_teamId: {
        raceId: task.raceId,
        teamId: task.teamId,
      },
    },
    update: {
      agentType: task.artifact.agentType,
      dialogueScore: null,
      submissionId: task.submissionId,
      taskScore: null,
      tokenScore: null,
      totalScore: input.score,
      progress: input.progress ?? null,
    },
    create: {
      agentType: task.artifact.agentType,
      dialogueScore: null,
      raceId: task.raceId,
      submissionId: task.submissionId,
      taskScore: null,
      teamId: task.teamId,
      tokenScore: null,
      totalScore: input.score,
      progress: input.progress ?? null,
    },
  });

  await tx.race.update({
    where: { id: task.raceId },
    data: {
      lastLeaderboardSyncAt: new Date(),
    },
  });
}

async function projectHarnessEvalSuccess(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  task: Awaited<ReturnType<typeof prisma.runnerTask.findUnique>> & {
    artifact: LatestArtifactRecord;
    race: { id: string; displayHighlightCount: number; displayShowRiderCode: boolean; harnessWeightReasoning: number; harnessWeightKeyword: number };
    submission: { id: string; agentType: AgentType };
    team: { id: string };
  },
  input: RunnerResultInput,
) {
  const { reasoningScore, keywordScore } = input;
  const harnessScore =
    reasoningScore != null && keywordScore != null
      ? computeHarnessScore(
          reasoningScore,
          keywordScore,
          task.race.harnessWeightReasoning,
          task.race.harnessWeightKeyword,
        )
      : input.score;

  await tx.harnessEntry.upsert({
    where: {
      raceId_teamId: {
        raceId: task.raceId,
        teamId: task.teamId,
      },
    },
    update: {
      harnessScore,
      reasoningScore: reasoningScore ?? null,
      keywordScore: keywordScore ?? null,
    },
    create: {
      harnessScore,
      reasoningScore: reasoningScore ?? null,
      keywordScore: keywordScore ?? null,
      raceId: task.raceId,
      teamId: task.teamId,
    },
  });

  const successfulHarnessTasks = await tx.runnerTask.findMany({
    where: {
      raceId: task.raceId,
      status: "SUCCEEDED",
      taskType: "HARNESS_EVAL",
    },
    include: {
      artifact: true,
      team: true,
    },
    orderBy: [
      { score: "desc" },
      { createdAt: "asc" },
    ],
  });

  await tx.ridingHighlight.deleteMany({
    where: { raceId: task.raceId },
  });

  if (successfulHarnessTasks.length > 0) {
    await tx.ridingHighlight.createMany({
      data: successfulHarnessTasks
        .slice(0, task.race.displayHighlightCount)
        .map((runnerTask) => ({
          agentType: runnerTask.artifact.agentType,
          codeSnippet: task.race.displayShowRiderCode
            ? extractCodeSnippetSafe(runnerTask.artifact.codeContent)
            : "Organizer 未公开 Rider 代码。",
          excerpt: extractHighlightSafe(runnerTask.artifact.ridingRecord),
          raceId: task.raceId,
          score: runnerTask.score ?? 0,
          teamId: runnerTask.teamId,
        })),
    });
  }

  await tx.race.update({
    where: { id: task.raceId },
    data: {
      lastShowcaseSyncAt: new Date(),
    },
  });
}

async function staleActiveRunnerTasks(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  teamId: string,
  taskTypes: RunnerTaskTypeValue[],
) {
  await tx.runnerTask.updateMany({
    where: {
      status: {
        in: ACTIVE_RUNNER_TASK_STATUSES,
      },
      taskType: {
        in: taskTypes,
      },
      teamId,
    },
    data: {
      status: "STALE",
    },
  });
}

async function getLatestArtifactsForRace(
  raceId: string,
): Promise<LatestArtifactRecord[]> {
  const artifacts = await prisma.submissionArtifact.findMany({
    where: { raceId },
    orderBy: [
      { teamId: "asc" },
      { createdAt: "desc" },
    ],
  });

  const latestByTeam = new Map<string, LatestArtifactRecord>();
  for (const artifact of artifacts) {
    if (!latestByTeam.has(artifact.teamId)) {
      latestByTeam.set(artifact.teamId, artifact);
    }
  }

  return [...latestByTeam.values()];
}

function toRunnerWireTaskType(taskType: RunnerTaskTypeValue) {
  switch (taskType) {
    case "SUBMISSION_TEST":
      return "submission_test";
    case "PROGRESS_EVAL":
      return "progress_eval";
    case "HARNESS_EVAL":
      return "harness_eval";
  }
}

function extractHighlightSafe(record: null | string): string {
  if (!record) {
    return "未提供 Riding Record。";
  }

  const lines = record
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (lines[0] ?? record.trim()).slice(0, 140);
}

function extractCodeSnippetSafe(code: string): string {
  return code
    .split(/\r?\n/)
    .slice(0, 8)
    .join("\n");
}

function computeHarnessScore(
  reasoningScore: number,
  keywordScore: number,
  weightReasoning: number,
  weightKeyword: number,
): number {
  const safeR = weightReasoning > 0 ? weightReasoning : 1;
  const safeK = weightKeyword > 0 ? weightKeyword : 1;
  const total = safeR + safeK;
  return Math.round((reasoningScore * (safeR / total) + keywordScore * (safeK / total)) * 10) / 10;
}
