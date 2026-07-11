import assert from "node:assert/strict";
import test from "node:test";
import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import { buildWorkSourceRef } from "@/lib/material-integrity-helpers";
import { prisma } from "@/lib/prisma";
import * as awardsService from "@/lib/services/awards";

test("award draft generation and publication withdraw follow the grs004 baseline", async () => {
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
  const raceId = `race_award_draft_${Date.now()}`;
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
      summary: "award draft withdraw fixture",
      taskDescription: templateRace.taskDescription,
      taskPackageLabel: templateRace.taskPackageLabel,
      title: "Award Draft Withdraw Fixture",
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
              repoUrl: `https://github.com/demo/award-draft-${index}`,
              registrationId: registration.id,
              summary: `fixture work ${index}`,
              techNotes: `fixture work notes ${index}`,
              title: `Fixture Work ${index}`,
              videoUrl: "",
            }),
            demoUrl: "",
            registrationId: registration.id,
            repoUrl: `https://github.com/demo/award-draft-${index}`,
            sourceRefJson: JSON.stringify(
              buildWorkSourceRef({
                demoUrl: "",
                repoUrl: `https://github.com/demo/award-draft-${index}`,
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
            sourceDigest: `award_draft_evidence_${index}`,
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
        generateAwardDraftsForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).generateAwardDraftsForRace({
      organizerId: race.organizerId,
      raceId: race.id,
    });

    const draftAwards = await prisma.award.findMany({
      orderBy: {
        awardName: "asc",
      },
      where: {
        raceId: race.id,
      },
    });

    assert.equal(draftAwards.length, 3);
    assert.equal(draftAwards.every((award) => award.publishedAt === null), true);

    await (
      awardsService as {
        publishAwardsForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).publishAwardsForRace({
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

    assert.equal(
      publishedAwards.every((award) => award.publishedAt instanceof Date),
      true,
    );

    await (
      awardsService as {
        withdrawPublishedAwardsForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).withdrawPublishedAwardsForRace({
      organizerId: race.organizerId,
      raceId: race.id,
    });

    const withdrawnAwards = await prisma.award.findMany({
      orderBy: {
        awardName: "asc",
      },
      where: {
        raceId: race.id,
      },
    });
    const visiblePublishedAwards = await awardsService.listPublishedAwardsForRace(race.id);

    assert.equal(withdrawnAwards.length, 3);
    assert.equal(withdrawnAwards.every((award) => award.publishedAt === null), true);
    assert.equal(visiblePublishedAwards.length, 0);

    await (
      awardsService as {
        generateAwardDraftsForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).generateAwardDraftsForRace({
      allowSystem: true,
      organizerId: "admin_01",
      raceId: race.id,
    });

    await (
      awardsService as {
        publishAwardsForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).publishAwardsForRace({
      allowSystem: true,
      organizerId: "admin_01",
      raceId: race.id,
    });

    const adminPublishedAwards = await prisma.award.findMany({
      orderBy: {
        awardName: "asc",
      },
      where: {
        raceId: race.id,
      },
    });

    assert.equal(
      adminPublishedAwards.every((award) => award.publishedAt instanceof Date),
      true,
    );

    await (
      awardsService as {
        withdrawPublishedAwardsForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).withdrawPublishedAwardsForRace({
      allowSystem: true,
      organizerId: "admin_01",
      raceId: race.id,
    });

    const adminWithdrawnAwards = await prisma.award.findMany({
      orderBy: {
        awardName: "asc",
      },
      where: {
        raceId: race.id,
      },
    });

    assert.equal(
      adminWithdrawnAwards.every((award) => award.publishedAt === null),
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

test("award draft editing updates editable fields while preserving draft-only rules", async () => {
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
  const raceId = `race_award_edit_${Date.now()}`;
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
      summary: "award draft edit fixture",
      taskDescription: templateRace.taskDescription,
      taskPackageLabel: templateRace.taskPackageLabel,
      title: "Award Draft Edit Fixture",
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
              repoUrl: `https://github.com/demo/award-edit-${index}`,
              registrationId: registration.id,
              summary: `fixture work ${index}`,
              techNotes: `fixture work notes ${index}`,
              title: `Fixture Work ${index}`,
              videoUrl: "",
            }),
            demoUrl: "",
            registrationId: registration.id,
            repoUrl: `https://github.com/demo/award-edit-${index}`,
            sourceRefJson: JSON.stringify(
              buildWorkSourceRef({
                demoUrl: "",
                repoUrl: `https://github.com/demo/award-edit-${index}`,
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
            sourceDigest: `award_edit_evidence_${index}`,
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
        generateAwardDraftsForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).generateAwardDraftsForRace({
      organizerId: race.organizerId,
      raceId: race.id,
    });

    const [firstDraft, secondDraft] = await prisma.award.findMany({
      orderBy: [
        {
          awardName: "asc",
        },
        {
          rank: "asc",
        },
      ],
      where: {
        raceId: race.id,
      },
    });

    const originalRegistrationId = firstDraft!.registrationId;
    const originalWorkId = firstDraft!.workId;
    const originalSourceDigest = firstDraft!.sourceDigest;
    const originalSourceRefJson = firstDraft!.sourceRefJson;

    await (
      awardsService as {
        updateAwardDraftForRace: (input: {
          allowSystem?: boolean;
          awardId: string;
          awardName: string;
          decisionReason: string;
          organizerId: string;
          rank: number;
        }) => Promise<void>;
      }
    ).updateAwardDraftForRace({
      awardId: firstDraft!.id,
      awardName: "Best UX",
      decisionReason: "manual draft refinement",
      organizerId: race.organizerId,
      rank: 2,
    });

    const updatedDraft = await prisma.award.findUniqueOrThrow({
      where: {
        id: firstDraft!.id,
      },
    });

    assert.equal(updatedDraft.awardName, "Best UX");
    assert.equal(updatedDraft.rank, 2);
    assert.equal(updatedDraft.decisionReason, "manual draft refinement");
    assert.equal(updatedDraft.registrationId, originalRegistrationId);
    assert.equal(updatedDraft.workId, originalWorkId);
    assert.equal(updatedDraft.sourceDigest, originalSourceDigest);
    assert.equal(updatedDraft.sourceRefJson, originalSourceRefJson);

    await assert.rejects(
      async () =>
        (
          awardsService as {
            updateAwardDraftForRace: (input: {
              allowSystem?: boolean;
              awardId: string;
              awardName: string;
              decisionReason: string;
              organizerId: string;
              rank: number;
            }) => Promise<void>;
          }
        ).updateAwardDraftForRace({
          awardId: secondDraft!.id,
          awardName: "Best UX",
          decisionReason: "duplicate slot",
          organizerId: race.organizerId,
          rank: 2,
        }),
      /draft/i,
    );

    await (
      awardsService as {
        updateAwardDraftForRace: (input: {
          allowSystem?: boolean;
          awardId: string;
          awardName: string;
          decisionReason: string;
          organizerId: string;
          rank: number;
        }) => Promise<void>;
      }
    ).updateAwardDraftForRace({
      allowSystem: true,
      awardId: firstDraft!.id,
      awardName: "Admin Best UX",
      decisionReason: "system scope refinement",
      organizerId: "admin_01",
      rank: 2,
    });

    const adminEditedDraft = await prisma.award.findUniqueOrThrow({
      where: {
        id: firstDraft!.id,
      },
    });

    assert.equal(adminEditedDraft.awardName, "Admin Best UX");
    assert.equal(adminEditedDraft.decisionReason, "system scope refinement");

    await (
      awardsService as {
        publishAwardsForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).publishAwardsForRace({
      organizerId: race.organizerId,
      raceId: race.id,
    });

    const publishedAward = await prisma.award.findUniqueOrThrow({
      where: {
        id: firstDraft!.id,
      },
    });

    await assert.rejects(
      async () =>
        (
          awardsService as {
            updateAwardDraftForRace: (input: {
              allowSystem?: boolean;
              awardId: string;
              awardName: string;
              decisionReason: string;
              organizerId: string;
              rank: number;
            }) => Promise<void>;
          }
        ).updateAwardDraftForRace({
          awardId: publishedAward.id,
          awardName: "Best Edited Published",
          decisionReason: "should reject",
          organizerId: race.organizerId,
          rank: 3,
        }),
      /已发布|published/i,
    );
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});

test("award services reject foreign organizers even with allowSystem and allow admin/system callers", async () => {
  const [templateRace, rider, adminUser, organizerUser] = await Promise.all([
    prisma.race.findFirstOrThrow({
      where: {
        id: "race_finished",
      },
    }),
    prisma.user.findFirstOrThrow({
      where: {
        username: "rider_alice",
      },
    }),
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
      profileName: "Foreign Award Organizer",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_award_foreign_${Date.now()}`,
    },
  });
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
      id: `race_award_scope_${Date.now()}`,
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
      summary: "award scope fixture",
      taskDescription: templateRace.taskDescription,
      taskPackageLabel: templateRace.taskPackageLabel,
      title: "Award Scope Fixture",
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

  try {
    const registration = await prisma.registration.create({
      data: {
        approvedAt: new Date("2026-06-18T08:00:00Z"),
        raceId: race.id,
        status: "APPROVED",
        userId: rider.id,
      },
    });
    const work = await prisma.work.create({
      data: {
        contentHash: buildPayloadDigest({
          demoUrl: "",
          repoUrl: "https://github.com/demo/award-scope",
          registrationId: registration.id,
          summary: "award scope work",
          techNotes: "award scope notes",
          title: "Award Scope Work",
          videoUrl: "",
        }),
        demoUrl: "",
        registrationId: registration.id,
        repoUrl: "https://github.com/demo/award-scope",
        sourceRefJson: JSON.stringify(
          buildWorkSourceRef({
            demoUrl: "",
            repoUrl: "https://github.com/demo/award-scope",
            techNotes: "award scope notes",
            videoUrl: "",
          }),
        ),
        summary: "award scope work",
        techNotes: "award scope notes",
        title: "Award Scope Work",
        videoUrl: "",
        visibility: "PUBLIC",
      },
    });
    await prisma.evidence.create({
      data: {
        confidenceLevel: "HIGH",
        integrityStatus: "OK",
        registrationId: registration.id,
        reviewFlagJson: "[]",
        sourceDigest: "award_scope_evidence_digest",
        sourceRefJson: JSON.stringify({ fixture: "award_scope" }),
        summary: "award scope evidence",
        title: "Award Scope Evidence",
        type: "SESSION_SUMMARY",
        visibility: "INTERNAL",
      },
    });
    const assignment = await prisma.judgeAssignment.create({
      data: {
        assignedAt: new Date("2026-06-18T10:00:00Z"),
        assignedByUserId: organizerUser.id,
        judgeId: "judge_01",
        workId: work.id,
      },
    });
    await prisma.judgingRecord.create({
      data: {
        comments: "award scope record",
        judgeAssignmentId: assignment.id,
        scoreResultJson: JSON.stringify({ overall: 92 }),
        scoreRidingJson: JSON.stringify({ overall: 88 }),
        sourceDigest: "",
        sourceRefJson: "{}",
        submittedAt: new Date("2026-06-18T12:00:00Z"),
      },
    });

    await assert.rejects(
      async () =>
        (
          awardsService as {
            generateAwardDraftsForRace: (input: {
              allowSystem?: boolean;
              organizerId: string;
              raceId: string;
            }) => Promise<unknown>;
          }
        ).generateAwardDraftsForRace({
          allowSystem: true,
          organizerId: foreignOrganizer.id,
          raceId: race.id,
        }),
      /无权操作这场比赛的正式榜单/,
    );

    await (
      awardsService as {
        generateAwardDraftsForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).generateAwardDraftsForRace({
      allowSystem: true,
      organizerId: adminUser.id,
      raceId: race.id,
    });

    const firstDraft = await prisma.award.findFirstOrThrow({
      orderBy: [
        {
          awardName: "asc",
        },
        {
          rank: "asc",
        },
      ],
      where: {
        raceId: race.id,
      },
    });

    await assert.rejects(
      async () =>
        (
          awardsService as {
            updateAwardDraftForRace: (input: {
              allowSystem?: boolean;
              awardId: string;
              awardName: string;
              decisionReason: string;
              organizerId: string;
              rank: number;
            }) => Promise<unknown>;
          }
        ).updateAwardDraftForRace({
          allowSystem: true,
          awardId: firstDraft.id,
          awardName: "Foreign Edited Award",
          decisionReason: "foreign should fail",
          organizerId: foreignOrganizer.id,
          rank: 2,
        }),
      /无权编辑这份 Award 草稿/,
    );

    await (
      awardsService as {
        updateAwardDraftForRace: (input: {
          allowSystem?: boolean;
          awardId: string;
          awardName: string;
          decisionReason: string;
          organizerId: string;
          rank: number;
        }) => Promise<void>;
      }
    ).updateAwardDraftForRace({
      allowSystem: true,
      awardId: firstDraft.id,
      awardName: "Admin Edited Award",
      decisionReason: "admin scope refinement",
      organizerId: adminUser.id,
      rank: 2,
    });

    await assert.rejects(
      async () =>
        (
          awardsService as {
            publishAwardsForRace: (input: {
              allowSystem?: boolean;
              organizerId: string;
              raceId: string;
            }) => Promise<unknown>;
          }
        ).publishAwardsForRace({
          allowSystem: true,
          organizerId: foreignOrganizer.id,
          raceId: race.id,
        }),
      /无权操作这场比赛的正式榜单/,
    );

    await (
      awardsService as {
        publishAwardsForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).publishAwardsForRace({
      allowSystem: true,
      organizerId: adminUser.id,
      raceId: race.id,
    });

    await assert.rejects(
      async () =>
        (
          awardsService as {
            withdrawPublishedAwardsForRace: (input: {
              allowSystem?: boolean;
              organizerId: string;
              raceId: string;
            }) => Promise<unknown>;
          }
        ).withdrawPublishedAwardsForRace({
          allowSystem: true,
          organizerId: foreignOrganizer.id,
          raceId: race.id,
        }),
      /无权操作这场比赛的正式榜单/,
    );

    await (
      awardsService as {
        withdrawPublishedAwardsForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).withdrawPublishedAwardsForRace({
      allowSystem: true,
      organizerId: adminUser.id,
      raceId: race.id,
    });

    const finalAwards = await prisma.award.findMany({
      where: {
        raceId: race.id,
      },
    });

    assert.equal(finalAwards.length > 0, true);
    assert.equal(finalAwards.every((award) => award.publishedAt === null), true);
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
