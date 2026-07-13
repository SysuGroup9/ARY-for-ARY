"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearSession,
  getSessionUser,
  loadDatabaseUser,
  requireRole,
  requireSession,
} from "@/lib/auth";
import {
  resolveGitHubOAuthErrorCode,
  startGitHubOAuth,
} from "@/lib/github-oauth";
import {
  getPostAuthRedirectTarget,
  resolveProfileCompletionReturnTo,
} from "@/lib/profile-completion";
import {
  buildEntryFeedbackHref,
  resolveEntryFeedbackCode,
} from "@/lib/entry-feedback";
import {
  buildActionFeedbackHref,
  shouldRethrowActionFeedback,
} from "@/lib/action-feedback";
import { replyFeedback, sendFeedback } from "@/lib/services/feedback";
import {
  generateAwardDraftsForRace,
  publishAwardsForRace,
  updateAwardDraftForRace,
  withdrawPublishedAwardsForRace,
} from "@/lib/services/awards";
import {
  generateReportsForRace,
  markReportReviewedForRace,
  publishReportForRace,
  updateReportDraftForRace,
} from "@/lib/services/reports";
import {
  createAnnouncementDraftForRace,
  hideAnnouncementForRace,
  publishAnnouncementForRace,
  updateAnnouncementDraftForRace,
} from "@/lib/services/announcements";
import {
  createCAConnectionForRaceProject,
  disableCAConnectionForOrganizer,
  enableCAConnectionForOrganizer,
  rotateCAConnectionSecretForRider,
} from "@/lib/services/ca-connections";
import { fetchCASessionSnapshotForConnection } from "@/lib/services/ca-fetch";
import { rebuildSessionSummaryEvidenceForRace } from "@/lib/services/evidence";
import {
  assignJudgeToWork,
  removeJudgeAssignment,
  upsertJudgingRecord,
} from "@/lib/services/judging";
import {
  archiveRace,
  assertManagedRaceActionAccess,
  createRace,
  publishRace,
  updateOrganizerComment,
  updateRaceContent,
  updateRaceTrackCalibration,
  updateRaceDisplayOptions,
} from "@/lib/services/races";
import {
  createFinalSubmission,
  createSubmission,
} from "@/lib/services/submissions";
import {
  hideWorkForRace,
  lockWorkForRace,
  publishWorkForRace,
  saveWorkDraftForRider,
} from "@/lib/services/works";
import { generateRaceSnapshot } from "@/lib/services/race-snapshot";
import {
  completeRunnerTask,
  enqueueHarnessEvalTasks,
  enqueueProgressEvalTasks,
} from "@/lib/services/runner";
import { rebuildRaceProcessProjections } from "@/lib/services/projections";
import {
  fallbackScreenDisplayToStableProjection,
  fallbackScreenDisplayToStaticNotice,
  updateScreenDisplayModeForRace,
  updateScreenDisplayThemeForRace,
} from "@/lib/services/screen-display";
import { updateTeamComment, createTeam, joinTeam, approveMember, removeMember } from "@/lib/services/teams";
import { createTask, completeTask } from "@/lib/services/team-tasks";
import { sendMessage } from "@/lib/services/collaboration";
import {
  approveRegistrationForRace,
  registerForRace,
  rejectRegistrationForRace,
  withdrawRegistrationForRace,
} from "@/lib/services/registrations";
import { submitCooperationRequest } from "@/lib/services/cooperation";
import {
  approveCooperationRequest,
  rejectCooperationRequest,
} from "@/lib/services/cooperation";
import { normalizeRoles } from "@/lib/user-roles";
import { hasRole } from "@/lib/user-roles";
import {
  completeUserProfile,
  loginUser,
  registerUser,
  updateUserRoles,
} from "@/lib/services/users";
import { buildRaceSlug } from "@/lib/public-site";

export async function registerAction(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "");
  let user: Awaited<ReturnType<typeof registerUser>>;
  try {
    user = await registerUser(formData);
  } catch (error) {
    redirect(
      buildEntryFeedbackHref({
        code: resolveEntryFeedbackCode(error, "register"),
        mode: "register",
        returnTo,
      }),
    );
  }
  redirect(
    getPostAuthRedirectTarget({
      profileCompleted: user.profileCompleted,
      returnTo,
    }),
  );
}

export async function loginAction(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "");
  let user: Awaited<ReturnType<typeof loginUser>>;
  try {
    user = await loginUser(formData);
  } catch (error) {
    redirect(
      buildEntryFeedbackHref({
        code: resolveEntryFeedbackCode(error, "login"),
        mode: "login",
        returnTo,
      }),
    );
  }
  redirect(
    getPostAuthRedirectTarget({
      profileCompleted: user.profileCompleted,
      returnTo,
    }),
  );
}

