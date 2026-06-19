import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicHomeHero } from "./public-home-hero";
import { HomeGallery } from "./home-gallery";
import type { ReturnTypeOfBuildPublicSiteModel } from "@/lib/public-site-types";

const model: ReturnTypeOfBuildPublicSiteModel = {
  featuredRaces: [
    {
      activeRiderCount: 8,
      currentProgressPercent: 64,
      id: "race_active",
      phase: "active",
      raceEnd: new Date("2026-06-20T12:00:00Z"),
      raceStart: new Date("2026-06-19T12:00:00Z"),
      slug: "race_active--sorting-challenge",
      summary: "一场进行中的公开赛事。",
      teamCount: 8,
      title: "Sorting Challenge",
      workCount: 4,
    },
  ],
  featuredRiders: [
    {
      featuredRaceTitle: "Sorting Challenge",
      featuredWorkTitle: "Render Rocket",
      id: "rider_1",
      orgLabel: "ARY",
      publicWorkLinks: [],
      raceCount: 2,
      riderSlug: "rider_1--alice",
      username: "alice",
      workCount: 1,
    },
  ],
  featuredWorks: [
    {
      agentType: "CUSTOM",
      author: "alice",
      excerpt: "作品摘要",
      id: "race_active__work_1--render-rocket",
      raceId: "race_active",
      raceSlug: "race_active--sorting-challenge",
      raceTitle: "Sorting Challenge",
      score: 95,
      title: "Render Rocket",
    },
  ],
  latestResults: [],
  liveRaces: [],
  pastRaces: [],
};

test("public home hero uses readable Chinese labels", () => {
  const html = renderToStaticMarkup(<PublicHomeHero model={model} />);

  assert.match(html, /当前状态/);
  assert.match(html, /赛事时间/);
  assert.match(html, /活跃骑手数/);
  assert.match(html, /已提交作品数/);
  assert.match(html, /当前进度/);
  assert.match(html, /进入赛事页/);
});

test("home gallery uses readable Chinese labels and CTAs", () => {
  const html = renderToStaticMarkup(
    <HomeGallery canManage={false} canRide={false} model={model} />,
  );

  assert.match(html, /最新赛果/);
  assert.match(html, /精选作品/);
  assert.match(html, /优秀骑手/);
  assert.match(html, /合作入口/);
  assert.match(html, /往届赛事/);
  assert.match(html, /骑手注册 \/ 报名 \/ 办赛 \/ 合作/);
  assert.match(html, /骑手注册 \/ 登录/);
  assert.match(html, /查看赛事报名页/);
  assert.match(html, /进入赛事页/);
  assert.doesNotMatch(html, /鏆|杩|浣|璧|鍚|鎴|寰|绮/);
});
