import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import {
  buildRaceEvaluationConfigDigest,
  buildChallengeMaterialSourceRef,
  buildFileBufferDigest,
} from "@/lib/material-integrity-helpers";
import { prisma } from "@/lib/prisma";
import {
  completeRunnerTask,
  enqueueHarnessEvalTasks,
  enqueueProgressEvalTasks,
  pullRunnerTask,
} from "@/lib/services/runner";
import {
  createFinalSubmission,
  createSubmission,
} from "@/lib/services/submissions";

function buildSubmissionFormData(raceId: string) {
  const fd = new FormData();
  fd.set("raceId", raceId);
  fd.set("codeLabel", "solution.ts");
  fd.set("codeContent", "export const solve = () => 1;");
  fd.set("tokenUsed", "100");
  fd.set("agentType", "CLAUDE");
  fd.set("workTitle", "Submission Materialized Work");
  fd.set("workSummary", "把提交代码同步沉淀成正式作品资产。");
  fd.set("demoUrl", "");
  fd.set("repoUrl", "");
  fd.set("videoUrl", "");
  fd.set("techNotes", "");
  return fd;
}

function buildFinalSubmissionFormData(raceId: string) {
  const fd = buildSubmissionFormData(raceId);
  fd.set("recordLabel", "riding-record.txt");
  fd.set("ridingRecord", "Investigated constraints and wrote final summary.");
  return fd;
}

function buildRaceCreateInput(
  templateRace: Awaited<ReturnType<typeof prisma.race.findFirstOrThrow>>,
) {
  return {
    cloudStudioUrl: templateRace.cloudStudioUrl,
    displayHighlightCount: templateRace.displayHighlightCount,
    displayShowOrganizerComment: templateRace.displayShowOrganizerComment,
    displayShowRiderCode: templateRace.displayShowRiderCode,
    displayShowTopHighlights: templateRace.displayShowTopHighlights,
    displayShowTrainingData: templateRace.displayShowTrainingData,
    enableFreeze: templateRace.enableFreeze,
    evaluationConfigHash: templateRace.evaluationConfigHash,
    evaluationConfigVersion: templateRace.evaluationConfigVersion,
    evaluationNotes: templateRace.evaluationNotes,
    freezeMinutesBeforeEnd: templateRace.freezeMinutesBeforeEnd,
    harnessWeightKeyword: templateRace.harnessWeightKeyword,
    harnessWeightReasoning: templateRace.harnessWeightReasoning,
    hasTrainingData: templateRace.hasTrainingData,
    keywordsJson: templateRace.keywordsJson,
    maxTeamSize: templateRace.maxTeamSize,
    organizerComment: "",
    organizerId: templateRace.organizerId,
    raceEnd: templateRace.raceEnd,
    raceStart: templateRace.raceStart,
    signupEnd: templateRace.signupEnd,
    signupStart: templateRace.signupStart,
    status: "completed",
    submissionIntervalHours: templateRace.submissionIntervalHours,
    summary: templateRace.summary,
    taskDescription: templateRace.taskDescription,
    taskPackageLabel: templateRace.taskPackageLabel,
    title: templateRace.title,
    tokenLimit: templateRace.tokenLimit,
    trackConfigJson: templateRace.trackConfigJson,
    trackId: templateRace.trackId,
    trainingDataSummary: templateRace.trainingDataSummary,
    updateGranularityMinutes: templateRace.updateGranularityMinutes,
    weightCodeReview: templateRace.weightCodeReview,
    weightKeywords: templateRace.weightKeywords,
    weightReasoning: templateRace.weightReasoning,
    weightTaskPassRate: templateRace.weightTaskPassRate,
    weightTotalDialogue: templateRace.weightTotalDialogue,
    weightTotalTask: templateRace.weightTotalTask,
    weightTotalToken: templateRace.weightTotalToken,
  };
}