export async function loginWithGitHubAction(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "");
  try {
    await startGitHubOAuth(returnTo);
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      `/login?oauthError=${resolveGitHubOAuthErrorCode(error, "start")}&returnTo=${encodeURIComponent(returnTo)}`,
    );
  }
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function completeProfileAction(formData: FormData) {
  const user = await requireSession();
  const returnTo = String(formData.get("returnTo") ?? "");
  try {
    await completeUserProfile({
      profileName: String(formData.get("profileName") ?? ""),
      profileOrgLabel: String(formData.get("profileOrgLabel") ?? ""),
      userId: user.id,
    });
  } catch (error) {
    redirect(
      buildEntryFeedbackHref({
        code: resolveEntryFeedbackCode(error, "profile"),
        mode: "profile",
        returnTo,
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console");
  redirect(resolveProfileCompletionReturnTo(returnTo));
}

export async function updateUserRolesAction(formData: FormData) {
  await requireRole("ADMIN");
  const returnTo = String(formData.get("returnTo") ?? "") || "/console/admin/roles";
  try {
    await updateUserRoles({
      userId: String(formData.get("userId") ?? ""),
      roles: normalizeRoles(
        formData.getAll("roles").map((value) => String(value)),
      ),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "admin_roles",
      }),
    );
  }
  revalidatePath("/console/admin/users");
  revalidatePath("/console/admin/roles");
  redirect(returnTo);
}

export async function createRaceAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const returnTo = String(formData.get("returnTo") ?? "") || "/console/races/new";
  const organizerId = hasRole(user.roles, "ADMIN")
    ? String(formData.get("organizerId") ?? "")
    : user.id;
  let race: Awaited<ReturnType<typeof createRace>>;
  try {
    race = await createRace({
      actorUserId: user.id,
      allowSystem: hasRole(user.roles, "ADMIN"),
      formData,
      organizerId,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "create_race",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  redirect(`/console/races/${buildRaceSlug(race.id, race.title)}/organizer/overview`);
}

export async function publishRaceAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/settings`;

  try {
    await publishRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      raceId: String(formData.get("raceId") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_settings",
      }),
    );
  }

  revalidatePath("/");
  redirect(returnTo);
}

export async function updateRaceAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/settings`;

  try {
    await updateRaceContent({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      raceId: String(formData.get("raceId") ?? ""),
      taskDescription: String(formData.get("taskDescription") ?? ""),
      trainingDataSummary: String(formData.get("trainingDataSummary") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_settings",
      }),
    );
  }

  revalidatePath("/");
  redirect(returnTo);
}

export async function updateOrganizerCommentAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/reports`;

  try {
    await updateOrganizerComment({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      raceId: String(formData.get("raceId") ?? ""),
      organizerComment: String(formData.get("organizerComment") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_reports",
      }),
    );
  }

  revalidatePath("/");
  redirect(returnTo);
}

export async function updateTeamCommentAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/reports`;

  try {
    await updateTeamComment({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      raceId,
      teamId: String(formData.get("teamId") ?? ""),
      content: String(formData.get("content") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_feedback",
      }),
    );
  }

  revalidatePath("/");
  revalidatePath(`/console/races/${raceSlug}/organizer/reports`);
  redirect(returnTo);
}

export async function archiveRaceAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/maintenance`;
  try {
    await archiveRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      raceId,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_maintenance",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  revalidatePath(`/console/races/${raceSlug}/organizer/maintenance`);
  revalidatePath(`/races/${raceSlug}`);
  redirect(returnTo);
}

export async function approveRegistrationAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }

  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/registrations`;
  try {
    await approveRegistrationForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      registrationId: String(formData.get("registrationId") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_registration",
      }),
    );
  }

  revalidatePath("/console/races");
  revalidatePath(`/console/races/${raceSlug}/organizer/registrations`);
  revalidatePath(`/console/races/${raceSlug}/rider/registration`);
  revalidatePath(`/console/races/${raceSlug}/rider/ca-setup`);
  revalidatePath(`/console/races/${raceSlug}/rider/submission`);
  revalidatePath(`/races/${raceSlug}/register`);
  redirect(returnTo);
}

