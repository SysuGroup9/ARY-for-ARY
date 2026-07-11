import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import {
  getConsoleRaceBySlugForAccess,
  getConsoleRaceEntriesBySlugForUser,
  getScreenConsoleRaceBySlugForUser,
  listConsoleRacesForUser,
  listScreenConsoleRacesForUser,
} from "@/lib/services/console-routes";

function buildRaceCreateInput(
  templateRace: Awaited<ReturnType<typeof prisma.race.findFirstOrThrow>>,
  organizerId: string,
) {
  return {
    cloudStudioUrl: templateRace.cloudStudioUrl,
    displayHighlightCount: templateRace.displayHighlightCount,
    displayShowOrganizerComment: templateRace.displayShowOrganizerComment,
    displayShowRiderCode: templateRace.displayShowRiderCode,
    displayShowTopHighlights: templateRace.displayShowTopHighlights,
    displayShowTrainingData: templateRace.displayShowTrainingData,
    enableFreeze: templateRace.enableFreeze,
    evaluationConfigHash: templateRace.evaluationConfigHash,
    evaluationConfigVersion: templateRace.evaluationConfigVersion,
    evaluationNotes: templateRace.evaluationNotes,
    freezeMinutesBeforeEnd: templateRace.freezeMinutesBeforeEnd,
    harnessWeightKeyword: templateRace.harnessWeightKeyword,
    harnessWeightReasoning: templateRace.harnessWeightReasoning,
    hasTrainingData: templateRace.hasTrainingData,
    keywordsJson: templateRace.keywordsJson,
    maxTeamSize: templateRace.maxTeamSize,
    organizerComment: "",
    organizerId,
    raceEnd: templateRace.raceEnd,
    raceStart: templateRace.raceStart,
    signupEnd: templateRace.signupEnd,
    signupStart: templateRace.signupStart,
    status: "published",
    submissionIntervalHours: templateRace.submissionIntervalHours,
    summary: templateRace.summary,
    taskDescription: templateRace.taskDescription,
    taskPackageLabel: templateRace.taskPackageLabel,
    title: templateRace.title,
    tokenLimit: templateRace.tokenLimit,
    trackConfigJson: templateRace.trackConfigJson,
    trackId: templateRace.trackId,
    trainingDataSummary: templateRace.trainingDataSummary,
    updateGranularityMinutes: templateRace.updateGranularityMinutes,
    weightCodeReview: templateRace.weightCodeReview,
    weightKeywords: templateRace.weightKeywords,
    weightReasoning: templateRace.weightReasoning,
    weightTaskPassRate: templateRace.weightTaskPassRate,
    weightTotalDialogue: templateRace.weightTotalDialogue,
    weightTotalTask: templateRace.weightTotalTask,
    weightTotalToken: templateRace.weightTotalToken,
  };
}

