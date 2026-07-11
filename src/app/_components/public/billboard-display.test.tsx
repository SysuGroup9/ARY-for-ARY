import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { BillboardDisplayView } from "./billboard-display";

test("billboard display shows race state, latest announcement, leaderboard summary, and works summary", () => {
  const html = renderToStaticMarkup(
    <BillboardDisplayView
      awards={[
        {
          awardName: "Best Overall",
          rank: 1,
          registration: {
            user: {
              username: "rider_alice",
            },
          },
          work: {
            title: "Orbit Runner",
          },
        },
        {
          awardName: "Best Work",
          rank: 1,
          registration: {
            user: {
              username: "rider_bob",
            },
          },
          work: {
            title: "Signal Map",
          },
        },
      ]}
      latestAnnouncement={{
        body: "Final review starts at 18:00.",
        title: "Stage Notice",
      }}
      race={{
        phase: "active",
        registrations: [{ id: "reg_1", work: { id: "work_1" } }, { id: "reg_2", work: null }],
        title: "Sorting Challenge",
      }}
      screenFeedItems={[
        {
          summary: "Stage Notice is now on the big screen.",
          type: "announcement",
        },
        {
          summary: "Current process leaderboard is available.",
          type: "current_leaderboard_projection",
        },
        {
          summary: "Alice completed routing with 22 tool calls.",
          type: "session_summary",
        },
        {
          summary: "Published final leaderboard is available.",
          type: "leaderboard_read_model",
        },
        {
          summary: "4 public works are available for showcase.",
          type: "works",
        },
      ]}
      ridingSkillHighlights={[
        {
          label: "成本控制",
          riderName: "rider_alice",
        },
      ]}
      riskCount={2}
    />,
  );

  assert.match(html, /Sorting Challenge/);
  assert.match(html, /比赛中/);
  assert.match(html, /Stage Notice/);
  assert.match(html, /Final review starts at 18:00\./);
  assert.match(html, /Best Overall/);
  assert.match(html, /Orbit Runner/);
  assert.match(html, /Signal Map/);
  assert.match(html, /公开作品/);
  assert.match(html, /风险数/);
  assert.match(html, /成本控制/);
  assert.match(html, /Screen Feed/);
  assert.match(html, /公告/);
  assert.match(html, /过程榜/);
  assert.match(html, /Session 摘要/);
  assert.match(html, /最终榜/);
  assert.match(html, /作品/);
  assert.match(html, /Stage Notice is now on the big screen\./);
  assert.match(html, /Current process leaderboard is available\./);
  assert.match(html, /Alice completed routing with 22 tool calls\./);
  assert.match(html, /Published final leaderboard is available\./);
  assert.match(html, /4 public works are available for showcase\./);
});
