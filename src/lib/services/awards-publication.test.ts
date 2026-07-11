import assert from "node:assert/strict";
import test from "node:test";
import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import { buildWorkSourceRef } from "@/lib/material-integrity-helpers";
import { prisma } from "@/lib/prisma";
import * as awardsService from "@/lib/services/awards";

test("formal award publication derives published awards from submitted judging records", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const riders = await prisma.user.findMany({
    orderBy: {
      username: "asc",
    },
    take: 3,
    where: {
      username: {
        in: ["rider_alice", "rider_bob", "rider_charlie"],
      },
    },
  });
  const raceId = `race_award_publish_${Date.now()}`;
  const race = await prisma.race.create({
    data: {
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
      id: raceId,
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
      summary: "formal award publication fixture",
      taskDescription: templateRace.taskDescription,
      taskPackageLabel: templateRace.taskPackageLabel,
      title: "Formal Award Publication Fixture",
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
    },
  });
  const approvalTimes = [
    new Date("2026-06-17T08:00:00Z"),
    new Date("2026-06-17T09:00:00Z"),
    new Date("2026-06-17T10:00:00Z"),
  ];

  try {
    const registrations = await Promise.all(
      riders.map((rider, index) =>
        prisma.registration.create({
          data: {
            approvedAt: approvalTimes[index]!,
            raceId: race.id,
            status: "APPROVED",
            userId: rider.id,
          },
        }),
      ),
    );
    const works = await Promise.all(
      registrations.map((registration, index) =>
        prisma.work.create({
          data: {
            contentHash: buildPayloadDigest({
              demoUrl: "",
              repoUrl: `https://github.com/demo/formal-award-${index}`,
              registrationId: registration.id,
              summary: `fixture work ${index}`,
              techNotes: `fixture work notes ${index}`,
              title: `Fixture Work ${index}`,
              videoUrl: "",
            }),
            demoUrl: "",
            registrationId: registration.id,
            repoUrl: `https://github.com/demo/formal-award-${index}`,
            sourceRefJson: JSON.stringify(
              buildWorkSourceRef({
                demoUrl: "",
                repoUrl: `https://github.com/demo/formal-award-${index}`,
                techNotes: `fixture work notes ${index}`,
                videoUrl: "",
              }),
            ),
            summary: `fixture work ${index}`,
            techNotes: `fixture work notes ${index}`,
            title: `Fixture Work ${index}`,
            videoUrl: "",
            visibility: "PUBLIC",
          },
        }),
      ),
    );
    await Promise.all(
      registrations.map((registration, index) =>
        prisma.evidence.create({
          data: {
            confidenceLevel: "HIGH",
            integrityStatus: "OK",
            registrationId: registration.id,
            reviewFlagJson: "[]",
            sourceDigest: `evidence_digest_${index}`,
            sourceRefJson: JSON.stringify({ fixture: index }),
            summary: `fixture evidence ${index}`,
            title: `Fixture Evidence ${index}`,
            type: "SESSION_SUMMARY",
            visibility: "INTERNAL",
          },
        }),
      ),
    );
    const assignments = await Promise.all(
      works.map((work, index) =>
        prisma.judgeAssignment.create({
          data: {
            assignedAt: new Date(`2026-06-17T1${index}:00:00Z`),
            assignedByUserId: "org_01",
            judgeId: "judge_01",
            workId: work.id,
          },
        }),
      ),
    );
    await Promise.all([
      prisma.judgingRecord.create({
        data: {
          comments: "best work candidate",
          judgeAssignmentId: assignments[0]!.id,
          scoreResultJson: JSON.stringify({ overall: 100 }),
          scoreRidingJson: JSON.stringify({ overall: 40 }),
          sourceDigest: "",
          sourceRefJson: "{}",
          submittedAt: new Date("2026-06-17T12:00:00Z"),
        },
      }),
      prisma.judgingRecord.create({
        data: {
          comments: "best overall candidate",
          judgeAssignmentId: assignments[1]!.id,
          scoreResultJson: JSON.stringify({ overall: 80 }),
          scoreRidingJson: JSON.stringify({ overall: 70 }),
          sourceDigest: "",
          sourceRefJson: "{}",
          submittedAt: new Date("2026-06-17T12:05:00Z"),
        },
      }),
      prisma.judgingRecord.create({
        data: {
          comments: "best rider candidate",
          judgeAssignmentId: assignments[2]!.id,
          scoreResultJson: JSON.stringify({ overall: 70 }),
          scoreRidingJson: JSON.stringify({ overall: 75 }),
          sourceDigest: "",
          sourceRefJson: "{}",
          submittedAt: new Date("2026-06-17T12:10:00Z"),
        },
      }),
    ]);

    await (
      awardsService as {
        publishAwardsForRace?: (input: {
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).publishAwardsForRace?.({
      organizerId: race.organizerId,
      raceId: race.id,
    });

    const publishedAwards = await prisma.award.findMany({
      orderBy: {
        awardName: "asc",
      },
      where: {
        raceId: race.id,
      },
    });

    assert.equal(publishedAwards.length, 3);
    assert.equal(
      publishedAwards.find((award) => award.awardName === "Best Overall")
        ?.registrationId,
      registrations[1]!.id,
    );
    assert.equal(
      publishedAwards.find((award) => award.awardName === "Best Work")?.registrationId,
      registrations[0]!.id,
    );
    assert.equal(
      publishedAwards.find((award) => award.awardName === "Best Agent Rider")
        ?.registrationId,
      registrations[2]!.id,
    );
    assert.equal(
      publishedAwards.every(
        (award) =>
          award.publishedAt instanceof Date &&
          award.sourceDigest.length > 0 &&
          award.sourceRefJson !== "{}",
      ),
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
