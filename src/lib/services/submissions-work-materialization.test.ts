import assert from "node:assert/strict";
import test from "node:test";
import { verifyWorkIntegrity } from "@/lib/material-integrity-helpers";
import { prisma } from "@/lib/prisma";
import {
  createFinalSubmission,
  createSubmission,
} from "@/lib/services/submissions";
import { saveWorkDraftForRider } from "@/lib/services/works";

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
    status: templateRace.status,
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

function buildWorkFields(overrides?: Partial<Record<string, string>>) {
  return {
    demoUrl: "",
    repoUrl: "",
    techNotes: "技术说明：补齐排序策略与边界判断。",
    videoUrl: "",
    workSummary: "把排序边界、稳定性和复杂度解释清楚，形成正式作品资产。",
    workTitle: "排序作品资产",
    ...overrides,
  };
}

function buildDraftFormData(input: {
  raceId: string;
  workFields?: Partial<Record<string, string>>;
}) {
  const formData = new FormData();
  formData.set("raceId", input.raceId);

  const workFields = buildWorkFields(input.workFields);
  for (const [key, value] of Object.entries(workFields)) {
    formData.set(key, value);
  }

  return formData;
}

function buildSubmissionFormData(input: {
  codeContent?: string;
  codeLabel?: string;
  raceId: string;
  tokenUsed?: string;
  workFields?: Partial<Record<string, string>>;
}) {
  const formData = buildDraftFormData({
    raceId: input.raceId,
    workFields: input.workFields,
  });

  formData.set("codeLabel", input.codeLabel ?? "solution.ts");
  formData.set("codeContent", input.codeContent ?? "export const solve = () => 1;");
  formData.set("tokenUsed", input.tokenUsed ?? "100");
  formData.set("agentType", "OPENAI");

  return formData;
}

function buildFinalSubmissionFormData(input: {
  raceId: string;
  workFields?: Partial<Record<string, string>>;
}) {
  const formData = buildSubmissionFormData({
    raceId: input.raceId,
    workFields: input.workFields,
  });

  formData.set("recordLabel", "riding-record.txt");
  formData.set(
    "ridingRecord",
    "先梳理边界条件，再补稳定性验证，最后整理赛后复盘。",
  );

  return formData;
}

async function createApprovedRegistrationFixture(input: {
  githubRepoUrl?: string;
  raceId: string;
  riderId: string;
  skipCompatibilityTeam?: boolean;
}) {
  const registration = await prisma.registration.create({
    data: {
      approvedAt: new Date("2026-07-11T10:00:00Z"),
      raceId: input.raceId,
      status: "APPROVED",
      userId: input.riderId,
    },
  });

  await prisma.raceProject.create({
    data: {
      githubRepoUrl:
        input.githubRepoUrl ?? "https://github.com/demo/materialized-work",
      registrationId: registration.id,
    },
  });

  if (!input.skipCompatibilityTeam) {
    await prisma.team.create({
      data: {
        captainId: input.riderId,
        members: {
          create: [
            {
              displayName: "Fixture Rider",
              userId: input.riderId,
            },
          ],
        },
        name: `fixture-team-${input.raceId}`,
        raceId: input.raceId,
      },
    });
  }

  return registration;
}

