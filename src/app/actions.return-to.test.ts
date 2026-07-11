import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("race registration and submission actions consume returnTo redirects", () => {
  const source = readFileSync("src/app/actions.ts", "utf8");

  assert.match(
    source,
    /export async function registerAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\);[\s\S]*?user = await registerUser\(formData\);[\s\S]*?buildEntryFeedbackHref\(\{[\s\S]*?mode: "register"[\s\S]*?returnTo[\s\S]*?\}\)[\s\S]*?getPostAuthRedirectTarget\(\{[\s\S]*?profileCompleted: user\.profileCompleted,[\s\S]*?returnTo,[\s\S]*?\}\)/,
  );
  assert.match(
    source,
    /export async function loginAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\);[\s\S]*?user = await loginUser\(formData\);[\s\S]*?buildEntryFeedbackHref\(\{[\s\S]*?mode: "login"[\s\S]*?returnTo[\s\S]*?\}\)[\s\S]*?getPostAuthRedirectTarget\(\{[\s\S]*?profileCompleted: user\.profileCompleted,[\s\S]*?returnTo,[\s\S]*?\}\)/,
  );
  assert.match(
    source,
    /export async function loginWithGitHubAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\);[\s\S]*?await startGitHubOAuth\(returnTo\);[\s\S]*?if \(shouldRethrowActionFeedback\(error\)\) \{[\s\S]*?throw error;[\s\S]*?\}[\s\S]*?resolveGitHubOAuthErrorCode\(error, "start"\)[\s\S]*?encodeURIComponent\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function completeProfileAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\);[\s\S]*?buildEntryFeedbackHref\(\{[\s\S]*?mode: "profile"[\s\S]*?returnTo[\s\S]*?\}\)[\s\S]*?redirect\(resolveProfileCompletionReturnTo\(returnTo\)\)/,
  );
  assert.match(
    source,
    /export async function updateUserRolesAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\) \|\| "\/console\/admin\/roles";[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "admin_roles"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function createRaceAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\) \|\| "\/console\/races\/new";[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "create_race"[\s\S]*?\}\)[\s\S]*?redirect\(`\/console\/races\/\$\{buildRaceSlug\(race\.id, race\.title\)\}\/organizer\/overview`\)/,
  );
  assert.match(
    source,
    /export async function registerForRaceAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\);[\s\S]*?redirect\(returnTo \|\| /,
  );
  assert.match(
    source,
    /export async function registerForRaceAction[\s\S]*?const feedbackReturnTo = String\(formData\.get\("feedbackReturnTo"\) \?\? ""\) \|\| returnTo \|\| "\/";[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?returnTo: feedbackReturnTo,[\s\S]*?scope: feedbackReturnTo\.includes\("\/races\/"\) \? "public_register" : "rider_registration"/,
  );
  assert.match(
    source,
    /export async function withdrawRegistrationAction[\s\S]*?const feedbackReturnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?returnTo: feedbackReturnTo,[\s\S]*?scope: feedbackReturnTo\.includes\("\/races\/"\)[\s\S]*?redirect\(feedbackReturnTo\)/,
  );
  assert.match(
    source,
    /export async function approveRegistrationAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_registration"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function rejectRegistrationAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_registration"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function submitEntryAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\);[\s\S]*?redirect\(returnTo \|\| "\/"\)/,
  );
  assert.doesNotMatch(source, /export async function submitEntryForTestAction/);
  assert.match(
    source,
    /export async function submitFinalEntryAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\);[\s\S]*?redirect\(returnTo \|\| "\/"\)/,
  );
  assert.match(
    source,
    /export async function publishWorkAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_works"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function hideWorkAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\) \|\| "\/";[\s\S]*?const scope =[\s\S]*?returnTo\.includes\("\/organizer\/works"\)[\s\S]*?"organizer_works"[\s\S]*?"rider_submission"[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope,[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function lockWorkAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_works"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function publishRaceAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_settings"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function updateRaceAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_settings"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function updateTeamCommentAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_feedback"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function updateDisplayOptionsAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_settings"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function createAnnouncementDraftAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_announcements"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function updateAnnouncementDraftAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_announcements"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function publishAnnouncementAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_announcements"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function hideAnnouncementAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_announcements"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function generateAwardDraftsAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_awards"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function publishLeaderboardAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_awards"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function withdrawPublishedAwardsAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_awards"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function updateAwardDraftAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_awards"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function generateReportsAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_reports"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function publishReportAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_reports"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function updateReportDraftAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_reports"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function markReportReviewedAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_reports"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function assignJudgeToWorkAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_judges"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function removeJudgeAssignmentAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_judges"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function submitJudgingRecordAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\) \|\| "\/console\/races";[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "judge_review"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function sendFeedbackAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "rider_review"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function replyFeedbackAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_feedback"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function runCompatibilityProgressEvalAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_judging"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function runCompatibilityHarnessEvalAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_judging"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function disableCAConnectionAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_ca_status"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function enableCAConnectionAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_ca_status"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function rebuildProcessModelsAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_ca_status"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function updateScreenDisplayModeAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "screen_console"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function updateScreenDisplayThemeAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "screen_console"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function saveRaceTrackCalibrationAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "screen_console"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function fallbackScreenDisplayToStableAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "screen_console"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function fallbackScreenDisplayToStaticAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "screen_console"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function generateRaceSnapshotAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_maintenance"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function archiveRaceAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "organizer_maintenance"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function cooperationRequestAction[\s\S]*?const returnTo = String\(formData\.get\("returnTo"\) \?\? ""\) \|\| "\/cooperation";[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "cooperation_request"[\s\S]*?\}\)[\s\S]*?redirect\(`\$\{returnTo\}\?submitted=1`\)/,
  );
  assert.match(
    source,
    /export async function approveCooperationRequestAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "admin_race_requests"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
  assert.match(
    source,
    /export async function rejectCooperationRequestAction[\s\S]*?const returnTo =[\s\S]*?buildActionFeedbackHref\(\{[\s\S]*?scope: "admin_race_requests"[\s\S]*?\}\)[\s\S]*?redirect\(returnTo\)/,
  );
});
