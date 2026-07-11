import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/app/actions.ts", "utf8");

const managedRaceSystemActions = [
  {
    name: "publishLeaderboardAction",
    next: "generateAwardDraftsAction",
    serviceCall: "publishAwardsForRace",
  },
  {
    name: "generateAwardDraftsAction",
    next: "withdrawPublishedAwardsAction",
    serviceCall: "generateAwardDraftsForRace",
  },
  {
    name: "withdrawPublishedAwardsAction",
    next: "updateAwardDraftAction",
    serviceCall: "withdrawPublishedAwardsForRace",
  },
  {
    name: "updateAwardDraftAction",
    next: "generateReportsAction",
    serviceCall: "updateAwardDraftForRace",
  },
  {
    name: "generateReportsAction",
    next: "publishReportAction",
    serviceCall: "generateReportsForRace",
  },
  {
    name: "publishReportAction",
    next: "updateReportDraftAction",
    serviceCall: "publishReportForRace",
  },
  {
    name: "updateReportDraftAction",
    next: "createAnnouncementDraftAction",
    serviceCall: "updateReportDraftForRace",
  },
  {
    name: "createAnnouncementDraftAction",
    next: "updateAnnouncementDraftAction",
    serviceCall: "createAnnouncementDraftForRace",
  },
  {
    name: "updateAnnouncementDraftAction",
    next: "publishAnnouncementAction",
    serviceCall: "updateAnnouncementDraftForRace",
  },
  {
    name: "publishAnnouncementAction",
    next: "hideAnnouncementAction",
    serviceCall: "publishAnnouncementForRace",
  },
  {
    name: "hideAnnouncementAction",
    next: "markReportReviewedAction",
    serviceCall: "hideAnnouncementForRace",
  },
  {
    name: "markReportReviewedAction",
    next: "runCompatibilityProgressEvalAction",
    serviceCall: "markReportReviewedForRace",
  },
] as const;

function getFunctionSource(name: string, next: string) {
  const start = source.indexOf(`export async function ${name}(formData: FormData)`);
  const end = source.indexOf(`export async function ${next}(`, start);

  assert.notEqual(start, -1, `${name} should exist in actions.ts`);
  assert.notEqual(end, -1, `${next} should exist after ${name}`);

  return source.slice(start, end);
}

test("managed-race award/report/announcement actions allow admin/system callers instead of organizer-only gates", () => {
  for (const action of managedRaceSystemActions) {
    const functionSource = getFunctionSource(action.name, action.next);

    assert.doesNotMatch(functionSource, /requireRole\("ORGANIZER"\)/);
    assert.match(functionSource, /const user = await loadDatabaseUser\(\);/);
    assert.match(functionSource, /if \(!user\.profileCompleted\)/);
    assert.match(
      functionSource,
      /if \(!hasRole\(user\.roles, "ADMIN"\) && !hasRole\(user\.roles, "ORGANIZER"\)\)/,
    );
    assert.match(
      functionSource,
      new RegExp(
        `await ${action.serviceCall}\\([\\s\\S]*?allowSystem: hasRole\\(user\\.roles, "ADMIN"\\)`,
      ),
    );
  }
});
