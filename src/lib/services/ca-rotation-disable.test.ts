import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import {
  disableCAConnectionForOrganizer,
  enableCAConnectionForOrganizer,
  rotateCAConnectionSecretForRider,
} from "@/lib/services/ca-connections";

test("rotateCAConnectionSecretForRider rotates the secret and clears handshake", async () => {
  const original = await prisma.cAConnection.findFirstOrThrow({
    where: {
      connectorId: "codex_connector_active_0",
    },
    include: {
      raceProject: {
        include: {
          registration: true,
        },
      },
    },
  });
  await prisma.cAConnection.update({
    where: { id: original.id },
    data: {
      disabledAt: null,
      disabledReason: "",
      handshakeCompletedAt: new Date("2026-06-19T09:00:00Z"),
      ingestionStatus: "ACTIVE",
      secretRotatedAt: null,
      secretVersion: 1,
    },
  });

  const rotated = await rotateCAConnectionSecretForRider({
    caConnectionId: original.id,
    userId: original.raceProject.registration.userId,
  });

  assert.notEqual(rotated.connectorSecret, original.connectorSecret);
  assert.equal(rotated.secretVersion, 2);
  assert.equal(rotated.handshakeCompletedAt, null);
  assert.equal(rotated.ingestionStatus, "CONNECTED");
  assert.ok(rotated.secretRotatedAt);

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "ca_connection.secret_rotated",
      targetId: original.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  assert.equal(audit.result, "accepted");
});

test("rotateCAConnectionSecretForRider rejects non-approved registrations", async () => {
  const [templateRace, rider] = await Promise.all([
    prisma.race.findFirstOrThrow({
      where: {
        id: "race_finished",
      },
    }),
    prisma.user.findFirstOrThrow({
      where: {
        username: "rider_charlie",
      },
    }),
  ]);
  const now = Date.now();
  const race = await prisma.race.create({
    data: {
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
      id: `race_ca_rotate_pending_${Date.now()}`,
      keywordsJson: templateRace.keywordsJson,
      maxTeamSize: templateRace.maxTeamSize,
      organizerComment: "",
      organizerId: templateRace.organizerId,
      raceEnd: new Date(now + 72 * 60 * 60 * 1000),
      raceStart: new Date(now + 48 * 60 * 60 * 1000),
      signupEnd: new Date(now + 24 * 60 * 60 * 1000),
      signupStart: new Date(now - 24 * 60 * 60 * 1000),
      status: "published",
      submissionIntervalHours: templateRace.submissionIntervalHours,
      summary: "ca rotate pending fixture",
      taskDescription: templateRace.taskDescription,
      taskPackageLabel: templateRace.taskPackageLabel,
      title: "CA Rotate Pending Fixture",
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
    },
  });

  try {
    const registration = await prisma.registration.create({
      data: {
        raceId: race.id,
        status: "SUBMITTED",
        userId: rider.id,
      },
    });
    const raceProject = await prisma.raceProject.create({
      data: {
        aggregateIngestionStatus: "CONNECTED",
        registrationId: registration.id,
      },
    });
    const connection = await prisma.cAConnection.create({
      data: {
        caProjectId: `rotate_pending_project_${Date.now()}`,
        caType: "CODEX",
        connectorBaseUrl: "https://connector.example/pending",
        connectorId: `rotate_pending_connector_${Date.now()}`,
        connectorSecret: "rotate-pending-secret",
        connectorVersion: "0.1.0",
        handshakeCompletedAt: new Date("2026-06-19T09:00:00Z"),
        ingestionSource: "CONNECTOR",
        ingestionStatus: "ACTIVE",
        raceProjectId: raceProject.id,
      },
    });

    await assert.rejects(
      () =>
        rotateCAConnectionSecretForRider({
          caConnectionId: connection.id,
          userId: rider.id,
        }),
      /当前报名尚未通过审核/,
    );
  } finally {
    await prisma.race.delete({
      where: {
        id: race.id,
      },
    });
  }
});

test("disableCAConnectionForOrganizer marks the connection disabled and stores a reason", async () => {
  const original = await prisma.cAConnection.findFirstOrThrow({
    where: {
      connectorId: "codex_connector_active_1",
    },
    include: {
      raceProject: {
        include: {
          registration: {
            include: {
              race: true,
            },
          },
        },
      },
    },
  });
  await prisma.cAConnection.update({
    where: { id: original.id },
    data: {
      disabledAt: null,
      disabledReason: "",
    },
  });

  const disabled = await disableCAConnectionForOrganizer({
    caConnectionId: original.id,
    organizerId: original.raceProject.registration.race.organizerId,
    reason: "manual security freeze",
  });

  assert.ok(disabled.disabledAt);
  assert.equal(disabled.disabledReason, "manual security freeze");

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "ca_connection.disabled",
      targetId: original.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  assert.equal(audit.result, "accepted");
});

