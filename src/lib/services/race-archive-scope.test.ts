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
    status: "completed",
    submissionIntervalHours: templateRace.submissionIntervalHours,
    taskDescription: templateRace.taskDescription,
    taskPackageLabel: templateRace.taskPackageLabel,
    title: "Race Archive Scope Fixture",
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

test("race archive service follows managed-race organizer and system admin boundaries", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const [adminUser, organizerUser] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: { username: "admin_demo" },
    }),
    prisma.user.findFirstOrThrow({
      where: { username: "organizer_demo" },
    }),
  ]);

  const foreignOrganizer = await prisma.user.create({
    data: {
      passwordHash: organizerUser.passwordHash,
      profileCompleted: true,
      profileName: "Foreign Race Archiver",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_race_archive_foreign_${Date.now()}`,
    },
  });

  const activeRace = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_archive_active_${Date.now()}`,
      raceEnd: new Date(Date.now() + 60 * 60 * 1000),
      raceStart: new Date(Date.now() - 30 * 60 * 1000),
      signupEnd: new Date(Date.now() - 60 * 60 * 1000),
      signupStart: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: "running",
      summary: "race archive active fixture",
    },
  });

  const completedRace = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_archive_completed_${Date.now()}`,
      summary: "race archive completed fixture",
    },
  });

  try {
    await assert.rejects(
      async () =>
        (
          racesService as {
            archiveRace: (input: {
              allowSystem?: boolean;
              organizerId: string;
              raceId: string;
            }) => Promise<unknown>;
          }
        ).archiveRace({
          allowSystem: true,
          organizerId: foreignOrganizer.id,
          raceId: completedRace.id,
        }),
      /无权归档这场比赛/,
    );

    await assert.rejects(
      async () =>
        (
          racesService as {
            archiveRace: (input: {
              allowSystem?: boolean;
              organizerId: string;
              raceId: string;
            }) => Promise<unknown>;
          }
        ).archiveRace({
          organizerId: completedRace.organizerId,
          raceId: activeRace.id,
        }),
      /只能在比赛结束后归档/,
    );

    const archivedRace = await (
      racesService as {
        archiveRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<{ status: string | null }>;
      }
    ).archiveRace({
      allowSystem: true,
      organizerId: adminUser.id,
      raceId: completedRace.id,
    });

    assert.equal(archivedRace.status, "archived");
  } finally {
    await prisma.race.deleteMany({
      where: {
        id: {
          in: [activeRace.id, completedRace.id],
        },
      },
    });
    await prisma.user.delete({
      where: {
        id: foreignOrganizer.id,
      },
    });
  }
});