test("saveWorkDraftForRider creates a private draft and submitEntry materializes it into submitted work", async () => {
  const [templateRace, rider] = await Promise.all([
    prisma.race.findFirstOrThrow({
      where: { id: "race_active" },
    }),
    prisma.user.findFirstOrThrow({
      where: { username: "rider_alice" },
    }),
  ]);

  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_work_materialize_${Date.now()}`,
      raceEnd: new Date("2026-07-12T12:00:00Z"),
      raceStart: new Date("2026-07-11T00:00:00Z"),
      signupEnd: new Date("2026-07-10T12:00:00Z"),
      signupStart: new Date("2026-07-01T00:00:00Z"),
      status: "running",
      submissionIntervalHours: 0,
      summary: "work materialization fixture",
      title: "Work Materialization Fixture",
    },
  });

  try {
    const registration = await createApprovedRegistrationFixture({
      raceId: race.id,
      riderId: rider.id,
    });

    const draft = await saveWorkDraftForRider(
      rider.id,
      buildDraftFormData({
        raceId: race.id,
        workFields: {
          repoUrl: "",
          workTitle: "草稿作品",
          workSummary: "先保存一版草稿作品，稍后再正式提交。",
        },
      }),
    );

    assert.equal(draft.registrationId, registration.id);
    assert.equal(draft.status, "DRAFT");
    assert.equal(draft.visibility, "PRIVATE");
    assert.equal(draft.repoUrl, "https://github.com/demo/materialized-work");
    assert.equal(verifyWorkIntegrity({ work: draft }).ok, true);

    await createSubmission(
      rider.id,
      buildSubmissionFormData({
        raceId: race.id,
        workFields: {
          demoUrl: "https://demo.example/materialized-work",
          repoUrl: "",
          techNotes: "技术说明：正式提交版补齐 Demo 与说明。",
          videoUrl: "https://video.example/materialized-work",
          workSummary: "正式提交后，这条 Work 应进入 submitted/private 状态。",
          workTitle: "正式提交作品",
        },
      }),
    );

    const work = await prisma.work.findUniqueOrThrow({
      where: {
        registrationId: registration.id,
      },
    });

    assert.equal(work.status, "SUBMITTED");
    assert.equal(work.visibility, "PRIVATE");
    assert.equal(work.title, "正式提交作品");
    assert.equal(
      work.summary,
      "正式提交后，这条 Work 应进入 submitted/private 状态。",
    );
    assert.equal(work.repoUrl, "https://github.com/demo/materialized-work");
    assert.equal(work.demoUrl, "https://demo.example/materialized-work");
    assert.equal(work.videoUrl, "https://video.example/materialized-work");
    assert.equal(verifyWorkIntegrity({ work }).ok, true);
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});

test("createFinalSubmission also materializes the rider work asset for completed races", async () => {
  const [templateRace, rider] = await Promise.all([
    prisma.race.findFirstOrThrow({
      where: { id: "race_finished" },
    }),
    prisma.user.findFirstOrThrow({
      where: { username: "rider_bob" },
    }),
  ]);

  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_work_final_${Date.now()}`,
      status: "completed",
      submissionIntervalHours: 0,
      summary: "final work materialization fixture",
      title: "Final Work Materialization Fixture",
    },
  });

  try {
    const registration = await createApprovedRegistrationFixture({
      raceId: race.id,
      riderId: rider.id,
      githubRepoUrl: "https://github.com/demo/final-materialized-work",
    });

    await createFinalSubmission(
      rider.id,
      buildFinalSubmissionFormData({
        raceId: race.id,
        workFields: {
          techNotes: "技术说明：赛后提交版补齐实现权衡与复盘。",
          workSummary: "赛后提交应继续落到正式 Work 资产，而不是只停留在 Submission。",
          workTitle: "赛后作品提交",
        },
      }),
    );

    const work = await prisma.work.findUniqueOrThrow({
      where: {
        registrationId: registration.id,
      },
    });

    assert.equal(work.status, "SUBMITTED");
    assert.equal(work.visibility, "PRIVATE");
    assert.equal(work.title, "赛后作品提交");
    assert.equal(work.repoUrl, "https://github.com/demo/final-materialized-work");
    assert.equal(verifyWorkIntegrity({ work }).ok, true);
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});

