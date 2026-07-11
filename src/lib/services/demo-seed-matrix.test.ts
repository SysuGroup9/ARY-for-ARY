import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";

test("seed includes added demo accounts for extended matrix and story races", async () => {
  const usernames = [
    "organizer_story",
    "judge_story",
    "rider_luna",
    "rider_milo",
    "rider_nova",
    "rider_orion",
  ];

  const users = await prisma.user.findMany({
    where: {
      username: {
        in: usernames,
      },
    },
    select: {
      username: true,
    },
  });

  assert.deepEqual(
    users.map((user) => user.username).sort(),
    usernames.sort(),
  );
});

test("seed includes matrix and story demo races across missing lifecycle states", async () => {
  const races = await prisma.race.findMany({
    where: {
      title: {
        in: [
          "[Matrix] Draft - Sponsor Sandbox",
          "[Matrix] Published - Countdown Lobby",
          "[Matrix] Submitting - Artifact Freeze Drill",
          "[Matrix] Judging - Review Queue Arena",
          "[Matrix] Archived - Legacy Showcase Vault",
          "[Story] Running - Smart Warehouse Copilot",
          "[Story] Completed - Campus Ops Automation Finals",
        ],
      },
    },
    select: {
      status: true,
      title: true,
    },
  });

  const byTitle = new Map(races.map((race) => [race.title, race.status]));

  assert.equal(byTitle.get("[Matrix] Draft - Sponsor Sandbox"), "draft");
  assert.equal(byTitle.get("[Matrix] Published - Countdown Lobby"), "published");
  assert.equal(byTitle.get("[Matrix] Submitting - Artifact Freeze Drill"), "submitting");
  assert.equal(byTitle.get("[Matrix] Judging - Review Queue Arena"), "judging");
  assert.equal(byTitle.get("[Matrix] Archived - Legacy Showcase Vault"), "archived");
  assert.equal(byTitle.get("[Story] Running - Smart Warehouse Copilot"), "running");
  assert.equal(byTitle.get("[Story] Completed - Campus Ops Automation Finals"), "completed");
});

test("seeded story races expose deeper platform capability data", async () => {
  const runningRace = await prisma.race.findFirstOrThrow({
    where: {
      title: "[Story] Running - Smart Warehouse Copilot",
    },
    include: {
      feedbackThreads: true,
      projections: true,
      registrations: true,
      runnerTasks: true,
      submissions: true,
      teamComments: true,
    },
  });
  const completedRace = await prisma.race.findFirstOrThrow({
    where: {
      title: "[Story] Completed - Campus Ops Automation Finals",
    },
    include: {
      awards: true,
      reports: true,
      registrations: true,
      teams: true,
    },
  });
  const completedJudgingCount = await prisma.judgingRecord.count({
    where: {
      judgeAssignment: {
        work: {
          registration: {
            raceId: completedRace.id,
          },
        },
      },
    },
  });
  const completedWorkCount = await prisma.work.count({
    where: {
      registration: {
        raceId: completedRace.id,
      },
    },
  });

  assert.ok(runningRace.registrations.length >= 4);
  assert.ok(runningRace.submissions.length >= 3);
  assert.ok(runningRace.runnerTasks.length >= 2);
  assert.ok(runningRace.feedbackThreads.length >= 1);
  assert.ok(runningRace.teamComments.length >= 1);
  assert.ok(runningRace.projections.length >= 1);

  assert.ok(completedRace.registrations.length >= 4);
  assert.ok(completedRace.teams.length >= 4);
  assert.ok(completedWorkCount >= 3);
  assert.ok(completedJudgingCount >= 2);
  assert.ok(completedRace.awards.length >= 3);
  assert.ok(completedRace.reports.length >= 3);
});
