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
    title: "Race Edit Scope Fixture",
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

test("race edit services follow managed-race organizer and system admin boundaries", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const [adminUser, organizerUser] = await Promise.all([
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
      profileName: "Foreign Race Editor",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_race_edit_foreign_${Date.now()}`,
    },
  });

  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_edit_scope_${Date.now()}`,
      summary: "race edit scope fixture",
    },
  });

  try {
    await assert.rejects(
      async () =>
        (
          racesService as {
            updateRaceContent: (input: {
              allowSystem?: boolean;
              organizerId: string;
              raceId: string;
              taskDescription: string;
              trainingDataSummary: string;
            }) => Promise<unknown>;
          }
        ).updateRaceContent({
          allowSystem: true,
          organizerId: foreignOrganizer.id,
          raceId: race.id,
          taskDescription: "foreign edit should fail",
          trainingDataSummary: "foreign edit should fail",
        }),
      /无权修改这场比赛/,
    );

    const updatedRace = await (
      racesService as {
        updateRaceContent: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
          taskDescription: string;
          trainingDataSummary: string;
        }) => Promise<{
          taskDescription: string;
          trainingDataSummary: string;
        }>;
      }
    ).updateRaceContent({
      allowSystem: true,
      organizerId: adminUser.id,
      raceId: race.id,
      taskDescription: "admin updated description",
      trainingDataSummary: "admin updated training data",
    });

    assert.equal(updatedRace.taskDescription, "admin updated description");
    assert.equal(updatedRace.trainingDataSummary, "admin updated training data");

    await assert.rejects(
      async () =>
        (
          racesService as {
            updateOrganizerComment: (input: {
              allowSystem?: boolean;
              organizerComment: string;
              organizerId: string;
              raceId: string;
            }) => Promise<unknown>;
          }
        ).updateOrganizerComment({
          allowSystem: true,
          organizerComment: "foreign comment",
          organizerId: foreignOrganizer.id,
          raceId: race.id,
        }),
      /无权修改这场比赛/,
    );

    const commentUpdatedRace = await (
      racesService as {
        updateOrganizerComment: (input: {
          allowSystem?: boolean;
          organizerComment: string;
          organizerId: string;
          raceId: string;
        }) => Promise<{
          organizerComment: string;
        }>;
      }
    ).updateOrganizerComment({
      allowSystem: true,
      organizerComment: "admin organizer note",
      organizerId: adminUser.id,
      raceId: race.id,
    });

    assert.equal(commentUpdatedRace.organizerComment, "admin organizer note");

    await assert.rejects(
      async () =>
        (
          racesService as {
            updateRaceDisplayOptions: (input: {
              allowSystem?: boolean;
              displayHighlightCount: number;
              displayShowOrganizerComment: boolean;
              displayShowRiderCode: boolean;
              displayShowTopHighlights: boolean;
              displayShowTrainingData: boolean;
              organizerId: string;
              raceId: string;
            }) => Promise<void>;
          }
        ).updateRaceDisplayOptions({
          allowSystem: true,
          displayHighlightCount: 1,
          displayShowOrganizerComment: false,
          displayShowRiderCode: false,
          displayShowTopHighlights: false,
          displayShowTrainingData: false,
          organizerId: foreignOrganizer.id,
          raceId: race.id,
        }),
      /无权修改这场比赛/,
    );

    await (
      racesService as {
        updateRaceDisplayOptions: (input: {
          allowSystem?: boolean;
          displayHighlightCount: number;
          displayShowOrganizerComment: boolean;
          displayShowRiderCode: boolean;
          displayShowTopHighlights: boolean;
          displayShowTrainingData: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).updateRaceDisplayOptions({
      allowSystem: true,
      displayHighlightCount: 1,
      displayShowOrganizerComment: false,
      displayShowRiderCode: false,
      displayShowTopHighlights: false,
      displayShowTrainingData: false,
      organizerId: adminUser.id,
      raceId: race.id,
    });

    const displayUpdatedRace = await prisma.race.findUniqueOrThrow({
      where: {
        id: race.id,
      },
    });

    assert.equal(displayUpdatedRace.displayHighlightCount, 1);
    assert.equal(displayUpdatedRace.displayShowOrganizerComment, false);
    assert.equal(displayUpdatedRace.displayShowRiderCode, false);
    assert.equal(displayUpdatedRace.displayShowTopHighlights, false);
    assert.equal(displayUpdatedRace.displayShowTrainingData, false);
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
