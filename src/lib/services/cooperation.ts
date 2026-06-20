import { prisma } from "@/lib/prisma";
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
