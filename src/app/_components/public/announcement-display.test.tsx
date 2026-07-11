import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AnnouncementDisplayView } from "./announcement-display";

test("announcement display renders the latest published announcement", () => {
  const html = renderToStaticMarkup(
    <AnnouncementDisplayView
      announcement={{
        body: "Warm up at Gate B at 13:30.",
        publishedAt: new Date("2026-07-11T13:30:00Z"),
        title: "Warmup Schedule",
      }}
      race={{
        phase: "active",
        title: "Sorting Challenge",
      }}
      raceSlug="race_active--sorting-challenge"
    />,
  );

  assert.match(html, /Warmup Schedule/);
  assert.match(html, /Warm up at Gate B at 13:30\./);
  assert.match(html, /Sorting Challenge/);
  assert.match(html, /2026-07-11T13:30:00.000Z/);
  assert.match(html, /返回赛事页/);
});

test("announcement display falls back when no published announcement exists", () => {
  const html = renderToStaticMarkup(
    <AnnouncementDisplayView
      announcement={null}
      race={{
        organizerComment: "Use the static fallback notice.",
        phase: "active",
        summary: "Fallback summary",
        title: "Sorting Challenge",
      }}
      raceSlug="race_active--sorting-challenge"
    />,
  );

  assert.match(html, /当前还没有已发布公告/);
  assert.match(html, /Use the static fallback notice\./);
});
