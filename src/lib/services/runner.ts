import {
  SubmissionStatus,
  type AgentType,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getRacePhase } from "@/lib/race-phase";
import {
  verifyRaceEvaluationConfigIntegrity,
  verifyRaceChallengeIntegrity,
  verifySubmissionArtifactIntegrity,
} from "@/lib/material-integrity-helpers";
import {
  ACTIVE_RUNNER_TASK_STATUSES,
  buildRunnerTaskPayload,
  type RunnerTaskTypeValue,
} from "@/lib/runner-task-helpers";
import {
  buildScoreResult,
  computeHarnessScore,
  parseKeywords,
} from "@/lib/services/scoring";
import { recordSecurityAudit } from "@/lib/services/security-audit";
import { runnerPullSchema, runnerResultSchema } from "@/lib/validation";

type RunnerResultInput = ReturnType<typeof runnerResultSchema.parse>;

type LatestArtifactRecord = {
  id: string;
  raceId: string;
  registrationId: null | string;
  teamId: string;
  submissionId: string;
  codeLabel: string;
  codeContent: string;
  codeContentHash: string;
  recordLabel: null | string;
  ridingRecord: null | string;
  ridingRecordHash: string;
  submitterBindingJson: string;
  tokenUsed: number;
  agentType: AgentType;
  createdAt: Date;
};

type RunnerArtifactVerificationStage = "runner_complete" | "runner_pull";

type RunnerTaskArtifactContext = {
  artifact: LatestArtifactRecord;
  raceId: string;
  registration: null | { userId: string };
  registrationId: null | string;
  submissionId: string;
  taskId: string;
  taskType: RunnerTaskTypeValue;
  teamId: string;
};