test("submissions do not overwrite locked work assets", async () => {
  const [templateRace, rider] = await Promise.all([
    prisma.race.findFirstOrThrow({
      where: { id: "race_active" },
    }),
    prisma.user.findFirstOrThrow({
      where: { username: "rider_charlie" },
    }),
  ]);

  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_work_locked_${Date.now()}`,
      raceEnd: new Date("2026-07-12T12:00:00Z"),
      raceStart: new Date("2026-07-11T00:00:00Z"),
      signupEnd: new Date("2026-07-10T12:00:00Z"),
      signupStart: new Date("2026-07-01T00:00:00Z"),
      status: "running",
      submissionIntervalHours: 0,
      summary: "locked work overwrite fixture",
      title: "Locked Work Overwrite Fixture",
    },
  });

  try {
    const registration = await createApprovedRegistrationFixture({
      raceId: race.id,
      riderId: rider.id,
    });

    await prisma.work.create({
      data: {
        contentHash:
          "fa274568ed1fef8cf920755650ff6a8056d2ce17f65f8bd5df31d2b039dbd099",
        demoUrl: "",
        registrationId: registration.id,
        repoUrl: "https://github.com/demo/locked-work",
        sourceRefJson:
          '{"demoUrl":"","repoUrl":"https://github.com/demo/locked-work","techNotesIncluded":true,"videoUrl":""}',
        status: "LOCKED",
        summary: "已锁定作品",
        techNotes: "locked notes",
        title: "Locked Work",
        videoUrl: "",
        visibility: "PRIVATE",
      },
    });

    await assert.rejects(
      () =>
        createSubmission(
          rider.id,
          buildSubmissionFormData({
            raceId: race.id,
            workFields: {
              workTitle: "不应覆盖",
              workSummary: "locked work 不应被新的提交覆盖。",
            },
          }),
        ),
      /当前作品已锁定，不能继续修改/,
    );

    const submissions = await prisma.submission.count({
      where: {
        raceId: race.id,
        registrationId: registration.id,
      },
    });

    assert.equal(submissions, 0);
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});

test("approved registrations can backfill a missing compatibility container during draft/save and submit flows", async () => {
  const [templateRace, rider] = await Promise.all([
    prisma.race.findFirstOrThrow({
      where: { id: "race_active" },
    }),
    prisma.user.findFirstOrThrow({
      where: { username: "rider_diana" },
    }),
  ]);

  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_work_container_backfill_${Date.now()}`,
      raceEnd: new Date("2026-07-12T12:00:00Z"),
      raceStart: new Date("2026-07-11T00:00:00Z"),
      signupEnd: new Date("2026-07-10T12:00:00Z"),
      signupStart: new Date("2026-07-01T00:00:00Z"),
      status: "running",
      submissionIntervalHours: 0,
      summary: "missing compatibility container backfill fixture",
      title: "Missing Compatibility Container Backfill Fixture",
    },
  });

  try {
    const registration = await createApprovedRegistrationFixture({
      raceId: race.id,
      riderId: rider.id,
      skipCompatibilityTeam: true,
    });

    assert.equal(
      await prisma.team.count({
        where: {
          captainId: rider.id,
          raceId: race.id,
        },
      }),
      0,
    );

    await saveWorkDraftForRider(
      rider.id,
      buildDraftFormData({
        raceId: race.id,
        workFields: {
          workTitle: "补建兼容容器草稿",
          workSummary: "approved registration 缺失 legacy team 时也应能保存草稿。",
        },
      }),
    );

    assert.equal(
      await prisma.team.count({
        where: {
          captainId: rider.id,
          raceId: race.id,
        },
      }),
      1,
    );

    await createSubmission(
      rider.id,
      buildSubmissionFormData({
        raceId: race.id,
        workFields: {
          workTitle: "补建兼容容器正式提交",
          workSummary: "approved registration 缺失 legacy team 时也应能正式提交。",
        },
      }),
    );

    const work = await prisma.work.findUniqueOrThrow({
      where: {
        registrationId: registration.id,
      },
    });

    assert.equal(work.status, "SUBMITTED");
    assert.equal(
      await prisma.submission.count({
        where: {
          raceId: race.id,
          registrationId: registration.id,
        },
      }),
      1,
    );
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});
