import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPublicSiteModel,
  buildRaceSlug,
  buildRiderSlug,
  buildWorkSlug,
  getRacePrimaryCta,
  getRaceIdFromSlug,
  getRiderIdFromSlug,
  getWorkPartsFromSlug,
  groupPublicRacesByPhase,
  sortFeaturedWorks,
} from "./public-site";

const sampleRaces = [
  {
    id: "race_active",
    title: "Sorting Challenge",
    summary: "active race",
    phase: "active",
    raceStart: new Date("2026-06-18T18:43:00.000Z"),
    raceEnd: new Date("2026-06-20T21:43:00.000Z"),
    teams: [
      {
        id: "team_a",
        name: "Fast Sort Squad",
        captain: { id: "rider_01", username: "rider_alice" },
      },
    ],
    registrations: [
      {
        id: "reg_a",
        userId: "rider_01",
        user: { id: "rider_01", username: "rider_alice" },
        raceProject: {
          id: "project_a",
          aggregateIngestionStatus: "ACTIVE",
          caConnections: [{ sessions: [{ id: "session_a" }] }],
        },
        awards: [],
        evidences: [],
        work: null,
      },
    ],
    highlights: [],
    teamArchives: [
      {
        id: "archive_a",
        teamId: "team_a",
        team: { id: "team_a", name: "Fast Sort Squad" },
        agentType: "CLAUDE",
        totalScore: 92.5,
      },
    ],
    leaderboardEntries: [
      {
        id: "leader_a",
        teamId: "team_a",
        team: { id: "team_a", name: "Fast Sort Squad" },
        totalScore: 92.5,
        rank: 1,
        agentType: "CLAUDE",
      },
    ],
  },
  {
    id: "race_finished",
    title: "Performance Marathon",
    summary: "finished race",
    phase: "finished",
    raceStart: new Date("2026-06-17T19:43:00.000Z"),
    raceEnd: new Date("2026-06-18T19:43:00.000Z"),
    teams: [
      {
        id: "team_b",
        name: "Render Rocket",
        captain: { id: "rider_02", username: "rider_bob" },
      },
    ],
    registrations: [
      {
        id: "reg_b",
        userId: "rider_02",
        user: { id: "rider_02", username: "rider_bob" },
        raceProject: {
          id: "project_b",
          aggregateIngestionStatus: "ACTIVE",
          caConnections: [{ sessions: [{ id: "session_b" }] }],
        },
        awards: [
          { awardName: "Best Overall", rank: 1 },
          { awardName: "Best Cost Control", rank: 1 },
        ],
        evidences: [{ id: "ev_b", summary: "session summary" }],
        work: {
          id: "work_b",
          title: "Render Rocket",
          summary: "asset-backed work summary",
        },
      },
    ],
    highlights: [
      {
        id: "highlight_b",
        registrationId: "reg_b",
        teamId: "team_b",
        team: { id: "team_b", name: "Legacy Highlight Name" },
        agentType: "CLAUDE",
        score: 94.1,
        excerpt: "legacy highlight excerpt",
        codeSnippet: "// legacy code",
      },
    ],
    teamArchives: [
      {
        id: "archive_b",
        teamId: "team_b",
        team: { id: "team_b", name: "Render Rocket" },
        agentType: "CLAUDE",
        totalScore: 94.1,
      },
    ],
    leaderboardEntries: [
      {
        id: "leader_b",
        registrationId: "reg_b",
        teamId: "team_b",
        team: { id: "team_b", name: "Render Rocket" },
        totalScore: 94.1,
        rank: 1,
        agentType: "CLAUDE",
      },
    ],
  },
] as const;

test("builds stable race, work, and rider slugs", () => {
  const raceSlug = buildRaceSlug("race_active", "Sorting Challenge");
  const workSlug = buildWorkSlug("race_finished", "work_b", "Render Rocket");
  const riderSlug = buildRiderSlug("rider_01", "rider_alice");

  assert.equal(getRaceIdFromSlug(raceSlug), "race_active");
  assert.deepEqual(getWorkPartsFromSlug(workSlug), {
    raceId: "race_finished",
    workId: "work_b",
  });
  assert.equal(getRiderIdFromSlug(riderSlug), "rider_01");
});

