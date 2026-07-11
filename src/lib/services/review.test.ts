import assert from "node:assert/strict";
import test from "node:test";
import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import { buildWorkSourceRef } from "@/lib/material-integrity-helpers";
import { prisma } from "@/lib/prisma";
import { buildPublicReviewModel } from "@/lib/services/review";

test("public review model excludes unpublished awards", async () => {
  const seededAward = await prisma.award.findFirstOrThrow({
    where: {
      publishedAt: {
        not: null,
      },
      raceId: "race_finished",
    },
  });
  const draftAwardName = `Draft Review Award ${Date.now()}`;

  try {
    await prisma.award.create({
      data: {
        awardName: draftAwardName,
        decisionReason: "should stay private",
        raceId: seededAward.raceId,
        rank: 1,
        registrationId: seededAward.registrationId,
        workId: seededAward.workId,
      },
    });

    const reviewModel = await buildPublicReviewModel("race_finished");
    assert.equal(
      reviewModel.awards.some((award) => award.awardName === draftAwardName),
      false,
    );
  } finally {
    await prisma.award.deleteMany({
      where: {
        awardName: draftAwardName,
        raceId: "race_finished",
      },
    });
  }
});

test("public review model excludes draft judging record summaries", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: {
      registrations: {
        none: {
          raceId: "race_finished",
        },
      },
      username: {
        startsWith: "rider_",
      },
    },
  });
  const registration = await prisma.registration.create({
    data: {
      approvedAt: new Date("2026-06-17T08:00:00Z"),
      raceId: "race_finished",
      status: "APPROVED",
      userId: rider.id,
    },
  });
  const work = await prisma.work.create({
    data: {
      contentHash: buildPayloadDigest({
        demoUrl: "",
        repoUrl: "https://github.com/demo/draft-review-work",
        summary: "draft review work",
        techNotes: "draft review work notes",
        title: "Draft Review Work",
        videoUrl: "",
      }),
      demoUrl: "",
      registrationId: registration.id,
      repoUrl: "https://github.com/demo/draft-review-work",
      sourceRefJson: JSON.stringify(
        buildWorkSourceRef({
          demoUrl: "",
          repoUrl: "https://github.com/demo/draft-review-work",
          techNotes: "draft review work notes",
          videoUrl: "",
        }),
      ),
      summary: "draft review work",
      techNotes: "draft review work notes",
      title: "Draft Review Work",
      videoUrl: "",
      visibility: "PUBLIC",
    },
  });
  const assignment = await prisma.judgeAssignment.create({
    data: {
      assignedByUserId: "org_01",
      judgeId: "admin_01",
      workId: work.id,
    },
  });
  const draftComment = `draft review leak ${Date.now()}`;

  try {
    await prisma.judgingRecord.create({
      data: {
        comments: draftComment,
        judgeAssignmentId: assignment.id,
        scoreResultJson: JSON.stringify({ overall: 50 }),
        scoreRidingJson: JSON.stringify({ overall: 90 }),
        sourceDigest: "",
        sourceRefJson: "{}",
        submittedAt: null,
      },
    });

    const reviewModel = await buildPublicReviewModel("race_finished");
    assert.equal(
      reviewModel.judgingRecords.some((record) => record.comments === draftComment),
      false,
    );
  } finally {
    await prisma.judgingRecord.deleteMany({
      where: {
        judgeAssignmentId: assignment.id,
      },
    });
    await prisma.judgeAssignment.delete({
      where: {
        id: assignment.id,
      },
    });
    await prisma.work.delete({
      where: {
        id: work.id,
      },
    });
    await prisma.registration.delete({
      where: {
        id: registration.id,
      },
    });
  }
});
