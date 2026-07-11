import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RiderProfilePageView } from "./rider-profile-page";

function renderRiderProfile(
  overrides?: Partial<Parameters<typeof RiderProfilePageView>[0]>,
) {
  return renderToStaticMarkup(
    <RiderProfilePageView
      featuredRaceTitle="Performance Marathon"
      featuredWorkTitle="Render Rocket"
      judgeComments={[
        {
          raceTitle: "Performance Marathon",
          summary: "Judge summary for Render Rocket.",
        },
      ]}
      orgLabel="ARY"
      performanceSummary={{
        averageProgressPercent: 72,
        riskCount: 1,
        totalTokens: 4200,
      }}
      publicWorkLinks={[
        {
          href: "/works/race_finished__work_b--render-rocket",
          title: "Render Rocket",
        },
      ]}
      raceCount={2}
      raceRecords={[
        {
          awardNames: ["Best Overall"],
          awardScore: 1,
          comment: "Published review summary excerpt.",
          evidenceCount: 3,
          phase: "finished",
          raceId: "race_finished",
          raceSlug: "race_finished--performance-marathon",
          raceTitle: "Performance Marathon",
          workTitle: "Render Rocket",
        },
      ]}
      reportSummaries={["Published rider report summary."]}
      skillTags={["Cost Control", "Risk Recovery", "Retrospective"]}
      username="rider_bob"
      workCount={1}
      {...overrides}
    />,
  );
}

test("renders rider profile with skills, performance summary, judge comments, and work links", () => {
  const html = renderRiderProfile();

  assert.match(html, /rider_bob/);
  assert.match(html, /Judge summary for Render Rocket\./);
  assert.match(html, /Render Rocket/);
  assert.match(html, /4200/);
  assert.match(html, /72%/);
});

test("renders empty states when there are no public works, skill tags, or judge comments", () => {
  const html = renderRiderProfile({
    judgeComments: [],
    performanceSummary: {
      averageProgressPercent: 0,
      riskCount: 0,
      totalTokens: 0,
    },
    publicWorkLinks: [],
    raceRecords: [],
    reportSummaries: [],
    skillTags: [],
    workCount: 0,
  });

  assert.match(html, /0/);
  assert.doesNotMatch(html, /Judge summary for Render Rocket\./);
  assert.doesNotMatch(html, /Published rider report summary\./);
});

test("public rider profile no longer renders rider report summaries as a public module", () => {
  const html = renderRiderProfile({
    reportSummaries: ["private rider report should stay hidden"],
  });

  assert.doesNotMatch(html, /private rider report should stay hidden/);
  assert.match(html, /Published review summary excerpt\./);
});