test("builds a public site model that prefers work and registration data over legacy highlights", () => {
  const model = buildPublicSiteModel(sampleRaces);

  assert.equal(model.featuredRaces.length, 2);
  assert.equal(model.featuredRaces[0].id, "race_active");
  assert.equal(model.latestResults[0].id, "race_finished");
  assert.equal(model.featuredWorks.length, 1);
  assert.equal(model.featuredWorks[0].title, "Render Rocket");
  assert.equal(model.featuredWorks[0].excerpt, "asset-backed work summary");
  assert.equal(model.featuredRiders.length, 2);
  assert.equal(model.featuredRiders[0].id, "rider_02");
  assert.equal(model.liveRaces.length, 1);
  assert.equal(model.liveRaces[0].id, "race_active");
  assert.equal(model.featuredRaces[0].activeRiderCount, 1);
  assert.equal(model.featuredRaces[0].currentProgressPercent, 100);
  assert.equal(
    model.featuredWorks[0].id,
    buildWorkSlug("race_finished", "work_b", "Render Rocket"),
  );
  assert.equal(
    model.featuredRiders.find((item) => item.id === "rider_02")?.publicWorkLinks[0]?.href,
    `/works/${buildWorkSlug("race_finished", "work_b", "Render Rocket")}`,
  );
});

test("uses CURRENT_LEADERBOARD projection progress when legacy leaderboard rows are absent", () => {
  const model = buildPublicSiteModel([
    {
      ...sampleRaces[0],
      leaderboardEntries: [],
      projections: [
        {
          id: "proj_current",
          type: "CURRENT_LEADERBOARD",
          payloadJson: JSON.stringify([
            {
              entryId: "reg_a",
              progressPercent: 80,
              rank: 1,
              username: "rider_alice",
            },
            {
              entryId: "reg_b",
              progressPercent: 40,
              rank: 2,
              username: "rider_bob",
            },
          ]),
        },
      ],
    },
  ]);

  assert.equal(model.featuredRaces[0]?.currentProgressPercent, 60);
});

test("does not treat legacy highlights as public work assets when no Work entity exists", () => {
  const model = buildPublicSiteModel([
    {
      ...sampleRaces[1],
      registrations: [
        {
          ...sampleRaces[1].registrations[0],
          work: null,
        },
      ],
    },
  ]);

  assert.equal(model.featuredWorks.length, 0);
  assert.equal(model.featuredRiders[0]?.workCount ?? 0, 0);
});

test("does not synthesize featured works from highlight-only races", () => {
  const model = buildPublicSiteModel([
    {
      ...sampleRaces[1],
      registrations: [],
    },
  ]);

  assert.equal(model.featuredWorks.length, 0);
});

test("groups public races by phase for the races index page", () => {
  const model = buildPublicSiteModel([
    ...sampleRaces,
    {
      ...sampleRaces[0],
      id: "race_running",
      title: "Running Race",
      summary: "running race",
      phase: "running",
    },
    {
      ...sampleRaces[0],
      id: "race_submitting",
      title: "Submitting Race",
      summary: "submitting race",
      phase: "submitting",
    },
    {
      ...sampleRaces[0],
      id: "race_judging",
      title: "Judging Race",
      summary: "judging race",
      phase: "judging",
    },
    {
      ...sampleRaces[0],
      id: "race_published",
      title: "Published Preview",
      summary: "published race",
      phase: "published",
    },
  ]);
  const grouped = groupPublicRacesByPhase(model.featuredRaces);

  assert.equal(grouped.active.length, 2);
  assert.equal(grouped.frozen.length, 2);
  assert.equal(grouped.registration.length, 0);
  assert.equal(grouped.preparation.length, 1);
  assert.equal(grouped.finished.length, 1);
  assert.equal(grouped.active[0].id, "race_active");
  assert.equal(grouped.active.some((race) => race.id === "race_running"), true);
  assert.equal(grouped.frozen.some((race) => race.id === "race_submitting"), true);
  assert.equal(grouped.frozen.some((race) => race.id === "race_judging"), true);
  assert.equal(grouped.preparation[0].id, "race_published");
});