export async function rejectRegistrationAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }

  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/registrations`;
  try {
    await rejectRegistrationForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      registrationId: String(formData.get("registrationId") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_registration",
      }),
    );
  }

  revalidatePath("/console/races");
  revalidatePath(`/console/races/${raceSlug}/organizer/registrations`);
  revalidatePath(`/console/races/${raceSlug}/rider/registration`);
  revalidatePath(`/console/races/${raceSlug}/rider/ca-setup`);
  revalidatePath(`/console/races/${raceSlug}/rider/submission`);
  revalidatePath(`/races/${raceSlug}/register`);
  redirect(returnTo);
}

export async function withdrawRegistrationAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (
    !hasRole(user.roles, "ADMIN") &&
    !hasRole(user.roles, "ORGANIZER") &&
    !hasRole(user.roles, "RIDER")
  ) {
    redirect("/");
  }

  const raceSlug = String(formData.get("raceSlug") ?? "");
  const feedbackReturnTo =
    String(formData.get("feedbackReturnTo") ?? "") ||
    `/console/races/${raceSlug}/rider/registration`;
  try {
    await withdrawRegistrationForRace({
      actorUserId: user.id,
      allowSystem: hasRole(user.roles, "ADMIN"),
      registrationId: String(formData.get("registrationId") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo: feedbackReturnTo,
        scope: feedbackReturnTo.includes("/races/")
          ? "public_register"
          : "rider_registration",
      }),
    );
  }

  revalidatePath("/console/races");
  revalidatePath(`/console/races/${raceSlug}/organizer/registrations`);
  revalidatePath(`/console/races/${raceSlug}/rider/registration`);
  revalidatePath(`/console/races/${raceSlug}/rider/ca-setup`);
  revalidatePath(`/console/races/${raceSlug}/rider/submission`);
  revalidatePath(`/races/${raceSlug}/register`);
  redirect(feedbackReturnTo);
}

export async function registerForRaceAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const raceId = String(formData.get("raceId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");
  const feedbackReturnTo = String(formData.get("feedbackReturnTo") ?? "") || returnTo || "/";
  try {
    await registerForRace(user.id, raceId);
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo: feedbackReturnTo,
        scope: feedbackReturnTo.includes("/races/") ? "public_register" : "rider_registration",
      }),
    );
  }
  await rebuildRaceProcessProjections(raceId);
  revalidatePath("/");
  revalidatePath("/console/races");
  redirect(returnTo || "/console/races");
}

export async function registerCAConnectionAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const raceId = String(formData.get("raceId") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${String(formData.get("raceSlug") ?? "")}/rider/ca-setup`;
  try {
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
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "rider_ca_setup",
      }),
    );
  }
  await rebuildSessionSummaryEvidenceForRace(raceId);
  await rebuildRaceProcessProjections(raceId);
  revalidatePath("/console/races");
  redirect(returnTo);
}

export async function fetchCASnapshotAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const raceId = String(formData.get("raceId") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${String(formData.get("raceSlug") ?? "")}/rider/ca-setup`;
  try {
    await fetchCASessionSnapshotForConnection({
      caConnectionId: String(formData.get("caConnectionId") ?? ""),
      caSessionId: String(formData.get("caSessionId") ?? ""),
      userId: user.id,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "rider_ca_setup",
      }),
    );
  }
  await rebuildSessionSummaryEvidenceForRace(raceId);
  await rebuildRaceProcessProjections(raceId);
  revalidatePath("/console/races");
  redirect(returnTo);
}

export async function rotateCAConnectionSecretAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const raceId = String(formData.get("raceId") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${String(formData.get("raceSlug") ?? "")}/rider/ca-setup`;
  try {
    await rotateCAConnectionSecretForRider({
      caConnectionId: String(formData.get("caConnectionId") ?? ""),
      userId: user.id,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "rider_ca_setup",
      }),
    );
  }
  revalidatePath("/console/races");
  revalidatePath(`/console/races/${String(formData.get("raceSlug") ?? "")}/rider/ca-setup`);
  if (raceId) {
    await rebuildRaceProcessProjections(raceId);
  }
  redirect(returnTo);
}

export async function disableCAConnectionAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/ca-status`;
  try {
    await disableCAConnectionForOrganizer({
      allowSystem: hasRole(user.roles, "ADMIN"),
      caConnectionId: String(formData.get("caConnectionId") ?? ""),
      organizerId: user.id,
      reason: String(formData.get("reason") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_ca_status",
      }),
    );
  }
  revalidatePath("/console/races");
  revalidatePath(`/console/races/${raceSlug}/organizer/ca-status`);
  if (raceId) {
    await rebuildRaceProcessProjections(raceId);
  }
  redirect(returnTo);
}

export async function enableCAConnectionAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/ca-status`;
  try {
    await enableCAConnectionForOrganizer({
      allowSystem: hasRole(user.roles, "ADMIN"),
      caConnectionId: String(formData.get("caConnectionId") ?? ""),
      organizerId: user.id,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_ca_status",
      }),
    );
  }
  revalidatePath("/console/races");
  revalidatePath(`/console/races/${raceSlug}/organizer/ca-status`);
  if (raceId) {
    await rebuildRaceProcessProjections(raceId);
  }
  redirect(returnTo);
}

