import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildRaceEvaluationConfigDigest } from "@/lib/material-integrity-helpers";
import { prisma } from "@/lib/prisma";
import {
  approveCooperationRequest,
  submitCooperationRequest,
} from "@/lib/services/cooperation";

test("submitCooperationRequest stores task package and proposal hashes", async () => {
  const request = await submitCooperationRequest({
    companyName: `Company ${randomUUID()}`,
    contactEmail: "hash@example.com",
    contactName: "Hash Owner",
    contactPhone: "",
    displayShowOrganizerComment: true,
    displayShowRiderCode: true,
    displayShowTopHighlights: true,
    displayShowTrainingData: true,
    enableFreeze: false,
    evaluationNotes: "notes",
    freezeMinutesBeforeEnd: 0,
    hasTrainingData: true,
    keywordsText: "hash,package",
    maxTeamSize: 5,
    notes: "",
    proposalFile: new File(["proposal-content"], "proposal.txt"),
    raceEnd: "2026-08-10T10:00:00.000Z",
    raceStart: "2026-08-09T10:00:00.000Z",
    raceSummary: "summary",
    raceTitle: `Race ${randomUUID()}`,
    signupEnd: "2026-08-08T10:00:00.000Z",
    signupStart: "2026-08-07T10:00:00.000Z",
    submissionIntervalHours: 24,
    taskDescription: "desc",
    taskPackageFile: new File(["task-content"], "task.zip"),
    tokenLimit: 4000,
    trainingDataSummary: "training",
  });

  assert.match(request.taskPackageFileHash, /^[a-f0-9]{64}$/);
  assert.match(request.proposalFileHash, /^[a-f0-9]{64}$/);

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "cooperation_request.materials_create",
      result: "accepted",
      targetId: request.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  assert.equal(audit.targetType, "CooperationRequest");
  assert.match(
    audit.detailsJson,
    new RegExp(request.taskPackageFileHash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
  assert.match(
    audit.detailsJson,
    new RegExp(request.proposalFileHash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
  assert.match(
    audit.detailsJson,
    new RegExp(request.taskPackageFilePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
  assert.match(
    audit.detailsJson,
    new RegExp(request.proposalFilePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
});

test("approveCooperationRequest carries challenge sourceRef and digest into Race", async () => {
  const admin = await prisma.user.findFirstOrThrow({
    where: { username: "admin_demo" },
  });

  const request = await submitCooperationRequest({
    companyName: `Company ${randomUUID()}`,
    contactEmail: "race@example.com",
    contactName: "Race Owner",
    contactPhone: "",
    displayShowOrganizerComment: true,
    displayShowRiderCode: true,
    displayShowTopHighlights: true,
    displayShowTrainingData: true,
    enableFreeze: false,
    evaluationNotes: "notes",
    freezeMinutesBeforeEnd: 0,
    hasTrainingData: true,
    keywordsText: "hash,package",
    maxTeamSize: 5,
    notes: "",
    proposalFile: new File(["proposal-content"], "proposal.txt"),
    raceEnd: "2026-08-10T10:00:00.000Z",
    raceStart: "2026-08-09T10:00:00.000Z",
    raceSummary: "summary",
    raceTitle: `Race ${randomUUID()}`,
    signupEnd: "2026-08-08T10:00:00.000Z",
    signupStart: "2026-08-07T10:00:00.000Z",
    submissionIntervalHours: 24,
    taskDescription: "desc",
    taskPackageFile: new File(["task-content"], "task.zip"),
    tokenLimit: 4000,
    trainingDataSummary: "training",
  });

  const race = await approveCooperationRequest(request.id, admin.id);

  assert.match(race.challengeContentHash, /^[a-f0-9]{64}$/);
  assert.match(race.challengeSourceRefJson, /taskPackage/);
  assert.match(race.challengeSourceRefJson, /proposal/);
  assert.equal(race.evaluationConfigVersion, 1);
  assert.equal(
    race.evaluationConfigHash,
    buildRaceEvaluationConfigDigest({
      harnessWeightKeyword: race.harnessWeightKeyword,
      harnessWeightReasoning: race.harnessWeightReasoning,
      keywordsJson: race.keywordsJson,
      taskDescription: race.taskDescription,
      taskPackageLabel: race.taskPackageLabel,
      tokenLimit: race.tokenLimit,
      weightCodeReview: race.weightCodeReview,
      weightKeywords: race.weightKeywords,
      weightReasoning: race.weightReasoning,
      weightTaskPassRate: race.weightTaskPassRate,
      weightTotalDialogue: race.weightTotalDialogue,
      weightTotalTask: race.weightTotalTask,
      weightTotalToken: race.weightTotalToken,
    }),
  );
});

test("approveCooperationRequest rejects tampered task package files and writes a security audit", async () => {
  const admin = await prisma.user.findFirstOrThrow({
    where: { username: "admin_demo" },
  });

  const request = await submitCooperationRequest({
    companyName: `Company ${randomUUID()}`,
    contactEmail: "tamper@example.com",
    contactName: "Tamper Owner",
    contactPhone: "",
    displayShowOrganizerComment: true,
    displayShowRiderCode: true,
    displayShowTopHighlights: true,
    displayShowTrainingData: true,
    enableFreeze: false,
    evaluationNotes: "notes",
    freezeMinutesBeforeEnd: 0,
    hasTrainingData: true,
    keywordsText: "hash,package",
    maxTeamSize: 5,
    notes: "",
    proposalFile: new File(["proposal-content"], "proposal.txt"),
    raceEnd: "2026-08-10T10:00:00.000Z",
    raceStart: "2026-08-09T10:00:00.000Z",
    raceSummary: "summary",
    raceTitle: `Race ${randomUUID()}`,
    signupEnd: "2026-08-08T10:00:00.000Z",
    signupStart: "2026-08-07T10:00:00.000Z",
    submissionIntervalHours: 24,
    taskDescription: "desc",
    taskPackageFile: new File(["task-content"], "task.zip"),
    tokenLimit: 4000,
    trainingDataSummary: "training",
  });

  const taskPackageAbsolutePath = join(
    process.cwd(),
    "public",
    request.taskPackageFilePath.replace(/^\//, ""),
  );
  await writeFile(taskPackageAbsolutePath, Buffer.from("tampered-task-content"));

  await assert.rejects(
    () => approveCooperationRequest(request.id, admin.id),
    /hash/i,
  );

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "cooperation_request.materials_verify",
      reason: "task_package_hash_mismatch",
      result: "rejected",
      targetId: request.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  assert.equal(audit.userId, admin.id);
});

test("approveCooperationRequest rejects missing proposal files and writes a security audit", async () => {
  const admin = await prisma.user.findFirstOrThrow({
    where: { username: "admin_demo" },
  });

  const request = await submitCooperationRequest({
    companyName: `Company ${randomUUID()}`,
    contactEmail: "missing@example.com",
    contactName: "Missing Owner",
    contactPhone: "",
    displayShowOrganizerComment: true,
    displayShowRiderCode: true,
    displayShowTopHighlights: true,
    displayShowTrainingData: true,
    enableFreeze: false,
    evaluationNotes: "notes",
    freezeMinutesBeforeEnd: 0,
    hasTrainingData: true,
    keywordsText: "hash,package",
    maxTeamSize: 5,
    notes: "",
    proposalFile: new File(["proposal-content"], "proposal.txt"),
    raceEnd: "2026-08-10T10:00:00.000Z",
    raceStart: "2026-08-09T10:00:00.000Z",
    raceSummary: "summary",
    raceTitle: `Race ${randomUUID()}`,
    signupEnd: "2026-08-08T10:00:00.000Z",
    signupStart: "2026-08-07T10:00:00.000Z",
    submissionIntervalHours: 24,
    taskDescription: "desc",
    taskPackageFile: new File(["task-content"], "task.zip"),
    tokenLimit: 4000,
    trainingDataSummary: "training",
  });

  const proposalAbsolutePath = join(
    process.cwd(),
    "public",
    request.proposalFilePath.replace(/^\//, ""),
  );
  await rm(proposalAbsolutePath);

  await assert.rejects(
    () => approveCooperationRequest(request.id, admin.id),
    /missing/i,
  );

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "cooperation_request.materials_verify",
      reason: "proposal_missing",
      result: "rejected",
      targetId: request.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  assert.equal(audit.userId, admin.id);
});