test("enableCAConnectionForOrganizer clears disabled state without restoring handshake", async () => {
  const original = await prisma.cAConnection.findFirstOrThrow({
    where: {
      connectorId: "codex_connector_active_2",
    },
    include: {
      raceProject: {
        include: {
          registration: {
            include: {
              race: true,
            },
          },
        },
      },
    },
  });
  await prisma.cAConnection.update({
    where: { id: original.id },
    data: {
      disabledAt: new Date("2026-06-19T09:00:00Z"),
      disabledReason: "manual freeze",
      handshakeCompletedAt: null,
    },
  });

  const enabled = await enableCAConnectionForOrganizer({
    caConnectionId: original.id,
    organizerId: original.raceProject.registration.race.organizerId,
  });

  assert.equal(enabled.disabledAt, null);
  assert.equal(enabled.disabledReason, "");
  assert.equal(enabled.handshakeCompletedAt, null);

  const audit = await prisma.securityAudit.findFirstOrThrow({
    where: {
      action: "ca_connection.enabled",
      targetId: original.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  assert.equal(audit.result, "accepted");
});

test("disableCAConnectionForOrganizer rejects foreign organizers even with allowSystem and allows admin/system", async () => {
  const [adminUser, organizerUser, baseConnection] = await Promise.all([
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
    prisma.cAConnection.findFirstOrThrow({
      where: {
        connectorId: "codex_connector_active_1",
      },
      include: {
        raceProject: {
          include: {
            registration: {
              include: {
                race: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const original = await prisma.cAConnection.create({
    data: {
      caProjectId: `scope_disable_project_${Date.now()}`,
      caType: "CODEX",
      connectorBaseUrl: "https://connector.example/scope-disable",
      connectorId: `scope_disable_connector_${Date.now()}`,
      connectorSecret: "scope-disable-secret",
      connectorVersion: "0.1.0",
      ingestionSource: "CONNECTOR",
      ingestionStatus: "CONNECTED",
      raceProjectId: baseConnection.raceProjectId,
    },
  });

  const foreignOrganizer = await prisma.user.create({
    data: {
      passwordHash: organizerUser.passwordHash,
      profileCompleted: true,
      profileName: "Foreign CA Organizer",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_ca_foreign_${Date.now()}`,
    },
  });

  try {
    await prisma.cAConnection.update({
      where: { id: original.id },
      data: {
        disabledAt: null,
        disabledReason: "",
      },
    });

    await assert.rejects(
      async () =>
        disableCAConnectionForOrganizer({
          allowSystem: true,
          caConnectionId: original.id,
          organizerId: foreignOrganizer.id,
          reason: "unauthorized freeze",
        }),
      /CAConnection not found for current operator/,
    );

    const disabled = await disableCAConnectionForOrganizer({
      allowSystem: true,
      caConnectionId: original.id,
      organizerId: adminUser.id,
      reason: "admin freeze",
    });

    assert.ok(disabled.disabledAt);
    assert.equal(disabled.disabledReason, "admin freeze");

    const audit = await prisma.securityAudit.findFirstOrThrow({
      where: {
        action: "ca_connection.disabled",
        targetId: original.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    assert.equal(audit.result, "accepted");
    assert.equal(audit.userId, adminUser.id);
  } finally {
    await prisma.cAConnection.delete({
      where: {
        id: original.id,
      },
    });
    await prisma.user.delete({
      where: {
        id: foreignOrganizer.id,
      },
    });
  }
});

test("enableCAConnectionForOrganizer rejects foreign organizers even with allowSystem and allows admin/system", async () => {
  const [adminUser, organizerUser, baseConnection] = await Promise.all([
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
    prisma.cAConnection.findFirstOrThrow({
      where: {
        connectorId: "codex_connector_active_2",
      },
      include: {
        raceProject: {
          include: {
            registration: {
              include: {
                race: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const original = await prisma.cAConnection.create({
    data: {
      caProjectId: `scope_enable_project_${Date.now()}`,
      caType: "CODEX",
      connectorBaseUrl: "https://connector.example/scope-enable",
      connectorId: `scope_enable_connector_${Date.now()}`,
      connectorSecret: "scope-enable-secret",
      connectorVersion: "0.1.0",
      ingestionSource: "CONNECTOR",
      ingestionStatus: "CONNECTED",
      raceProjectId: baseConnection.raceProjectId,
    },
  });

  const foreignOrganizer = await prisma.user.create({
    data: {
      passwordHash: organizerUser.passwordHash,
      profileCompleted: true,
      profileName: "Foreign CA Organizer Enable",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_ca_enable_foreign_${Date.now()}`,
    },
  });

  try {
    await prisma.cAConnection.update({
      where: { id: original.id },
      data: {
        disabledAt: new Date("2026-07-11T09:00:00Z"),
        disabledReason: "pre-disabled",
        handshakeCompletedAt: null,
      },
    });

    await assert.rejects(
      async () =>
        enableCAConnectionForOrganizer({
          allowSystem: true,
          caConnectionId: original.id,
          organizerId: foreignOrganizer.id,
        }),
      /CAConnection not found for current operator/,
    );

    const enabled = await enableCAConnectionForOrganizer({
      allowSystem: true,
      caConnectionId: original.id,
      organizerId: adminUser.id,
    });

    assert.equal(enabled.disabledAt, null);
    assert.equal(enabled.disabledReason, "");
    assert.equal(enabled.handshakeCompletedAt, null);

    const audit = await prisma.securityAudit.findFirstOrThrow({
      where: {
        action: "ca_connection.enabled",
        targetId: original.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    assert.equal(audit.result, "accepted");
    assert.equal(audit.userId, adminUser.id);
  } finally {
    await prisma.cAConnection.delete({
      where: {
        id: original.id,
      },
    });
    await prisma.user.delete({
      where: {
        id: foreignOrganizer.id,
      },
    });
  }
});
