import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import * as racesService from "@/lib/services/races";

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
    status: "active",
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

test("race calibration save updates the current race trackConfigJson", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_track_calibration_${Date.now()}`,
      summary: "track calibration fixture",
      title: "Track Calibration Fixture",
      trackConfigJson: JSON.stringify({
        startFinish: { s: 0.15 },
        checkpoints: [],
      }),
    },
  });

  try {
    await (
      racesService as {
        updateRaceTrackCalibration?: (input: {
          organizerId: string;
          raceId: string;
          trackConfigJson: string;
        }) => Promise<void>;
      }
    ).updateRaceTrackCalibration?.({
      organizerId: race.organizerId,
      raceId: race.id,
      trackConfigJson: JSON.stringify({
        startFinish: { s: 0.42 },
        checkpoints: [
          { id: "cp-1", name: "检查点 1", s: 0.3 },
          { id: "cp-2", name: "检查点 2", s: 0.8 },
        ],
      }),
    });

    const updatedRace = await prisma.race.findUniqueOrThrow({
      where: {
        id: race.id,
      },
    });

    assert.match(updatedRace.trackConfigJson, /0\.42/);
    assert.match(updatedRace.trackConfigJson, /检查点 1/);
    assert.match(updatedRace.trackConfigJson, /检查点 2/);
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});

test("race calibration save rejects organizers outside the managed race", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const organizerUser = await prisma.user.findFirstOrThrow({
    where: {
      username: "organizer_demo",
    },
  });
  const foreignOrganizer = await prisma.user.create({
    data: {
      passwordHash: organizerUser.passwordHash,
      profileCompleted: true,
      profileName: "Foreign Track Organizer",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_track_foreign_${Date.now()}`,
    },
  });
  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_track_calibration_forbidden_${Date.now()}`,
      organizerId: templateRace.organizerId,
      summary: "track calibration forbidden fixture",
      title: "Track Calibration Forbidden Fixture",
    },
  });

  try {
    await assert.rejects(
      async () =>
        (
          racesService as {
            updateRaceTrackCalibration?: (input: {
              allowSystem?: boolean;
              organizerId: string;
              raceId: string;
              trackConfigJson: string;
            }) => Promise<void>;
          }
        ).updateRaceTrackCalibration?.({
          allowSystem: true,
          organizerId: foreignOrganizer.id,
          raceId: race.id,
          trackConfigJson: JSON.stringify({
            startFinish: { s: 0.2 },
            checkpoints: [],
          }),
        }),
      /无权修改这场比赛的赛道校准/,
    );
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

test("race calibration save allows admin/system callers outside the managed race", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const adminUser = await prisma.user.findFirstOrThrow({
    where: {
      username: "admin_demo",
    },
  });
  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_track_calibration_admin_${Date.now()}`,
      organizerId: templateRace.organizerId,
      summary: "track calibration admin fixture",
      title: "Track Calibration Admin Fixture",
      trackConfigJson: JSON.stringify({
        startFinish: { s: 0.18 },
        checkpoints: [],
      }),
    },
  });

  try {
    await (
      racesService as {
        updateRaceTrackCalibration?: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
          trackConfigJson: string;
        }) => Promise<void>;
      }
    ).updateRaceTrackCalibration?.({
      allowSystem: true,
      organizerId: adminUser.id,
      raceId: race.id,
      trackConfigJson: JSON.stringify({
        startFinish: { s: 0.56 },
        checkpoints: [{ id: "cp-admin", name: "管理员校准点", s: 0.61 }],
      }),
    });

    const updatedRace = await prisma.race.findUniqueOrThrow({
      where: {
        id: race.id,
      },
    });

    assert.match(updatedRace.trackConfigJson, /0\.56/);
    assert.match(updatedRace.trackConfigJson, /管理员校准点/);
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});
