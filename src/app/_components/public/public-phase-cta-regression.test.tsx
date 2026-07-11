import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeGallery } from "./home-gallery";
import { RacesIndexPageView } from "./races-index-page";
import type { ReturnTypeOfBuildPublicSiteModel } from "@/lib/public-site-types";

const model: ReturnTypeOfBuildPublicSiteModel = {
  featuredRaces: [
    {
      activeRiderCount: 18,
      currentProgressPercent: 72,
      id: "race_running",
      phase: "running",
      raceEnd: new Date("2026-06-20T12:00:00Z"),
      raceStart: new Date("2026-06-19T12:00:00Z"),
      slug: "race_running--sorting-challenge",
      summary: "进行中的公开赛事。",
      teamCount: 18,
      title: "Running Race",
      workCount: 6,
    },
    {
      activeRiderCount: 24,
      currentProgressPercent: 100,
      id: "race_judging",
      phase: "judging",
      raceEnd: new Date("2026-06-18T12:00:00Z"),
      raceStart: new Date("2026-06-17T12:00:00Z"),
      slug: "race_judging--media-ops-agent",
      summary: "进入评审阶段的赛事。",
      teamCount: 24,
      title: "Judging Race",
      workCount: 24,
    },
  ],
  featuredRiders: [],
  featuredWorks: [],
  latestResults: [],
  liveRaces: [
    {
      activeRiderCount: 18,
      currentProgressPercent: 72,
      id: "race_running",
      phase: "running",
      raceEnd: new Date("2026-06-20T12:00:00Z"),
      raceStart: new Date("2026-06-19T12:00:00Z"),
      slug: "race_running--sorting-challenge",
      summary: "进行中的公开赛事。",
      teamCount: 18,
      title: "Running Race",
      workCount: 6,
    },
  ],
  pastRaces: [],
};

test("home gallery uses live-hall CTA for running races and works CTA for judging races", () => {
  const html = renderToStaticMarkup(
    <HomeGallery canManage={false} canRide={false} model={model} />,
  );

  assert.match(html, /href="\/races\/race_running--sorting-challenge\/live"/);
  assert.match(html, /进入实况大厅/);
  assert.match(html, /比赛中/);
  assert.match(html, /href="\/races\/race_judging--media-ops-agent\/works"/);
  assert.match(html, /查看作品/);
  assert.match(html, /评审中/);
});

test("races index uses phase-aware CTA targets for ongoing races", () => {
  const html = renderToStaticMarkup(<RacesIndexPageView model={model} />);

  assert.match(html, /href="\/races\/race_running--sorting-challenge\/live"/);
  assert.match(html, /href="\/races\/race_judging--media-ops-agent\/works"/);
  assert.match(html, /进行中/);
  assert.match(html, /比赛中/);
  assert.match(html, /评审中/);
});
