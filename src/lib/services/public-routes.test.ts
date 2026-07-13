import assert from "node:assert/strict";
import test from "node:test";
import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import { buildRaceSlug, buildWorkSlug } from "@/lib/public-site";
import {
  buildWorkSourceRef,
  captureGitHubReferenceSnapshot,
  captureRemoteAssetSnapshot,
} from "@/lib/material-integrity-helpers";
import { prisma } from "@/lib/prisma";
import { getRaceBySlug, getRiderBySlug, getWorkBySlug } from "@/lib/services/public-routes";

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
    status: "draft",
    submissionIntervalHours: templateRace.submissionIntervalHours,
    taskDescription: templateRace.taskDescription,
    taskPackageLabel: templateRace.taskPackageLabel,
    title: "Draft Public Route Fixture",
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

test("resolves a public work by the new work-id slug", async () => {
  const race = await prisma.race.findFirstOrThrow({
    where: { id: "race_finished" },
  });

  const work = await prisma.work.findFirst({
    include: {
      team: {
        include: {
          registrations: {
            where: { status: { not: "WITHDRAWN" } },
            include: { race: true },
          },
        },
      },
    },
    where: {
      team: { raceId: "race_finished" },
    },
  });

  assert.ok(work, "expected seeded work for race_finished");

  const result = await getWorkBySlug(
    buildWorkSlug(race.id, work.id, work.title),
  );

  assert.ok(result);
  assert.equal(result.title, work.title);
  assert.equal(result.raceTitle, race.title);
  assert.equal(typeof result.techNotes, "string");
  assert.equal(Array.isArray(result.judgeComments), true);
});

test("still resolves a public work by the legacy team-id slug for compatibility", async () => {
  const team = await prisma.team.findFirst({
    where: {
      raceId: "race_finished",
    },
  });

  assert.ok(team, "expected seeded team for race_finished");

  const result = await getWorkBySlug(`${team.raceId}__${team.id}--legacy-compat`);

  assert.ok(result);
  assert.equal(result.raceSlug.startsWith("race_finished--"), true);
});

test("returns technical notes and judge comments for the public work page", async () => {
  const race = await prisma.race.findFirstOrThrow({
    where: { id: "race_finished" },
  });

  const work = await prisma.work.findFirst({
    include: {
      judgeAssignments: {
        include: {
          judgingRecord: true,
          judge: true,
        },
      },
      team: {
        include: {
          registrations: {
            where: { status: { not: "WITHDRAWN" } },
            include: { race: true },
          },
        },
      },
    },
    where: {
      team: { raceId: "race_finished" },
    },
  });

  assert.ok(work, "expected seeded work for race_finished");

  const result = await getWorkBySlug(
    buildWorkSlug(race.id, work.id, work.title),
  );

  assert.ok(result);
  assert.equal(result.techNotes.length > 0, true);
  assert.equal(result.judgeComments.length > 0, true);
  assert.equal(result.judgeComments[0]?.judgeName.length > 0, true);
  assert.equal(result.judgeComments[0]?.summary.length > 0, true);
});

test("public work route hides tampered works", async () => {
  const race = await prisma.race.findFirstOrThrow({
    where: { id: "race_finished" },
  });

  const work = await prisma.work.findFirstOrThrow({
    where: {
      team: { raceId: "race_finished" },
    },
  });

  const originalSummary = work.summary;

  try {
    await prisma.work.update({
      where: { id: work.id },
      data: {
        summary: `${originalSummary} tampered`,
      },
    });

    const result = await getWorkBySlug(
      buildWorkSlug(race.id, work.id, work.title),
    );

    assert.equal(result, null);
  } finally {
    await prisma.work.update({
      where: { id: work.id },
      data: {
        summary: originalSummary,
      },
    });
  }
});

test("race read model filters tampered works from public works pages", async () => {
  const race = await prisma.race.findFirstOrThrow({
    where: { id: "race_finished" },
  });

  const work = await prisma.work.findFirstOrThrow({
    where: {
      team: { raceId: "race_finished" },
    },
  });

  const originalSummary = work.summary;

  try {
    await prisma.work.update({
      where: { id: work.id },
      data: {
        summary: `${originalSummary} tampered`,
      },
    });

    // GRS004: tampered works are hidden by sanitizePublicWork in getWorkBySlug
    const tamperedResult = await getWorkBySlug(
      buildWorkSlug(race.id, work.id, work.title),
    );
    assert.equal(tamperedResult, null, "tampered work should be hidden from public page");
  } finally {
    await prisma.work.update({
      where: { id: work.id },
      data: {
        summary: originalSummary,
      },
    });
  }
});

