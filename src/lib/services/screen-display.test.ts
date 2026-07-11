import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import * as screenDisplayService from "@/lib/services/screen-display";

function buildRaceCreateInput(
  templateRace: Awaited<ReturnType<typeof prisma.race.findFirstOrThrow>>,
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
    organizerId: templateRace.organizerId,
    raceEnd: templateRace.raceEnd,
    raceStart: templateRace.raceStart,
    signupEnd: templateRace.signupEnd,
    signupStart: templateRace.signupStart,
    status: "active",
    submissionIntervalHours: templateRace.submissionIntervalHours,
    taskDescription: templateRace.taskDescription,
    taskPackageLabel: templateRace.taskPackageLabel,
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

test("screen display state persists mode, theme, and fallback override", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_screen_display_${Date.now()}`,
      summary: "screen display fixture",
      title: "Screen Display Fixture",
    },
  });

  try {
    const initialState = await (
      screenDisplayService as {
        getOrCreateScreenDisplayForRace: (input: { raceId: string }) => Promise<{
          fallbackMode: string;
          mode: string;
          theme: string;
        }>;
      }
    ).getOrCreateScreenDisplayForRace({
      raceId: race.id,
    });

    assert.equal(initialState.mode, "jumbotron");
    assert.equal(initialState.theme, "default");
    assert.equal(initialState.fallbackMode, "auto");

    await (
      screenDisplayService as {
        updateScreenDisplayThemeForRace: (input: {
          organizerId: string;
          raceId: string;
          theme: string;
        }) => Promise<void>;
      }
    ).updateScreenDisplayThemeForRace({
      organizerId: race.organizerId,
      raceId: race.id,
      theme: "arena-night",
    });

    await (
      screenDisplayService as {
        updateScreenDisplayModeForRace: (input: {
          mode: "announcement" | "billboard" | "jumbotron" | "leaderboard" | "live" | "works";
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).updateScreenDisplayModeForRace({
      mode: "announcement",
      organizerId: race.organizerId,
      raceId: race.id,
    });

    await (
      screenDisplayService as {
        fallbackScreenDisplayToStableProjection: (input: {
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).fallbackScreenDisplayToStableProjection({
      organizerId: race.organizerId,
      raceId: race.id,
    });

    const stableState = await (
      screenDisplayService as {
        getOrCreateScreenDisplayForRace: (input: { raceId: string }) => Promise<{
          fallbackMode: string;
          mode: string;
          theme: string;
        }>;
      }
    ).getOrCreateScreenDisplayForRace({
      raceId: race.id,
    });

    assert.equal(stableState.mode, "announcement");
    assert.equal(stableState.theme, "arena-night");
    assert.equal(stableState.fallbackMode, "stable_projection");

    await (
      screenDisplayService as {
        fallbackScreenDisplayToStaticNotice: (input: {
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).fallbackScreenDisplayToStaticNotice({
      organizerId: race.organizerId,
      raceId: race.id,
    });

    const staticState = await (
      screenDisplayService as {
        getOrCreateScreenDisplayForRace: (input: { raceId: string }) => Promise<{
          fallbackMode: string;
        }>;
      }
    ).getOrCreateScreenDisplayForRace({
      raceId: race.id,
    });

    assert.equal(staticState.fallbackMode, "static_notice");

    await (
      screenDisplayService as {
        updateScreenDisplayModeForRace: (input: {
          mode: "announcement" | "billboard" | "jumbotron" | "leaderboard" | "live" | "works";
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).updateScreenDisplayModeForRace({
      mode: "works",
      organizerId: race.organizerId,
      raceId: race.id,
    });

    const switchedState = await (
      screenDisplayService as {
        getOrCreateScreenDisplayForRace: (input: { raceId: string }) => Promise<{
          fallbackMode: string;
          mode: string;
        }>;
      }
    ).getOrCreateScreenDisplayForRace({
      raceId: race.id,
    });

    assert.equal(switchedState.mode, "works");
    assert.equal(switchedState.fallbackMode, "auto");
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});

test("screen display services reject foreign organizers even with allowSystem and allow admin/system callers", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const [adminUser, organizerUser] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: {
        username: "admin_demo",
      },
    }),
    prisma.user.findFirstOrThrow({
      where: {
        username: "organizer_demo",
      },
    }),
  ]);
  const foreignOrganizer = await prisma.user.create({
    data: {
      passwordHash: organizerUser.passwordHash,
      profileCompleted: true,
      profileName: "Foreign Screen Organizer",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_screen_foreign_${Date.now()}`,
    },
  });
  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_screen_scope_${Date.now()}`,
      summary: "screen display scope fixture",
      title: "Screen Display Scope Fixture",
    },
  });

  try {
    await assert.rejects(
      async () =>
        (
          screenDisplayService as {
            updateScreenDisplayThemeForRace: (input: {
              allowSystem?: boolean;
              organizerId: string;
              raceId: string;
              theme: string;
            }) => Promise<void>;
          }
        ).updateScreenDisplayThemeForRace({
          allowSystem: true,
          organizerId: foreignOrganizer.id,
          raceId: race.id,
          theme: "foreign-theme",
        }),
      /无权操作这场比赛的大屏显示状态/,
    );

    await assert.rejects(
      async () =>
        (
          screenDisplayService as {
            updateScreenDisplayModeForRace: (input: {
              allowSystem?: boolean;
              mode: "announcement" | "billboard" | "jumbotron" | "leaderboard" | "live" | "works";
              organizerId: string;
              raceId: string;
            }) => Promise<void>;
          }
        ).updateScreenDisplayModeForRace({
          allowSystem: true,
          mode: "live",
          organizerId: foreignOrganizer.id,
          raceId: race.id,
        }),
      /无权操作这场比赛的大屏显示状态/,
    );

    await assert.rejects(
      async () =>
        (
          screenDisplayService as {
            fallbackScreenDisplayToStableProjection: (input: {
              allowSystem?: boolean;
              organizerId: string;
              raceId: string;
            }) => Promise<void>;
          }
        ).fallbackScreenDisplayToStableProjection({
          allowSystem: true,
          organizerId: foreignOrganizer.id,
          raceId: race.id,
        }),
      /无权操作这场比赛的大屏显示状态/,
    );

    await assert.rejects(
      async () =>
        (
          screenDisplayService as {
            fallbackScreenDisplayToStaticNotice: (input: {
              allowSystem?: boolean;
              organizerId: string;
              raceId: string;
            }) => Promise<void>;
          }
        ).fallbackScreenDisplayToStaticNotice({
          allowSystem: true,
          organizerId: foreignOrganizer.id,
          raceId: race.id,
        }),
      /无权操作这场比赛的大屏显示状态/,
    );

    await (
      screenDisplayService as {
        updateScreenDisplayThemeForRace: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
          theme: string;
        }) => Promise<void>;
      }
    ).updateScreenDisplayThemeForRace({
      allowSystem: true,
      organizerId: adminUser.id,
      raceId: race.id,
      theme: "admin-theme",
    });

    await (
      screenDisplayService as {
        updateScreenDisplayModeForRace: (input: {
          allowSystem?: boolean;
          mode: "announcement" | "billboard" | "jumbotron" | "leaderboard" | "live" | "works";
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).updateScreenDisplayModeForRace({
      allowSystem: true,
      mode: "leaderboard",
      organizerId: adminUser.id,
      raceId: race.id,
    });

    await (
      screenDisplayService as {
        fallbackScreenDisplayToStableProjection: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).fallbackScreenDisplayToStableProjection({
      allowSystem: true,
      organizerId: adminUser.id,
      raceId: race.id,
    });

    let state = await (
      screenDisplayService as {
        getOrCreateScreenDisplayForRace: (input: { raceId: string }) => Promise<{
          fallbackMode: string;
          mode: string;
          theme: string;
        }>;
      }
    ).getOrCreateScreenDisplayForRace({
      raceId: race.id,
    });

    assert.equal(state.theme, "admin-theme");
    assert.equal(state.mode, "leaderboard");
    assert.equal(state.fallbackMode, "stable_projection");

    await (
      screenDisplayService as {
        fallbackScreenDisplayToStaticNotice: (input: {
          allowSystem?: boolean;
          organizerId: string;
          raceId: string;
        }) => Promise<void>;
      }
    ).fallbackScreenDisplayToStaticNotice({
      allowSystem: true,
      organizerId: adminUser.id,
      raceId: race.id,
    });

    state = await (
      screenDisplayService as {
        getOrCreateScreenDisplayForRace: (input: { raceId: string }) => Promise<{
          fallbackMode: string;
          mode: string;
          theme: string;
        }>;
      }
    ).getOrCreateScreenDisplayForRace({
      raceId: race.id,
    });

    assert.equal(state.theme, "admin-theme");
    assert.equal(state.mode, "leaderboard");
    assert.equal(state.fallbackMode, "static_notice");
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
    await prisma.user.delete({
      where: {
        id: foreignOrganizer.id,
      },
    });
  }
});

test("screen display href resolution follows current mode and fallback override", async () => {
  const hrefAuto = (
    screenDisplayService as {
      resolveScreenDisplayHref: (input: {
        mode: "announcement" | "billboard" | "jumbotron" | "leaderboard" | "live" | "works";
        raceId: string;
        raceSlug: string;
        fallbackMode: "auto" | "stable_projection" | "static_notice";
      }) => string;
    }
  ).resolveScreenDisplayHref({
    fallbackMode: "auto",
    mode: "announcement",
    raceId: "race_active",
    raceSlug: "race_active--sorting-challenge",
  });
  const hrefStable = (
    screenDisplayService as {
      resolveScreenDisplayHref: (input: {
        mode: "announcement" | "billboard" | "jumbotron" | "leaderboard" | "live" | "works";
        raceId: string;
        raceSlug: string;
        fallbackMode: "auto" | "stable_projection" | "static_notice";
      }) => string;
    }
  ).resolveScreenDisplayHref({
    fallbackMode: "stable_projection",
    mode: "works",
    raceId: "race_active",
    raceSlug: "race_active--sorting-challenge",
  });
  const hrefStatic = (
    screenDisplayService as {
      resolveScreenDisplayHref: (input: {
        mode: "announcement" | "billboard" | "jumbotron" | "leaderboard" | "live" | "works";
        raceId: string;
        raceSlug: string;
        fallbackMode: "auto" | "stable_projection" | "static_notice";
      }) => string;
    }
  ).resolveScreenDisplayHref({
    fallbackMode: "static_notice",
    mode: "live",
    raceId: "race_active",
    raceSlug: "race_active--sorting-challenge",
  });

  assert.equal(hrefAuto, "/screen/race_active--sorting-challenge/announcement");
  assert.equal(hrefStable, "/jumbotron/race_active?source=stable");
  assert.equal(hrefStatic, "/screen/race_active--sorting-challenge/static");

  const hrefBillboard = (
    screenDisplayService as {
      resolveScreenDisplayHref: (input: {
        mode: "announcement" | "billboard" | "jumbotron" | "leaderboard" | "live" | "works";
        raceId: string;
        raceSlug: string;
        fallbackMode: "auto" | "stable_projection" | "static_notice";
      }) => string;
    }
  ).resolveScreenDisplayHref({
    fallbackMode: "auto",
    mode: "billboard",
    raceId: "race_active",
    raceSlug: "race_active--sorting-challenge",
  });
  const hrefLive = (
    screenDisplayService as {
      resolveScreenDisplayHref: (input: {
        mode: "announcement" | "billboard" | "jumbotron" | "leaderboard" | "live" | "works";
        raceId: string;
        raceSlug: string;
        fallbackMode: "auto" | "stable_projection" | "static_notice";
      }) => string;
    }
  ).resolveScreenDisplayHref({
    fallbackMode: "auto",
    mode: "live",
    raceId: "race_active",
    raceSlug: "race_active--sorting-challenge",
  });
  const hrefLeaderboard = (
    screenDisplayService as {
      resolveScreenDisplayHref: (input: {
        mode: "announcement" | "billboard" | "jumbotron" | "leaderboard" | "live" | "works";
        raceId: string;
        raceSlug: string;
        fallbackMode: "auto" | "stable_projection" | "static_notice";
      }) => string;
    }
  ).resolveScreenDisplayHref({
    fallbackMode: "auto",
    mode: "leaderboard",
    raceId: "race_active",
    raceSlug: "race_active--sorting-challenge",
  });
  const hrefWorks = (
    screenDisplayService as {
      resolveScreenDisplayHref: (input: {
        mode: "announcement" | "billboard" | "jumbotron" | "leaderboard" | "live" | "works";
        raceId: string;
        raceSlug: string;
        fallbackMode: "auto" | "stable_projection" | "static_notice";
      }) => string;
    }
  ).resolveScreenDisplayHref({
    fallbackMode: "auto",
    mode: "works",
    raceId: "race_active",
    raceSlug: "race_active--sorting-challenge",
  });

  assert.equal(hrefBillboard, "/screen/race_active--sorting-challenge/billboard");
  assert.equal(hrefLive, "/screen/race_active--sorting-challenge/live");
  assert.equal(hrefLeaderboard, "/screen/race_active--sorting-challenge/leaderboard");
  assert.equal(hrefWorks, "/screen/race_active--sorting-challenge/works");
});
