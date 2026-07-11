import assert from "node:assert/strict";
import test from "node:test";
import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import { buildWorkSourceRef } from "@/lib/material-integrity-helpers";
import { prisma } from "@/lib/prisma";
import * as reportsService from "@/lib/services/reports";

test("report generation creates rider, race, and review reports with frozen refs", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const riders = await prisma.user.findMany({
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
  const raceId = `race_report_publish_${Date.now()}`;
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
      organizerComment: "fixture organizer note",
      organizerId: templateRace.organizerId,
      raceEnd: templateRace.raceEnd,
      raceStart: templateRace.raceStart,
      signupEnd: templateRace.signupEnd,
      signupStart: templateRace.signupStart,
      status: "completed",
      submissionIntervalHours: templateRace.submissionIntervalHours,
      summary: "report generation fixture",
      taskDescription: templateRace.taskDescription,
      taskPackageLabel: templateRace.taskPackageLabel,
      title: "Report Generation Fixture",
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
  const approvedAtValues = [
    new Date("2026-06-17T08:00:00Z"),
    new Date("2026-06-17T09:00:00Z"),
  ];

  try {
    const registrations = await Promise.all(
      riders.map((rider, index) =>
        prisma.registration.create({
          data: {
            approvedAt: approvedAtValues[index]!,
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
              repoUrl: `https://github.com/demo/report-gen-${index}`,
              summary: `report fixture work ${index}`,
              techNotes: `report fixture notes ${index}`,
              title: `Report Fixture Work ${index}`,
              videoUrl: "",
            }),
            demoUrl: "",
            registrationId: registration.id,
            repoUrl: `https://github.com/demo/report-gen-${index}`,
            sourceRefJson: JSON.stringify(
              buildWorkSourceRef({
                demoUrl: "",
                repoUrl: `https://github.com/demo/report-gen-${index}`,
                techNotes: `report fixture notes ${index}`,
                videoUrl: "",
              }),
            ),
            summary: `report fixture work ${index}`,
            techNotes: `report fixture notes ${index}`,
            title: `Report Fixture Work ${index}`,
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
            sourceDigest: `report_evidence_digest_${index}`,
            sourceRefJson: JSON.stringify({ fixture: `evidence_${index}` }),
            summary: `report evidence ${index}`,
            title: `Report Evidence ${index}`,
            type: "SESSION_SUMMARY",
            visibility: "PUBLIC",
          },
        }),
      ),
    );
    await prisma.projection.create({
      data: {
        asOfAt: new Date("2026-06-17T12:00:00Z"),
        payloadJson: JSON.stringify([{ label: "fixture" }]),
        raceId: race.id,
        type: "CURRENT_LEADERBOARD",
      },
    });
    await Promise.all(
      registrations.map((registration, index) =>
        prisma.award.create({
          data: {
            awardName: index === 0 ? "Best Overall" : "Best Work",
            decisionReason: `fixture award ${index}`,
            publishedAt: new Date("2026-06-17T13:00:00Z"),
            raceId: race.id,
            rank: 1,
            registrationId: registration.id,
            sourceDigest: `award_digest_${index}`,
            sourceRefJson: JSON.stringify({ fixture: `award_${index}` }),
            workId: works[index]!.id,
          },
        }),
      ),
    );

    await (
      reportsService as {
        generateReportsForRace?: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).generateReportsForRace?.({
      organizerId: race.organizerId,
      raceId: race.id,
    });

    const reports = await prisma.report.findMany({
      orderBy: [
        { type: "asc" },
        { title: "asc" },
      ],
      where: {
        raceId: race.id,
      },
    });

    assert.equal(reports.filter((report) => report.type === "RIDER_REPORT").length, 2);
    assert.equal(reports.filter((report) => report.type === "RACE_REPORT").length, 1);
    assert.equal(reports.filter((report) => report.type === "REVIEW_SUMMARY").length, 1);
    assert.equal(
      reports
        .filter((report) => report.type === "RIDER_REPORT")
        .every((report) => report.subjectRegistrationId !== null),
      true,
    );
    assert.equal(
      reports
        .filter((report) => report.type !== "RIDER_REPORT")
        .every((report) => report.subjectRegistrationId === null),
      true,
    );
    assert.equal(
      reports.every(
        (report) =>
          report.sourceDigest.length > 0 &&
          report.sourceRefJson.includes("projections") &&
          report.status === "GENERATED",
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

test("report draft editing, reviewed gate, and regenerate follow the grs004 report workflow", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const rider = await prisma.user.findFirstOrThrow({
    where: {
      username: "rider_alice",
    },
  });
  const raceId = `race_report_review_gate_${Date.now()}`;
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
      organizerComment: "editable organizer note",
      organizerId: templateRace.organizerId,
      raceEnd: templateRace.raceEnd,
      raceStart: templateRace.raceStart,
      signupEnd: templateRace.signupEnd,
      signupStart: templateRace.signupStart,
      status: "completed",
      submissionIntervalHours: templateRace.submissionIntervalHours,
      summary: "report review gate fixture",
      taskDescription: templateRace.taskDescription,
      taskPackageLabel: templateRace.taskPackageLabel,
      title: "Report Review Gate Fixture",
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
          repoUrl: "https://github.com/demo/report-gate",
          summary: "report gate work",
          techNotes: "report gate notes",
          title: "Report Gate Work",
          videoUrl: "",
        }),
        demoUrl: "",
        registrationId: registration.id,
        repoUrl: "https://github.com/demo/report-gate",
        sourceRefJson: JSON.stringify(
          buildWorkSourceRef({
            demoUrl: "",
            repoUrl: "https://github.com/demo/report-gate",
            techNotes: "report gate notes",
            videoUrl: "",
          }),
        ),
        summary: "report gate work",
        techNotes: "report gate notes",
        title: "Report Gate Work",
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
        sourceDigest: "report_gate_evidence_digest",
        sourceRefJson: JSON.stringify({ fixture: "evidence" }),
        summary: "report gate evidence",
        title: "Report Gate Evidence",
        type: "SESSION_SUMMARY",
        visibility: "PUBLIC",
      },
    });
    await prisma.projection.create({
      data: {
        asOfAt: new Date("2026-06-18T12:00:00Z"),
        payloadJson: JSON.stringify([{ label: "fixture" }]),
        raceId: race.id,
        type: "CURRENT_LEADERBOARD",
      },
    });
    await prisma.award.create({
      data: {
        awardName: "Best Overall",
        decisionReason: "fixture award",
        publishedAt: new Date("2026-06-18T13:00:00Z"),
        raceId: race.id,
        rank: 1,
        registrationId: registration.id,
        sourceDigest: "report_gate_award_digest",
        sourceRefJson: JSON.stringify({ fixture: "award" }),
        workId: work.id,
      },
    });

    await (
      reportsService as {
        generateReportsForRace?: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).generateReportsForRace?.({
      allowSystem: true,
      organizerId: "admin_01",
      raceId: race.id,
    });

    const generatedRaceReport = await prisma.report.findFirstOrThrow({
      where: {
        raceId: race.id,
        type: "RACE_REPORT",
      },
    });

    await (
      reportsService as {
        updateReportDraftForRace?: (input: {
          allowSystem?: boolean;
          body: string;
          organizerId: string;
          reportId: string;
          summary: string;
          title: string;
        }) => Promise<void>;
      }
    ).updateReportDraftForRace?.({
      allowSystem: true,
      body: "manual report body",
      organizerId: "admin_01",
      reportId: generatedRaceReport.id,
      summary: "manual report summary",
      title: "Manual Race Report",
    });

    const draftedRaceReport = await prisma.report.findUniqueOrThrow({
      where: {
        id: generatedRaceReport.id,
      },
    });

    assert.equal(draftedRaceReport.title, "Manual Race Report");
    assert.equal(draftedRaceReport.summary, "manual report summary");
    assert.equal(draftedRaceReport.body, "manual report body");
    assert.equal(draftedRaceReport.status, "DRAFT");

    await (
      reportsService as {
        generateReportsForRace?: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).generateReportsForRace?.({
      allowSystem: true,
      organizerId: "admin_01",
      raceId: race.id,
    });

    const regeneratedRaceReport = await prisma.report.findUniqueOrThrow({
      where: {
        id: generatedRaceReport.id,
      },
    });

    assert.notEqual(regeneratedRaceReport.body, "manual report body");
    assert.equal(regeneratedRaceReport.status, "GENERATED");

    await assert.rejects(
      async () =>
        (
          reportsService as {
            publishReportForRace?: (input: {
              allowSystem?: boolean;
              organizerId: string;
              reportId: string;
            }) => Promise<void>;
          }
        ).publishReportForRace?.({
          allowSystem: true,
          organizerId: "admin_01",
          reportId: generatedRaceReport.id,
        }),
      /reviewed/i,
    );

    await (
      reportsService as {
        markReportReviewedForRace?: (input: {
          allowSystem?: boolean;
          organizerId: string;
          reportId: string;
        }) => Promise<void>;
      }
    ).markReportReviewedForRace?.({
      allowSystem: true,
      organizerId: "admin_01",
      reportId: generatedRaceReport.id,
    });

    const reviewedRaceReport = await prisma.report.findUniqueOrThrow({
      where: {
        id: generatedRaceReport.id,
      },
    });

    assert.equal(reviewedRaceReport.status, "REVIEWED");

    await (
      reportsService as {
        publishReportForRace?: (input: {
          allowSystem?: boolean;
          organizerId: string;
          reportId: string;
        }) => Promise<void>;
      }
    ).publishReportForRace?.({
      allowSystem: true,
      organizerId: "admin_01",
      reportId: generatedRaceReport.id,
    });

    const publishedRaceReport = await prisma.report.findUniqueOrThrow({
      where: {
        id: generatedRaceReport.id,
      },
    });

    assert.equal(publishedRaceReport.status, "PUBLISHED");
    assert.notEqual(publishedRaceReport.publishedAt, null);
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});

test("report services reject foreign organizers even with allowSystem and allow admin/system callers", async () => {
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
      profileName: "Foreign Report Organizer",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_report_foreign_${Date.now()}`,
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
      id: `race_report_scope_${Date.now()}`,
      keywordsJson: templateRace.keywordsJson,
      maxTeamSize: templateRace.maxTeamSize,
      organizerComment: "scope organizer note",
      organizerId: templateRace.organizerId,
      raceEnd: templateRace.raceEnd,
      raceStart: templateRace.raceStart,
      signupEnd: templateRace.signupEnd,
      signupStart: templateRace.signupStart,
      status: "completed",
      submissionIntervalHours: templateRace.submissionIntervalHours,
      summary: "report scope fixture",
      taskDescription: templateRace.taskDescription,
      taskPackageLabel: templateRace.taskPackageLabel,
      title: "Report Scope Fixture",
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
          repoUrl: "https://github.com/demo/report-scope",
          summary: "report scope work",
          techNotes: "report scope notes",
          title: "Report Scope Work",
          videoUrl: "",
        }),
        demoUrl: "",
        registrationId: registration.id,
        repoUrl: "https://github.com/demo/report-scope",
        sourceRefJson: JSON.stringify(
          buildWorkSourceRef({
            demoUrl: "",
            repoUrl: "https://github.com/demo/report-scope",
            techNotes: "report scope notes",
            videoUrl: "",
          }),
        ),
        summary: "report scope work",
        techNotes: "report scope notes",
        title: "Report Scope Work",
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
        sourceDigest: "report_scope_evidence_digest",
        sourceRefJson: JSON.stringify({ fixture: "report_scope" }),
        summary: "report scope evidence",
        title: "Report Scope Evidence",
        type: "SESSION_SUMMARY",
        visibility: "PUBLIC",
      },
    });
    await prisma.projection.create({
      data: {
        asOfAt: new Date("2026-06-18T12:00:00Z"),
        payloadJson: JSON.stringify([{ label: "report-scope" }]),
        raceId: race.id,
        type: "CURRENT_LEADERBOARD",
      },
    });
    await prisma.award.create({
      data: {
        awardName: "Best Overall",
        decisionReason: "scope fixture award",
        publishedAt: new Date("2026-06-18T13:00:00Z"),
        raceId: race.id,
        rank: 1,
        registrationId: registration.id,
        sourceDigest: "report_scope_award_digest",
        sourceRefJson: JSON.stringify({ fixture: "report_scope_award" }),
        workId: work.id,
      },
    });

    await assert.rejects(
      async () =>
        (
          reportsService as {
            generateReportsForRace: (input: {
              allowSystem?: boolean;
              organizerId: string;
              raceId: string;
            }) => Promise<unknown>;
          }
        ).generateReportsForRace({
          allowSystem: true,
          organizerId: foreignOrganizer.id,
          raceId: race.id,
        }),
      /无权操作这场比赛的报告/,
    );

    await (
      reportsService as {
        generateReportsForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).generateReportsForRace({
      allowSystem: true,
      organizerId: adminUser.id,
      raceId: race.id,
    });

    const raceReport = await prisma.report.findFirstOrThrow({
      where: {
        raceId: race.id,
        type: "RACE_REPORT",
      },
    });

    await assert.rejects(
      async () =>
        (
          reportsService as {
            updateReportDraftForRace: (input: {
              allowSystem?: boolean;
              body: string;
              organizerId: string;
              reportId: string;
              summary: string;
              title: string;
            }) => Promise<unknown>;
          }
        ).updateReportDraftForRace({
          allowSystem: true,
          body: "foreign body",
          organizerId: foreignOrganizer.id,
          reportId: raceReport.id,
          summary: "foreign summary",
          title: "Foreign Report",
        }),
      /无权操作这份报告/,
    );

    await (
      reportsService as {
        updateReportDraftForRace: (input: {
          allowSystem?: boolean;
          body: string;
          organizerId: string;
          reportId: string;
          summary: string;
          title: string;
        }) => Promise<void>;
      }
    ).updateReportDraftForRace({
      allowSystem: true,
      body: "admin body",
      organizerId: adminUser.id,
      reportId: raceReport.id,
      summary: "admin summary",
      title: "Admin Report",
    });

    await assert.rejects(
      async () =>
        (
          reportsService as {
            markReportReviewedForRace: (input: {
              allowSystem?: boolean;
              organizerId: string;
              reportId: string;
            }) => Promise<unknown>;
          }
        ).markReportReviewedForRace({
          allowSystem: true,
          organizerId: foreignOrganizer.id,
          reportId: raceReport.id,
        }),
      /无权操作这份报告/,
    );

    await (
      reportsService as {
        markReportReviewedForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          reportId: string;
        }) => Promise<void>;
      }
    ).markReportReviewedForRace({
      allowSystem: true,
      organizerId: adminUser.id,
      reportId: raceReport.id,
    });

    await assert.rejects(
      async () =>
        (
          reportsService as {
            publishReportForRace: (input: {
              allowSystem?: boolean;
              organizerId: string;
              reportId: string;
            }) => Promise<unknown>;
          }
        ).publishReportForRace({
          allowSystem: true,
          organizerId: foreignOrganizer.id,
          reportId: raceReport.id,
        }),
      /无权操作这份报告/,
    );

    await (
      reportsService as {
        publishReportForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          reportId: string;
        }) => Promise<void>;
      }
    ).publishReportForRace({
      allowSystem: true,
      organizerId: adminUser.id,
      reportId: raceReport.id,
    });

    const publishedRaceReport = await prisma.report.findUniqueOrThrow({
      where: {
        id: raceReport.id,
      },
    });

    assert.equal(publishedRaceReport.title, "Admin Report");
    assert.equal(publishedRaceReport.summary, "admin summary");
    assert.equal(publishedRaceReport.body, "admin body");
    assert.equal(publishedRaceReport.status, "PUBLISHED");
    assert.notEqual(publishedRaceReport.publishedAt, null);
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
