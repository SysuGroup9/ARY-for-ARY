import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AnnouncementDisplayView } from "./announcement-display";
import { BillboardDisplayView } from "./billboard-display";
import { LeaderboardDisplayView } from "./leaderboard-display";
import { LiveDisplayView } from "./live-display";
import { LiveHallView } from "./live-hall";
import { PublicHomeHero } from "./public-home-hero";
import { RacePageView } from "./race-page";

test("public and screen displays render localized phase labels instead of raw phase keys", () => {
  const heroHtml = renderToStaticMarkup(
    <PublicHomeHero
      model={{
        featuredRaces: [
          {
            activeRiderCount: 8,
            currentProgressPercent: 64,
            id: "race_running",
            phase: "running",
            raceEnd: new Date("2026-06-20T12:00:00Z"),
            raceStart: new Date("2026-06-19T12:00:00Z"),
            slug: "race_running--sorting-challenge",
            summary: "一场进行中的公开赛事。",
            teamCount: 8,
            title: "Sorting Challenge",
            workCount: 4,
          },
        ],
        featuredRiders: [],
        featuredWorks: [],
        latestResults: [],
        liveRaces: [],
        pastRaces: [],
      }}
    />,
  );
  const racePageHtml = renderToStaticMarkup(
    <RacePageView
      race={
        {
          evaluationNotes: "以公开规则为准。",
          id: "race_judging",
          keywords: ["sort"],
          phase: "judging",
          raceEnd: new Date("2026-06-20T12:00:00Z"),
          raceStart: new Date("2026-06-19T12:00:00Z"),
          signupEnd: new Date("2026-06-18T12:00:00Z"),
          signupStart: new Date("2026-06-17T12:00:00Z"),
          summary: "进入评审阶段的赛事。",
          taskDescription: "完成排序挑战。",
          taskPackageLabel: "sorting.zip",
          teams: [],
          title: "Sorting Challenge",
          trackId: "track-alpha",
        } as never
      }
      raceSlug="race_judging--sorting-challenge"
    />,
  );
  const liveHallHtml = renderToStaticMarkup(
    <LiveHallView
      race={
        {
          announcements: [],
          id: "race_running",
          phase: "running",
          projections: [],
          registrations: [],
          title: "Sorting Challenge",
        } as never
      }
    />,
  );
  const liveDisplayHtml = renderToStaticMarkup(
    <LiveDisplayView
      race={
        {
          announcements: [],
          phase: "judging",
          projections: [],
          raceEnd: new Date(Date.now() + 60 * 60 * 1000),
          registrations: [],
          title: "Sorting Challenge",
        } as never
      }
    />,
  );
  const billboardHtml = renderToStaticMarkup(
    <BillboardDisplayView
      awards={[]}
      latestAnnouncement={null}
      race={{
        phase: "archived",
        registrations: [],
        title: "Sorting Challenge",
      }}
      riskCount={0}
      ridingSkillHighlights={[]}
      screenFeedItems={[]}
    />,
  );
  const leaderboardHtml = renderToStaticMarkup(
    <LeaderboardDisplayView
      awards={[]}
      race={{
        phase: "completed",
        title: "Sorting Challenge",
      }}
      raceReport={null}
      ridingSkillHighlights={[]}
    />,
  );
  const announcementHtml = renderToStaticMarkup(
    <AnnouncementDisplayView
      announcement={{
        body: "Warm up at Gate B at 13:30.",
        publishedAt: new Date("2026-07-11T13:30:00Z"),
        title: "Warmup Schedule",
      }}
      race={{
        phase: "registration",
        title: "Sorting Challenge",
      }}
    />,
  );

  assert.match(heroHtml, /比赛中/);
  assert.match(racePageHtml, /评审中/);
  assert.match(liveHallHtml, /比赛中/);
  assert.match(liveDisplayHtml, /评审中/);
  assert.match(billboardHtml, /已归档/);
  assert.match(leaderboardHtml, /已结束/);
  assert.match(announcementHtml, /报名中/);

  assert.doesNotMatch(heroHtml, />running</);
  assert.doesNotMatch(racePageHtml, />judging</);
  assert.doesNotMatch(liveHallHtml, />running</);
  assert.doesNotMatch(liveDisplayHtml, />judging</);
});
