import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ScreenConsolePageView } from "./screen-console-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return {
    announcements: [],
    id: "race_active",
    phase: "active",
    raceEnd: new Date("2026-06-20T12:00:00Z"),
    raceStart: new Date("2026-06-19T12:00:00Z"),
    screenDisplay: {
      fallbackMode: "auto",
      mode: "announcement",
      theme: "arena-night",
    },
    summary: "进行中的赛事。",
    title: "Sorting Challenge",
    ...overrides,
  } as unknown as RaceListItem;
}

test("screen console shows current ScreenDisplay state and control actions", () => {
  const html = renderToStaticMarkup(
    <ScreenConsolePageView
      mode="announcement"
      race={buildRace({
        announcements: [
          {
            body: "Warm up at Gate B.",
            id: "announcement_latest",
            publishedAt: new Date("2026-07-11T12:00:00Z"),
            title: "Latest Notice",
            visibility: "PUBLIC",
          },
        ] as never,
      })}
      raceSlug="race_active--sorting-challenge"
      screenDisplay={{
        fallbackMode: "auto",
        mode: "announcement",
        theme: "arena-night",
      }}
    />,
  );

  assert.match(html, /当前 ScreenDisplay/);
  assert.match(html, /当前公开播放入口/);
  assert.match(html, /全屏展示当前输出/);
  assert.match(html, /arena-night/);
  assert.match(html, /\/screen\/race_active--sorting-challenge/);
  assert.match(html, /切到大屏/);
  assert.match(html, /切到实况/);
  assert.match(html, /切到作品/);
  assert.match(html, /切到稳定 Projection fallback/);
  assert.match(html, /切到静态公告 fallback/);
  assert.match(html, /保存 Theme/);
  assert.match(html, /name="theme"/);
  assert.match(html, /比赛中/);
  assert.doesNotMatch(html, />active</);
});

test("screen console non-jumbotron modes expose an inline output preview", () => {
  const html = renderToStaticMarkup(
    <ScreenConsolePageView
      mode="billboard"
      race={buildRace()}
      raceSlug="race_active--sorting-challenge"
      screenDisplay={{
        fallbackMode: "auto",
        mode: "billboard",
        theme: "arena-night",
      }}
    />,
  );

  assert.match(html, /当前输出预览/);
  assert.match(html, /<iframe/);
  assert.match(html, /src="\/screen\/race_active--sorting-challenge\/billboard"/);
});

test("screen console calibration mode embeds the calibration workspace instead of placeholder-only copy", () => {
  const html = renderToStaticMarkup(
    <ScreenConsolePageView
      mode="calibration"
      race={buildRace()}
      raceSlug="race_active--sorting-challenge"
      screenDisplay={{
        fallbackMode: "auto",
        mode: "jumbotron",
        theme: "arena-night",
      }}
    />,
  );

  assert.match(html, /当前模式：主题 \/ 校准/);
  assert.match(html, /校准工作区/);
  assert.match(html, /导入底图/);
  assert.match(html, /导出当前 Profile/);
  assert.match(html, /保存到当前赛事/);
  assert.match(html, /全屏展示当前输出/);
  assert.doesNotMatch(html, /后续再完全并入大屏控制台/);
});
