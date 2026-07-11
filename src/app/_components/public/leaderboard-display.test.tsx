import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { LeaderboardDisplayView } from "./leaderboard-display";

test("leaderboard display renders final award groups, winning works, and riding highlights without process copy", () => {
  const html = renderToStaticMarkup(
    <LeaderboardDisplayView
      awards={[
        {
          awardName: "Best Overall",
          decisionReason: "final overall winner",
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
          decisionReason: "final work winner",
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
      race={{
        phase: "completed",
        title: "Sorting Challenge",
      }}
      raceReport={{
        summary: "2 registrations / 2 works / 2 published awards",
        title: "Sorting Challenge Race Report",
      }}
      ridingSkillHighlights={[
        {
          label: "成本控制",
          riderName: "rider_alice",
        },
      ]}
    />,
  );

  assert.match(html, /Sorting Challenge/);
  assert.match(html, /Best Overall/);
  assert.match(html, /Best Work/);
  assert.match(html, /Orbit Runner/);
  assert.match(html, /Signal Map/);
  assert.match(html, /成本控制/);
  assert.match(html, /2 registrations \/ 2 works \/ 2 published awards/);
  assert.doesNotMatch(html, /过程榜单/);
  assert.doesNotMatch(html, /Current Leaderboard/);
  assert.doesNotMatch(html, /查看评审总结/);
});
