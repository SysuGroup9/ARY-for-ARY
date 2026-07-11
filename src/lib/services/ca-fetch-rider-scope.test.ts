import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import { fetchCASessionSnapshotForConnection } from "@/lib/services/ca-fetch";

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
    status: "running",
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

test("snapshot fetch rejects riders outside the owning registration", async () => {
  const connection = await prisma.cAConnection.findFirstOrThrow({
    include: {
      raceProject: {
        include: {
          registration: true,
        },
      },
    },
    where: {
      raceProject: {
        registration: {
          user: {
            username: "rider_alice",
          },
        },
      },
    },
  });
  const foreignRider = await prisma.user.findFirstOrThrow({
    where: {
      username: "rider_bob",
    },
  });

  await assert.rejects(
    () =>
      fetchCASessionSnapshotForConnection({
        caConnectionId: connection.id,
        caSessionId: `scope_reject_${randomUUID()}`,
        fetchImpl: async () => {
          throw new Error("fetch should not run");
        },
        userId: foreignRider.id,
      }),
    /CAConnection not found for current rider/,
  );
});

test("snapshot fetch rejects non-approved registrations even if rider owns the connection", async () => {
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
  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_snapshot_scope_${Date.now()}`,
      summary: "snapshot scope fixture",
      title: "Snapshot Scope Fixture",
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
        aggregateIngestionStatus: "CONNECTED",
        registrationId: registration.id,
      },
    });
    const connection = await prisma.cAConnection.create({
      data: {
        caProjectId: `scope_project_${randomUUID()}`,
        caType: "CODEX",
        connectorBaseUrl: "http://127.0.0.1:4010",
        connectorId: `scope_connector_${randomUUID()}`,
        connectorSecret: `scope_secret_${randomUUID()}`,
        connectorVersion: "0.1.0",
        handshakeCompletedAt: new Date("2026-06-19T10:00:00.000Z"),
        ingestionSource: "MANUAL",
        ingestionStatus: "ACTIVE",
        raceProjectId: raceProject.id,
      },
    });

    await assert.rejects(
      () =>
        fetchCASessionSnapshotForConnection({
          caConnectionId: connection.id,
          caSessionId: `pending_scope_${randomUUID()}`,
          fetchImpl: async () => {
            throw new Error("fetch should not run");
          },
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
