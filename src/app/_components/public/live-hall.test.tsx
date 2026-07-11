import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LiveHallView } from "./live-hall";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return {
    announcements: [],
    id: "race_active",
    title: "Active Race",
    phase: "active",
    projections: [],
    registrations: [],
    leaderboardEntries: [],
    ...overrides,
  } as unknown as RaceListItem;
}

test("renders process leaderboard rows from CURRENT_LEADERBOARD projection", () => {
  const html = renderToStaticMarkup(
    <LiveHallView
      race={buildRace({
        projections: [
          {
            id: "proj_current",
            type: "CURRENT_LEADERBOARD",
            payloadJson: JSON.stringify([
              {
                entryId: "reg_1",
                rank: 1,
                progressPercent: 82,
                username: "alice",
              },
            ]),
          } as RaceListItem["projections"][number],
        ],
      })}
    />,
  );

  assert.match(html, /alice/);
  assert.match(html, /82%/);
});

test("does not fall back to legacy leaderboard rows when process projection is missing", () => {
  const html = renderToStaticMarkup(
    <LiveHallView
      race={buildRace({
        leaderboardEntries: [
          {
            id: "legacy_1",
            rank: 1,
            totalScore: 999,
            team: { id: "team_1", name: "Legacy Team" },
          } as RaceListItem["leaderboardEntries"][number],
        ],
      })}
    />,
  );

  assert.match(html, /暂时还没有可用的过程榜单。/);
  assert.doesNotMatch(html, /Legacy Team/);
  assert.doesNotMatch(html, /Legacy Leaderboard Rows/);
});

test("renders event stream items from the event-stream read model instead of screen-feed data", () => {
  const html = renderToStaticMarkup(
    <LiveHallView
      race={buildRace({
        projections: [
          {
            id: "proj_event_stream",
            type: "EVENT_STREAM_READ_MODEL",
            payloadJson: JSON.stringify({
              raceId: "race_active",
              items: [
                {
                  createdAt: "2026-06-19T10:05:00.000Z",
                  severity: "warning",
                  summary: "Bob reported an ingestion failure.",
                  type: "risk",
                  username: "bob",
                },
              ],
            }),
          } as RaceListItem["projections"][number],
          {
            id: "proj_screen",
            type: "SCREEN_FEED",
            payloadJson: JSON.stringify({
              raceId: "race_active",
              items: [
                {
                  summary: "Screen-only announcement.",
                  type: "announcement",
                },
              ],
            }),
          } as RaceListItem["projections"][number],
        ],
      })}
    />,
  );

  assert.match(html, /Bob reported an ingestion failure\./);
  assert.match(html, /事件流/);
  assert.doesNotMatch(html, /Screen-only announcement\./);
});

test("uses Chinese live-hall headings and actions for public viewers", () => {
  const html = renderToStaticMarkup(
    <LiveHallView
      race={buildRace()}
      raceSlug="race_active--active-race"
      jumbotronPreview={{ snapshot: null, source: "static", trackProfile: null }}
    />,
  );

  assert.match(html, /实况大厅/);
  assert.match(html, /过程总览/);
  assert.match(html, /过程指标/);
  assert.match(html, /打开大屏/);
  assert.doesNotMatch(html, /打开大屏控制台/);
  assert.doesNotMatch(html, /Live Hall/);
  assert.doesNotMatch(html, /Process Summary/);
  assert.doesNotMatch(html, /Open Jumbotron/);
  assert.doesNotMatch(html, /Open Screen Console/);
});

test("live hall shows a static fallback notice and public links when no stable projection snapshot is available", () => {
  const html = renderToStaticMarkup(
    <LiveHallView
      race={buildRace({
        leaderboardEntries: [
          {
            id: "lb_1",
            rank: 1,
            totalScore: 92,
            team: { id: "team_1", name: "Alpha Work" },
          } as RaceListItem["leaderboardEntries"][number],
        ],
        summary: "当前先展示静态公告。",
      })}
      raceSlug="race_active--active-race"
      jumbotronPreview={{
        fallbackReason: "projection_rebuild_failed",
        snapshot: null,
        source: "static",
        trackProfile: null,
      }}
    />,
  );

  assert.match(html, /静态展示 fallback/);
  assert.match(html, /Projection 当前不可用/);
  assert.match(html, /查看作品/);
  assert.match(html, /查看赛果/);
  assert.match(html, /projection_rebuild_failed/);
});

test("live hall surfaces the latest published announcement card", () => {
  const html = renderToStaticMarkup(
    <LiveHallView
      race={buildRace({
        announcements: [
          {
            body: "Older announcement body.",
            id: "announcement_old",
            publishedAt: new Date("2026-07-11T11:00:00Z"),
            title: "Older Notice",
            visibility: "PUBLIC",
          },
          {
            body: "Latest announcement body.",
            id: "announcement_latest",
            publishedAt: new Date("2026-07-11T12:00:00Z"),
            title: "Latest Notice",
            visibility: "PUBLIC",
          },
        ] as never,
      })}
      raceSlug="race_active--active-race"
    />,
  );

  assert.match(html, /最近公告/);
  assert.match(html, /Latest Notice/);
  assert.match(html, /Latest announcement body\./);
  assert.doesNotMatch(html, /Older announcement body\./);
});