test("sorts featured works by score and title", () => {
  const works = sortFeaturedWorks(
    [
      {
        id: "work_c",
        raceId: "r1",
        raceSlug: "r1--race",
        title: "C Work",
        author: "charlie",
        excerpt: "c",
        score: 50,
        agentType: "CLAUDE",
      },
      {
        id: "work_a",
        raceId: "r1",
        raceSlug: "r1--race",
        title: "A Work",
        author: "alice",
        excerpt: "a",
        score: 90,
        agentType: "OPENAI",
      },
    ],
    "score",
  );

  assert.equal(works[0].id, "work_a");

  const byTitle = sortFeaturedWorks(
    [
      {
        id: "work_c",
        raceId: "r1",
        raceSlug: "r1--race",
        title: "C Work",
        author: "charlie",
        excerpt: "c",
        score: 50,
        agentType: "CLAUDE",
      },
      {
        id: "work_a",
        raceId: "r1",
        raceSlug: "r1--race",
        title: "A Work",
        author: "alice",
        excerpt: "a",
        score: 90,
        agentType: "OPENAI",
      },
    ],
    "title",
  );

  assert.equal(byTitle[0].id, "work_a");
});

test("maps race phase to public home CTA", () => {
  assert.deepEqual(
    getRacePrimaryCta({ slug: "race_signup--test", phase: "registration" }),
    { href: "/races/race_signup--test/register", label: "立即报名" },
  );
  assert.deepEqual(
    getRacePrimaryCta({ slug: "race_preview--test", phase: "published" }),
    { href: "/races/race_preview--test", label: "查看赛题" },
  );
  assert.deepEqual(
    getRacePrimaryCta({ slug: "race_running--test", phase: "running" }),
    { href: "/races/race_running--test/live", label: "进入实况大厅" },
  );
  assert.deepEqual(
    getRacePrimaryCta({ slug: "race_active--test", phase: "active" }),
    { href: "/races/race_active--test/live", label: "进入实况大厅" },
  );
  assert.deepEqual(
    getRacePrimaryCta({ slug: "race_submitting--test", phase: "submitting" }),
    { href: "/races/race_submitting--test/works", label: "查看作品" },
  );
  assert.deepEqual(
    getRacePrimaryCta({ slug: "race_judging--test", phase: "judging" }),
    { href: "/races/race_judging--test/works", label: "查看作品" },
  );
  assert.deepEqual(
    getRacePrimaryCta({ slug: "race_finished--test", phase: "finished" }),
    { href: "/races/race_finished--test/results", label: "查看赛果" },
  );
  assert.deepEqual(
    getRacePrimaryCta({ slug: "race_completed--test", phase: "completed" }),
    { href: "/races/race_completed--test/results", label: "查看赛果" },
  );
  assert.deepEqual(
    getRacePrimaryCta({ slug: "race_archived--test", phase: "archived" }),
    { href: "/races/race_archived--test/results", label: "查看赛果" },
  );
});

test("treats running races as live-race public assets under the 8-state lifecycle", () => {
  const model = buildPublicSiteModel([
    {
      ...sampleRaces[0],
      id: "race_running",
      title: "Running Race",
      phase: "running",
      summary: "running race",
    },
  ]);

  assert.equal(model.liveRaces.length, 1);
  assert.equal(model.liveRaces[0]?.id, "race_running");
});

test("treats archived races as past-race public assets", () => {
  const model = buildPublicSiteModel([
    sampleRaces[0],
    {
      ...sampleRaces[1],
      id: "race_archived",
      phase: "archived",
      summary: "archived race",
      title: "Archived Marathon",
    },
  ]);

  assert.equal(model.latestResults[0]?.id, "race_archived");
  assert.equal(model.pastRaces[0]?.id, "race_archived");
  assert.equal(model.featuredWorks[0]?.raceId, "race_archived");

  const grouped = groupPublicRacesByPhase(model.featuredRaces);
  assert.equal(grouped.finished.some((race) => race.id === "race_archived"), true);
});