type RunnerAuditWriter =
  | typeof prisma
  | Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function enqueueProgressEvalTasks(raceId: string) {
  const race = await prisma.race.findUnique({
    where: { id: raceId },
  });

  if (!race) {
    throw new Error("赛事不存在");
  }

  const phase = getRacePhase(race);
  if (
    phase !== "active" &&
    phase !== "frozen" &&
    phase !== "running" &&
    phase !== "submitting"
  ) {
    throw new Error("只有比赛中、封榜期或提交中阶段才能发起进度评测");
  }

  const latestArtifacts = await getLatestArtifactsForRace(raceId);
  if (latestArtifacts.length === 0) {
    throw new Error("当前还没有可评测提交");
  }

  await prisma.$transaction(async (tx) => {
    for (const artifact of latestArtifacts) {
      await staleActiveRunnerTasks(
        tx,
        {
          registrationId: artifact.registrationId,
          teamId: artifact.teamId,
        },
        ["PROGRESS_EVAL"],
      );
      await tx.runnerTask.create({
        data: {
          artifactId: artifact.id,
          raceId,
          registrationId: artifact.registrationId,
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

  const phase = getRacePhase(race);
  if (phase !== "finished" && phase !== "completed") {
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
      await enqueueHarnessEvalTaskForArtifact(tx, artifact);
    }
  });
}

export async function enqueueHarnessEvalTaskForArtifact(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  artifact: LatestArtifactRecord,
) {
  await staleActiveRunnerTasks(
    tx,
    {
      registrationId: artifact.registrationId,
      teamId: artifact.teamId,
    },
    ["HARNESS_EVAL"],
  );
  return tx.runnerTask.create({
    data: {
      artifactId: artifact.id,
      raceId: artifact.raceId,
      registrationId: artifact.registrationId,
      submissionId: artifact.submissionId,
      taskType: "HARNESS_EVAL",
      teamId: artifact.teamId,
    },
  });
}

export async function pullRunnerTask(raceId: string) {
  const parsed = runnerPullSchema.parse({ raceId });

  while (true) {
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
        registration: true,
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
        registration: true,
        team: true,
      },
    });

    const runnerTaskArtifactContext = {
      artifact: claimed.artifact,
      raceId: claimed.raceId,
      registration: claimed.registration,
      registrationId: claimed.registrationId,
      submissionId: claimed.submissionId,
      taskId: claimed.id,
      taskType: claimed.taskType,
      teamId: claimed.teamId,
    } satisfies RunnerTaskArtifactContext;

    const challengeVerification = await verifyRaceChallengeIntegrity({
      race: claimed.race,
    });

    if (!challengeVerification.ok) {
      await prisma.$transaction(async (tx) => {
        await failRunnerTaskRaceChallengeVerification(
          tx,
          runnerTaskArtifactContext,
          challengeVerification,
        );
      });

      continue;
    }

    await recordRunnerTaskRaceChallengeVerification(prisma, {
      task: runnerTaskArtifactContext,
      verification: { ok: true },
    });

    const evaluationConfigVerification = verifyRaceEvaluationConfigIntegrity({
      race: claimed.race,
    });

    if (!evaluationConfigVerification.ok) {
      await prisma.$transaction(async (tx) => {
        await failRunnerTaskRaceEvaluationConfigVerification(
          tx,
          runnerTaskArtifactContext,
          evaluationConfigVerification,
        );
      });

      continue;
    }

    await recordRunnerTaskRaceEvaluationConfigVerification(prisma, {
      task: runnerTaskArtifactContext,
      verification: { ok: true },
    });

    const verification = verifyRunnerTaskArtifact(runnerTaskArtifactContext);

    if (!verification.ok) {
      await prisma.$transaction(async (tx) => {
        await failRunnerTaskArtifactVerification(
          tx,
          runnerTaskArtifactContext,
          verification,
          "runner_pull",
        );
      });

      continue;
    }

    await recordRunnerTaskArtifactVerification(prisma, {
      stage: "runner_pull",
      task: runnerTaskArtifactContext,
      verification: { ok: true },
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
      evaluationConfigHash: claimed.race.evaluationConfigHash,
      evaluationConfigVersion: claimed.race.evaluationConfigVersion,
      taskPackageLabel: claimed.race.taskPackageLabel,
      taskDescription: claimed.race.taskDescription,
      keywords: parseKeywords(claimed.race.keywordsJson),
      ...payload,
    };
  }
}

export async function completeRunnerTask(input: RunnerResultInput) {
  const task = await prisma.runnerTask.findUnique({
    where: { id: input.taskId },
    include: {
      artifact: true,
      race: true,
      registration: true,
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
    const runnerTaskArtifactContext = {
      artifact: task.artifact,
      raceId: task.raceId,
      registration: task.registration,
      registrationId: task.registrationId,
      submissionId: task.submissionId,
      taskId: task.id,
      taskType: task.taskType,
      teamId: task.teamId,
    } satisfies RunnerTaskArtifactContext;

    if (input.status === "succeeded") {
      const verification = verifyRunnerTaskArtifact(runnerTaskArtifactContext);

      if (!verification.ok) {
        await failRunnerTaskArtifactVerification(
          tx,
          runnerTaskArtifactContext,
          verification,
          "runner_complete",
        );
        return;
      }
    }

    await tx.runnerTask.update({
      where: { id: task.id },
      data: {
        finishedAt: input.finishedAt ? new Date(input.finishedAt) : new Date(),
        resultHash: input.resultHash ?? null,
        runnerComment: input.runnerComment || null,
        score: 0,
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

    await recordRunnerTaskArtifactVerification(tx, {
      stage: "runner_complete",
      task: runnerTaskArtifactContext,
      verification: { ok: true },
    });

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
    race: {
      id: string;
      tokenLimit: number;
      keywordsJson: string;
      weightTaskPassRate: number;
      weightCodeReview: number;
      weightReasoning: number;
      weightKeywords: number;
      weightTotalTask: number;
      weightTotalToken: number;
      weightTotalDialogue: number;
    };
    submission: { id: string };
    team: { id: string };
  },
  input: RunnerResultInput,
) {
  const scoreResult = buildScoreResult({
    weights: {
      taskPassRate: task.race.weightTaskPassRate,
      codeReview: task.race.weightCodeReview,
      reasoning: task.race.weightReasoning,
      keywords: task.race.weightKeywords,
      totalTask: task.race.weightTotalTask,
      totalToken: task.race.weightTotalToken,
      totalDialogue: task.race.weightTotalDialogue,
    },
    tokenLimit: task.race.tokenLimit,
    keywords: parseKeywords(task.race.keywordsJson),
    artifact: task.artifact,
    runner: {
      passRate: input.passRate ?? 0,
      codeReviewScore: input.codeReviewScore ?? 0,
      reasoningScore: input.reasoningScore ?? 0,
      keywordScore: input.keywordScore ?? 0,
      runnerComment: input.runnerComment || "",
      status: "success",
    },
  });

  await tx.runnerTask.update({
    where: { id: task.id },
    data: {
      score: scoreResult.totalScore,
    },
  });

  await tx.submission.update({
    where: { id: task.submissionId },
    data: {
      codeContent: null,
      ridingRecord: null,
      runnerComment: scoreResult.runnerComment || null,
      runnerStatus: scoreResult.runnerStatus,
      scoredAt: new Date(),
      status: SubmissionStatus.SCORED,
      passRate: scoreResult.passRate,
      codeReviewScore: scoreResult.codeReviewScore,
      reasoningScore: scoreResult.reasoningScore,
      keywordScore: scoreResult.keywordScore,
      tokenScore: scoreResult.tokenScore,
      taskScore: scoreResult.taskScore,
      dialogueScore: scoreResult.dialogueScore,
      totalScore: scoreResult.totalScore,
      antiCheatPenalty: scoreResult.antiCheatPenalty,
      progress: input.progress ?? null,
    },
  });
}

async function projectProgressEvalSuccess(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  task: Awaited<ReturnType<typeof prisma.runnerTask.findUnique>> & {
    artifact: LatestArtifactRecord;
    race: {
      id: string;
      tokenLimit: number;
      keywordsJson: string;
      weightTaskPassRate: number;
      weightCodeReview: number;
      weightReasoning: number;
      weightKeywords: number;
      weightTotalTask: number;
      weightTotalToken: number;
      weightTotalDialogue: number;
    };
    submission: { id: string; agentType: AgentType };
    team: { id: string };
  },
  input: RunnerResultInput,
) {
  const scoreResult = buildScoreResult({
    weights: {
      taskPassRate: task.race.weightTaskPassRate,
      codeReview: task.race.weightCodeReview,
      reasoning: task.race.weightReasoning,
      keywords: task.race.weightKeywords,
      totalTask: task.race.weightTotalTask,
      totalToken: task.race.weightTotalToken,
      totalDialogue: task.race.weightTotalDialogue,
    },
    tokenLimit: task.race.tokenLimit,
    keywords: parseKeywords(task.race.keywordsJson),
    artifact: task.artifact,
    runner: {
      passRate: input.passRate ?? 0,
      codeReviewScore: input.codeReviewScore ?? 0,
      reasoningScore: input.reasoningScore ?? 0,
      keywordScore: input.keywordScore ?? 0,
      runnerComment: input.runnerComment || "",
      status: "success",
    },
  });

  await tx.runnerTask.update({
    where: { id: task.id },
    data: {
      score: scoreResult.totalScore,
    },
  });

  const existingTeamArchive = await tx.teamArchive.findFirst({
    where: buildRaceContainerWhere({
      raceId: task.raceId,
      registrationId: task.registrationId,
      teamId: task.teamId,
    }),
  });

  const teamArchivePayload = {
    agentType: task.artifact.agentType,
    antiCheatPenalty: scoreResult.antiCheatPenalty,
    codeContent: task.artifact.codeContent,
    codeContentHash: task.artifact.codeContentHash,
    codeLabel: task.artifact.codeLabel,
    dialogueScore: scoreResult.dialogueScore,
    keywordScore: scoreResult.keywordScore,
    raceId: task.raceId,
    reasoningScore: scoreResult.reasoningScore,
    recordLabel: task.artifact.recordLabel,
    registrationId: task.registrationId,
    ridingRecord: task.artifact.ridingRecord,
    ridingRecordHash: task.artifact.ridingRecordHash,
    submissionId: task.submissionId,
    submitterBindingJson: task.artifact.submitterBindingJson,
    taskScore: scoreResult.taskScore,
    teamId: task.teamId,
    tokenScore: scoreResult.tokenScore,
    tokenUsed: task.artifact.tokenUsed,
    totalScore: scoreResult.totalScore,
    progress: input.progress ?? null,
  };

  if (existingTeamArchive) {
    await tx.teamArchive.update({
      where: { id: existingTeamArchive.id },
      data: teamArchivePayload,
    });
  } else {
    await tx.teamArchive.create({
      data: teamArchivePayload,
    });
  }

  const existingLeaderboardEntry = await tx.leaderboardEntry.findFirst({
    where: buildRaceContainerWhere({
      raceId: task.raceId,
      registrationId: task.registrationId,
      teamId: task.teamId,
    }),
  });

  const leaderboardPayload = {
    agentType: task.artifact.agentType,
    dialogueScore: scoreResult.dialogueScore,
    progress: input.progress ?? null,
    raceId: task.raceId,
    registrationId: task.registrationId,
    submissionId: task.submissionId,
    taskScore: scoreResult.taskScore,
    teamId: task.teamId,
    tokenScore: scoreResult.tokenScore,
    totalScore: scoreResult.totalScore,
  };

  if (existingLeaderboardEntry) {
    await tx.leaderboardEntry.update({
      where: { id: existingLeaderboardEntry.id },
      data: leaderboardPayload,
    });
  } else {
    await tx.leaderboardEntry.create({
      data: leaderboardPayload,
    });
  }

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
  const reasoningScore = input.reasoningScore ?? 0;
  const keywordScore = input.keywordScore ?? 0;
  const harnessScore = computeHarnessScore(
    reasoningScore,
    keywordScore,
    task.race.harnessWeightReasoning,
    task.race.harnessWeightKeyword,
  );

  await tx.runnerTask.update({
    where: { id: task.id },
    data: {
      score: harnessScore,
    },
  });

  const existingHarnessEntry = await tx.harnessEntry.findFirst({
    where: buildRaceContainerWhere({
      raceId: task.raceId,
      registrationId: task.registrationId,
      teamId: task.teamId,
    }),
  });

  const harnessPayload = {
    harnessScore,
    keywordScore,
    raceId: task.raceId,
    registrationId: task.registrationId,
    reasoningScore,
    teamId: task.teamId,
  };

  if (existingHarnessEntry) {
    await tx.harnessEntry.update({
      where: { id: existingHarnessEntry.id },
      data: harnessPayload,
    });
  } else {
    await tx.harnessEntry.create({
      data: harnessPayload,
    });
  }

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
          registrationId: runnerTask.registrationId,
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
  subject: {
    registrationId: null | string;
    teamId: string;
  },
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
      ...buildContainerIdentityWhere(subject),
    },
    data: {
      status: "STALE",
    },
  });
}

function buildRaceContainerWhere(input: {
  raceId: string;
  registrationId: null | string;
  teamId: string;
}) {
  return {
    raceId: input.raceId,
    ...buildContainerIdentityWhere({
      registrationId: input.registrationId,
      teamId: input.teamId,
    }),
  };
}

function buildContainerIdentityWhere(input: {
  registrationId: null | string;
  teamId: string;
}) {
  if (input.registrationId) {
    return {
      OR: [
        { registrationId: input.registrationId },
        { registrationId: null, teamId: input.teamId },
      ],
    };
  }

  return {
    teamId: input.teamId,
  };
}

async function getLatestArtifactsForRace(
  raceId: string,
): Promise<LatestArtifactRecord[]> {
  const artifacts = await prisma.submissionArtifact.findMany({
    where: { raceId },
    orderBy: [{ createdAt: "desc" }],
  });

  const latestByContainer = new Map<string, LatestArtifactRecord>();
  for (const artifact of artifacts) {
    const containerKey = artifact.teamId;
    if (!latestByContainer.has(containerKey)) {
      latestByContainer.set(containerKey, artifact);
    }
  }

  return [...latestByContainer.values()];
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

function verifyRunnerTaskArtifact(task: RunnerTaskArtifactContext) {
  if (task.registrationId && !task.registration) {
    return {
      actualValue: "",
      expectedValue: "",
      ok: false as const,
      reason: "registration_missing" as const,
    };
  }

  return verifySubmissionArtifactIntegrity({
    artifact: task.artifact,
    expectedRaceId: task.raceId,
    expectedRegistrationId: task.registrationId,
    expectedUserId: task.registration?.userId ?? null,
  });
}

async function failRunnerTaskRaceChallengeVerification(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  task: RunnerTaskArtifactContext,
  verification: Awaited<ReturnType<typeof verifyRaceChallengeIntegrity>>,
) {
  if (verification.ok) {
    return;
  }

  await tx.runnerTask.update({
    where: { id: task.taskId },
    data: {
      finishedAt: new Date(),
      runnerComment: `race challenge material integrity check failed: ${verification.reason}`,
      score: 0,
      status: "FAILED",
    },
  });

  await recordRunnerTaskRaceChallengeVerification(tx, {
    task,
    verification,
  });
}

async function failRunnerTaskRaceEvaluationConfigVerification(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  task: RunnerTaskArtifactContext,
  verification: ReturnType<typeof verifyRaceEvaluationConfigIntegrity>,
) {
  if (verification.ok) {
    return;
  }

  await tx.runnerTask.update({
    where: { id: task.taskId },
    data: {
      finishedAt: new Date(),
      runnerComment: `race evaluation config integrity check failed: ${verification.reason}`,
      score: 0,
      status: "FAILED",
    },
  });

  await recordRunnerTaskRaceEvaluationConfigVerification(tx, {
    task,
    verification,
  });
}

async function failRunnerTaskArtifactVerification(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  task: RunnerTaskArtifactContext,
  verification: ReturnType<typeof verifyRunnerTaskArtifact>,
  stage: RunnerArtifactVerificationStage,
) {
  if (verification.ok) {
    return;
  }

  const integrityFailureComment = `submission artifact integrity check failed: ${verification.reason}`;

  await tx.runnerTask.update({
    where: { id: task.taskId },
    data: {
      finishedAt: new Date(),
      runnerComment: integrityFailureComment,
      score: 0,
      status: "FAILED",
    },
  });

  if (task.taskType === "SUBMISSION_TEST") {
    await tx.submission.update({
      where: { id: task.submissionId },
      data: {
        runnerComment: integrityFailureComment,
        runnerStatus: "failed",
        scoredAt: new Date(),
        status: SubmissionStatus.FAILED,
      },
    });
  }

  await recordRunnerTaskArtifactVerification(tx, {
    stage,
    task,
    verification,
  });
}

async function recordRunnerTaskArtifactVerification(
  db: RunnerAuditWriter,
  input: {
    stage: RunnerArtifactVerificationStage;
    task: RunnerTaskArtifactContext;
    verification: { ok: true } | ReturnType<typeof verifyRunnerTaskArtifact>;
  },
) {
  const details = {
    registrationId: input.task.registrationId,
    submissionId: input.task.submissionId,
    taskId: input.task.taskId,
    taskType: input.task.taskType,
    teamId: input.task.teamId,
    verificationStage: input.stage,
    ...("actualValue" in input.verification
      ? {
          actualValue: input.verification.actualValue,
          expectedValue: input.verification.expectedValue,
        }
      : {}),
  };

  await recordSecurityAudit(db, {
    action: "submission_artifact.verify",
    actorKind: "SYSTEM",
    details,
    raceId: input.task.raceId,
    reason:
      "reason" in input.verification
        ? input.verification.reason
        : "",
    registrationId: input.task.registrationId,
    result:
      "reason" in input.verification
        ? "rejected"
        : "accepted",
    targetId: input.task.artifact.id,
    targetType: "SubmissionArtifact",
    userId: input.task.registration?.userId ?? null,
  });
}

async function recordRunnerTaskRaceChallengeVerification(
  db: RunnerAuditWriter,
  input: {
    task: RunnerTaskArtifactContext;
    verification:
      | { ok: true }
      | Awaited<ReturnType<typeof verifyRaceChallengeIntegrity>>;
  },
) {
  const details = {
    registrationId: input.task.registrationId,
    submissionId: input.task.submissionId,
    taskId: input.task.taskId,
    taskType: input.task.taskType,
    teamId: input.task.teamId,
    verificationStage: "runner_pull",
    ...("actualValue" in input.verification
      ? {
          actualValue: input.verification.actualValue,
          expectedValue: input.verification.expectedValue,
        }
      : {}),
    ...("fileName" in input.verification
      ? {
          fileName: input.verification.fileName,
          filePath: input.verification.filePath,
        }
      : {}),
  };

  await recordSecurityAudit(db, {
    action: "race.challenge_verify",
    actorKind: "SYSTEM",
    details,
    raceId: input.task.raceId,
    reason:
      "reason" in input.verification
        ? input.verification.reason
        : "",
    registrationId: input.task.registrationId,
    result:
      "reason" in input.verification
        ? "rejected"
        : "accepted",
    targetId: input.task.raceId,
    targetType: "Race",
    userId: input.task.registration?.userId ?? null,
  });
}

async function recordRunnerTaskRaceEvaluationConfigVerification(
  db: RunnerAuditWriter,
  input: {
    task: RunnerTaskArtifactContext;
    verification:
      | { ok: true }
      | ReturnType<typeof verifyRaceEvaluationConfigIntegrity>;
  },
) {
  const details = {
    registrationId: input.task.registrationId,
    submissionId: input.task.submissionId,
    taskId: input.task.taskId,
    taskType: input.task.taskType,
    teamId: input.task.teamId,
    verificationStage: "runner_pull",
    ...("actualValue" in input.verification
      ? {
          actualValue: input.verification.actualValue,
          expectedValue: input.verification.expectedValue,
        }
      : {}),
  };

  await recordSecurityAudit(db, {
    action: "race.evaluation_config_verify",
    actorKind: "SYSTEM",
    details,
    raceId: input.task.raceId,
    reason:
      "reason" in input.verification
        ? input.verification.reason
        : "",
    registrationId: input.task.registrationId,
    result:
      "reason" in input.verification
        ? "rejected"
        : "accepted",
    targetId: input.task.raceId,
    targetType: "Race",
    userId: input.task.registration?.userId ?? null,
  });
}

