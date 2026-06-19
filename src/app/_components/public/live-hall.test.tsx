import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LiveHallView } from "./live-hall";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return {
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

  assert.match(html, /No process leaderboard is available yet\./);
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
  assert.match(html, /Event Stream/);
  assert.doesNotMatch(html, /Screen-only announcement\./);
});
