"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, requireRole } from "@/lib/auth";
import { replyFeedback, sendFeedback } from "@/lib/services/feedback";
import { createCAConnectionForRaceProject } from "@/lib/services/ca-connections";
import { rebuildSessionSummaryEvidenceForRace } from "@/lib/services/evidence";
import { assignJudgeToWork, upsertJudgingRecord } from "@/lib/services/judging";
import {
  clearRace,
  createRace,
  updateOrganizerComment,
  updateRaceContent,
  updateRaceDisplayOptions,
} from "@/lib/services/races";
import {
  createFinalSubmission,
  createSubmission,
} from "@/lib/services/submissions";
import { generateRaceSnapshot } from "@/lib/services/race-snapshot";
import {
  completeRunnerTask,
  enqueueHarnessEvalTasks,
  enqueueProgressEvalTasks,
} from "@/lib/services/runner";
import { rebuildRaceProcessProjections } from "@/lib/services/projections";
import { registerTeam, updateTeamComment } from "@/lib/services/teams";
import { registerForRace } from "@/lib/services/registrations";
import { loginUser, registerUser, updateUserRoles } from "@/lib/services/users";
import { normalizeRoles } from "@/lib/user-roles";

export async function registerAction(formData: FormData) {
  await registerUser(formData);
  redirect("/");
}

export async function loginAction(formData: FormData) {
  await loginUser(formData);
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function updateUserRolesAction(formData: FormData) {
  await requireRole("ADMIN");
  await updateUserRoles({
    userId: String(formData.get("userId") ?? ""),
    roles: normalizeRoles(
      formData.getAll("roles").map((value) => String(value)),
    ),
  });
  revalidatePath("/console/admin/users");
  revalidatePath("/console/admin/roles");
}

export async function createRaceAction(formData: FormData) {
  const user = await requireRole("ORGANIZER");
  await createRace(user.id, formData);
  revalidatePath("/");
  redirect("/");
}

export async function updateRaceAction(formData: FormData) {
  const user = await requireRole("ORGANIZER");

  await updateRaceContent({
    organizerId: user.id,
    raceId: String(formData.get("raceId") ?? ""),
    taskDescription: String(formData.get("taskDescription") ?? ""),
    trainingDataSummary: String(formData.get("trainingDataSummary") ?? ""),
  });

  revalidatePath("/");
}

export async function updateOrganizerCommentAction(formData: FormData) {
  const user = await requireRole("ORGANIZER");

  await updateOrganizerComment({
    organizerId: user.id,
    raceId: String(formData.get("raceId") ?? ""),
    organizerComment: String(formData.get("organizerComment") ?? ""),
  });

  revalidatePath("/");
}

export async function updateTeamCommentAction(formData: FormData) {
  const user = await requireRole("ORGANIZER");

  await updateTeamComment({
    organizerId: user.id,
    raceId: String(formData.get("raceId") ?? ""),
    teamId: String(formData.get("teamId") ?? ""),
    content: String(formData.get("content") ?? ""),
  });

  revalidatePath("/");
}

export async function clearRaceAction(formData: FormData) {
  const user = await requireRole("ORGANIZER");

  await clearRace({
    organizerId: user.id,
    raceId: String(formData.get("raceId") ?? ""),
  });

  revalidatePath("/");
}

export async function registerTeamAction(formData: FormData) {
  const user = await requireRole("RIDER");
  await registerTeam(user.id, formData);
  revalidatePath("/");
}

export async function registerForRaceAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const raceId = String(formData.get("raceId") ?? "");
  await registerForRace(user.id, raceId);
  await rebuildRaceProcessProjections(raceId);
  revalidatePath("/");
  revalidatePath("/console/races");
}

export async function registerCAConnectionAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const raceId = String(formData.get("raceId") ?? "");
  await createCAConnectionForRaceProject({
    caProjectId: String(formData.get("caProjectId") ?? ""),
    caType: String(formData.get("caType") ?? "OTHER") as
      | "CLAUDE_CODE"
      | "CODEX"
      | "OTHER",
    connectorBaseUrl: String(formData.get("connectorBaseUrl") ?? ""),
    connectorId: String(formData.get("connectorId") ?? ""),
    connectorVersion: String(formData.get("connectorVersion") ?? ""),
    raceProjectId: String(formData.get("raceProjectId") ?? ""),
    userId: user.id,
  });
  await rebuildSessionSummaryEvidenceForRace(raceId);
  await rebuildRaceProcessProjections(raceId);
  revalidatePath("/console/races");
}

