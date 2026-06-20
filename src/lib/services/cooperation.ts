import { prisma } from "@/lib/prisma";
import { parseKeywords, normalizeWeights } from "@/lib/services/scoring";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

async function saveFile(file: File, subDir: string): Promise<{ name: string; path: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._\-]/g, "_")}`;
  const uploadDir = join(process.cwd(), "public", "uploads", subDir);
  await mkdir(uploadDir, { recursive: true });
  const filePath = join(uploadDir, safeName);
  await writeFile(filePath, buffer);
  return { name: file.name, path: `/uploads/${subDir}/${safeName}` };
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
  let proposalFileName = "";
  let proposalFilePath = "";

  if (data.taskPackageFile && data.taskPackageFile.size > 0) {
    const saved = await saveFile(data.taskPackageFile, "cooperation/taskpackages");
    taskPackageFileName = saved.name;
    taskPackageFilePath = saved.path;
  }
  if (data.proposalFile && data.proposalFile.size > 0) {
    const saved = await saveFile(data.proposalFile, "cooperation/proposals");
    proposalFileName = saved.name;
    proposalFilePath = saved.path;
  }

  return prisma.cooperationRequest.create({
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
      proposalFileName,
      proposalFilePath,
    },
  });
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

  return prisma.$transaction(async (tx) => {
    const race = await tx.race.create({
      data: {
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
