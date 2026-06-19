import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { WorksPageView } from "./works-page";
import type { RaceListItem } from "@/lib/services/races";

function buildRace(overrides?: Partial<RaceListItem>): RaceListItem {
  return {
    id: "race_finished",
    title: "Finished Race",
    registrations: [],
    teams: [],
    highlights: [],
    ...overrides,
  } as unknown as RaceListItem;
}

test("renders public work cards from registration-backed Work entities", () => {
  const html = renderToStaticMarkup(
    <WorksPageView
      race={buildRace({
        registrations: [
          {
            id: "reg_1",
            userId: "rider_1",
            user: { id: "rider_1", username: "alice" },
            awards: [{ awardName: "Best Overall", rank: 1 }],
            work: {
              id: "work_1",
              title: "Render Rocket",
              summary: "An asset-backed work summary.",
            },
          } as RaceListItem["registrations"][number],
        ],
        teams: [
          {
            id: "team_1",
            captain: { id: "rider_1", username: "alice" },
            name: "Legacy Team Name",
          } as RaceListItem["teams"][number],
        ],
      })}
    />,
  );

  assert.match(html, /Render Rocket/);
  assert.match(html, /alice/);
  assert.match(html, /An asset-backed work summary\./);
  assert.match(html, /\/works\/race_finished__work_1--render-rocket/);
});

test("does not fall back to legacy highlights when no Work entity exists", () => {
  const html = renderToStaticMarkup(
    <WorksPageView
      race={buildRace({
        highlights: [
          {
            id: "highlight_1",
            teamId: "team_1",
            team: { id: "team_1", name: "Legacy Highlight Name" },
            excerpt: "Legacy-only excerpt.",
          } as RaceListItem["highlights"][number],
        ],
      })}
    />,
  );

  assert.match(html, /暂无已发布的公开作品。/);
  assert.doesNotMatch(html, /Legacy Highlight Name/);
  assert.doesNotMatch(html, /Legacy-only excerpt\./);
});
