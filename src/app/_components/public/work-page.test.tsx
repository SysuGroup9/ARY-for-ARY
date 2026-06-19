import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkPageView } from "./work-page";

function renderWorkPage(overrides?: Partial<Parameters<typeof WorkPageView>[0]>) {
  return renderToStaticMarkup(
    <WorkPageView
      author="alice"
      awards={[{ awardName: "Best Overall", rank: 1 }]}
      demoUrl="https://example.com/demo"
      evidenceSummaries={["会话摘要证据", "评委评语证据"]}
      excerpt="一段作品摘要。"
      judgeComments={[
        {
          judgeName: "judge_amy",
          summary: "Judge summary for Render Rocket.",
        },
      ]}
      raceSlug="race_finished--performance-marathon"
      raceTitle="Performance Marathon"
      repoUrl="https://example.com/repo"
      score={100}
      techNotes="技术方案与权衡说明。"
      title="Render Rocket"
      videoUrl="https://example.com/video"
      {...overrides}
    />,
  );
}

test("渲染作品详情页的作品资产、证据、奖项与赛事回链", () => {
  const html = renderWorkPage();

  assert.match(html, /作品详情/);
  assert.match(html, /打开演示/);
  assert.match(html, /打开仓库/);
  assert.match(html, /打开视频/);
  assert.match(html, /公开证据/);
  assert.match(html, /已发布奖项/);
  assert.match(html, /评委评语/);
  assert.match(html, /技术说明/);
  assert.match(html, /返回赛事/);
  assert.match(html, /返回 Performance Marathon/);
});

test("不会再展示 legacy score fallback 文案", () => {
  const html = renderWorkPage();

  assert.doesNotMatch(html, /Legacy score fallback/);
});

test("在没有公开证据和技术说明时渲染中文空态", () => {
  const html = renderWorkPage({
    awards: [],
    demoUrl: "",
    evidenceSummaries: [],
    judgeComments: [],
    repoUrl: "",
    techNotes: "",
    videoUrl: "",
  });

  assert.match(html, /暂无已发布的公开证据。/);
  assert.match(html, /暂无已发布的技术说明。/);
});

test("在有评委评语时渲染公开评审上下文", () => {
  const html = renderWorkPage();

  assert.match(html, /judge_amy/);
  assert.match(html, /Judge summary for Render Rocket\./);
});
