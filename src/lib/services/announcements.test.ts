import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import * as announcementsService from "@/lib/services/announcements";

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

test("announcement draft create, edit, publish, and hide follow the grs004 baseline", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_announcement_${Date.now()}`,
      summary: "announcement fixture",
      title: "Announcement Fixture",
    },
  });

  try {
    const draft = await (
      announcementsService as {
        createAnnouncementDraftForRace: (input: {
          allowSystem?: boolean;
          body: string;
          organizerId: string;
          raceId: string;
          title: string;
        }) => Promise<{
          body: string;
          id: string;
          publishedAt: Date | null;
          title: string;
          visibility: string;
        }>;
      }
    ).createAnnouncementDraftForRace({
      body: "Warm up at Gate A.",
      organizerId: race.organizerId,
      raceId: race.id,
      title: "Warmup Notice",
    });

    assert.equal(draft.title, "Warmup Notice");
    assert.equal(draft.body, "Warm up at Gate A.");
    assert.equal(draft.visibility, "PRIVATE");
    assert.equal(draft.publishedAt, null);

    await (
      announcementsService as {
        updateAnnouncementDraftForRace: (input: {
          allowSystem?: boolean;
          announcementId: string;
          body: string;
          organizerId: string;
          title: string;
        }) => Promise<void>;
      }
    ).updateAnnouncementDraftForRace({
      announcementId: draft.id,
      body: "Warm up moved to Gate B.",
      organizerId: race.organizerId,
      title: "Warmup Notice Updated",
    });

    await (
      announcementsService as {
        publishAnnouncementForRace: (input: {
          allowSystem?: boolean;
          announcementId: string;
          organizerId: string;
        }) => Promise<void>;
      }
    ).publishAnnouncementForRace({
      announcementId: draft.id,
      organizerId: race.organizerId,
    });

    const publishedAnnouncements = await (
      announcementsService as {
        listPublishedAnnouncementsForRace: (raceId: string) => Promise<
          Array<{
            body: string;
            id: string;
            publishedAt: Date | null;
            title: string;
            visibility: string;
          }>
        >;
      }
    ).listPublishedAnnouncementsForRace(race.id);

    assert.equal(publishedAnnouncements.length, 1);
    assert.equal(publishedAnnouncements[0]!.title, "Warmup Notice Updated");
    assert.equal(publishedAnnouncements[0]!.body, "Warm up moved to Gate B.");
    assert.equal(publishedAnnouncements[0]!.visibility, "PUBLIC");
    assert.notEqual(publishedAnnouncements[0]!.publishedAt, null);

    await (
      announcementsService as {
        hideAnnouncementForRace: (input: {
          allowSystem?: boolean;
          announcementId: string;
          organizerId: string;
        }) => Promise<void>;
      }
    ).hideAnnouncementForRace({
      announcementId: draft.id,
      organizerId: race.organizerId,
    });

    const hiddenAnnouncement = await (prisma as typeof prisma & {
      announcement: {
        findUniqueOrThrow: (input: { where: { id: string } }) => Promise<{
          id: string;
          publishedAt: Date | null;
          visibility: string;
        }>;
      };
    }).announcement.findUniqueOrThrow({
      where: {
        id: draft.id,
      },
    });
    const visibleAfterHide = await (
      announcementsService as {
        listPublishedAnnouncementsForRace: (raceId: string) => Promise<unknown[]>;
      }
    ).listPublishedAnnouncementsForRace(race.id);

    assert.equal(hiddenAnnouncement.visibility, "PRIVATE");
    assert.notEqual(hiddenAnnouncement.publishedAt, null);
    assert.equal(visibleAfterHide.length, 0);

    const adminDraft = await (
      announcementsService as {
        createAnnouncementDraftForRace: (input: {
          allowSystem?: boolean;
          body: string;
          organizerId: string;
          raceId: string;
          title: string;
        }) => Promise<{
          body: string;
          id: string;
          publishedAt: Date | null;
          title: string;
          visibility: string;
        }>;
      }
    ).createAnnouncementDraftForRace({
      allowSystem: true,
      body: "System notice draft.",
      organizerId: "admin_01",
      raceId: race.id,
      title: "System Notice",
    });

    await (
      announcementsService as {
        updateAnnouncementDraftForRace: (input: {
          allowSystem?: boolean;
          announcementId: string;
          body: string;
          organizerId: string;
          title: string;
        }) => Promise<void>;
      }
    ).updateAnnouncementDraftForRace({
      allowSystem: true,
      announcementId: adminDraft.id,
      body: "System notice published body.",
      organizerId: "admin_01",
      title: "System Notice Updated",
    });

    await (
      announcementsService as {
        publishAnnouncementForRace: (input: {
          allowSystem?: boolean;
          announcementId: string;
          organizerId: string;
        }) => Promise<void>;
      }
    ).publishAnnouncementForRace({
      allowSystem: true,
      announcementId: adminDraft.id,
      organizerId: "admin_01",
    });

    await (
      announcementsService as {
        hideAnnouncementForRace: (input: {
          allowSystem?: boolean;
          announcementId: string;
          organizerId: string;
        }) => Promise<void>;
      }
    ).hideAnnouncementForRace({
      allowSystem: true,
      announcementId: adminDraft.id,
      organizerId: "admin_01",
    });

    const hiddenAdminAnnouncement = await (prisma as typeof prisma & {
      announcement: {
        findUniqueOrThrow: (input: { where: { id: string } }) => Promise<{
          body: string;
          id: string;
          publishedAt: Date | null;
          title: string;
          visibility: string;
        }>;
      };
    }).announcement.findUniqueOrThrow({
      where: {
        id: adminDraft.id,
      },
    });

    assert.equal(hiddenAdminAnnouncement.title, "System Notice Updated");
    assert.equal(hiddenAdminAnnouncement.body, "System notice published body.");
    assert.equal(hiddenAdminAnnouncement.visibility, "PRIVATE");
    assert.notEqual(hiddenAdminAnnouncement.publishedAt, null);
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});

test("announcement public reads exclude drafts and hidden announcements", async () => {
  const templateRace = await prisma.race.findFirstOrThrow({
    where: {
      id: "race_finished",
    },
  });
  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_announcement_public_${Date.now()}`,
      summary: "announcement public fixture",
      title: "Announcement Public Fixture",
    },
  });

  try {
    const draftOnly = await (prisma as typeof prisma & {
      announcement: {
        create: (input: {
          data: {
            body: string;
            raceId: string;
            title: string;
            visibility: "PRIVATE" | "PUBLIC";
          };
        }) => Promise<{ id: string }>;
      };
    }).announcement.create({
      data: {
        body: "draft only body",
        raceId: race.id,
        title: "Draft Only",
        visibility: "PRIVATE",
      },
    });
    const publishedVisible = await (prisma as typeof prisma & {
      announcement: {
        create: (input: {
          data: {
            body: string;
            publishedAt: Date;
            raceId: string;
            title: string;
            visibility: "PRIVATE" | "PUBLIC";
          };
        }) => Promise<{ id: string }>;
      };
    }).announcement.create({
      data: {
        body: "published visible body",
        publishedAt: new Date("2026-07-11T12:00:00Z"),
        raceId: race.id,
        title: "Published Visible",
        visibility: "PUBLIC",
      },
    });
    const publishedHidden = await (prisma as typeof prisma & {
      announcement: {
        create: (input: {
          data: {
            body: string;
            publishedAt: Date;
            raceId: string;
            title: string;
            visibility: "PRIVATE" | "PUBLIC";
          };
        }) => Promise<{ id: string }>;
      };
    }).announcement.create({
      data: {
        body: "published hidden body",
        publishedAt: new Date("2026-07-11T13:00:00Z"),
        raceId: race.id,
        title: "Published Hidden",
        visibility: "PRIVATE",
      },
    });

    const publicAnnouncements = await (
      announcementsService as {
        listPublishedAnnouncementsForRace: (raceId: string) => Promise<
          Array<{ id: string; title: string }>
        >;
      }
    ).listPublishedAnnouncementsForRace(race.id);

    assert.deepEqual(
      publicAnnouncements.map((announcement) => announcement.id),
      [publishedVisible.id],
    );
    assert.equal(publicAnnouncements[0]!.title, "Published Visible");
    assert.notEqual(draftOnly.id, publishedVisible.id);
    assert.notEqual(publishedHidden.id, publishedVisible.id);
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});