export async function rebuildProcessModelsAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/ca-status`;
  try {
    await assertManagedRaceActionAccess({
      allowSystem: hasRole(user.roles, "ADMIN"),
      errorMessage: "无权重算这场比赛的过程投影",
      raceId,
      userId: user.id,
    });
    await rebuildSessionSummaryEvidenceForRace(raceId);
    await rebuildRaceProcessProjections(raceId);
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_ca_status",
      }),
    );
  }
  revalidatePath("/console/races");
  revalidatePath(`/console/races/${raceSlug}/organizer/ca-status`);
  revalidatePath(`/jumbotron/${raceId}`);
  redirect(returnTo);
}

export async function assignJudgeToWorkAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/judges`;
  try {
    await assignJudgeToWork({
      allowSystem: hasRole(user.roles, "ADMIN"),
      assignedByUserId: user.id,
      judgeId: String(formData.get("judgeId") ?? ""),
      workId: String(formData.get("workId") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_judges",
      }),
    );
  }
  revalidatePath("/console/races");
  redirect(returnTo);
}

export async function removeJudgeAssignmentAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/judges`;
  try {
    await removeJudgeAssignment({
      allowSystem: hasRole(user.roles, "ADMIN"),
      assignedByUserId: user.id,
      assignmentId: String(formData.get("assignmentId") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_judges",
      }),
    );
  }
  revalidatePath("/console/races");
  redirect(returnTo);
}

export async function submitJudgingRecordAction(formData: FormData) {
  const user = await requireRole("JUDGE");
  const returnTo = String(formData.get("returnTo") ?? "") || "/console/races";
  try {
    await upsertJudgingRecord({
      assignmentId: String(formData.get("assignmentId") ?? ""),
      comments: String(formData.get("comments") ?? ""),
      judgeUserId: user.id,
      scoreResultTotal: Number(formData.get("scoreResultTotal") ?? 0),
      scoreRidingTotal: Number(formData.get("scoreRidingTotal") ?? 0),
      submit: formData.get("submit") === "true",
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "judge_review",
      }),
    );
  }
  revalidatePath("/console/races");
  redirect(returnTo);
}

export async function submitEntryAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const returnTo = String(formData.get("returnTo") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  try {
    await createSubmission(user.id, formData);
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo: returnTo || `/console/races/${raceSlug}/rider/submission`,
        scope: "rider_submission",
      }),
    );
  }
  revalidatePath("/");
  if (raceSlug) {
    revalidatePath("/works");
    revalidatePath(`/races/${raceSlug}`);
    revalidatePath(`/races/${raceSlug}/works`);
    revalidatePath(`/console/races/${raceSlug}/rider/submission`);
    revalidatePath(`/console/races/${raceSlug}/organizer/works`);
  }
  redirect(returnTo || "/");
}

export async function submitFinalEntryAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const returnTo = String(formData.get("returnTo") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  try {
    await createFinalSubmission(user.id, formData);
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo: returnTo || `/console/races/${raceSlug}/rider/submission`,
        scope: "rider_submission",
      }),
    );
  }
  revalidatePath("/");
  if (raceSlug) {
    revalidatePath("/works");
    revalidatePath(`/races/${raceSlug}`);
    revalidatePath(`/races/${raceSlug}/works`);
    revalidatePath(`/console/races/${raceSlug}/rider/submission`);
    revalidatePath(`/console/races/${raceSlug}/organizer/works`);
  }
  redirect(returnTo || "/");
}

export async function saveWorkDraftAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const returnTo = String(formData.get("returnTo") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  try {
    await saveWorkDraftForRider(user.id, formData);
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo: returnTo || `/console/races/${raceSlug}/rider/submission`,
        scope: "rider_submission",
      }),
    );
  }
  revalidatePath("/");
  if (raceSlug) {
    revalidatePath("/works");
    revalidatePath(`/races/${raceSlug}`);
    revalidatePath(`/races/${raceSlug}/works`);
    revalidatePath(`/console/races/${raceSlug}/rider/submission`);
    revalidatePath(`/console/races/${raceSlug}/organizer/works`);
  }
  redirect(returnTo || "/");
}

export async function publishWorkAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/works`;
  try {
    await publishWorkForRace({
      actorUserId: user.id,
      allowSystem: hasRole(user.roles, "ADMIN"),
      workId: String(formData.get("workId") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_works",
      }),
    );
  }
  revalidatePath("/works");
  revalidatePath(`/races/${raceSlug}`);
  revalidatePath(`/races/${raceSlug}/works`);
  revalidatePath(`/console/races/${raceSlug}/organizer/works`);
  redirect(returnTo);
}