async function createCompletedSubmissionFixture(input: {
  riderId: string;
}) {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: { id: "race_finished" },
  });

  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_final_submission_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      summary: "final submission material integrity fixture",
      title: "Final Submission Material Integrity Fixture",
    },
  });

  const registration = await prisma.registration.create({
    data: {
      approvedAt: new Date("2026-07-11T08:00:00Z"),
      raceId: race.id,
      status: "APPROVED",
      userId: input.riderId,
    },
  });

  await prisma.raceProject.create({
    data: {
      githubRepoUrl: "https://github.com/demo/final-material-integrity",
      registrationId: registration.id,
    },
  });

  await prisma.team.create({
    data: {
      captainId: input.riderId,
      members: {
        create: [
          {
            displayName: "Final Fixture Rider",
            userId: input.riderId,
          },
        ],
      },
      name: `final-fixture-${race.id}`,
      raceId: race.id,
    },
  });

  return {
    registrationId: registration.id,
    cleanup: async () => {
      await prisma.race.delete({
        where: { id: race.id },
      });
    },
    raceId: race.id,
  };
}

async function setRaceRunningNow(raceId: string) {
  await prisma.race.update({
    where: { id: raceId },
    data: {
      raceEnd: new Date("2026-07-12T12:00:00Z"),
      raceStart: new Date("2026-07-11T00:00:00Z"),
      signupEnd: new Date("2026-07-10T12:00:00Z"),
      signupStart: new Date("2026-07-01T00:00:00Z"),
      status: "running",
      submissionIntervalHours: 0,
    },
  });
}

test.beforeEach(async () => {
  await setRaceRunningNow("race_active");
});

async function writeUploadFixture(relativePath: string, content: string) {
  const absolutePath = join(process.cwd(), "public", "uploads", relativePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  const buffer = Buffer.from(content, "utf8");
  await writeFile(absolutePath, buffer);
  return {
    absolutePath,
    fileHash: buildFileBufferDigest(buffer),
    filePath: `/uploads/${relativePath.replace(/\\/g, "/")}`,
  };
}

async function clearOpenRunnerTasks(raceId: string) {
  await prisma.runnerTask.updateMany({
    where: {
      raceId,
      status: {
        in: ["QUEUED", "CLAIMED"],
      },
    },
    data: {
      status: "STALE",
    },
  });
}

async function createQueuedRunnerTaskForSubmission(input: {
  submissionId: string;
  taskType?: "HARNESS_EVAL" | "PROGRESS_EVAL" | "SUBMISSION_TEST";
}) {
  const submission = await prisma.submission.findUniqueOrThrow({
    where: { id: input.submissionId },
    include: { artifact: true },
  });

  return prisma.runnerTask.create({
    data: {
      artifactId: submission.artifact!.id,
      raceId: submission.raceId,
      registrationId: submission.registrationId,
      submissionId: submission.id,
      taskType: input.taskType ?? "SUBMISSION_TEST",
      teamId: submission.teamId,
    },
  });
}

test("createSubmission stores code hash and submitter binding on submission and artifact", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: { username: "rider_alice" },
  });

  const submission = await createSubmission(
    rider.id,
    buildSubmissionFormData("race_active"),
  );
  const stored = await prisma.submission.findUniqueOrThrow({
    where: { id: submission.id },
    include: { artifact: true },
  });

  assert.match(stored.codeContentHash, /^[a-f0-9]{64}$/);
  assert.equal(stored.ridingRecordHash.length > 0, true);
  assert.match(stored.submitterBindingJson, /registrationId/);
  assert.ok(stored.artifact);
  assert.match(stored.artifact!.codeContentHash, /^[a-f0-9]{64}$/);

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "submission_artifact.create",
      result: "accepted",
      targetId: stored.artifact!.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  assert.equal(audit.targetType, "SubmissionArtifact");
  assert.match(audit.detailsJson, /submissionPhase/);
  assert.match(audit.detailsJson, /active/);
  assert.match(
    audit.detailsJson,
    new RegExp(stored.artifact!.codeContentHash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
});