export async function rebuildProcessModelsAction(formData: FormData) {
  await requireRole("ORGANIZER");
  const raceId = String(formData.get("raceId") ?? "");
  await rebuildSessionSummaryEvidenceForRace(raceId);
  await rebuildRaceProcessProjections(raceId);
  revalidatePath("/console/races");
  revalidatePath(`/jumbotron/${raceId}`);
}

export async function assignJudgeToWorkAction(formData: FormData) {
  const user = await requireRole("ORGANIZER");
  await assignJudgeToWork({
    assignedByUserId: user.id,
    judgeId: String(formData.get("judgeId") ?? ""),
    workId: String(formData.get("workId") ?? ""),
  });
  revalidatePath("/console/races");
}

export async function submitJudgingRecordAction(formData: FormData) {
  const user = await requireRole("JUDGE");
  await upsertJudgingRecord({
    assignmentId: String(formData.get("assignmentId") ?? ""),
    comments: String(formData.get("comments") ?? ""),
    judgeUserId: user.id,
    scoreResultTotal: Number(formData.get("scoreResultTotal") ?? 0),
    scoreRidingTotal: Number(formData.get("scoreRidingTotal") ?? 0),
    submit: formData.get("submit") === "true",
  });
  revalidatePath("/console/races");
}

export async function submitEntryAction(formData: FormData) {
  const user = await requireRole("RIDER");
  await createSubmission(user.id, formData);
  revalidatePath("/");
}

export async function submitFinalEntryAction(formData: FormData) {
  const user = await requireRole("RIDER");
  await createFinalSubmission(user.id, formData);
  revalidatePath("/");
}

export async function sendFeedbackAction(formData: FormData) {
  const user = await requireRole("RIDER");
  await sendFeedback(user.id, formData);
  revalidatePath("/");
}

export async function replyFeedbackAction(formData: FormData) {
  const user = await requireRole("ORGANIZER");
  await replyFeedback(user.id, formData);
  revalidatePath("/");
}

export async function publishLeaderboardAction(formData: FormData) {
  await requireRole("ORGANIZER");
  await enqueueProgressEvalTasks(String(formData.get("raceId") ?? ""));
  revalidatePath("/");
}

export async function publishShowcaseAction(formData: FormData) {
  await requireRole("ORGANIZER");
  await enqueueHarnessEvalTasks(String(formData.get("raceId") ?? ""));
  revalidatePath("/");
}

export async function updateDisplayOptionsAction(formData: FormData) {
  const user = await requireRole("ORGANIZER");

  await updateRaceDisplayOptions({
    organizerId: user.id,
    raceId: String(formData.get("raceId") ?? ""),
    displayShowTrainingData: formData.get("displayShowTrainingData") === "on",
    displayShowOrganizerComment:
      formData.get("displayShowOrganizerComment") === "on",
    displayShowTopHighlights:
      formData.get("displayShowTopHighlights") === "on",
    displayHighlightCount: Number(formData.get("displayHighlightCount") ?? 3),
    displayShowRiderCode: formData.get("displayShowRiderCode") === "on",
  });

  revalidatePath("/");
}

export async function generateRaceSnapshotAction(formData: FormData) {
  await requireRole("ORGANIZER");
  await generateRaceSnapshot(String(formData.get("raceId") ?? ""));
  revalidatePath("/jumbotron/" + String(formData.get("raceId") ?? ""));
}

export async function scoreRunnerTaskAction(formData: FormData) {
  await completeRunnerTask({
    taskId: String(formData.get("taskId") ?? ""),
    submissionId: String(formData.get("submissionId") ?? ""),
    status: String(formData.get("status") ?? "") as "failed" | "succeeded",
    progress: Number(formData.get("progress") ?? "") || undefined,
    passRate: Number(formData.get("passRate") ?? "") || undefined,
    codeReviewScore: Number(formData.get("codeReviewScore") ?? "") || undefined,
    reasoningScore: Number(formData.get("reasoningScore") ?? "") || undefined,
    keywordScore: Number(formData.get("keywordScore") ?? "") || undefined,
    runnerComment: String(formData.get("runnerComment") ?? ""),
    resultHash: String(formData.get("resultHash") ?? "") || undefined,
    finishedAt: String(formData.get("finishedAt") ?? "") || undefined,
  });
  revalidatePath("/");
}