async function createForeignOrganizerRaceFixture() {
  const [templateRace, organizerTemplate] = await Promise.all([
    prisma.race.findFirstOrThrow({
      where: { id: "race_finished" },
    }),
    prisma.user.findFirstOrThrow({
      where: { username: "organizer_demo" },
    }),
  ]);

  const foreignOrganizer = await prisma.user.create({
    data: {
      passwordHash: organizerTemplate.passwordHash,
      profileCompleted: true,
      profileName: "Foreign Organizer Scope Fixture",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_scope_${Date.now()}_${randomUUID().slice(0, 8)}`,
    },
  });

  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace, foreignOrganizer.id),
      id: `race_console_scope_${Date.now()}_${randomUUID().slice(0, 8)}`,
      summary: "console scope foreign organizer fixture",
      title: "Console Scope Foreign Organizer Fixture",
    },
  });

  return {
    cleanup: async () => {
      await prisma.race.delete({
        where: { id: race.id },
      });
      await prisma.user.delete({
        where: { id: foreignOrganizer.id },
      });
    },
    race,
  };
}

test("rider console race list returns only races where the user has a registration", async () => {
  const races = await listConsoleRacesForUser({
    roles: ["RIDER"],
    userId: "rider_01",
  });

  // 不依赖特定 raceId，只验证返回值结构正确且按 access=rider 返回
  assert.ok(Array.isArray(races));
  for (const item of races) {
    assert.equal(item.access, "rider");
    assert.ok(item.slug.length > 0);
    assert.ok(item.defaultHref.startsWith("/console/races/"));
  }
});

test("screen console race list follows managed-race scope for organizers and full scope for admins", async () => {
  const adminRaces = await listScreenConsoleRacesForUser({
    roles: ["ADMIN"],
    userId: "admin_01",
  });
  const organizerRaces = await listScreenConsoleRacesForUser({
    roles: ["ORGANIZER"],
    userId: "org_01",
  });

  assert.ok(Array.isArray(adminRaces));
  assert.ok(adminRaces.every((item) => item.defaultHref.startsWith("/console/screen/")));
  assert.ok(organizerRaces.length > 0);
  assert.ok(organizerRaces.every((item) => item.race.organizerId === "org_01"));
  assert.ok(organizerRaces.every((item) => item.defaultHref.startsWith("/console/screen/")));
});

test("screen console detail lookup blocks organizers from reading unmanaged races while keeping admin access", async () => {
  const organizerRaces = await listScreenConsoleRacesForUser({
    roles: ["ORGANIZER"],
    userId: "org_01",
  });
  assert.ok(organizerRaces.length > 0);

  const ownRace = await getScreenConsoleRaceBySlugForUser({
    raceSlug: organizerRaces[0]!.slug,
    roles: ["ORGANIZER"],
    userId: "org_01",
  });
  assert.ok(ownRace);
  assert.equal(ownRace?.race.organizerId, "org_01");

  const fixture = await createForeignOrganizerRaceFixture();

  try {
    const adminRaces = await listScreenConsoleRacesForUser({
      roles: ["ADMIN"],
      userId: "admin_01",
    });
    const foreignRace = adminRaces.find(
      (item) => item.race.id === fixture.race.id,
    );
    assert.ok(foreignRace);

    const blockedForOrganizer = await getScreenConsoleRaceBySlugForUser({
      raceSlug: foreignRace!.slug,
      roles: ["ORGANIZER"],
      userId: "org_01",
    });
    assert.equal(blockedForOrganizer, null);

    const visibleForAdmin = await getScreenConsoleRaceBySlugForUser({
      raceSlug: foreignRace!.slug,
      roles: ["ADMIN"],
      userId: "admin_01",
    });
    assert.ok(visibleForAdmin);
    assert.equal(visibleForAdmin?.race.id, foreignRace!.race.id);
  } finally {
    await fixture.cleanup();
  }
});

test("judge console race list returns only races where the user has judge assignments", async () => {
  const races = await listConsoleRacesForUser({
    roles: ["JUDGE"],
    userId: "judge_01",
  });

  assert.ok(Array.isArray(races));
  for (const item of races) {
    assert.equal(item.access, "judge");
    assert.ok(item.defaultHref.startsWith("/console/races/"));
  }
});

test("admin race list exposes organizer-view entries for every race as system scope", async () => {
  const fixture = await createForeignOrganizerRaceFixture();

  try {
    const races = await listConsoleRacesForUser({
      roles: ["ADMIN"],
      userId: "admin_01",
    });

    assert.ok(races.length > 0);
    assert.ok(races.every((item) => item.access === "organizer"));
    assert.ok(
      races.every((item) =>
        item.defaultHref.includes("/organizer/overview"),
      ),
    );
    assert.ok(races.some((item) => item.race.id === fixture.race.id));
  } finally {
    await fixture.cleanup();
  }
});

test("console race scoped detail lookup follows organizer / rider / judge access boundaries", async () => {
  const organizerRaces = await listConsoleRacesForUser({
    roles: ["ORGANIZER"],
    userId: "org_01",
  });
  const riderRaces = await listConsoleRacesForUser({
    roles: ["RIDER"],
    userId: "rider_01",
  });
  const judgeRaces = await listConsoleRacesForUser({
    roles: ["JUDGE"],
    userId: "judge_01",
  });

  const organizerOwn = organizerRaces.find((item) => item.access === "organizer");
  const riderOwn = riderRaces.find((item) => item.access === "rider");
  const judgeOwn = judgeRaces.find((item) => item.access === "judge");
  const fixture = await createForeignOrganizerRaceFixture();
  assert.ok(organizerOwn);
  assert.ok(riderOwn);
  assert.ok(judgeOwn);

  try {
    const adminScreenRaces = await listScreenConsoleRacesForUser({
      roles: ["ADMIN"],
      userId: "admin_01",
    });
    const foreignRace = adminScreenRaces.find(
      (item) => item.race.id === fixture.race.id,
    );
    assert.ok(foreignRace);

    const organizerContext = await getConsoleRaceBySlugForAccess({
      access: "organizer",
      raceSlug: organizerOwn!.slug,
      roles: ["ORGANIZER"],
      userId: "org_01",
    });
    assert.ok(organizerContext);
    assert.equal(organizerContext?.race.organizerId, "org_01");

    const riderContext = await getConsoleRaceBySlugForAccess({
      access: "rider",
      raceSlug: riderOwn!.slug,
      roles: ["RIDER"],
      userId: "rider_01",
    });
    assert.ok(riderContext);
    assert.ok(riderContext?.race.registrations.some((registration) => registration.userId === "rider_01"));

    const judgeContext = await getConsoleRaceBySlugForAccess({
      access: "judge",
      raceSlug: judgeOwn!.slug,
      roles: ["JUDGE"],
      userId: "judge_01",
    });
    assert.ok(judgeContext);

    const blockedOrganizer = await getConsoleRaceBySlugForAccess({
      access: "organizer",
      raceSlug: foreignRace!.slug,
      roles: ["ORGANIZER"],
      userId: "org_01",
    });
    assert.equal(blockedOrganizer, null);

    const blockedRider = await getConsoleRaceBySlugForAccess({
      access: "rider",
      raceSlug: foreignRace!.slug,
      roles: ["RIDER"],
      userId: "rider_01",
    });
    assert.equal(blockedRider, null);

    const adminOrganizerContext = await getConsoleRaceBySlugForAccess({
      access: "organizer",
      raceSlug: foreignRace!.slug,
      roles: ["ADMIN"],
      userId: "admin_01",
    });
    assert.ok(adminOrganizerContext);
    assert.equal(adminOrganizerContext?.race.id, foreignRace!.race.id);
  } finally {
    await fixture.cleanup();
  }
});

test("console race entry helper returns only the current user's visible accesses for a slug", async () => {
  const organizerRaces = await listConsoleRacesForUser({
    roles: ["ORGANIZER"],
    userId: "org_01",
  });
  const organizerOwn = organizerRaces.find((item) => item.access === "organizer");
  assert.ok(organizerOwn);
  const fixture = await createForeignOrganizerRaceFixture();

  try {
    const adminScreenRaces = await listScreenConsoleRacesForUser({
      roles: ["ADMIN"],
      userId: "admin_01",
    });
    const foreignRace = adminScreenRaces.find(
      (item) => item.race.id === fixture.race.id,
    );
    assert.ok(foreignRace);

    const organizerEntry = await getConsoleRaceEntriesBySlugForUser({
      raceSlug: organizerOwn!.slug,
      roles: ["ORGANIZER"],
      userId: "org_01",
    });
    assert.ok(organizerEntry);
    assert.deepEqual(organizerEntry?.items.map((item) => item.access), ["organizer"]);

    const riderEntry = await getConsoleRaceEntriesBySlugForUser({
      raceSlug: foreignRace!.slug,
      roles: ["RIDER"],
      userId: "rider_01",
    });
    assert.equal(riderEntry, null);

    const adminEntry = await getConsoleRaceEntriesBySlugForUser({
      raceSlug: foreignRace!.slug,
      roles: ["ADMIN"],
      userId: "admin_01",
    });
    assert.ok(adminEntry);
    assert.deepEqual(adminEntry?.items.map((item) => item.access), ["organizer"]);
  } finally {
    await fixture.cleanup();
  }
});