test("createSubmission no longer auto-enqueues runner tasks during in-race submission", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: { username: "rider_alice" },
  });
  await clearOpenRunnerTasks("race_active");

  const submission = await createSubmission(
    rider.id,
    buildSubmissionFormData("race_active"),
  );

  const queuedTasks = await prisma.runnerTask.findMany({
    where: {
      raceId: "race_active",
      status: {
        in: ["QUEUED", "CLAIMED"],
      },
      submissionId: submission.id,
    },
  });

  assert.equal(queuedTasks.length, 0);
});

test("createFinalSubmission stores riding record hash for post-race materials", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: { username: "rider_alice" },
  });

  const fixture = await createCompletedSubmissionFixture({
    riderId: rider.id,
  });

  try {
    const submission = await createFinalSubmission(
      rider.id,
      buildFinalSubmissionFormData(fixture.raceId),
    );
    const stored = await prisma.submission.findUniqueOrThrow({
      where: { id: submission.id },
      include: { artifact: true },
    });

    assert.match(stored.ridingRecordHash, /^[a-f0-9]{64}$/);
    assert.ok(stored.artifact);
    assert.match(stored.artifact!.ridingRecordHash, /^[a-f0-9]{64}$/);

    const audit = await prisma.securityAudit.findFirstOrThrow({
      where: {
        action: "submission_artifact.create",
        result: "accepted",
        targetId: stored.artifact!.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    assert.equal(audit.targetType, "SubmissionArtifact");
    assert.match(audit.detailsJson, /submissionPhase/);
    assert.match(audit.detailsJson, /final/);
    assert.match(
      audit.detailsJson,
      new RegExp(stored.artifact!.ridingRecordHash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  } finally {
    await fixture.cleanup();
  }
});

test("progress evaluation carries material integrity fields into TeamArchive", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: { username: "rider_alice" },
  });

  const submission = await createSubmission(
    rider.id,
    buildSubmissionFormData("race_active"),
  );
  const stored = await prisma.submission.findUniqueOrThrow({
    where: { id: submission.id },
    include: { artifact: true },
  });

  await enqueueProgressEvalTasks("race_active");

  const task = await pullRunnerTask("race_active");
  assert.ok(task);
  assert.equal(task.submissionId, submission.id);

  await completeRunnerTask({
    taskId: task.taskId,
    submissionId: submission.id,
    status: "succeeded",
    progress: 0.72,
    passRate: 88,
    codeReviewScore: 84,
    reasoningScore: 90,
    keywordScore: 76,
    runnerComment: "material integrity propagation check",
  });

  const archive = await prisma.teamArchive.findFirstOrThrow({
    where: {
      raceId: "race_active",
      registrationId: stored.registrationId,
    },
  });

  assert.match(archive.codeContentHash, /^[a-f0-9]{64}$/);
  assert.equal(archive.codeContentHash, stored.artifact!.codeContentHash);
  assert.equal(archive.ridingRecordHash, stored.artifact!.ridingRecordHash);
  assert.equal(
    archive.submitterBindingJson,
    stored.artifact!.submitterBindingJson,
  );
});

