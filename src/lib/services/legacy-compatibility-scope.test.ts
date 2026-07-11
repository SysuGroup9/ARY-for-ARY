import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import * as feedbackService from "@/lib/services/feedback";
import * as teamsService from "@/lib/services/teams";

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
    title: "Legacy Compatibility Scope Fixture",
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

test("legacy team comment and feedback reply follow managed-race organizer and system admin boundaries", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const [adminUser, organizerUser, riderUser] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: { username: "admin_demo" },
    }),
    prisma.user.findFirstOrThrow({
      where: { username: "organizer_demo" },
    }),
    prisma.user.findFirstOrThrow({
      where: { username: "rider_alice" },
    }),
  ]);

  const foreignOrganizer = await prisma.user.create({
    data: {
      passwordHash: organizerUser.passwordHash,
      profileCompleted: true,
      profileName: "Foreign Legacy Organizer",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_legacy_foreign_${Date.now()}`,
    },
  });

  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_legacy_scope_${Date.now()}`,
      summary: "legacy compatibility scope fixture",
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

    const team = await prisma.team.create({
      data: {
        captainId: riderUser.id,
        name: "Legacy Team Scope",
        raceId: race.id,
      },
    });

    const createdComment = await (
      teamsService as {
        updateTeamComment: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
          teamId: string;
          content: string;
        }) => Promise<{ content: string }>;
      }
    ).updateTeamComment({
      organizerId: race.organizerId,
      raceId: race.id,
      teamId: team.id,
      content: "organizer legacy comment",
    });

    assert.equal(createdComment.content, "organizer legacy comment");

    await assert.rejects(
      async () =>
        (
          teamsService as {
            updateTeamComment: (input: {
              allowSystem?: boolean;
              organizerId: string;
              raceId: string;
              teamId: string;
              content: string;
            }) => Promise<unknown>;
          }
        ).updateTeamComment({
          allowSystem: true,
          organizerId: foreignOrganizer.id,
          raceId: race.id,
          teamId: team.id,
          content: "foreign legacy comment",
        }),
      /无权修改队伍评语/,
    );

    const adminUpdatedComment = await (
      teamsService as {
        updateTeamComment: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
          teamId: string;
          content: string;
        }) => Promise<{ content: string }>;
      }
    ).updateTeamComment({
      allowSystem: true,
      organizerId: adminUser.id,
      raceId: race.id,
      teamId: team.id,
      content: "admin legacy comment",
    });

    assert.equal(adminUpdatedComment.content, "admin legacy comment");

    const thread = await prisma.feedbackThread.create({
      data: {
        raceId: race.id,
        registrationId: registration.id,
        status: "PENDING",
        teamId: team.id,
      },
    });

    const replyFormData = new FormData();
    replyFormData.set("threadId", thread.id);
    replyFormData.set("content", "admin legacy reply");
    replyFormData.set("markResolved", "on");

    await assert.rejects(
      async () =>
        (
          feedbackService as {
            replyFeedback: (input: {
              allowSystem?: boolean;
              formData: FormData;
              organizerId: string;
            }) => Promise<unknown>;
          }
        ).replyFeedback({
          allowSystem: true,
          formData: replyFormData,
          organizerId: foreignOrganizer.id,
        }),
      /无权回复这条反馈/,
    );

    const updatedThread = await (
      feedbackService as {
        replyFeedback: (input: {
          allowSystem?: boolean;
          formData: FormData;
          organizerId: string;
        }) => Promise<{ status: string }>;
      }
    ).replyFeedback({
      allowSystem: true,
      formData: replyFormData,
      organizerId: adminUser.id,
    });

    assert.equal(updatedThread.status, "RESOLVED");

    const replyMessages = await prisma.feedbackMessage.findMany({
      where: {
        threadId: thread.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    assert.equal(replyMessages.at(-1)?.authorId, adminUser.id);
    assert.equal(replyMessages.at(-1)?.content, "admin legacy reply");
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
