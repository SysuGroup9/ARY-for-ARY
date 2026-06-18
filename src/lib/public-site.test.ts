import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPublicSiteModel,
  buildRaceSlug,
  buildRiderSlug,
  buildWorkSlug,
  getRacePrimaryCta,
  groupPublicRacesByPhase,
  getRaceIdFromSlug,
  getRiderIdFromSlug,
  getWorkPartsFromSlug,
  sortFeaturedWorks,
} from "./public-site";

const sampleRaces = [
  {
    id: "race_active",
    title: "排序算法挑战赛",
    summary: "active race",
    phase: "active",
    raceStart: new Date("2026-06-18T18:43:00.000Z"),
    raceEnd: new Date("2026-06-20T21:43:00.000Z"),
    teams: [
      {
        id: "team_a",
        name: "极速排序队",
        captain: { id: "rider_01", username: "rider_alice" },
      },
    ],
    highlights: [],
    teamArchives: [
      {
        id: "archive_a",
        teamId: "team_a",
        team: { id: "team_a", name: "极速排序队" },
        agentType: "CLAUDE",
        totalScore: 92.5,
      },
    ],
    leaderboardEntries: [
      {
        id: "leader_a",
        teamId: "team_a",
        team: { id: "team_a", name: "极速排序队" },
        totalScore: 92.5,
        rank: 1,
        agentType: "CLAUDE",
      },
    ],
  },
  {
    id: "race_finished",
    title: "性能优化马拉松",
    summary: "finished race",
    phase: "finished",
    raceStart: new Date("2026-06-17T19:43:00.000Z"),
    raceEnd: new Date("2026-06-18T19:43:00.000Z"),
    teams: [
      {
        id: "team_b",
        name: "渲染超快队",
        captain: { id: "rider_02", username: "rider_bob" },
      },
    ],
    highlights: [
      {
        id: "highlight_b",
        teamId: "team_b",
        team: { id: "team_b", name: "渲染超快队" },
        agentType: "CLAUDE",
        score: 94.1,
        excerpt: "性能优化亮点",
        codeSnippet: "// code",
      },
    ],
    teamArchives: [
      {
        id: "archive_b",
        teamId: "team_b",
        team: { id: "team_b", name: "渲染超快队" },
        agentType: "CLAUDE",
        totalScore: 94.1,
      },
    ],
    leaderboardEntries: [
      {
        id: "leader_b",
        teamId: "team_b",
        team: { id: "team_b", name: "渲染超快队" },
        totalScore: 94.1,
        rank: 1,
        agentType: "CLAUDE",
      },
    ],
  },
] as const;

test("builds stable race, work, and rider slugs", () => {
  const raceSlug = buildRaceSlug("race_active", "排序算法挑战赛");
  const workSlug = buildWorkSlug("race_finished", "team_b", "渲染超快队");
  const riderSlug = buildRiderSlug("rider_01", "rider_alice");

  assert.equal(getRaceIdFromSlug(raceSlug), "race_active");
  assert.deepEqual(getWorkPartsFromSlug(workSlug), {
    raceId: "race_finished",
    teamId: "team_b",
  });
  assert.equal(getRiderIdFromSlug(riderSlug), "rider_01");
});

test("builds a public site model with featured races, latest results, works, and riders", () => {
  const model = buildPublicSiteModel(sampleRaces);

  assert.equal(model.featuredRaces.length, 2);
  assert.equal(model.featuredRaces[0].id, "race_active");
  assert.equal(model.latestResults[0].id, "race_finished");
  assert.equal(model.featuredWorks.length, 1);
  assert.equal(model.featuredWorks[0].title, "渲染超快队");
  assert.equal(model.featuredRiders.length, 2);
  assert.equal(model.featuredRiders[0].id, "rider_02");
  assert.equal(model.liveRaces.length, 1);
  assert.equal(model.liveRaces[0].id, "race_active");
  assert.equal(model.featuredRaces[0].activeRiderCount, 1);
  assert.equal(model.featuredRaces[0].currentProgressPercent, 100);
});

test("groups public races by phase for the races index page", () => {
  const model = buildPublicSiteModel(sampleRaces);
  const grouped = groupPublicRacesByPhase(model.featuredRaces);

  assert.equal(grouped.active.length, 1);
  assert.equal(grouped.registration.length, 0);
  assert.equal(grouped.finished.length, 1);
  assert.equal(grouped.active[0].id, "race_active");
});

test("sorts featured works by score and title", () => {
  const works = sortFeaturedWorks([
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
  ], "score");

  assert.equal(works[0].id, "work_a");

  const byTitle = sortFeaturedWorks([
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
  ], "title");

  assert.equal(byTitle[0].id, "work_a");
});

test("maps race phase to public home CTA", () => {
  assert.deepEqual(
    getRacePrimaryCta({ slug: "race_active--test", phase: "active" }),
    { href: "/races/race_active--test/live", label: "进入实况大厅" },
  );
  assert.deepEqual(
    getRacePrimaryCta({ slug: "race_finished--test", phase: "finished" }),
    { href: "/races/race_finished--test/results", label: "查看赛果" },
  );
});