test("pullRunnerTask rejects tampered code artifacts and writes a security audit", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: { username: "rider_alice" },
  });
  await clearOpenRunnerTasks("race_active");

  const submission = await createSubmission(
    rider.id,
    buildSubmissionFormData("race_active"),
  );
  await createQueuedRunnerTaskForSubmission({
    submissionId: submission.id,
    taskType: "SUBMISSION_TEST",
  });
  const stored = await prisma.submission.findUniqueOrThrow({
    where: { id: submission.id },
    include: { artifact: true },
  });
  assert.ok(stored.artifact);

  await prisma.submissionArtifact.update({
    where: { id: stored.artifact!.id },
    data: {
      codeContent: "export const solve = () => 999;",
    },
  });

    const task = await pullRunnerTask("race_active");
    assert.equal(task, null);

  const failedTask = await prisma.runnerTask.findFirstOrThrow({
    where: {
      submissionId: submission.id,
      taskType: "SUBMISSION_TEST",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  assert.equal(failedTask.status, "FAILED");

  const failedSubmission = await prisma.submission.findUniqueOrThrow({
    where: { id: submission.id },
  });
  assert.equal(failedSubmission.status, "FAILED");

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "submission_artifact.verify",
      reason: "code_content_hash_mismatch",
      result: "rejected",
      targetId: stored.artifact!.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  assert.equal(audit.targetType, "SubmissionArtifact");
});

test("pullRunnerTask rejects mismatched submitter bindings and writes a security audit", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: { username: "rider_alice" },
  });
  await clearOpenRunnerTasks("race_active");

  const submission = await createSubmission(
    rider.id,
    buildSubmissionFormData("race_active"),
  );
  await createQueuedRunnerTaskForSubmission({
    submissionId: submission.id,
    taskType: "SUBMISSION_TEST",
  });
  const stored = await prisma.submission.findUniqueOrThrow({
    where: { id: submission.id },
    include: { artifact: true },
  });
  assert.ok(stored.artifact);

  await prisma.submissionArtifact.update({
    where: { id: stored.artifact!.id },
    data: {
      submitterBindingJson: JSON.stringify({
        raceId: "race_active",
        registrationId: stored.registrationId,
        submittedAt: new Date().toISOString(),
        userId: "tampered-user",
      }),
    },
  });

  const task = await pullRunnerTask("race_active");
  assert.equal(task, null);

  const failedTask = await prisma.runnerTask.findFirstOrThrow({
    where: {
      submissionId: submission.id,
      taskType: "SUBMISSION_TEST",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  assert.equal(failedTask.status, "FAILED");

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "submission_artifact.verify",
      reason: "submitter_binding_mismatch",
      result: "rejected",
      targetId: stored.artifact!.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  assert.equal(audit.targetType, "SubmissionArtifact");
});

test("pullRunnerTask rejects tampered race challenge materials without auto-failing the submission", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: { username: "rider_alice" },
  });
  await clearOpenRunnerTasks("race_active");

  const originalRace = await prisma.race.findUniqueOrThrow({
    where: { id: "race_active" },
    select: {
      challengeContentHash: true,
      challengeSourceRefJson: true,
    },
  });

  const taskPackage = await writeUploadFixture(
    `tests/grs004-p1j-runner-${Date.now()}-task.zip`,
    "task-package-v1",
  );
  const proposal = await writeUploadFixture(
    `tests/grs004-p1j-runner-${Date.now()}-proposal.pdf`,
    "proposal-v1",
  );
  const sourceRef = buildChallengeMaterialSourceRef({
    proposal: {
      fileHash: proposal.fileHash,
      fileName: "proposal.pdf",
      filePath: proposal.filePath,
    },
    taskPackage: {
      fileHash: taskPackage.fileHash,
      fileName: "task.zip",
      filePath: taskPackage.filePath,
    },
  });

  await prisma.race.update({
    where: { id: "race_active" },
    data: {
      challengeContentHash: buildPayloadDigest(sourceRef),
      challengeSourceRefJson: JSON.stringify(sourceRef),
    },
  });

  try {
    const submission = await createSubmission(
      rider.id,
      buildSubmissionFormData("race_active"),
    );
    await createQueuedRunnerTaskForSubmission({
      submissionId: submission.id,
      taskType: "SUBMISSION_TEST",
    });
    const stored = await prisma.submission.findUniqueOrThrow({
      where: { id: submission.id },
      include: { artifact: true },
    });

    await writeFile(
      taskPackage.absolutePath,
      Buffer.from("task-package-tampered", "utf8"),
    );

    const task = await pullRunnerTask("race_active");
    assert.equal(task, null);

    const failedTask = await prisma.runnerTask.findFirstOrThrow({
      where: {
        submissionId: submission.id,
        taskType: "SUBMISSION_TEST",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    assert.equal(failedTask.status, "FAILED");

    const unchangedSubmission = await prisma.submission.findUniqueOrThrow({
      where: { id: submission.id },
    });
    assert.notEqual(unchangedSubmission.status, "FAILED");

    const audit = await prisma.securityAudit.findFirstOrThrow({
      where: {
        action: "race.challenge_verify",
        reason: "task_package_hash_mismatch",
        result: "rejected",
        targetId: "race_active",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    assert.equal(audit.targetType, "Race");
    assert.match(audit.detailsJson, /runner_pull/);
    assert.ok(stored.artifact);
  } finally {
    await prisma.race.update({
      where: { id: "race_active" },
      data: {
        challengeContentHash: originalRace.challengeContentHash,
        challengeSourceRefJson: originalRace.challengeSourceRefJson,
      },
    });
  }
});

test("pullRunnerTask rejects tampered race evaluation config without auto-failing the submission", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: { username: "rider_alice" },
  });
  await clearOpenRunnerTasks("race_active");

  const originalRace = await prisma.race.findUniqueOrThrow({
    where: { id: "race_active" },
    select: {
      evaluationConfigHash: true,
      evaluationConfigVersion: true,
      taskDescription: true,
      taskPackageLabel: true,
      keywordsJson: true,
      tokenLimit: true,
      weightTaskPassRate: true,
      weightCodeReview: true,
      weightReasoning: true,
      weightKeywords: true,
      weightTotalTask: true,
      weightTotalToken: true,
      weightTotalDialogue: true,
      harnessWeightReasoning: true,
      harnessWeightKeyword: true,
    },
  });

  await prisma.race.update({
    where: { id: "race_active" },
    data: {
      evaluationConfigHash: buildRaceEvaluationConfigDigest({
        harnessWeightKeyword: originalRace.harnessWeightKeyword,
        harnessWeightReasoning: originalRace.harnessWeightReasoning,
        keywordsJson: originalRace.keywordsJson,
        taskDescription: originalRace.taskDescription,
        taskPackageLabel: originalRace.taskPackageLabel,
        tokenLimit: originalRace.tokenLimit,
        weightCodeReview: originalRace.weightCodeReview,
        weightKeywords: originalRace.weightKeywords,
        weightReasoning: originalRace.weightReasoning,
        weightTaskPassRate: originalRace.weightTaskPassRate,
        weightTotalDialogue: originalRace.weightTotalDialogue,
        weightTotalTask: originalRace.weightTotalTask,
        weightTotalToken: originalRace.weightTotalToken,
      }),
      evaluationConfigVersion: 1,
    },
  });

  try {
    const submission = await createSubmission(
      rider.id,
      buildSubmissionFormData("race_active"),
    );
    await createQueuedRunnerTaskForSubmission({
      submissionId: submission.id,
      taskType: "SUBMISSION_TEST",
    });

    await prisma.race.update({
      where: { id: "race_active" },
      data: {
        taskDescription: `${originalRace.taskDescription} tampered`,
      },
    });

    const task = await pullRunnerTask("race_active");
    assert.equal(task, null);

    const failedTask = await prisma.runnerTask.findFirstOrThrow({
      where: {
        submissionId: submission.id,
        taskType: "SUBMISSION_TEST",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    assert.equal(failedTask.status, "FAILED");

    const unchangedSubmission = await prisma.submission.findUniqueOrThrow({
      where: { id: submission.id },
    });
    assert.notEqual(unchangedSubmission.status, "FAILED");

    const audit = await prisma.securityAudit.findFirstOrThrow({
      where: {
        action: "race.evaluation_config_verify",
        reason: "race_evaluation_config_hash_mismatch",
        result: "rejected",
        targetId: "race_active",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    assert.equal(audit.targetType, "Race");
    assert.match(audit.detailsJson, /runner_pull/);
  } finally {
    await prisma.race.update({
      where: { id: "race_active" },
      data: {
        evaluationConfigHash: originalRace.evaluationConfigHash,
        evaluationConfigVersion: originalRace.evaluationConfigVersion,
        taskDescription: originalRace.taskDescription,
      },
    });
  }
});

test("completeRunnerTask blocks tampered artifacts from propagating into TeamArchive", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: { username: "rider_bob" },
  });
  await clearOpenRunnerTasks("race_active");

  const submission = await createSubmission(
    rider.id,
    buildSubmissionFormData("race_active"),
  );
  const stored = await prisma.submission.findUniqueOrThrow({
    where: { id: submission.id },
    include: { artifact: true },
  });
  assert.ok(stored.artifact);

  const archiveCountBefore = await prisma.teamArchive.count({
    where: {
      raceId: "race_active",
      registrationId: stored.registrationId,
    },
  });

  await enqueueProgressEvalTasks("race_active");

  const task = await pullRunnerTask("race_active");
  assert.ok(task);
  assert.equal(task.submissionId, submission.id);

  await prisma.submissionArtifact.update({
    where: { id: stored.artifact!.id },
    data: {
      codeContent: "export const solve = () => 404;",
    },
  });

  await completeRunnerTask({
    taskId: task.taskId,
    submissionId: submission.id,
    status: "succeeded",
    progress: 0.51,
    passRate: 77,
    codeReviewScore: 72,
    reasoningScore: 81,
    keywordScore: 69,
    runnerComment: "tamper window check before projection",
  });

  const archiveCountAfter = await prisma.teamArchive.count({
    where: {
      raceId: "race_active",
      registrationId: stored.registrationId,
    },
  });
  assert.equal(archiveCountAfter, archiveCountBefore);

  const failedTask = await prisma.runnerTask.findUniqueOrThrow({
    where: { id: task.taskId },
  });
  assert.equal(failedTask.status, "FAILED");

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "submission_artifact.verify",
      reason: "code_content_hash_mismatch",
      result: "rejected",
      targetId: stored.artifact!.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  assert.equal(audit.targetType, "SubmissionArtifact");
  assert.match(audit.detailsJson, /runner_complete/);
});

test("completeRunnerTask blocks tampered artifacts from generating RidingHighlight", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: { username: "rider_alice" },
  });

  const fixture = await createCompletedSubmissionFixture({
    riderId: rider.id,
  });

  try {
    await clearOpenRunnerTasks(fixture.raceId);

    const submission = await createFinalSubmission(
      rider.id,
      buildFinalSubmissionFormData(fixture.raceId),
    );
    const stored = await prisma.submission.findUniqueOrThrow({
      where: { id: submission.id },
      include: { artifact: true },
    });
    assert.ok(stored.artifact);

    const highlightCountBefore = await prisma.ridingHighlight.count({
      where: {
        raceId: fixture.raceId,
        registrationId: stored.registrationId,
      },
    });

    await enqueueHarnessEvalTasks(fixture.raceId);

    const task = await pullRunnerTask(fixture.raceId);
    assert.ok(task);
    assert.equal(task.submissionId, submission.id);

    await prisma.submissionArtifact.update({
      where: { id: stored.artifact!.id },
      data: {
        submitterBindingJson: JSON.stringify({
          raceId: fixture.raceId,
          registrationId: stored.registrationId,
          submittedAt: new Date().toISOString(),
          userId: "tampered-user",
        }),
      },
    });

    await completeRunnerTask({
      taskId: task.taskId,
      submissionId: submission.id,
      status: "succeeded",
      reasoningScore: 83,
      keywordScore: 71,
      runnerComment: "tamper window check before showcase",
    });

    const highlightCountAfter = await prisma.ridingHighlight.count({
      where: {
        raceId: fixture.raceId,
        registrationId: stored.registrationId,
      },
    });
    assert.equal(highlightCountAfter, highlightCountBefore);

    const failedTask = await prisma.runnerTask.findUniqueOrThrow({
      where: { id: task.taskId },
    });
    assert.equal(failedTask.status, "FAILED");

    const audit = await prisma.securityAudit.findFirstOrThrow({
      where: {
        action: "submission_artifact.verify",
        reason: "submitter_binding_mismatch",
        result: "rejected",
        targetId: stored.artifact!.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    assert.equal(audit.targetType, "SubmissionArtifact");
    assert.match(audit.detailsJson, /runner_complete/);
  } finally {
    await fixture.cleanup();
  }
});
