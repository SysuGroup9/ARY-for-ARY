import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OrganizerConsolePageView } from "./organizer-console-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return {
    announcements: [],
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

test("organizer announcements section exposes draft, publish, hide, and display controls", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace({
        announcements: [
          {
            body: "draft stage notice",
            id: "announcement_draft",
            publishedAt: null,
            title: "Draft Notice",
            visibility: "PRIVATE",
          },
          {
            body: "published stage notice",
            id: "announcement_published",
            publishedAt: new Date("2026-07-11T12:00:00Z"),
            title: "Published Notice",
            visibility: "PUBLIC",
          },
        ] as never,
      })}
      raceSlug="race_active--sorting-challenge"
      section="announcements"
    />,
  );

  assert.match(html, /创建公告草稿/);
  assert.match(html, /公告草稿/);
  assert.match(html, /已发布公告/);
  assert.match(html, /保存公告草稿/);
  assert.match(html, /发布公告/);
  assert.match(html, /隐藏公告/);
  assert.match(html, /打开 Announcement Display/);
  assert.match(html, /name="title"/);
  assert.match(html, /name="body"/);
});
