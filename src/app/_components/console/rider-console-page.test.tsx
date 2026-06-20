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
    phase: "running",
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
  assert.match(html, /你已经进入骑手工作台；下一步是对当前赛事提交正式报名/);
  assert.match(html, /提交已锁定/);
});

test("比赛中提交区同时显示普通提交和赛中代码测试入口", () => {
  const html = renderToStaticMarkup(
    <RiderConsolePageView
      race={buildRace()}
      registration={{ id: "reg_1" } as never}
      reviewSummary={null}
      riderReports={[]}
      riderTeam={{ id: "team_1", name: "solo" } as never}
      section="submission"
    />,
  );

  assert.match(html, /提交作品/);
  assert.match(html, /赛中代码测试/);
  assert.match(html, /提交代码并进入待评测队列/);
  assert.match(html, /提交代码并发起赛中测试/);
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
