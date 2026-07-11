import assert from "node:assert/strict";
import test from "node:test";
import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import {
  buildWorkSourceRef,
  captureRemoteAssetSnapshot,
} from "@/lib/material-integrity-helpers";
import { prisma } from "@/lib/prisma";
import { buildPublicResultsModel } from "@/lib/services/results";

test("builds public results model with work slugs and riding skill highlights", async () => {
  const result = await buildPublicResultsModel("race_finished");

  assert.equal(result.awards.length > 0, true);
  assert.equal(
    result.awards.some((award) => award.work?.slug?.startsWith("race_finished__")),
    true,
  );
  assert.equal(result.ridingSkillHighlights.length > 0, true);
});

test("public results model drops tampered award work links", async () => {
  const awardWithWork = await prisma.award.findFirstOrThrow({
    include: {
      work: true,
    },
    where: {
      raceId: "race_finished",
      workId: {
        not: null,
      },
    },
  });

  const work = awardWithWork.work!;
  const originalSummary = work.summary;

  try {
    await prisma.work.update({
      where: { id: work.id },
      data: {
        summary: `${originalSummary} tampered`,
      },
    });

    const result = await buildPublicResultsModel("race_finished");
    const tamperedAward = result.awards.find((award) => award.id === awardWithWork.id);

    assert.ok(tamperedAward);
    assert.equal(tamperedAward!.work, null);
  } finally {
    await prisma.work.update({
      where: { id: work.id },
      data: {
        summary: originalSummary,
      },
    });
  }
});

test("public results model drops stale video snapshot work links", async () => {
  const awardWithWork = await prisma.award.findFirstOrThrow({
    include: {
      work: true,
    },
    where: {
      raceId: "race_finished",
      workId: {
        not: null,
      },
    },
  });

  const work = awardWithWork.work!;
  const originalVideoUrl = work.videoUrl;
  const originalSourceRefJson = work.sourceRefJson;
  const staleVideoRef = await captureRemoteAssetSnapshot({
    assetKind: "video",
    fetchImpl: async () =>
      new Response("video-v1", {
        headers: {
          "content-type": "video/mp4",
        },
        status: 200,
      }),
    url: "https://video.example/work-1",
  });

  try {
    await prisma.work.update({
      where: { id: work.id },
      data: {
        sourceRefJson: JSON.stringify(
          buildWorkSourceRef({
            demoUrl: work.demoUrl,
            repoUrl: work.repoUrl,
            techNotes: work.techNotes,
            videoRef: staleVideoRef,
            videoUrl: "https://video.example/work-2",
          }),
        ),
        videoUrl: "https://video.example/work-2",
      },
    });

    const result = await buildPublicResultsModel("race_finished");
    const tamperedAward = result.awards.find((award) => award.id === awardWithWork.id);

    assert.ok(tamperedAward);
    assert.equal(tamperedAward!.work, null);
  } finally {
    await prisma.work.update({
      where: { id: work.id },
      data: {
        sourceRefJson: originalSourceRefJson,
        videoUrl: originalVideoUrl,
      },
    });
  }
});

test("public results model excludes unpublished awards", async () => {
  const seededAward = await prisma.award.findFirstOrThrow({
    where: {
      publishedAt: {
        not: null,
      },
      raceId: "race_finished",
    },
  });
  const draftAwardName = `Draft Leak Award ${Date.now()}`;

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

    const result = await buildPublicResultsModel("race_finished");
    assert.equal(
      result.awards.some((award) => award.awardName === draftAwardName),
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

test("public results model ignores draft judging records when building riding skill highlights", async () => {
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
  const before = await buildPublicResultsModel("race_finished");
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
        repoUrl: "https://github.com/demo/draft-judging-work",
        summary: "draft judging work",
        techNotes: "draft judging work notes",
        title: "Draft Judging Work",
        videoUrl: "",
      }),
      demoUrl: "",
      registrationId: registration.id,
      repoUrl: "https://github.com/demo/draft-judging-work",
      sourceRefJson: JSON.stringify(
        buildWorkSourceRef({
          demoUrl: "",
          repoUrl: "https://github.com/demo/draft-judging-work",
          techNotes: "draft judging work notes",
          videoUrl: "",
        }),
      ),
      summary: "draft judging work",
      techNotes: "draft judging work notes",
      title: "Draft Judging Work",
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

  try {
    await prisma.judgingRecord.create({
      data: {
        comments: "recovery draft leak comment",
        judgeAssignmentId: assignment.id,
        scoreResultJson: JSON.stringify({ overall: 50 }),
        scoreRidingJson: JSON.stringify({ overall: 90 }),
        sourceDigest: "",
        sourceRefJson: "{}",
        submittedAt: null,
      },
    });

    const after = await buildPublicResultsModel("race_finished");
    assert.equal(after.ridingSkillHighlights.length, before.ridingSkillHighlights.length);
    assert.equal(
      after.ridingSkillHighlights.some(
        (item) => item.label === "风险处理" && item.riderName === rider.username,
      ),
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
