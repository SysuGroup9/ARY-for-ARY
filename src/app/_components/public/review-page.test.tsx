import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ReviewPageView } from "./review-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return {
    id: "race_finished",
    title: "Performance Marathon",
    ...overrides,
  } as unknown as RaceListItem;
}

function renderReviewPage(
  overrides?: Partial<Parameters<typeof ReviewPageView>[0]>,
) {
  return renderToStaticMarkup(
    <ReviewPageView
      awards={[
        {
          awardName: "Best Overall",
          decisionReason: "Best end-to-end delivery.",
          registration: { user: { username: "rider_bob" } },
        },
      ]}
      evidenceHighlights={[
        {
          summary: "公开证据摘要。",
          title: "会话摘要",
        },
      ]}
      judgingRecords={[
        {
          comments: "Judge summary for Render Rocket.",
          judgeAssignment: {
            judge: { username: "judge_amy" },
            work: { title: "Render Rocket" },
          },
        },
      ]}
      race={buildRace()}
      reviewReport={{
        body: "详细评审正文。",
        summary: "已发布评审摘要。",
        title: "评审总结",
      }}
      {...overrides}
    />,
  );
}

test("渲染评审总结、获奖说明、评委评语、典型案例和证据摘要", () => {
  const html = renderReviewPage();

  assert.match(html, /评审总结/);
  assert.match(html, /获奖说明/);
  assert.match(html, /评委评语/);
  assert.match(html, /典型案例/);
  assert.match(html, /证据摘要/);
  assert.match(html, /公开证据摘要。/);
});

test("在没有公开证据摘要时渲染中文空态", () => {
  const html = renderReviewPage({
    awards: [],
    evidenceHighlights: [],
    judgingRecords: [],
    reviewReport: null,
  });

  assert.match(html, /暂无已发布的公开评审总结。/);
  assert.match(html, /暂无公开证据摘要。/);
});
