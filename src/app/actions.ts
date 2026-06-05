"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, requireRole } from "@/lib/auth";
import { replyFeedback, sendFeedback } from "@/lib/services/feedback";
import {
  clearRace,
  createRace,
  updateOrganizerComment,
  updateRaceContent,
} from "@/lib/services/races";
import {
  createSubmission,
  publishLeaderboard,
  publishShowcase,
  scoreRunnerTask,
} from "@/lib/services/submissions";
import { registerTeam, updateTeamComment } from "@/lib/services/teams";
import { loginUser, registerUser } from "@/lib/services/users";

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

export async function createRaceAction(formData: FormData) {
  const user = await requireRole("ORGANIZER");
  await createRace(user.id, formData);
  revalidatePath("/");
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

export async function submitEntryAction(formData: FormData) {
  const user = await requireRole("RIDER");
  await createSubmission(user.id, formData);
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
  await publishLeaderboard(String(formData.get("raceId") ?? ""));
  revalidatePath("/");
}

export async function publishShowcaseAction(formData: FormData) {
  await requireRole("ORGANIZER");
  await publishShowcase(String(formData.get("raceId") ?? ""));
  revalidatePath("/");
}

export async function scoreRunnerTaskAction(formData: FormData) {
  await scoreRunnerTask(formData);
  revalidatePath("/");
}
