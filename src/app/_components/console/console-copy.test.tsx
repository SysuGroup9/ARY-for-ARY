import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ConsoleHomeView } from "./console-home";
import { ConsoleRacesPageView } from "./console-races-page";
import { JudgeConsolePageView } from "./judge-console-page";
import { ScreenConsolePageView } from "./screen-console-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return {
    id: "race_active",
    phase: "active",
    raceEnd: new Date("2026-06-20T12:00:00Z"),
    raceStart: new Date("2026-06-19T12:00:00Z"),
    summary: "进行中的赛事。",
    title: "Sorting Challenge",
    ...overrides,
  } as unknown as RaceListItem;
}

test("screen console uses Chinese titles, buttons, and notes", () => {
  const html = renderToStaticMarkup(
    <ScreenConsolePageView
      mode="jumbotron"
      race={buildRace()}
      raceSlug="race_active--sorting-challenge"
      jumbotronPreview={{ snapshot: null, trackProfile: null }}
    />,
  );

  assert.match(html, /大屏控制台/);
  assert.match(html, /当前模式/);
  assert.match(html, /输出目标/);
  assert.match(html, /打开大屏/);
  assert.match(html, /打开校准器/);
  assert.match(html, /打开公开赛事页/);
});

test("judge console uses Chinese labels and actions", () => {
  const html = renderToStaticMarkup(
    <JudgeConsolePageView
      assignments={[
        {
          assignedAt: new Date("2026-06-19T12:00:00Z"),
          assignedByUser: { username: "organizer_amy" },
          id: "assign_1",
          judge: { username: "judge_amy" },
          judgingRecord: null,
          work: {
            awards: [],
            registration: {
              evidences: [{ summary: "证据摘要", type: "SESSION_SUMMARY" }],
              user: { username: "rider_bob" },
            },
            summary: "作品摘要",
            title: "Render Rocket",
          },
        },
      ]}
      race={buildRace()}
      raceSlug="race_active--sorting-challenge"
      section="assigned"
    />,
  );

  assert.match(html, /已分配作品/);
  assert.match(html, /骑手/);
  assert.match(html, /结果评分/);
  assert.match(html, /骑行评分/);
  assert.match(html, /保存草稿/);
  assert.match(html, /提交评审/);
});

test("console home and race workspace list use Chinese copy", () => {
  const homeHtml = renderToStaticMarkup(
    <ConsoleHomeView raceCount={3} sections={["races", "admin", "screen"]} />,
  );
  const racesHtml = renderToStaticMarkup(
    <ConsoleRacesPageView
      races={[
        {
          access: "organizer",
          defaultHref: "/console/races/race_active--sorting-challenge/organizer/overview",
          race: buildRace(),
        } as never,
      ]}
    />,
  );

  assert.match(homeHtml, /工作台入口/);
  assert.match(homeHtml, /赛事控制台/);
  assert.match(homeHtml, /管理控制台/);
  assert.match(homeHtml, /大屏控制台/);
  assert.match(racesHtml, /赛事工作台/);
  assert.match(racesHtml, /主办方视图/);
});