export async function hideWorkAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (
    !hasRole(user.roles, "ADMIN") &&
    !hasRole(user.roles, "ORGANIZER") &&
    !hasRole(user.roles, "RIDER")
  ) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "") || "/";
  const scope =
    returnTo.includes("/organizer/works")
      ? "organizer_works"
      : "rider_submission";
  try {
    await hideWorkForRace({
      actorUserId: user.id,
      allowSystem: hasRole(user.roles, "ADMIN"),
      workId: String(formData.get("workId") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope,
      }),
    );
  }
  revalidatePath("/works");
  revalidatePath(`/races/${raceSlug}`);
  revalidatePath(`/races/${raceSlug}/works`);
  revalidatePath(`/console/races/${raceSlug}/organizer/works`);
  revalidatePath(`/console/races/${raceSlug}/rider/submission`);
  redirect(returnTo);
}

export async function lockWorkAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/works`;
  try {
    await lockWorkForRace({
      actorUserId: user.id,
      allowSystem: hasRole(user.roles, "ADMIN"),
      workId: String(formData.get("workId") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_works",
      }),
    );
  }
  revalidatePath("/works");
  revalidatePath(`/races/${raceSlug}`);
  revalidatePath(`/races/${raceSlug}/works`);
  revalidatePath(`/console/races/${raceSlug}/organizer/works`);
  redirect(returnTo);
}

export async function sendFeedbackAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/rider/review`;
  try {
    await sendFeedback(user.id, formData);
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "rider_review",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath(`/console/races/${raceSlug}/rider/review`);
  revalidatePath(`/console/races/${raceSlug}/organizer/reports`);
  redirect(returnTo);
}

export async function replyFeedbackAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/reports`;
  try {
    await replyFeedback({
      allowSystem: hasRole(user.roles, "ADMIN"),
      formData,
      organizerId: user.id,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_feedback",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath(`/console/races/${raceSlug}/organizer/reports`);
  revalidatePath(`/console/races/${raceSlug}/rider/review`);
  redirect(returnTo);
}

export async function publishLeaderboardAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/awards`;
  try {
    await publishAwardsForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      raceId,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_awards",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  redirect(returnTo);
}

export async function generateAwardDraftsAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/awards`;
  try {
    await generateAwardDraftsForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      raceId,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_awards",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  redirect(returnTo);
}

export async function withdrawPublishedAwardsAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/awards`;
  try {
    await withdrawPublishedAwardsForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      raceId,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_awards",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  redirect(returnTo);
}

export async function updateAwardDraftAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/awards`;
  try {
    await updateAwardDraftForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      awardId: String(formData.get("awardId") ?? ""),
      awardName: String(formData.get("awardName") ?? ""),
      decisionReason: String(formData.get("decisionReason") ?? ""),
      organizerId: user.id,
      rank: Number(formData.get("rank") ?? 1),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_awards",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  redirect(returnTo);
}

export async function generateReportsAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/reports`;
  try {
    await generateReportsForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      raceId,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_reports",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  redirect(returnTo);
}