test("announcement services reject foreign organizers even with allowSystem and allow admin/system callers", async () => {
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
      profileName: "Foreign Announcement Organizer",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_announcement_foreign_${Date.now()}`,
    },
  });
  const race = await prisma.race.create({
    data: {
      ...buildRaceCreateInput(templateRace),
      id: `race_announcement_scope_${Date.now()}`,
      summary: "announcement scope fixture",
      title: "Announcement Scope Fixture",
    },
  });

  try {
    await assert.rejects(
      async () =>
        (
          announcementsService as {
            createAnnouncementDraftForRace: (input: {
              allowSystem?: boolean;
              body: string;
              organizerId: string;
              raceId: string;
              title: string;
            }) => Promise<unknown>;
          }
        ).createAnnouncementDraftForRace({
          allowSystem: true,
          body: "foreign should fail",
          organizerId: foreignOrganizer.id,
          raceId: race.id,
          title: "Foreign Announcement",
        }),
      /无权操作这场比赛的公告/,
    );

    const draft = await (
      announcementsService as {
        createAnnouncementDraftForRace: (input: {
          allowSystem?: boolean;
          body: string;
          organizerId: string;
          raceId: string;
          title: string;
        }) => Promise<{
          id: string;
        }>;
      }
    ).createAnnouncementDraftForRace({
      allowSystem: true,
      body: "admin draft body",
      organizerId: adminUser.id,
      raceId: race.id,
      title: "Admin Draft",
    });

    await assert.rejects(
      async () =>
        (
          announcementsService as {
            updateAnnouncementDraftForRace: (input: {
              allowSystem?: boolean;
              announcementId: string;
              body: string;
              organizerId: string;
              title: string;
            }) => Promise<unknown>;
          }
        ).updateAnnouncementDraftForRace({
          allowSystem: true,
          announcementId: draft.id,
          body: "foreign update",
          organizerId: foreignOrganizer.id,
          title: "Foreign Update",
        }),
      /无权操作这条公告/,
    );

    await (
      announcementsService as {
        updateAnnouncementDraftForRace: (input: {
          allowSystem?: boolean;
          announcementId: string;
          body: string;
          organizerId: string;
          title: string;
        }) => Promise<void>;
      }
    ).updateAnnouncementDraftForRace({
      allowSystem: true,
      announcementId: draft.id,
      body: "admin updated body",
      organizerId: adminUser.id,
      title: "Admin Updated",
    });

    await assert.rejects(
      async () =>
        (
          announcementsService as {
            publishAnnouncementForRace: (input: {
              allowSystem?: boolean;
              announcementId: string;
              organizerId: string;
            }) => Promise<unknown>;
          }
        ).publishAnnouncementForRace({
          allowSystem: true,
          announcementId: draft.id,
          organizerId: foreignOrganizer.id,
        }),
      /无权操作这条公告/,
    );

    await (
      announcementsService as {
        publishAnnouncementForRace: (input: {
          allowSystem?: boolean;
          announcementId: string;
          organizerId: string;
        }) => Promise<void>;
      }
    ).publishAnnouncementForRace({
      allowSystem: true,
      announcementId: draft.id,
      organizerId: adminUser.id,
    });

    await assert.rejects(
      async () =>
        (
          announcementsService as {
            hideAnnouncementForRace: (input: {
              allowSystem?: boolean;
              announcementId: string;
              organizerId: string;
            }) => Promise<unknown>;
          }
        ).hideAnnouncementForRace({
          allowSystem: true,
          announcementId: draft.id,
          organizerId: foreignOrganizer.id,
        }),
      /无权操作这条公告/,
    );

    await (
      announcementsService as {
        hideAnnouncementForRace: (input: {
          allowSystem?: boolean;
          announcementId: string;
          organizerId: string;
        }) => Promise<void>;
      }
    ).hideAnnouncementForRace({
      allowSystem: true,
      announcementId: draft.id,
      organizerId: adminUser.id,
    });

    const storedAnnouncement = await prisma.announcement.findUniqueOrThrow({
      where: {
        id: draft.id,
      },
    });

    assert.equal(storedAnnouncement.title, "Admin Updated");
    assert.equal(storedAnnouncement.body, "admin updated body");
    assert.equal(storedAnnouncement.visibility, "PRIVATE");
    assert.notEqual(storedAnnouncement.publishedAt, null);
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
