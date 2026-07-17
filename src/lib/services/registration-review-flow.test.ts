import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import * as registrationsService from "@/lib/services/registrations";

function buildRaceCreateInput(
  templateRace: Awaited<ReturnType<typeof prisma.race.findFirstOrThrow>>,
) {
  const now = Date.now();
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
    raceEnd: new Date(now + 72 * 60 * 60 * 1000),
    raceStart: new Date(now + 48 * 60 * 60 * 1000),
    signupEnd: new Date(now + 24 * 60 * 60 * 1000),
    signupStart: new Date(now - 24 * 60 * 60 * 1000),
    status: "published",
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

test("registration submit creates SUBMITTED first and approval provisions RaceProject and compatibility team", async () => {
  const [templateRace, rider, adminUser, organizerUser] = await Promise.all([
    prisma.race.findFirstOrThrow({
      where: {
        id: "race_finished",
      },
    }),
    prisma.user.findFirstOrThrow({
      where: {
        username: "rider_kate",
      },
    }),
    prisma.user.findFirstOrThrow({
      where: {
        username: "admin_demo",
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
      profileName: "Foreign Registration Organizer",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_registration_foreign_${Date.now()}`,
    },
  });
  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_registration_review_${Date.now()}`,
      summary: "registration review fixture",
      title: "Registration Review Fixture",
    },
  });

  try {
    const submittedRegistration = await registrationsService.registerForRace(
      rider.id,
      race.id,
    );

    assert.equal(submittedRegistration?.status, "SUBMITTED");
    assert.equal(submittedRegistration?.approvedAt ?? null, null);
    assert.equal(submittedRegistration?.raceProject ?? null, null);

    const registrationCount = await prisma.registration.count({
      where: {
        raceId: race.id,
        userId: rider.id,
      },
    });

    assert.equal(registrationCount, 1);

    await assert.rejects(
      async () =>
        registrationsService.approveRegistrationForRace({
          allowSystem: true,
          organizerId: foreignOrganizer.id,
          registrationId: submittedRegistration!.id,
        }),
      /无权批准这条报名/,
    );

    const approvedRegistration =
      await registrationsService.approveRegistrationForRace({
        allowSystem: true,
        organizerId: adminUser.id,
        registrationId: submittedRegistration!.id,
      });
  
      assert.equal(approvedRegistration?.status, "APPROVED");
      assert.notEqual(approvedRegistration?.approvedAt ?? null, null);
      assert.notEqual(approvedRegistration?.raceProject ?? null, null);
  
      const raceProjectCount = await prisma.raceProject.count({
        where: {
          registrationId: submittedRegistration!.id,
        },
      });
      const compatibilityTeamCount = await prisma.team.count({
        where: {
          captainId: rider.id,
          raceId: race.id,
        },
      });
  
      assert.equal(raceProjectCount, 1);
      // GRS004: 不再自动创建兼容队伍，由 createTeam/joinTeam 显式控制
      assert.equal(compatibilityTeamCount, 0);

    await registrationsService.approveRegistrationForRace({
      allowSystem: true,
      organizerId: adminUser.id,
      registrationId: submittedRegistration!.id,
    });

    const idempotentRaceProjectCount = await prisma.raceProject.count({
      where: {
        registrationId: submittedRegistration!.id,
      },
    });
    const idempotentCompatibilityTeamCount = await prisma.team.count({
      where: {
        captainId: rider.id,
        raceId: race.id,
      },
    });

    assert.equal(idempotentRaceProjectCount, 1);
    // GRS004: 不再自动创建兼容队伍，由 createTeam/joinTeam 显式控制
    assert.equal(idempotentCompatibilityTeamCount, 0);
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

test("registration reject keeps the rider out of approved participation context", async () => {
  const [templateRace, rider, organizerUser] = await Promise.all([
    prisma.race.findFirstOrThrow({
      where: {
        id: "race_finished",
      },
    }),
    prisma.user.findFirstOrThrow({
      where: {
        username: "rider_bob",
      },
    }),
    prisma.user.findFirstOrThrow({
      where: {
        username: "organizer_demo",
      },
    }),
  ]);
  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_registration_reject_${Date.now()}`,
      summary: "registration reject fixture",
      title: "Registration Reject Fixture",
    },
  });

  try {
    const submittedRegistration = await registrationsService.registerForRace(
      rider.id,
      race.id,
    );

    const rejectedRegistration =
      await registrationsService.rejectRegistrationForRace({
        organizerId: organizerUser.id,
        registrationId: submittedRegistration!.id,
      });

    assert.equal(rejectedRegistration.status, "REJECTED");
    assert.notEqual(rejectedRegistration.rejectedAt ?? null, null);

    const raceProjectCount = await prisma.raceProject.count({
      where: {
        registrationId: submittedRegistration!.id,
      },
    });
    const compatibilityTeamCount = await prisma.team.count({
      where: {
        captainId: rider.id,
        raceId: race.id,
      },
    });

    assert.equal(raceProjectCount, 0);
    assert.equal(compatibilityTeamCount, 0);
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});

test("registration withdraw allows riders to exit during registration and lets organizer exceptions withdraw approved entries", async () => {
  const [templateRace, riderAlice, riderBob, adminUser, organizerUser] =
    await Promise.all([
      prisma.race.findFirstOrThrow({
        where: {
          id: "race_finished",
        },
      }),
      prisma.user.findFirstOrThrow({
        where: {
          username: "rider_alice",
        },
      }),
      prisma.user.findFirstOrThrow({
        where: {
          username: "rider_bob",
        },
      }),
      prisma.user.findFirstOrThrow({
        where: {
          username: "admin_demo",
        },
      }),
      prisma.user.findFirstOrThrow({
        where: {
          username: "organizer_demo",
        },
      }),
    ]);
  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_registration_withdraw_${Date.now()}`,
      summary: "registration withdraw fixture",
      title: "Registration Withdraw Fixture",
    },
  });

  try {
    const riderSubmittedRegistration = await registrationsService.registerForRace(
      riderAlice.id,
      race.id,
    );

    const withdrawnByRider = await registrationsService.withdrawRegistrationForRace({
      actorUserId: riderAlice.id,
      registrationId: riderSubmittedRegistration!.id,
    });

    assert.equal(withdrawnByRider.status, "WITHDRAWN");
    assert.notEqual(withdrawnByRider.withdrawnAt ?? null, null);

    const approvedRegistration =
      await registrationsService.approveRegistrationForRace({
        allowSystem: true,
        organizerId: adminUser.id,
        registrationId: (
          await registrationsService.registerForRace(riderBob.id, race.id)
        )!.id,
      });

    const withdrawnByOrganizer =
      await registrationsService.withdrawRegistrationForRace({
        actorUserId: organizerUser.id,
        registrationId: approvedRegistration!.id,
      });

    assert.equal(withdrawnByOrganizer.status, "WITHDRAWN");

    const runningRace = await prisma.race.create({
      data: {
        ...buildRaceCreateInput(templateRace),
        id: `race_registration_withdraw_locked_${Date.now()}`,
        raceEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
        raceStart: new Date(Date.now() - 24 * 60 * 60 * 1000),
        signupEnd: new Date(Date.now() - 48 * 60 * 60 * 1000),
        signupStart: new Date(Date.now() - 72 * 60 * 60 * 1000),
        status: "published",
        summary: "registration withdraw locked fixture",
        title: "Registration Withdraw Locked Fixture",
      },
    });

    try {
      const lockedRegistration = await prisma.registration.create({
        data: {
          approvedAt: new Date(),
          raceId: runningRace.id,
          status: "APPROVED",
          userId: riderAlice.id,
        },
      });

      await assert.rejects(
        () =>
          registrationsService.withdrawRegistrationForRace({
            actorUserId: riderAlice.id,
            registrationId: lockedRegistration.id,
          }),
        /报名锁定后不能自行撤回/,
      );
    } finally {
      await prisma.race.delete({
        where: {
          id: runningRace.id,
        },
      });
    }
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});
