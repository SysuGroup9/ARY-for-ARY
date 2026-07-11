import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "@/lib/prisma";
import * as racesService from "@/lib/services/races";

function buildCreateRaceFormData(overrides?: Partial<Record<string, string>>) {
  const formData = new FormData();
  const fields: Record<string, string> = {
    title: "System Scope Race",
    summary: "用于验证管理员代主办方创建赛事的 system scope 测试。",
    taskPackageLabel: "scope-race.zip",
    taskDescription: "实现一个可验证的排序任务，并保证边界输入正确。",
    trainingDataSummary: "包含基础样例与逆序样例。",
    evaluationNotes: "按通过率、代码质量和推理质量综合评估。",
    keywordsText: "排序, 边界条件, 复杂度, 测试",
    tokenLimit: "4000",
    signupStart: "2026-08-01T08:00:00.000Z",
    signupEnd: "2026-08-02T08:00:00.000Z",
    raceStart: "2026-08-02T09:00:00.000Z",
    raceEnd: "2026-08-03T09:00:00.000Z",
    freezeMinutesBeforeEnd: "30",
    updateGranularityMinutes: "15",
    maxTeamSize: "5",
    submissionIntervalHours: "24",
    cloudStudioUrl: "https://cloudstudio.net/",
    trackId: "oval-track",
    trackStartFinishS: "0",
    trackCheckpointsJson:
      '[{"id":"cp-1","name":"检查点 1","s":0.5},{"id":"cp-2","name":"检查点 2","s":0.9}]',
    displayHighlightCount: "3",
    weightTaskPassRate: "1",
    weightCodeReview: "1",
    weightReasoning: "1",
    weightKeywords: "1",
    weightTotalTask: "1",
    weightTotalToken: "1",
    weightTotalDialogue: "1",
    harnessWeightReasoning: "1",
    harnessWeightKeyword: "1",
    ...overrides,
  };

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  formData.set("hasTrainingData", "on");
  formData.set("enableFreeze", "on");
  formData.set("displayShowTrainingData", "on");
  formData.set("displayShowOrganizerComment", "on");
  formData.set("displayShowTopHighlights", "on");
  formData.set("displayShowRiderCode", "on");

  return formData;
}

test("race create service follows organizer and admin system boundaries", async () => {
  const [adminUser, organizerUser, riderUser] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: { username: "admin_demo" },
    }),
    prisma.user.findFirstOrThrow({
      where: { username: "organizer_demo" },
    }),
    prisma.user.findFirstOrThrow({
      where: { username: "rider_alice" },
    }),
  ]);

  const foreignOrganizer = await prisma.user.create({
    data: {
      passwordHash: organizerUser.passwordHash,
      profileCompleted: true,
      profileName: "Foreign Race Creator",
      profileOrgLabel: "ARY",
      rolesJson: JSON.stringify(["ORGANIZER"]),
      username: `organizer_race_create_foreign_${Date.now()}`,
    },
  });

  const createdRaceIds: string[] = [];

  try {
    const organizerCreatedRace = await (
      racesService as {
        createRace: (input: {
          actorUserId: string;
          allowSystem?: boolean;
          formData: FormData;
          organizerId: string;
        }) => Promise<{ id: string; organizerId: string }>;
      }
    ).createRace({
      actorUserId: organizerUser.id,
      formData: buildCreateRaceFormData({
        title: "Organizer Self Create",
      }),
      organizerId: organizerUser.id,
    });

    createdRaceIds.push(organizerCreatedRace.id);
    assert.equal(organizerCreatedRace.organizerId, organizerUser.id);

    const adminCreatedRace = await (
      racesService as {
        createRace: (input: {
          actorUserId: string;
          allowSystem?: boolean;
          formData: FormData;
          organizerId: string;
        }) => Promise<{ id: string; organizerId: string }>;
      }
    ).createRace({
      actorUserId: adminUser.id,
      allowSystem: true,
      formData: buildCreateRaceFormData({
        title: "Admin System Create",
      }),
      organizerId: organizerUser.id,
    });

    createdRaceIds.push(adminCreatedRace.id);
    assert.equal(adminCreatedRace.organizerId, organizerUser.id);

    await assert.rejects(
      async () =>
        (
          racesService as {
            createRace: (input: {
              actorUserId: string;
              allowSystem?: boolean;
              formData: FormData;
              organizerId: string;
            }) => Promise<unknown>;
          }
        ).createRace({
          actorUserId: foreignOrganizer.id,
          allowSystem: true,
          formData: buildCreateRaceFormData({
            title: "Foreign Organizer Create",
          }),
          organizerId: organizerUser.id,
        }),
      /无权为其他主办方创建比赛/,
    );

    await assert.rejects(
      async () =>
        (
          racesService as {
            createRace: (input: {
              actorUserId: string;
              allowSystem?: boolean;
              formData: FormData;
              organizerId: string;
            }) => Promise<unknown>;
          }
        ).createRace({
          actorUserId: adminUser.id,
          allowSystem: true,
          formData: buildCreateRaceFormData({
            title: "Admin Target Rider",
          }),
          organizerId: riderUser.id,
        }),
      /创建赛事时必须选择主办方账号/,
    );
  } finally {
    if (createdRaceIds.length > 0) {
      await prisma.race.deleteMany({
        where: {
          id: {
            in: createdRaceIds,
          },
        },
      });
    }
    await prisma.user.delete({
      where: {
        id: foreignOrganizer.id,
      },
    });
  }
});