export async function publishReportAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/reports`;
  try {
    await publishReportForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      reportId: String(formData.get("reportId") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_reports",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  redirect(returnTo);
}

export async function updateReportDraftAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/reports`;
  try {
    await updateReportDraftForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      body: String(formData.get("body") ?? ""),
      organizerId: user.id,
      reportId: String(formData.get("reportId") ?? ""),
      summary: String(formData.get("summary") ?? ""),
      title: String(formData.get("title") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_reports",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  redirect(returnTo);
}

export async function createAnnouncementDraftAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/announcements`;
  try {
    await createAnnouncementDraftForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      body: String(formData.get("body") ?? ""),
      organizerId: user.id,
      raceId: String(formData.get("raceId") ?? ""),
      title: String(formData.get("title") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_announcements",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  revalidatePath(`/console/races/${raceSlug}/organizer/announcements`);
  revalidatePath(`/console/screen/${raceSlug}/announcement`);
  revalidatePath(`/screen/${raceSlug}/announcement`);
  revalidatePath(`/races/${raceSlug}/live`);
  redirect(returnTo);
}

export async function updateAnnouncementDraftAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/announcements`;
  try {
    await updateAnnouncementDraftForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      announcementId: String(formData.get("announcementId") ?? ""),
      body: String(formData.get("body") ?? ""),
      organizerId: user.id,
      title: String(formData.get("title") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_announcements",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  revalidatePath(`/console/races/${raceSlug}/organizer/announcements`);
  revalidatePath(`/console/screen/${raceSlug}/announcement`);
  revalidatePath(`/screen/${raceSlug}/announcement`);
  revalidatePath(`/races/${raceSlug}/live`);
  redirect(returnTo);
}

export async function publishAnnouncementAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/announcements`;
  try {
    await publishAnnouncementForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      announcementId: String(formData.get("announcementId") ?? ""),
      organizerId: user.id,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_announcements",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  revalidatePath(`/console/races/${raceSlug}/organizer/announcements`);
  revalidatePath(`/console/screen/${raceSlug}/announcement`);
  revalidatePath(`/screen/${raceSlug}/announcement`);
  revalidatePath(`/races/${raceSlug}/live`);
  redirect(returnTo);
}

export async function hideAnnouncementAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/announcements`;
  try {
    await hideAnnouncementForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      announcementId: String(formData.get("announcementId") ?? ""),
      organizerId: user.id,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_announcements",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  revalidatePath(`/console/races/${raceSlug}/organizer/announcements`);
  revalidatePath(`/console/screen/${raceSlug}/announcement`);
  revalidatePath(`/screen/${raceSlug}/announcement`);
  revalidatePath(`/races/${raceSlug}/live`);
  redirect(returnTo);
}

export async function markReportReviewedAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/reports`;
  try {
    await markReportReviewedForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      reportId: String(formData.get("reportId") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_reports",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  redirect(returnTo);
}

export async function runCompatibilityProgressEvalAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/judging`;
  try {
    await assertManagedRaceActionAccess({
      allowSystem: hasRole(user.roles, "ADMIN"),
      errorMessage: "无权发起这场比赛的兼容过程评估",
      raceId,
      userId: user.id,
    });
    await enqueueProgressEvalTasks(raceId);
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_judging",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath(`/console/races/${raceSlug}/organizer/judging`);
  redirect(returnTo);
}

export async function runCompatibilityHarnessEvalAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/judging`;
  try {
    await assertManagedRaceActionAccess({
      allowSystem: hasRole(user.roles, "ADMIN"),
      errorMessage: "无权发起这场比赛的兼容 Harness 评估",
      raceId,
      userId: user.id,
    });
    await enqueueHarnessEvalTasks(raceId);
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_judging",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath(`/console/races/${raceSlug}/organizer/judging`);
  redirect(returnTo);
}

export async function updateDisplayOptionsAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/settings`;

  try {
    await updateRaceDisplayOptions({
      allowSystem: hasRole(user.roles, "ADMIN"),
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
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_settings",
      }),
    );
  }

  revalidatePath("/");
  redirect(returnTo);
}

export async function generateRaceSnapshotAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/races/${raceSlug}/organizer/maintenance`;
  try {
    await assertManagedRaceActionAccess({
      allowSystem: hasRole(user.roles, "ADMIN"),
      errorMessage: "无权生成这场比赛的大屏快照",
      raceId,
      userId: user.id,
    });
    await generateRaceSnapshot(raceId);
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "organizer_maintenance",
      }),
    );
  }
  revalidatePath("/jumbotron/" + raceId);
  revalidatePath(`/console/races/${raceSlug}/organizer/maintenance`);
  redirect(returnTo);
}

export async function updateScreenDisplayModeAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/screen/${raceSlug}/jumbotron`;
  try {
    await updateScreenDisplayModeForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      mode: String(formData.get("mode") ?? "jumbotron") as
        | "announcement"
        | "billboard"
        | "jumbotron"
        | "leaderboard"
        | "live"
        | "works",
      organizerId: user.id,
      raceId,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "screen_console",
      }),
    );
  }
  revalidatePath("/console/screen");
  revalidatePath(`/console/screen/${raceSlug}/jumbotron`);
  revalidatePath(`/console/screen/${raceSlug}/announcement`);
  revalidatePath(`/screen/${raceSlug}`);
  revalidatePath(`/screen/${raceSlug}/announcement`);
  revalidatePath(`/screen/${raceSlug}/static`);
  redirect(returnTo);
}

export async function updateScreenDisplayThemeAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/screen/${raceSlug}/jumbotron`;
  try {
    await updateScreenDisplayThemeForRace({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      raceId,
      theme: String(formData.get("theme") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "screen_console",
      }),
    );
  }
  revalidatePath("/console/screen");
  revalidatePath(`/console/screen/${raceSlug}/jumbotron`);
  revalidatePath(`/console/screen/${raceSlug}/announcement`);
  revalidatePath(`/screen/${raceSlug}`);
  revalidatePath(`/screen/${raceSlug}/announcement`);
  revalidatePath(`/screen/${raceSlug}/static`);
  redirect(returnTo);
}

export async function saveRaceTrackCalibrationAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/screen/${raceSlug}/calibration`;
  try {
    await updateRaceTrackCalibration({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      raceId,
      trackConfigJson: String(formData.get("trackConfigJson") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "screen_console",
      }),
    );
  }
  revalidatePath("/console/screen");
  revalidatePath(`/console/screen/${raceSlug}/calibration`);
  revalidatePath(`/console/screen/${raceSlug}/jumbotron`);
  revalidatePath(`/screen/${raceSlug}`);
  revalidatePath(`/screen/${raceSlug}/live`);
  revalidatePath(`/races/${raceSlug}/live`);
  revalidatePath(`/jumbotron/${raceId}`);
  redirect(returnTo);
}

export async function fallbackScreenDisplayToStableAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/screen/${raceSlug}/jumbotron`;
  try {
    await fallbackScreenDisplayToStableProjection({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      raceId,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "screen_console",
      }),
    );
  }
  revalidatePath("/console/screen");
  revalidatePath(`/console/screen/${raceSlug}/jumbotron`);
  revalidatePath(`/screen/${raceSlug}`);
  revalidatePath(`/jumbotron/${raceId}`);
  redirect(returnTo);
}

export async function fallbackScreenDisplayToStaticAction(formData: FormData) {
  const user = await loadDatabaseUser();
  if (!user) {
    redirect("/login");
  }
  if (!user.profileCompleted) {
    redirect("/profile");
  }
  if (!hasRole(user.roles, "ADMIN") && !hasRole(user.roles, "ORGANIZER")) {
    redirect("/");
  }
  const raceId = String(formData.get("raceId") ?? "");
  const raceSlug = String(formData.get("raceSlug") ?? "");
  const returnTo =
    String(formData.get("returnTo") ?? "") ||
    `/console/screen/${raceSlug}/jumbotron`;
  try {
    await fallbackScreenDisplayToStaticNotice({
      allowSystem: hasRole(user.roles, "ADMIN"),
      organizerId: user.id,
      raceId,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "screen_console",
      }),
    );
  }
  revalidatePath("/console/screen");
  revalidatePath(`/console/screen/${raceSlug}/jumbotron`);
  revalidatePath(`/screen/${raceSlug}`);
  revalidatePath(`/screen/${raceSlug}/static`);
  redirect(returnTo);
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

export async function cooperationRequestAction(formData: FormData) {
  const session = await getSessionUser();
  const returnTo = String(formData.get("returnTo") ?? "") || "/cooperation";
  try {
    await submitCooperationRequest({
      submitterId: session?.id ?? null,
      companyName: String(formData.get("companyName") ?? ""),
      contactName: String(formData.get("contactName") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      contactPhone: String(formData.get("contactPhone") ?? ""),
      raceTitle: String(formData.get("raceTitle") ?? ""),
      raceSummary: String(formData.get("raceSummary") ?? ""),
      taskDescription: String(formData.get("taskDescription") ?? ""),
      trainingDataSummary: String(formData.get("trainingDataSummary") ?? ""),
      evaluationNotes: String(formData.get("evaluationNotes") ?? ""),
      keywordsText: String(formData.get("keywordsText") ?? ""),
      signupStart: String(formData.get("signupStart") ?? ""),
      signupEnd: String(formData.get("signupEnd") ?? ""),
      raceStart: String(formData.get("raceStart") ?? ""),
      raceEnd: String(formData.get("raceEnd") ?? ""),
      tokenLimit: Number(formData.get("tokenLimit")) || 4000,
      maxTeamSize: Number(formData.get("maxTeamSize")) || 5,
      submissionIntervalHours:
        Number(formData.get("submissionIntervalHours")) || 24,
      freezeMinutesBeforeEnd:
        Number(formData.get("freezeMinutesBeforeEnd")) || 30,
      hasTrainingData: formData.get("hasTrainingData") === "on",
      enableFreeze: formData.get("enableFreeze") === "on",
      displayShowTrainingData:
        formData.get("displayShowTrainingData") === "on",
      displayShowOrganizerComment:
        formData.get("displayShowOrganizerComment") === "on",
      displayShowTopHighlights:
        formData.get("displayShowTopHighlights") === "on",
      displayShowRiderCode: formData.get("displayShowRiderCode") === "on",
      notes: String(formData.get("notes") ?? ""),
      taskPackageFile: formData.get("taskPackageFile") as File | null,
      proposalFile: formData.get("proposalFile") as File | null,
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "cooperation_request",
      }),
    );
  }
  redirect(`${returnTo}?submitted=1`);
}

export async function approveCooperationRequestAction(formData: FormData) {
  const user = await requireRole("ADMIN");
  const returnTo =
    String(formData.get("returnTo") ?? "") || "/console/admin/race-requests";
  const requestId = String(formData.get("requestId") ?? "");
  try {
    await approveCooperationRequest(requestId, user.id);
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "admin_race_requests",
      }),
    );
  }
  revalidatePath("/");
  revalidatePath("/console/races");
  revalidatePath("/console/admin/race-requests");
  redirect(returnTo);
}

export async function rejectCooperationRequestAction(formData: FormData) {
  await requireRole("ADMIN");
  const returnTo =
    String(formData.get("returnTo") ?? "") || "/console/admin/race-requests";
  const requestId = String(formData.get("requestId") ?? "");
  try {
    await rejectCooperationRequest(requestId);
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) {
      throw error;
    }
    redirect(
      buildActionFeedbackHref({
        error,
        returnTo,
        scope: "admin_race_requests",
      }),
    );
  }
  revalidatePath("/console/admin/race-requests");
  redirect(returnTo);
}

// ============================================================
// GRS004 协作功能 Server Actions
// ============================================================

export async function createTeamAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const raceId = String(formData.get("raceId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");
  const feedbackReturnTo = String(formData.get("feedbackReturnTo") ?? "") || returnTo || "/";
  try {
    await createTeam(user.id, {
      raceId,
      name: String(formData.get("teamName") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) throw error;
    redirect(buildActionFeedbackHref({ error, returnTo: feedbackReturnTo, scope: "rider_registration" }));
  }
  await rebuildRaceProcessProjections(raceId);
  revalidatePath("/");
  revalidatePath("/console/races");
  redirect(returnTo || "/console/races");
}

export async function joinTeamAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const raceId = String(formData.get("raceId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");
  const feedbackReturnTo = String(formData.get("feedbackReturnTo") ?? "") || returnTo || "/";
  try {
    // GRS004: joinTeam 内部已创建 Registration 关联，无需再调用 registerForRace
    await joinTeam(user.id, { teamId });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) throw error;
    redirect(buildActionFeedbackHref({ error, returnTo: feedbackReturnTo, scope: "rider_registration" }));
  }
  await rebuildRaceProcessProjections(raceId);
  revalidatePath("/");
  revalidatePath("/console/races");
  redirect(returnTo || "/console/races");
}

export async function approveMemberAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const teamId = String(formData.get("teamId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");
  const feedbackReturnTo = String(formData.get("feedbackReturnTo") ?? "") || returnTo || "/console/races";
  try {
    await approveMember(user.id, { teamId, memberId });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) throw error;
    redirect(buildActionFeedbackHref({ error, returnTo: feedbackReturnTo, scope: "rider_console" }));
  }
  revalidatePath("/console/races");
  redirect(returnTo || "/console/races");
}

export async function removeMemberAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const teamId = String(formData.get("teamId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");
  const feedbackReturnTo = String(formData.get("feedbackReturnTo") ?? "") || returnTo || "/console/races";
  try {
    await removeMember(user.id, { teamId, memberId });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) throw error;
    redirect(buildActionFeedbackHref({ error, returnTo: feedbackReturnTo, scope: "rider_console" }));
  }
  revalidatePath("/console/races");
  redirect(returnTo || "/console/races");
}

export async function createTaskAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const teamId = String(formData.get("teamId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");
  const feedbackReturnTo = String(formData.get("feedbackReturnTo") ?? "") || returnTo || "/console/races";
  try {
    await createTask(user.id, {
      teamId,
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      assigneeId: String(formData.get("assigneeId") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) throw error;
    redirect(buildActionFeedbackHref({ error, returnTo: feedbackReturnTo, scope: "rider_console" }));
  }
  revalidatePath("/console/races");
  redirect(returnTo || "/console/races");
}

export async function completeTaskAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const taskId = String(formData.get("taskId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");
  const feedbackReturnTo = String(formData.get("feedbackReturnTo") ?? "") || returnTo || "/console/races";
  try {
    await completeTask(user.id, { taskId });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) throw error;
    redirect(buildActionFeedbackHref({ error, returnTo: feedbackReturnTo, scope: "rider_console" }));
  }
  revalidatePath("/console/races");
  redirect(returnTo || "/console/races");
}

export async function sendMessageAction(formData: FormData) {
  const user = await requireRole("RIDER");
  const teamId = String(formData.get("teamId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");
  const feedbackReturnTo = String(formData.get("feedbackReturnTo") ?? "") || returnTo || "/console/races";
  try {
    await sendMessage(user.id, {
      teamId,
      receiverId: String(formData.get("receiverId") ?? ""),
      content: String(formData.get("content") ?? ""),
    });
  } catch (error) {
    if (shouldRethrowActionFeedback(error)) throw error;
    redirect(buildActionFeedbackHref({ error, returnTo: feedbackReturnTo, scope: "rider_console" }));
  }
  revalidatePath("/console/races");
  redirect(returnTo || "/console/races");
}
