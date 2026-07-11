import { prisma } from "@/lib/prisma";
import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import {
  buildRaceEvaluationConfigDigest,
  buildChallengeMaterialSourceRef,
  buildFileBufferDigest,
  verifyStoredUploadHash,
} from "@/lib/material-integrity-helpers";
import { parseKeywords, normalizeWeights } from "@/lib/services/scoring";
import { recordSecurityAudit } from "@/lib/services/security-audit";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

async function saveFile(file: File, subDir: string): Promise<{
  fileHash: string;
  name: string;
  path: string;
}> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileHash = buildFileBufferDigest(buffer);
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._\-]/g, "_")}`;
  const uploadDir = join(
    /*turbopackIgnore: true*/ process.cwd(),
    "public",
    "uploads",
    subDir,
  );
  await mkdir(uploadDir, { recursive: true });
  const filePath = join(uploadDir, safeName);
  await writeFile(filePath, buffer);
  return { fileHash, name: file.name, path: `/uploads/${subDir}/${safeName}` };
}

export async function submitCooperationRequest(data: {
  submitterId?: string | null;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  raceTitle: string;
  raceSummary: string;
  taskDescription: string;
  trainingDataSummary: string;
  evaluationNotes: string;
  keywordsText: string;
  signupStart: string;
  signupEnd: string;
  raceStart: string;
  raceEnd: string;
  tokenLimit: number;
  maxTeamSize: number;
  submissionIntervalHours: number;
  freezeMinutesBeforeEnd: number;
  hasTrainingData: boolean;
  enableFreeze: boolean;
  displayShowTrainingData: boolean;
  displayShowOrganizerComment: boolean;
  displayShowTopHighlights: boolean;
  displayShowRiderCode: boolean;
  notes: string;
  taskPackageFile?: File | null;
  proposalFile?: File | null;
}) {
  let taskPackageFileName = "";
  let taskPackageFilePath = "";
  let taskPackageFileHash = "";
  let proposalFileName = "";
  let proposalFilePath = "";
  let proposalFileHash = "";

  if (data.taskPackageFile && data.taskPackageFile.size > 0) {
    const saved = await saveFile(data.taskPackageFile, "cooperation/taskpackages");
    taskPackageFileHash = saved.fileHash;
    taskPackageFileName = saved.name;
    taskPackageFilePath = saved.path;
  }
  if (data.proposalFile && data.proposalFile.size > 0) {
    const saved = await saveFile(data.proposalFile, "cooperation/proposals");
    proposalFileHash = saved.fileHash;
    proposalFileName = saved.name;
    proposalFilePath = saved.path;
  }

  const request = await prisma.cooperationRequest.create({
    data: {
      submitterId: data.submitterId ?? null,
      companyName: data.companyName,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      raceTitle: data.raceTitle,
      raceSummary: data.raceSummary,
      taskDescription: data.taskDescription,
      trainingDataSummary: data.trainingDataSummary,
      evaluationNotes: data.evaluationNotes,
      keywordsText: data.keywordsText,
      signupStart: data.signupStart,
      signupEnd: data.signupEnd,
      raceStart: data.raceStart,
      raceEnd: data.raceEnd,
      tokenLimit: data.tokenLimit,
      maxTeamSize: data.maxTeamSize,
      submissionIntervalHours: data.submissionIntervalHours,
      freezeMinutesBeforeEnd: data.freezeMinutesBeforeEnd,
      hasTrainingData: data.hasTrainingData,
      enableFreeze: data.enableFreeze,
      displayShowTrainingData: data.displayShowTrainingData,
      displayShowOrganizerComment: data.displayShowOrganizerComment,
      displayShowTopHighlights: data.displayShowTopHighlights,
      displayShowRiderCode: data.displayShowRiderCode,
      notes: data.notes,
      taskPackageFileName,
      taskPackageFilePath,
      taskPackageFileHash,
      proposalFileName,
      proposalFilePath,
      proposalFileHash,
    },
  });

  await recordSecurityAudit(prisma, {
    action: "cooperation_request.materials_create",
    actorKind: "USER",
    details: {
      companyName: data.companyName,
      proposalFileHash,
      proposalFileName,
      proposalFilePath,
      raceTitle: data.raceTitle,
      taskPackageFileHash,
      taskPackageFileName,
      taskPackageFilePath,
    },
    reason: "",
    result: "accepted",
    targetId: request.id,
    targetType: "CooperationRequest",
    userId: data.submitterId ?? null,
  });

  return request;
}

export async function listCooperationRequests(status?: string) {
  return prisma.cooperationRequest.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
  });
}

export async function approveCooperationRequest(
  requestId: string,
  adminUserId: string,
) {
  const request = await prisma.cooperationRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error("办赛申请不存在");
  if (request.status !== "PENDING") throw new Error("该申请已处理，无法重复审批");

  // 优先使用提交申请时记录的 submitterId，fallback 到审批 Admin
  async function verifyRecordedMaterial(input: {
    expectedHash: string;
    fileName: string;
    filePath: string;
    materialType: "proposal" | "taskPackage";
    missingReason: string;
    mismatchReason: string;
  }) {
    if (!input.filePath || !input.expectedHash) {
      return;
    }

    const verification = await verifyStoredUploadHash({
      expectedHash: input.expectedHash,
      publicPath: input.filePath,
    });

    if (verification.ok) {
      return;
    }

    const reason =
      verification.reason === "missing"
        ? input.missingReason
        : verification.reason === "invalid_upload_path"
          ? "invalid_upload_path"
          : input.mismatchReason;

    await recordSecurityAudit(prisma, {
      action: "cooperation_request.materials_verify",
      actorKind: "USER",
      details: {
        actualHash: verification.actualHash,
        expectedHash: input.expectedHash,
        fileName: input.fileName,
        filePath: input.filePath,
        materialType: input.materialType,
      },
      reason,
      result: "rejected",
      targetId: requestId,
      targetType: "CooperationRequest",
      userId: adminUserId,
    });

    if (verification.reason === "missing") {
      throw new Error(`Cooperation material missing: ${input.materialType}`);
    }
    if (verification.reason === "invalid_upload_path") {
      throw new Error(`Invalid cooperation upload path: ${input.materialType}`);
    }
    throw new Error(`Cooperation material hash mismatch: ${input.materialType}`);
  }

  await verifyRecordedMaterial({
    expectedHash: request.taskPackageFileHash,
    fileName: request.taskPackageFileName,
    filePath: request.taskPackageFilePath,
    materialType: "taskPackage",
    missingReason: "task_package_missing",
    mismatchReason: "task_package_hash_mismatch",
  });
  await verifyRecordedMaterial({
    expectedHash: request.proposalFileHash,
    fileName: request.proposalFileName,
    filePath: request.proposalFilePath,
    materialType: "proposal",
    missingReason: "proposal_missing",
    mismatchReason: "proposal_hash_mismatch",
  });

  const organizerId = request.submitterId ?? adminUserId;

  const keywords = parseKeywords(request.keywordsText);
  const weights = normalizeWeights({
    taskPassRate: 1.0,
    codeReview: 0.0,
    reasoning: 1.0,
    keywords: 1.0,
    totalTask: 1.0,
    totalToken: 0.0,
    totalDialogue: 0.0,
  });
  const challengeSourceRef = buildChallengeMaterialSourceRef({
    proposal:
      request.proposalFilePath && request.proposalFileName && request.proposalFileHash
        ? {
            fileHash: request.proposalFileHash,
            fileName: request.proposalFileName,
            filePath: request.proposalFilePath,
          }
        : null,
    taskPackage:
      request.taskPackageFilePath &&
      request.taskPackageFileName &&
      request.taskPackageFileHash
        ? {
            fileHash: request.taskPackageFileHash,
            fileName: request.taskPackageFileName,
            filePath: request.taskPackageFilePath,
          }
        : null,
  });
  const challengeContentHash = buildPayloadDigest(challengeSourceRef);
  const evaluationConfigHash = buildRaceEvaluationConfigDigest({
    harnessWeightKeyword: 0.4,
    harnessWeightReasoning: 0.6,
    keywordsJson: JSON.stringify(keywords),
    taskDescription: request.taskDescription,
    taskPackageLabel: request.raceTitle,
    tokenLimit: request.tokenLimit,
    weightCodeReview: weights.codeReview,
    weightKeywords: weights.keywords,
    weightReasoning: weights.reasoning,
    weightTaskPassRate: weights.taskPassRate,
    weightTotalDialogue: weights.totalDialogue,
    weightTotalTask: weights.totalTask,
    weightTotalToken: weights.totalToken,
  });

  return prisma.$transaction(async (tx) => {
    const race = await tx.race.create({
      data: {
        challengeContentHash,
        challengeSourceRefJson: JSON.stringify(challengeSourceRef),
        evaluationConfigHash,
        evaluationConfigVersion: 1,
        organizerId,
        title: request.raceTitle,
        summary: request.raceSummary,
        taskPackageLabel: request.raceTitle,
        taskDescription: request.taskDescription,
        trainingDataSummary: request.trainingDataSummary,
        hasTrainingData: request.hasTrainingData,
        evaluationNotes: request.evaluationNotes,
        keywordsJson: JSON.stringify(keywords),
        tokenLimit: request.tokenLimit,
        signupStart: new Date(request.signupStart),
        signupEnd: new Date(request.signupEnd),
        raceStart: new Date(request.raceStart),
        raceEnd: new Date(request.raceEnd),
        enableFreeze: request.enableFreeze,
        freezeMinutesBeforeEnd: request.enableFreeze
          ? request.freezeMinutesBeforeEnd
          : 0,
        maxTeamSize: request.maxTeamSize,
        submissionIntervalHours: request.submissionIntervalHours,
        cloudStudioUrl: "",
        trackId: "oval-track",
        trackConfigJson: "",
        displayShowTrainingData: request.displayShowTrainingData,
        displayShowOrganizerComment: request.displayShowOrganizerComment,
        displayShowTopHighlights: request.displayShowTopHighlights,
        displayShowRiderCode: request.displayShowRiderCode,
        weightTaskPassRate: weights.taskPassRate,
        weightCodeReview: weights.codeReview,
        weightReasoning: weights.reasoning,
        weightKeywords: weights.keywords,
        weightTotalTask: weights.totalTask,
        weightTotalToken: weights.totalToken,
        weightTotalDialogue: weights.totalDialogue,
      },
    });

    await tx.cooperationRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });

    await recordSecurityAudit(tx, {
      action: "cooperation_request.materials_verify",
      actorKind: "USER",
      details: {
        proposalFileHash: request.proposalFileHash,
        proposalFilePath: request.proposalFilePath,
        taskPackageFileHash: request.taskPackageFileHash,
        taskPackageFilePath: request.taskPackageFilePath,
      },
      reason: "",
      result: "accepted",
      targetId: requestId,
      targetType: "CooperationRequest",
      userId: adminUserId,
    });

    return race;
  });
}

export async function rejectCooperationRequest(requestId: string) {
  const request = await prisma.cooperationRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error("办赛申请不存在");
  if (request.status !== "PENDING") throw new Error("该申请已处理，无法重复审批");

  return prisma.cooperationRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
  });
}
