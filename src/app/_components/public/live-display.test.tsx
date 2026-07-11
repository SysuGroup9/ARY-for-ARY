import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LiveDisplayView } from "./live-display";

test("live display renders a dedicated live riding board with screen-focused metrics", () => {
  const html = renderToStaticMarkup(
    <LiveDisplayView
      jumbotronPreview={{
        fallbackReason: null,
        snapshot: null,
        source: "stable",
        trackProfile: null,
      }}
      race={{
        announcements: [
          {
            body: "Final review starts at 18:00.",
            id: "announcement_latest",
            publishedAt: new Date("2026-07-11T12:00:00Z"),
            title: "Stage Notice",
            visibility: "PUBLIC",
          },
        ],
        phase: "active",
        projections: [
          {
            id: "proj_progress",
            payloadJson: JSON.stringify({
              activeConnections: 21,
              activeRegistrations: 27,
              activeSessions: 188,
              raceId: "race_active",
              totalRegistrations: 32,
            }),
            type: "RACE_PROGRESS",
          },
          {
            id: "proj_risk",
            payloadJson: JSON.stringify([
              { aggregateIngestionStatus: "FAILED", registrationId: "reg_1" },
              { aggregateIngestionStatus: "FAILED", registrationId: "reg_2" },
            ]),
            type: "RISK",
          },
          {
            id: "proj_cost",
            payloadJson: JSON.stringify([
              { registrationId: "reg_1", tokenCost: 1200 },
              { registrationId: "reg_2", tokenCost: 800 },
            ]),
            type: "COST",
          },
          {
            id: "proj_leaderboard",
            payloadJson: JSON.stringify([
              { entryId: "reg_1", rank: 1, progressPercent: 94, username: "alice" },
              { entryId: "reg_2", rank: 2, progressPercent: 88, username: "bob" },
            ]),
            type: "CURRENT_LEADERBOARD",
          },
          {
            id: "proj_stream",
            payloadJson: JSON.stringify({
              items: [
                {
                  createdAt: "2026-07-11T12:00:00.000Z",
                  summary: "Alice entered cost watch.",
                  type: "risk",
                  username: "alice",
                },
              ],
              raceId: "race_active",
            }),
            type: "EVENT_STREAM_READ_MODEL",
          },
        ],
        raceEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
        registrations: [],
        title: "Sorting Challenge",
      } as never}
      raceSlug="race_active--sorting-challenge"
    />,
  );

  assert.match(html, /Live Riding Board/);
  assert.match(html, /27/);
  assert.match(html, /188/);
  assert.match(html, /风险数/);
  assert.match(html, /2/);
  assert.match(html, /Stage Notice/);
  assert.match(html, /Final review starts at 18:00\./);
  assert.match(html, /Alice entered cost watch\./);
});

test("live display keeps stable and static fallback hints visible", () => {
  const stableHtml = renderToStaticMarkup(
    <LiveDisplayView
      jumbotronPreview={{
        fallbackReason: "screen_display_stable_projection",
        snapshot: null,
        source: "stable",
        trackProfile: null,
      }}
      race={{
        announcements: [],
        phase: "active",
        projections: [],
        raceEnd: new Date(Date.now() + 60 * 60 * 1000),
        registrations: [],
        title: "Sorting Challenge",
      } as never}
      raceSlug="race_active--sorting-challenge"
    />,
  );
  const staticHtml = renderToStaticMarkup(
    <LiveDisplayView
      jumbotronPreview={{
        fallbackReason: "projection_rebuild_failed",
        snapshot: null,
        source: "static",
        trackProfile: null,
      }}
      race={{
        announcements: [],
        phase: "active",
        projections: [],
        raceEnd: new Date(Date.now() + 60 * 60 * 1000),
        registrations: [],
        title: "Sorting Challenge",
      } as never}
      raceSlug="race_active--sorting-challenge"
    />,
  );

  assert.match(stableHtml, /稳定快照 fallback/);
  assert.match(staticHtml, /静态展示 fallback/);
});
