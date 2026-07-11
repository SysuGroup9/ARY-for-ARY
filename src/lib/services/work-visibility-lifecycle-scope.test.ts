import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import { buildWorkSourceRef } from "@/lib/material-integrity-helpers";
import { prisma } from "@/lib/prisma";
import * as worksService from "@/lib/services/works";

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

test("work visibility lifecycle follows rider draft and managed-race/system boundaries", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const [adminUser, riderUser, secondRiderUser, organizerUser] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: {
        username: "admin_demo",
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
        username: "organizer_demo",
      },
    }),
  ]);

  const foreignOrganizer = await prisma.user.create({
    data: {
      passwordHash: organizerUser.passwordHash,
      profileCompleted: true,
      profileName: "Foreign Work Organizer",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_work_foreign_${Date.now()}`,
    },
  });

  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_work_visibility_${Date.now()}`,
      summary: "work visibility scope fixture",
      title: "Work Visibility Scope Fixture",
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
    const draftWork = await prisma.work.create({
      data: {
        contentHash: buildPayloadDigest({
          title: "Draft Work",
        }),
        registrationId: registration.id,
        sourceRefJson: JSON.stringify(
          buildWorkSourceRef({
            demoUrl: "",
            repoUrl: "",
            techNotes: "",
            videoUrl: "",
          }),
        ),
        status: "DRAFT",
        summary: "draft work summary",
        techNotes: "",
        title: "Draft Work",
        visibility: "PRIVATE",
      },
    });

    const hiddenByRider = await worksService.hideWorkForRace({
      actorUserId: riderUser.id,
      workId: draftWork.id,
    });

    assert.equal(hiddenByRider.status, "HIDDEN");
    assert.equal(hiddenByRider.visibility, "PRIVATE");

    const secondRegistration = await prisma.registration.create({
      data: {
        approvedAt: new Date("2026-07-11T09:00:00Z"),
        raceId: race.id,
        status: "APPROVED",
        userId: secondRiderUser.id,
      },
    });
    const publicWork = await prisma.work.create({
      data: {
        contentHash: buildPayloadDigest({
          title: "Public Work",
        }),
        demoUrl: "",
        registrationId: secondRegistration.id,
        repoUrl: "",
        sourceRefJson: JSON.stringify(
          buildWorkSourceRef({
            demoUrl: "",
            repoUrl: "",
            techNotes: "",
            videoUrl: "",
          }),
        ),
        status: "SUBMITTED",
        summary: "public work summary",
        techNotes: "",
        title: `Public Work ${randomUUID()}`,
        videoUrl: "",
        visibility: "PUBLIC",
      },
    });

    await assert.rejects(
      () =>
        worksService.hideWorkForRace({
          actorUserId: foreignOrganizer.id,
          allowSystem: true,
          workId: publicWork.id,
        }),
      /无权隐藏这份作品/,
    );

    const hiddenByAdmin = await worksService.hideWorkForRace({
      actorUserId: adminUser.id,
      allowSystem: true,
      workId: publicWork.id,
    });

    assert.equal(hiddenByAdmin.status, "HIDDEN");
    assert.equal(hiddenByAdmin.visibility, "PRIVATE");

    await assert.rejects(
      () =>
        worksService.publishWorkForRace({
          actorUserId: foreignOrganizer.id,
          allowSystem: true,
          workId: publicWork.id,
        }),
      /无权公开这份作品/,
    );

    const republished = await worksService.publishWorkForRace({
      actorUserId: adminUser.id,
      allowSystem: true,
      workId: publicWork.id,
    });

    assert.equal(republished.status, "SUBMITTED");
    assert.equal(republished.visibility, "PUBLIC");

    await assert.rejects(
      () =>
        worksService.lockWorkForRace({
          actorUserId: foreignOrganizer.id,
          allowSystem: true,
          workId: publicWork.id,
        }),
      /无权锁定这份作品/,
    );

    const locked = await worksService.lockWorkForRace({
      actorUserId: adminUser.id,
      allowSystem: true,
      workId: publicWork.id,
    });

    assert.equal(locked.status, "LOCKED");
    assert.equal(locked.visibility, "PUBLIC");
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
