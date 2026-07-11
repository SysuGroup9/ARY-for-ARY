import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import * as judgingService from "@/lib/services/judging";

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
    status: "judging",
    submissionIntervalHours: templateRace.submissionIntervalHours,
    taskDescription: templateRace.taskDescription,
    taskPackageLabel: templateRace.taskPackageLabel,
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

test("judge assignment write scope follows managed-race organizer and system admin boundaries", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const [adminUser, judgeUser, riderUser, organizerUser] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: {
        username: "admin_demo",
      },
    }),
    prisma.user.findFirstOrThrow({
      where: {
        username: "judge_demo",
      },
    }),
    prisma.user.findFirstOrThrow({
      where: {
        username: "rider_alice",
      },
    }),
    prisma.user.findFirstOrThrow({
      where: {
        username: "organizer_demo",
      },
    }),
  ]);

  const foreignOrganizer = await prisma.user.create({
    data: {
      passwordHash: organizerUser.passwordHash,
      profileCompleted: true,
      profileName: "Foreign Organizer",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_foreign_${Date.now()}`,
    },
  });

  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_judge_assignment_scope_${Date.now()}`,
      summary: "judge assignment scope fixture",
      title: "Judge Assignment Scope Fixture",
    },
  });

  try {
    const registration = await prisma.registration.create({
      data: {
        approvedAt: new Date("2026-07-11T08:00:00Z"),
        raceId: race.id,
        status: "APPROVED",
        userId: riderUser.id,
      },
    });

    const work = await prisma.work.create({
      data: {
        contentHash: "judge-assignment-scope-hash",
        registrationId: registration.id,
        sourceRefJson: "{}",
        summary: "judge assignment scope work",
        techNotes: "judge assignment scope notes",
        title: "Judge Assignment Scope Work",
        visibility: "PUBLIC",
      },
    });

    const organizerAssignment = await (
      judgingService as {
        assignJudgeToWork: (input: {
          allowSystem?: boolean;
          assignedByUserId: string;
          judgeId: string;
          workId: string;
        }) => Promise<{
          assignedByUserId: string;
          id: string;
          judgeId: string;
          workId: string;
        }>;
      }
    ).assignJudgeToWork({
      assignedByUserId: race.organizerId,
      judgeId: judgeUser.id,
      workId: work.id,
    });

    assert.equal(organizerAssignment.assignedByUserId, race.organizerId);
    assert.equal(organizerAssignment.judgeId, judgeUser.id);
    assert.equal(organizerAssignment.workId, work.id);

    await assert.rejects(async () =>
      (
        judgingService as {
          assignJudgeToWork: (input: {
            allowSystem?: boolean;
            assignedByUserId: string;
            judgeId: string;
            workId: string;
          }) => Promise<unknown>;
        }
      ).assignJudgeToWork({
        assignedByUserId: foreignOrganizer.id,
        judgeId: judgeUser.id,
        workId: work.id,
      }),
    );

    await assert.rejects(async () =>
      (
        judgingService as {
          assignJudgeToWork: (input: {
            allowSystem?: boolean;
            assignedByUserId: string;
            judgeId: string;
            workId: string;
          }) => Promise<unknown>;
        }
      ).assignJudgeToWork({
        allowSystem: true,
        assignedByUserId: foreignOrganizer.id,
        judgeId: judgeUser.id,
        workId: work.id,
      }),
    );

    await assert.rejects(async () =>
      (
        judgingService as {
          assignJudgeToWork: (input: {
            allowSystem?: boolean;
            assignedByUserId: string;
            judgeId: string;
            workId: string;
          }) => Promise<unknown>;
        }
      ).assignJudgeToWork({
        assignedByUserId: riderUser.id,
        judgeId: judgeUser.id,
        workId: work.id,
      }),
    );

    const adminUpdatedAssignment = await (
      judgingService as {
        assignJudgeToWork: (input: {
          allowSystem?: boolean;
          assignedByUserId: string;
          judgeId: string;
          workId: string;
        }) => Promise<{
          assignedByUserId: string;
          id: string;
        }>;
      }
    ).assignJudgeToWork({
      allowSystem: true,
      assignedByUserId: adminUser.id,
      judgeId: judgeUser.id,
      workId: work.id,
    });

    assert.equal(adminUpdatedAssignment.id, organizerAssignment.id);
    assert.equal(adminUpdatedAssignment.assignedByUserId, adminUser.id);

    const storedAssignment = await prisma.judgeAssignment.findUniqueOrThrow({
      where: {
        id: organizerAssignment.id,
      },
    });

    assert.equal(storedAssignment.assignedByUserId, adminUser.id);
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
    await prisma.user.delete({
      where: {
        id: foreignOrganizer.id,
      },
    });
  }
});

test("judge assignment remove follows managed-race organizer and system admin boundaries", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const [adminUser, judgeUser, riderUser, organizerUser] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: {
        username: "admin_demo",
      },
    }),
    prisma.user.findFirstOrThrow({
      where: {
        username: "judge_demo",
      },
    }),
    prisma.user.findFirstOrThrow({
      where: {
        username: "rider_alice",
      },
    }),
    prisma.user.findFirstOrThrow({
      where: {
        username: "organizer_demo",
      },
    }),
  ]);

  const foreignOrganizer = await prisma.user.create({
    data: {
      passwordHash: organizerUser.passwordHash,
      profileCompleted: true,
      profileName: "Foreign Organizer Remove",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_remove_foreign_${Date.now()}`,
    },
  });

  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_judge_assignment_remove_${Date.now()}`,
      summary: "judge assignment remove fixture",
      title: "Judge Assignment Remove Fixture",
    },
  });

  try {
    const registration = await prisma.registration.create({
      data: {
        approvedAt: new Date("2026-07-11T08:00:00Z"),
        raceId: race.id,
        status: "APPROVED",
        userId: riderUser.id,
      },
    });

    const work = await prisma.work.create({
      data: {
        contentHash: "judge-assignment-remove-hash",
        registrationId: registration.id,
        sourceRefJson: "{}",
        summary: "judge assignment remove work",
        techNotes: "judge assignment remove notes",
        title: "Judge Assignment Remove Work",
        visibility: "PUBLIC",
      },
    });

    const assignment = await prisma.judgeAssignment.create({
      data: {
        assignedByUserId: organizerUser.id,
        judgeId: judgeUser.id,
        workId: work.id,
      },
    });

    await assert.rejects(
      () =>
        judgingService.removeJudgeAssignment({
          assignedByUserId: foreignOrganizer.id,
          assignmentId: assignment.id,
        }),
      /Judge assignment not allowed for current actor/,
    );

    await assert.rejects(
      () =>
        judgingService.removeJudgeAssignment({
          allowSystem: true,
          assignedByUserId: foreignOrganizer.id,
          assignmentId: assignment.id,
        }),
      /Judge assignment not allowed for current actor/,
    );

    const deleted = await judgingService.removeJudgeAssignment({
      allowSystem: true,
      assignedByUserId: adminUser.id,
      assignmentId: assignment.id,
    });

    assert.equal(deleted.id, assignment.id);

    const remaining = await prisma.judgeAssignment.findUnique({
      where: {
        id: assignment.id,
      },
    });

    assert.equal(remaining, null);
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
    await prisma.user.delete({
      where: {
        id: foreignOrganizer.id,
      },
    });
  }
});
