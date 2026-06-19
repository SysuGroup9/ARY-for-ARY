import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RiderConsolePageView } from "./rider-console-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return {
    feedbackThreads: [],
    highlights: [],
    id: "race_active",
    leaderboardEntries: [],
    organizerComment: "",
    phase: "active",
    raceEnd: new Date("2026-06-20T12:00:00Z"),
    raceStart: new Date("2026-06-19T12:00:00Z"),
    submissions: [],
    teamComments: [],
    teamArchives: [],
    title: "Sorting Challenge",
    ...overrides,
  } as unknown as RaceListItem;
}

test("骑手工作台在报名与提交区块中不再暴露 compatibility 层文案", () => {
  const html = renderToStaticMarkup(
    <RiderConsolePageView
      race={buildRace()}
      registration={null}
      reviewSummary={null}
      riderReports={[]}
      riderTeam={null}
      section="registration"
    />,
  ) +
    renderToStaticMarkup(
      <RiderConsolePageView
        race={buildRace()}
        registration={null}
        reviewSummary={null}
        riderReports={[]}
        riderTeam={null}
        section="submission"
      />,
    );

  assert.doesNotMatch(html, /Compatibility team/);
  assert.doesNotMatch(html, /compatibility team creation/);
  assert.doesNotMatch(html, /No compatibility submission container yet\./);
  assert.match(html, /报名状态/);
  assert.match(html, /提交已锁定/);
});

test("骑手报告区块优先使用骑手报告语义，而不是暴露过渡层标题", () => {
  const html = renderToStaticMarkup(
    <RiderConsolePageView
      race={buildRace({
        organizerComment: "主办方总结。",
        teamArchives: [
          {
            teamId: "team_1",
            totalScore: 91,
          } as RaceListItem["teamArchives"][number],
        ],
      })}
      registration={
        {
          evidences: [
            {
              id: "ev_1",
              summary: "公开证据摘要。",
              title: "会话摘要",
            },
          ],
        } as never
      }
      reviewSummary={null}
      riderReports={[]}
      riderTeam={
        {
          id: "team_1",
          name: "solo",
        } as never
      }
      section="report"
    />,
  );

  assert.match(html, /骑手报告/);
  assert.match(html, /最终得分/);
  assert.doesNotMatch(html, /Transitional Read Model/);
  assert.doesNotMatch(html, /Highlight/);
});
