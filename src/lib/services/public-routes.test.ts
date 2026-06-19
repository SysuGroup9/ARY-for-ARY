import assert from "node:assert/strict";
import test from "node:test";
import { buildWorkSlug } from "@/lib/public-site";
import { prisma } from "@/lib/prisma";
import { getRiderBySlug, getWorkBySlug } from "@/lib/services/public-routes";

test("resolves a public work by the new work-id slug", async () => {
  const work = await prisma.work.findFirst({
    include: {
      registration: {
        include: {
          race: true,
        },
      },
    },
    where: {
      registration: {
        race: {
          id: "race_finished",
        },
      },
    },
  });

  assert.ok(work, "expected seeded work for race_finished");

  const result = await getWorkBySlug(
    buildWorkSlug(work.registration.race.id, work.id, work.title),
  );

  assert.ok(result);
  assert.equal(result.title, work.title);
  assert.equal(result.raceTitle, work.registration.race.title);
  assert.equal(typeof result.techNotes, "string");
  assert.equal(Array.isArray(result.judgeComments), true);
});

test("still resolves a public work by the legacy team-id slug for compatibility", async () => {
  const team = await prisma.team.findFirst({
    where: {
      raceId: "race_finished",
    },
  });

  assert.ok(team, "expected seeded team for race_finished");

  const result = await getWorkBySlug(`${team.raceId}__${team.id}--legacy-compat`);

  assert.ok(result);
  assert.equal(result.raceSlug.startsWith("race_finished--"), true);
});

test("returns technical notes and judge comments for the public work page", async () => {
  const work = await prisma.work.findFirst({
    include: {
      judgeAssignments: {
        include: {
          judgingRecord: true,
          judge: true,
        },
      },
      registration: {
        include: {
          race: true,
        },
      },
    },
    where: {
      registration: {
        race: {
          id: "race_finished",
        },
      },
    },
  });

  assert.ok(work, "expected seeded work for race_finished");

  const result = await getWorkBySlug(
    buildWorkSlug(work.registration.race.id, work.id, work.title),
  );

  assert.ok(result);
  assert.equal(result.techNotes.length > 0, true);
  assert.equal(result.judgeComments.length > 0, true);
  assert.equal(result.judgeComments[0]?.judgeName.length > 0, true);
  assert.equal(result.judgeComments[0]?.summary.length > 0, true);
});

test("returns rider profile aggregates for skill tags, performance summary, and judge comments", async () => {
  const rider = await prisma.user.findFirst({
    where: {
      username: "rider_bob",
    },
  });

  assert.ok(rider, "expected seeded rider_bob user");

  const result = await getRiderBySlug(`${rider.id}--${rider.username}`);

  assert.ok(result);
  assert.equal(Array.isArray(result.skillTags), true);
  assert.equal(result.skillTags.length > 0, true);
  assert.equal(result.performanceSummary.totalTokens > 0, true);
  assert.equal(result.performanceSummary.averageProgressPercent > 0, true);
  assert.equal(Array.isArray(result.judgeComments), true);
  assert.equal(result.judgeComments.length > 0, true);
});
