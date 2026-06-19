import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RaceRegisterPageView } from "./race-register-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return {
    id: "race_active",
    keywords: ["sort", "agent"],
    phase: "registration",
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

test("public register page guides anonymous users to login and back", () => {
  const html = renderToStaticMarkup(
    <RaceRegisterPageView
      race={buildRace()}
      raceSlug="race_active--sorting-challenge"
      registration={null}
      sessionUser={null}
    />,
  );

  assert.match(html, /登录 \/ 注册后继续报名/);
  assert.match(html, /returnTo=%2Fraces%2Frace_active--sorting-challenge%2Fregister/);
});

test("public register page shows direct register action for rider users", () => {
  const html = renderToStaticMarkup(
    <RaceRegisterPageView
      race={buildRace()}
      raceSlug="race_active--sorting-challenge"
      registration={null}
      sessionUser={{
        id: "user_1",
        role: "RIDER",
        roles: ["RIDER"],
        username: "alice",
      }}
    />,
  );

  assert.match(html, /提交正式报名/);
  assert.match(html, /报名参赛/);
});

test("public register page shows existing registration state", () => {
  const html = renderToStaticMarkup(
    <RaceRegisterPageView
      race={buildRace()}
      raceSlug="race_active--sorting-challenge"
      registration={{
        status: "APPROVED",
        user: { username: "alice" },
        raceProject: { aggregateIngestionStatus: "ACTIVE" },
      } as never}
      sessionUser={{
        id: "user_1",
        role: "RIDER",
        roles: ["RIDER"],
        username: "alice",
      }}
    />,
  );

  assert.match(html, /你已完成报名/);
  assert.match(html, /进入骑手工作台/);
});

test("public register page still lets previously registered riders enter during active phase", () => {
  const html = renderToStaticMarkup(
    <RaceRegisterPageView
      race={buildRace({ phase: "active" })}
      raceSlug="race_active--sorting-challenge"
      registration={{
        status: "APPROVED",
        user: { username: "alice" },
        raceProject: { aggregateIngestionStatus: "ACTIVE" },
      } as never}
      sessionUser={{
        id: "user_1",
        role: "RIDER",
        roles: ["RIDER"],
        username: "alice",
      }}
    />,
  );

  assert.match(html, /比赛开始前已经报过名/);
  assert.match(html, /进入骑手工作台/);
  assert.doesNotMatch(html, /报名已截止/);
});

test("public register page blocks new registration during active phase", () => {
  const html = renderToStaticMarkup(
    <RaceRegisterPageView
      race={buildRace({ phase: "active" })}
      raceSlug="race_active--sorting-challenge"
      registration={null}
      sessionUser={{
        id: "user_1",
        role: "RIDER",
        roles: ["RIDER"],
        username: "alice",
      }}
    />,
  );

  assert.match(html, /报名已截止/);
  assert.match(html, /赛前已报名的骑手仍可继续进入自己的工作台/);
});
