import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RiderProfilePageView } from "./rider-profile-page";

function renderRiderProfile(
  overrides?: Partial<Parameters<typeof RiderProfilePageView>[0]>,
) {
  return renderToStaticMarkup(
    <RiderProfilePageView
      featuredRaceTitle="Performance Marathon"
      featuredWorkTitle="Render Rocket"
      judgeComments={[
        {
          raceTitle: "Performance Marathon",
          summary: "Judge summary for Render Rocket.",
        },
      ]}
      orgLabel="ARY"
      performanceSummary={{
        averageProgressPercent: 72,
        riskCount: 1,
        totalTokens: 4200,
      }}
      publicWorkLinks={[
        {
          href: "/works/race_finished__work_b--render-rocket",
          title: "Render Rocket",
        },
      ]}
      raceCount={2}
      raceRecords={[
        {
          awardNames: ["Best Overall"],
          awardScore: 1,
          comment: "评审摘要评论。",
          evidenceCount: 3,
          phase: "finished",
          raceId: "race_finished",
          raceSlug: "race_finished--performance-marathon",
          raceTitle: "Performance Marathon",
          workTitle: "Render Rocket",
        },
      ]}
      reportSummaries={["已发布骑手报告摘要。"]}
      skillTags={["成本控制", "风险处理", "复盘表达"]}
      username="rider_bob"
      workCount={1}
      {...overrides}
    />,
  );
}

test("渲染骑手档案页的能力标签、表现摘要、评委评语与作品链接", () => {
  const html = renderRiderProfile();

  assert.match(html, /骑手档案/);
  assert.match(html, /骑行能力/);
  assert.match(html, /成本控制/);
  assert.match(html, /风险处理/);
  assert.match(html, /表现摘要/);
  assert.match(html, /4200/);
  assert.match(html, /72%/);
  assert.match(html, /评委评语/);
  assert.match(html, /Judge summary for Render Rocket\./);
  assert.match(html, /公开作品/);
});

test("在没有技能标签、公开作品和评委评语时渲染中文空态", () => {
  const html = renderRiderProfile({
    judgeComments: [],
    performanceSummary: {
      averageProgressPercent: 0,
      riskCount: 0,
      totalTokens: 0,
    },
    publicWorkLinks: [],
    raceRecords: [],
    reportSummaries: [],
    skillTags: [],
    workCount: 0,
  });

  assert.match(html, /暂无已发布的骑手报告。/);
  assert.match(html, /暂无公开作品链接。/);
  assert.match(html, /暂无已生成的能力标签。/);
  assert.match(html, /暂无公开评委评语。/);
});
