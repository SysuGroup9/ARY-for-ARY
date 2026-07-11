import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import { createCAConnectionForRaceProject } from "@/lib/services/ca-connections";

test("createCAConnectionForRaceProject writes a security audit record", async () => {
  const registration = await prisma.registration.findFirstOrThrow({
    where: { raceId: "race_active" },
    include: { raceProject: true, user: true },
  });

  const connection = await createCAConnectionForRaceProject({
    caProjectId: `audit_project_${Date.now()}`,
    caType: "CODEX",
    connectorBaseUrl: "https://connector.example/audit",
    connectorId: `audit_connector_${Date.now()}`,
    connectorVersion: "0.1.0",
    raceProjectId: registration.raceProject!.id,
    userId: registration.userId,
  });

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "ca_connection.register",
      targetId: connection.id,
    },
  });

  assert.equal(audit.actorKind, "USER");
  assert.equal(audit.result, "accepted");
});

test("createCAConnectionForRaceProject rejects non-approved registrations", async () => {
  const [templateRace, rider] = await Promise.all([
    prisma.race.findFirstOrThrow({
      where: {
        id: "race_finished",
      },
    }),
    prisma.user.findFirstOrThrow({
      where: {
        username: "rider_charlie",
      },
    }),
  ]);
  const now = Date.now();
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
      id: `race_ca_register_pending_${Date.now()}`,
      keywordsJson: templateRace.keywordsJson,
      maxTeamSize: templateRace.maxTeamSize,
      organizerComment: "",
      organizerId: templateRace.organizerId,
      raceEnd: new Date(now + 72 * 60 * 60 * 1000),
      raceStart: new Date(now + 48 * 60 * 60 * 1000),
      signupEnd: new Date(now + 24 * 60 * 60 * 1000),
      signupStart: new Date(now - 24 * 60 * 60 * 1000),
      status: "published",
      submissionIntervalHours: templateRace.submissionIntervalHours,
      summary: "ca register pending fixture",
      taskDescription: templateRace.taskDescription,
      taskPackageLabel: templateRace.taskPackageLabel,
      title: "CA Register Pending Fixture",
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
        raceId: race.id,
        status: "SUBMITTED",
        userId: rider.id,
      },
    });
    const raceProject = await prisma.raceProject.create({
      data: {
        aggregateIngestionStatus: "NOT_CONFIGURED",
        registrationId: registration.id,
      },
    });

    await assert.rejects(
      () =>
        createCAConnectionForRaceProject({
          caProjectId: `audit_project_${Date.now()}`,
          caType: "CODEX",
          connectorBaseUrl: "https://connector.example/audit",
          connectorId: `audit_connector_${Date.now()}`,
          connectorVersion: "0.1.0",
          raceProjectId: raceProject.id,
          userId: rider.id,
        }),
      /当前报名尚未通过审核/,
    );
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});