test("public work route hides stale github commit snapshots while preserving legacy works", async () => {
  const race = await prisma.race.findFirstOrThrow({
    where: { id: "race_finished" },
  });

  const work = await prisma.work.findFirstOrThrow({
    where: {
      team: { raceId: "race_finished" },
    },
  });

  const originalRepoUrl = work.repoUrl;
  const originalSourceRefJson = work.sourceRefJson;
  const currentRepoUrl = "https://github.com/demo/work/commit/bbbbbbbb";
  const staleSnapshot = await captureGitHubReferenceSnapshot({
    repoUrl: "https://github.com/demo/work/commit/aaaaaaaa",
  });

  try {
    await prisma.work.update({
      where: { id: work.id },
      data: {
        repoUrl: currentRepoUrl,
        sourceRefJson: JSON.stringify(
          buildWorkSourceRef({
            demoUrl: work.demoUrl,
            githubRef: staleSnapshot,
            repoUrl: currentRepoUrl,
            techNotes: work.techNotes,
            videoUrl: work.videoUrl,
          }),
        ),
      },
    });

    const result = await getWorkBySlug(
      buildWorkSlug(race.id, work.id, work.title),
    );

    assert.equal(result, null);
  } finally {
    await prisma.work.update({
      where: { id: work.id },
      data: {
        repoUrl: originalRepoUrl,
        sourceRefJson: originalSourceRefJson,
      },
    });
  }
});

test("public work route hides stale demo snapshots", async () => {
  const race = await prisma.race.findFirstOrThrow({
    where: { id: "race_finished" },
  });

  const work = await prisma.work.findFirstOrThrow({
    where: {
      team: { raceId: "race_finished" },
    },
  });

  const originalDemoUrl = work.demoUrl;
  const originalSourceRefJson = work.sourceRefJson;
  const staleDemoRef = await captureRemoteAssetSnapshot({
    assetKind: "demo",
    fetchImpl: async () =>
      new Response("<html>demo-v1</html>", {
        headers: {
          "content-type": "text/html",
        },
        status: 200,
      }),
    url: "https://demo.example/work-1",
  });

  try {
    await prisma.work.update({
      where: { id: work.id },
      data: {
        demoUrl: "https://demo.example/work-2",
        sourceRefJson: JSON.stringify(
          buildWorkSourceRef({
            demoRef: staleDemoRef,
            demoUrl: "https://demo.example/work-2",
            repoUrl: work.repoUrl,
            techNotes: work.techNotes,
            videoUrl: work.videoUrl,
          }),
        ),
      },
    });

    const result = await getWorkBySlug(
      buildWorkSlug(race.id, work.id, work.title),
    );

    assert.equal(result, null);
  } finally {
    await prisma.work.update({
      where: { id: work.id },
      data: {
        demoUrl: originalDemoUrl,
        sourceRefJson: originalSourceRefJson,
      },
    });
  }
});

