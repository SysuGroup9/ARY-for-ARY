import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OrganizerConsolePageView } from "./organizer-console-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
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

test("organizer awards section exposes award draft and withdraw controls", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace({
        awards: [
          {
            awardName: "Best Overall",
            decisionReason: "draft best overall",
            id: "award_draft",
            publishedAt: null,
            rank: 1,
            registration: {
              user: {
                username: "rider_draft",
              },
            },
            work: {
              title: "Draft Work",
            },
          },
          {
            awardName: "Best Work",
            decisionReason: "published best work",
            id: "award_published",
            publishedAt: new Date("2026-06-20T12:00:00Z"),
            rank: 1,
            registration: {
              user: {
                username: "rider_published",
              },
            },
            work: {
              title: "Published Work",
            },
          },
        ] as never,
      })}
      raceSlug="race_active--sorting-challenge"
      section="awards"
    />,
  );

  assert.match(html, /生成 Award 草稿/);
  assert.match(html, /撤回已发布榜单/);
  assert.match(html, /奖项草稿/);
  assert.match(html, /已发布奖项/);
});

test("organizer award draft panel exposes draft edit controls", () => {
  const html = renderToStaticMarkup(
    <OrganizerConsolePageView
      judgeAssignments={[]}
      judges={[]}
      race={buildRace({
        awards: [
          {
            awardName: "Best Overall",
            decisionReason: "draft best overall",
            id: "award_draft",
            publishedAt: null,
            rank: 1,
            registration: {
              user: {
                username: "rider_draft",
              },
            },
            work: {
              title: "Draft Work",
            },
          },
        ] as never,
      })}
      raceSlug="race_active--sorting-challenge"
      section="awards"
    />,
  );

  assert.match(html, /奖项草稿/);
  assert.match(html, /保存 Award 草稿/);
  assert.match(html, /name="awardName"/);
  assert.match(html, /name="rank"/);
  assert.match(html, /name="decisionReason"/);
});
