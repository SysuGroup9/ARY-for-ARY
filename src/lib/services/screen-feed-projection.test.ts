import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import { rebuildRaceProcessProjections } from "@/lib/services/projections";

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

test("screen feed projection includes published final leaderboard and public works items", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const [riderAlice, riderBob] = await prisma.user.findMany({
    orderBy: {
      username: "asc",
    },
    take: 2,
    where: {
      username: {
        in: ["rider_alice", "rider_bob"],
      },
    },
  });
  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_screen_feed_${Date.now()}`,
      summary: "screen feed fixture",
      title: "Screen Feed Fixture",
    },
  });

  try {
    const [registrationAlice, registrationBob] = await Promise.all([
      prisma.registration.create({
        data: {
          approvedAt: new Date("2026-07-11T08:00:00Z"),
          raceId: race.id,
          status: "APPROVED",
          userId: riderAlice!.id,
        },
      }),
      prisma.registration.create({
        data: {
          approvedAt: new Date("2026-07-11T09:00:00Z"),
          raceId: race.id,
          status: "APPROVED",
          userId: riderBob!.id,
        },
      }),
    ]);

    const workAlice = await prisma.work.create({
      data: {
        contentHash: "screen-feed-work-hash",
        demoUrl: "",
        registrationId: registrationAlice.id,
        repoUrl: "https://github.com/demo/screen-feed",
        sourceRefJson: "{}",
        summary: "public screen feed work",
        techNotes: "screen feed notes",
        title: "Screen Feed Work",
        videoUrl: "",
        visibility: "PUBLIC",
      },
    });

    await prisma.award.create({
      data: {
        awardName: "Best Overall",
        decisionReason: "screen feed final leaderboard fixture",
        publishedAt: new Date("2026-07-11T12:00:00Z"),
        raceId: race.id,
        rank: 1,
        registrationId: registrationAlice.id,
        sourceDigest: "screen-feed-award-digest",
        sourceRefJson: JSON.stringify({ fixture: "award" }),
        workId: workAlice.id,
      },
    });

    await prisma.notification.create({
      data: {
        content: "Final review starts at 18:00.",
        raceId: race.id,
        target: "ALL",
        title: "Stage Notice",
      },
    });

    await rebuildRaceProcessProjections(race.id);

    const screenFeedProjection = await prisma.projection.findUniqueOrThrow({
      where: {
        raceId_type: {
          raceId: race.id,
          type: "SCREEN_FEED",
        },
      },
    });

    const payload = JSON.parse(screenFeedProjection.payloadJson) as {
      items: Array<{ summary: string; type: string }>;
      raceId: string;
    };

    assert.equal(payload.raceId, race.id);
    assert.equal(
      payload.items.some((item) => item.type === "leaderboard_read_model"),
      true,
    );
    assert.equal(
      payload.items.some((item) => item.type === "works"),
      true,
    );
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});
