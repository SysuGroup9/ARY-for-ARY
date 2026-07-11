import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OrganizerConsolePageView } from "./organizer-console-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(
  overrides?: Partial<RaceListItem> & { securityAudits?: Array<unknown> },
): RaceListItem {
  return {
    awards: [],
    displayHighlightCount: 3,
    displayShowOrganizerComment: false,
    displayShowRiderCode: false,
    displayShowTopHighlights: false,
    displayShowTrainingData: false,
    feedbackThreads: [],
    harnessEntries: [],
    highlights: [],
    id: "race_active",
    organizerComment: "",
    phase: "active",
    projections: [],
    raceEnd: new Date("2026-06-20T12:00:00Z"),
    raceStart: new Date("2026-06-19T12:00:00Z"),
    registrations: [],
    reports: [],
    runnerTasks: [],
    securityAudits: [],
    submissions: [],
    teamComments: [],
    teams: [],
    title: "Sorting Challenge",
    leaderboardEntries: [],
    ...overrides,
  } as unknown as RaceListItem;
}

test("organizer report controls expose draft edit, review, and regenerate warning copy", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace({
        reports: [
          {
            body: "draft race report body",
            id: "report_race_editable",
            status: "GENERATED",
            summary: "draft race report",
            title: "Race Report",
            type: "RACE_REPORT",
          },
          {
            body: "reviewed review summary body",
            id: "report_review_editable",
            status: "REVIEWED",
            summary: "reviewed review summary",
            title: "Review Summary",
            type: "REVIEW_SUMMARY",
          },
        ] as never,
      })}
      raceSlug="race_active--sorting-challenge"
      section="reports"
    />,
  );

  assert.match(html, /淇濆瓨鎶ュ憡鑽夌/);
  assert.match(html, /reviewed/);
  assert.match(html, /GENERATED/);
});

test("organizer reports expose editable team comments and rider feedback reply controls", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace({
        feedbackThreads: [
          {
            id: "thread_1",
            messages: [
              {
                author: { username: "rider_alice" },
                content: "Please clarify the next judging checkpoint.",
                id: "msg_1",
              },
            ],
            status: "PENDING",
            team: { id: "team_1", name: "solo" },
          },
        ] as never,
        teamComments: [
          {
            content: "Current organizer note.",
            id: "comment_1",
            team: { id: "team_1", name: "solo" },
            teamId: "team_1",
          },
        ] as never,
        teams: [{ id: "team_1", name: "solo" }] as never,
      })}
      raceSlug="race_active--sorting-challenge"
      section="reports"
    />,
  );

  assert.match(html, /name="teamId" value="team_1"/);
  assert.match(
    html,
    /type="hidden" name="returnTo" value="\/console\/races\/race_active--sorting-challenge\/organizer\/reports"/,
  );
  assert.match(html, /保存团队评语/);
  assert.match(html, /name="threadId" value="thread_1"/);
  assert.match(html, /回复后标记为已解决/);
  assert.match(html, /发送回复/);
});