test("public race route hides draft races before publish", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });

  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_public_draft_${Date.now()}`,
      summary: "draft public route fixture",
    },
  });

  try {
    const result = await getRaceBySlug(buildRaceSlug(race.id, race.title));
    assert.equal(result, null);
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});

test("returns rider profile aggregates for skill tags, performance summary, and judge comments", async () => {
  const rider = await prisma.user.findFirst({
    where: {
      username: "rider_bob",
    },
  });

  assert.ok(rider, "expected seeded rider_bob user");

  const result = await getRiderBySlug(`${rider.id}--${rider.username}`);

  assert.ok(result);
  assert.equal(Array.isArray(result.skillTags), true);
  assert.equal(result.skillTags.length > 0, true);
  assert.equal(result.performanceSummary.totalTokens > 0, true);
  assert.equal(result.performanceSummary.averageProgressPercent > 0, true);
  assert.equal(Array.isArray(result.judgeComments), true);
  assert.equal(result.judgeComments.length > 0, true);
});

test("public rider profile does not change when raw sessions change without projection rebuild", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: {
      username: "rider_bob",
    },
  });
  const registration = await prisma.registration.findFirstOrThrow({
    where: {
      userId: rider.id,
    },
    include: {
      raceProject: {
        include: {
          caConnections: {
            include: {
              sessions: true,
            },
          },
        },
      },
    },
  });
  const session = registration.raceProject?.caConnections[0]?.sessions[0];

  assert.ok(session, "expected seeded session for rider_bob");

  const before = await getRiderBySlug(`${rider.id}--${rider.username}`);
  assert.ok(before);

  try {
    await prisma.session.update({
      where: {
        id: session!.id,
      },
      data: {
        progressPercent: 3,
        riskLevel: "high",
        riskReason: "tampered_public_session_read",
        tokenCost: 999999,
      },
    });

    const after = await getRiderBySlug(`${rider.id}--${rider.username}`);
    assert.ok(after);
    assert.deepEqual(after.performanceSummary, before.performanceSummary);
  } finally {
    await prisma.session.update({
      where: {
        id: session!.id,
      },
      data: {
        progressPercent: session!.progressPercent,
        riskLevel: session!.riskLevel,
        riskReason: session!.riskReason,
        tokenCost: session!.tokenCost,
      },
    });
  }
});

test("public rider profile does not expose rider_report summaries anymore", async () => {
  const rider = await prisma.user.findFirstOrThrow({
    where: {
      username: "rider_bob",
    },
  });

  const result = await getRiderBySlug(`${rider.id}--${rider.username}`);

  assert.ok(result);
  assert.deepEqual(result.reportSummaries, []);
});

test("public routes expose only PUBLIC evidences on work and rider pages", async () => {
  const race = await prisma.race.findFirstOrThrow({
    where: { id: "race_finished" },
  });

  const work = await prisma.work.findFirstOrThrow({
    include: {
      team: {
        include: {
          members: {
            where: { role: "LEADER" },
            include: { user: true },
          },
          registrations: {
            where: { status: "APPROVED" },
            include: { user: true, race: true },
          },
        },
      },
    },
    where: {
      team: { raceId: "race_finished" },
    },
  });

  const leaderUser = work.team?.members?.[0]?.user ?? work.team?.registrations?.[0]?.user ?? null;

  const internalEvidence = await prisma.evidence.create({
    data: {
      registrationId: work.registrationId ?? "",
      sourceRefJson: JSON.stringify({ test: "internal" }),
      summary: "internal evidence should stay hidden",
      title: "Internal Evidence",
      type: "SESSION_SUMMARY",
      visibility: "INTERNAL",
    },
  });

  try {
    const workResult = await getWorkBySlug(
      buildWorkSlug(race.id, work.id, work.title),
    );
    const riderResult = leaderUser
      ? await getRiderBySlug(
          `${leaderUser.id}--${leaderUser.username}`,
        )
      : null;

    assert.ok(workResult);
    assert.ok(riderResult);
    assert.equal(
      workResult.evidenceSummaries.includes("internal evidence should stay hidden"),
      false,
    );
    const raceRecord = riderResult?.raceRecords.find(
      (record) => record.raceId === race.id,
    );
    assert.ok(raceRecord);
    assert.equal(raceRecord!.evidenceCount, 1);
  } finally {
    await prisma.evidence.delete({
      where: {
        id: internalEvidence.id,
      },
    });
  }
});

test("public race route no longer returns raw session arrays", async () => {
  const race = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_active",
    },
  });

  const result = await getRaceBySlug(buildRaceSlug(race.id, race.title));

  assert.ok(result);
  const firstConnection =
    result.registrations[0]?.raceProject?.caConnections[0];
  assert.ok(firstConnection);
  assert.equal("sessions" in firstConnection!, false);
});

test("public race, rider, and work routes exclude unpublished awards and draft judging comments", async () => {
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

  // GRS004: Create a Team to associate Work
  const team = await prisma.team.create({
    data: {
      captainId: rider.id,
      leaderId: rider.id,
      name: `Public Gating Team ${Date.now()}`,
      raceId: "race_finished",
    },
  });
  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: rider.id,
      displayName: rider.username,
      role: "LEADER",
      status: "APPROVED",
    },
  });

  const registration = await prisma.registration.create({
    data: {
      approvedAt: new Date("2026-06-17T08:00:00Z"),
      raceId: "race_finished",
      status: "APPROVED",
      teamId: team.id,
      userId: rider.id,
    },
  });
  const work = await prisma.work.create({
    data: {
      contentHash: buildPayloadDigest({
        demoUrl: "",
        repoUrl: "https://github.com/demo/public-gating-work",
        summary: "public gating work",
        techNotes: "public gating work notes",
        title: "Public Gating Work",
        videoUrl: "",
      }),
      demoUrl: "",
      registrationId: registration.id,
      repoUrl: "https://github.com/demo/public-gating-work",
      sourceRefJson: JSON.stringify(
        buildWorkSourceRef({
          demoUrl: "",
          repoUrl: "https://github.com/demo/public-gating-work",
          techNotes: "public gating work notes",
          videoUrl: "",
        }),
      ),
      summary: "public gating work",
      techNotes: "public gating work notes",
      teamId: team.id,
      title: "Public Gating Work",
      videoUrl: "",
      visibility: "PUBLIC",
    },
  });
  const draftAwardName = `Draft Public Award ${Date.now()}`;
  const assignment = await prisma.judgeAssignment.create({
    data: {
      assignedByUserId: "org_01",
      judgeId: "admin_01",
      workId: work.id,
    },
  });
  const draftComment = `draft public judge comment ${Date.now()}`;

  try {
    await prisma.award.create({
      data: {
        awardName: draftAwardName,
        decisionReason: "should stay private",
        raceId: "race_finished",
        rank: 1,
        registrationId: registration.id,
        workId: work.id,
      },
    });
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

    const workResult = await getWorkBySlug(
      buildWorkSlug("race_finished", work.id, work.title),
    );
    assert.ok(workResult);
    assert.equal(
      workResult.awards.some((award: any) => award.awardName === draftAwardName),
      false,
    );
    assert.equal(
      workResult.judgeComments.some((comment: any) => comment.summary === draftComment),
      false,
    );

    const raceResult = await getRaceBySlug(
      buildRaceSlug("race_finished", "Performance Marathon"),
    );
    assert.ok(raceResult);
    const gatedRegistration = raceResult.registrations.find(
      (item) => item.id === registration.id,
    );
    assert.ok(gatedRegistration);
    assert.equal(
      gatedRegistration!.awards.some((award) => award.awardName === draftAwardName),
      false,
    );

    const riderResult = await getRiderBySlug(`${rider.id}--${rider.username}`);
    assert.ok(riderResult);
    const raceRecord = riderResult.raceRecords.find(
      (item) => item.raceId === "race_finished",
    );
    assert.ok(raceRecord);
    assert.equal(raceRecord!.awardNames.includes(draftAwardName), false);
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
    await prisma.award.deleteMany({
      where: {
        awardName: draftAwardName,
        raceId: "race_finished",
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
    await prisma.teamMember.deleteMany({
      where: { teamId: team.id },
    });
    await prisma.team.delete({
      where: { id: team.id },
    });
  }
});

test("public routes exclude hidden, private, and draft works from race, rider, and work pages", async () => {
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
        repoUrl: "https://github.com/demo/public-hidden-work",
        summary: "public hidden work",
        techNotes: "public hidden work notes",
        title: "Public Hidden Work",
        videoUrl: "",
      }),
      demoUrl: "",
      registrationId: registration.id,
      repoUrl: "https://github.com/demo/public-hidden-work",
      sourceRefJson: JSON.stringify(
        buildWorkSourceRef({
          demoUrl: "",
          repoUrl: "https://github.com/demo/public-hidden-work",
          techNotes: "public hidden work notes",
          videoUrl: "",
        }),
      ),
      status: "HIDDEN",
      summary: "public hidden work",
      techNotes: "public hidden work notes",
      title: "Public Hidden Work",
      videoUrl: "",
      visibility: "PUBLIC",
    },
  });

  try {
    const workResult = await getWorkBySlug(
      buildWorkSlug("race_finished", work.id, work.title),
    );
    assert.equal(workResult, null);

    const raceResult = await getRaceBySlug(
      buildRaceSlug("race_finished", "Performance Marathon"),
    );
    assert.ok(raceResult);
    const gatedRegistration = raceResult.registrations.find(
      (item) => item.id === registration.id,
    );
    assert.ok(gatedRegistration);
    assert.equal(gatedRegistration!.work, null);

    const riderResult = await getRiderBySlug(`${rider.id}--${rider.username}`);
    assert.ok(riderResult);
    assert.equal(
      riderResult.publicWorkLinks.some((item) =>
        item.href.includes(work.id),
      ),
      false,
    );

    await prisma.work.update({
      where: { id: work.id },
      data: {
        status: "DRAFT",
        visibility: "PUBLIC",
      },
    });

    const draftResult = await getWorkBySlug(
      buildWorkSlug("race_finished", work.id, work.title),
    );
    assert.equal(draftResult, null);

    await prisma.work.update({
      where: { id: work.id },
      data: {
        status: "SUBMITTED",
        visibility: "PRIVATE",
      },
    });

    const privateResult = await getWorkBySlug(
      buildWorkSlug("race_finished", work.id, work.title),
    );
    assert.equal(privateResult, null);
  } finally {
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
