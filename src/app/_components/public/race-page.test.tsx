import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RacePageView } from "./race-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return {
    id: "race_active",
    keywords: ["sort", "agent"],
    phase: "active",
    raceEnd: new Date("2026-06-20T12:00:00Z"),
    raceStart: new Date("2026-06-19T12:00:00Z"),
    signupEnd: new Date("2026-06-19T11:00:00Z"),
    signupStart: new Date("2026-06-18T11:00:00Z"),
    summary: "进行中的赛事概览",
    taskDescription: "完成公开排序挑战。",
    taskPackageLabel: "sorting-package",
    teams: [],
    title: "Sorting Challenge",
    trackId: "track-alpha",
    evaluationNotes: "以公开规则为准。",
    ...overrides,
  } as unknown as RaceListItem;
}

test("race page uses Chinese public entry and next-step labels", () => {
  const html = renderToStaticMarkup(
    <RacePageView
      race={buildRace()}
      raceSlug="race_active--sorting-challenge"
    />,
  );

  assert.match(html, /公开入口/);
  assert.match(html, /进入实况大厅/);
  assert.match(html, /查看作品/);
  assert.match(html, /查看赛果/);
  assert.match(html, /查看复盘/);
  assert.match(html, /下一步入口/);
  assert.match(html, /查看合作/);
  assert.match(html, /返回赛事列表/);
  assert.doesNotMatch(html, /Public Entry/);
  assert.doesNotMatch(html, /Live Hall/);
  assert.doesNotMatch(html, /Works/);
  assert.doesNotMatch(html, /Results/);
  assert.doesNotMatch(html, /Review/);
  assert.doesNotMatch(html, /Next Step/);
});

test("race page explains login-before-registration during signup phases", () => {
  const html = renderToStaticMarkup(
    <RacePageView
      race={buildRace({ phase: "registration" })}
      raceSlug="race_active--sorting-challenge"
    />,
  );

  assert.match(html, /进入报名页面/);
  assert.match(html, /\/races\/race_active--sorting-challenge\/register/);
  assert.match(html, /先登录或注册骑手账号，再进入该赛事完成正式报名/);
});
