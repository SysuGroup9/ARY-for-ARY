import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ResultsPageView } from "./results-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return {
    id: "race_finished",
    title: "Performance Marathon",
    ...overrides,
  } as unknown as RaceListItem;
}

function renderResultsPage(
  overrides?: Partial<Parameters<typeof ResultsPageView>[0]>,
) {
  return renderToStaticMarkup(
    <ResultsPageView
      awards={[
        {
          awardName: "Best Overall",
          decisionReason: "Best end-to-end delivery.",
          rank: 1,
          registration: { user: { username: "rider_bob" } },
          work: { slug: "race_finished__work_b--render-rocket", title: "Render Rocket" },
        },
        {
          awardName: "Best Cost Control",
          decisionReason: "Strongest efficiency under budget.",
          rank: 1,
          registration: { user: { username: "rider_alice" } },
          work: { slug: "race_finished__work_a--budget-master", title: "Budget Master" },
        },
      ]}
      race={buildRace()}
      raceReport={{ summary: "已发布赛事总结摘要。", title: "赛事报告" }}
      ridingSkillHighlights={[
        {
          label: "成本控制",
          riderName: "rider_alice",
        },
        {
          label: "复盘表达",
          riderName: "rider_bob",
        },
      ]}
      {...overrides}
    />,
  );
}

test("渲染奖项榜单、获奖作品、骑行亮点和评审总结入口", () => {
  const html = renderResultsPage();

  assert.match(html, /奖项榜单/);
  assert.match(html, /获奖作品/);
  assert.match(html, /骑行亮点/);
  assert.match(html, /成本控制/);
  assert.match(html, /复盘表达/);
  assert.match(html, /查看评审总结/);
});

test("获奖作品以公开作品入口链接呈现，而不是纯文本卡片", () => {
  const html = renderResultsPage();

  assert.match(html, /\/works\//);
  assert.match(html, /Render Rocket/);
});

test("在没有骑行亮点时渲染中文空态", () => {
  const html = renderResultsPage({
    awards: [],
    raceReport: null,
    ridingSkillHighlights: [],
  });

  assert.match(html, /暂无已发布的公开赛果。/);
  assert.match(html, /暂无已发布的骑行亮点。/);
});
