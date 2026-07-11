import { buildPayloadDigest } from "@/lib/ca-integrity-helpers";
import { readJudgingScoreTotal } from "@/lib/judging-helpers";
import { verifyWorkReadIntegrity } from "@/lib/material-integrity-helpers";
import { prisma } from "@/lib/prisma";
import { buildAwardSourceRef } from "@/lib/result-reference-freeze-helpers";
import { hasRole, parseRolesJson } from "@/lib/user-roles";

const FORMAL_AWARD_DEFINITIONS = [
  {
    awardName: "Best Overall",
    scoreOf: (candidate: AwardCandidate) =>
      candidate.averageResultScore + candidate.averageRidingScore,
  },
  {
    awardName: "Best Work",
    scoreOf: (candidate: AwardCandidate) => candidate.averageResultScore,
  },
  {
    awardName: "Best Agent Rider",
    scoreOf: (candidate: AwardCandidate) => candidate.averageRidingScore,
  },
] as const;

type AwardCandidate = {
  averageResultScore: number;
  averageRidingScore: number;
  evidenceRefs: Array<{
    id: string;
    sourceDigest: string;
    type: string;
  }>;
  recordCount: number;
  registrationId: string;
  userId: string;
  work: null | {
    contentHash: string;
    id: string;
    title: string;
  };
};

type ComputedAwardDraft = {
  awardName: string;
  decisionReason: string;
  rank: number;
  registrationId: string;
  sourceDigest: string;
  sourceRefJson: string;
  workId: null | string;
};

async function listAwardsForRaceInternal(input: {
  publishedOnly: boolean;
  raceId: string;
}) {
  const awards = await prisma.award.findMany({
    where: {
      raceId: input.raceId,
      ...(input.publishedOnly
        ? {
            publishedAt: {
              not: null,
            },
          }
        : {}),
    },
    include: {
      registration: {
        include: {
          user: true,
        },
      },
      work: true,
    },
    orderBy: [
      {
        awardName: "asc",
      },
      {
        rank: "asc",
      },
    ],
  });

  return Promise.all(
    awards.map(async (award) => ({
      ...award,
      work:
        award.work && (await verifyWorkReadIntegrity({ work: award.work })).ok
          ? award.work
          : null,
    })),
  );
}

export async function listAwardsForRace(raceId: string) {
  return listAwardsForRaceInternal({
    publishedOnly: false,
    raceId,
  });
}

export async function listPublishedAwardsForRace(raceId: string) {
  return listAwardsForRaceInternal({
    publishedOnly: true,
    raceId,
  });
}

async function getRaceForManagedAwardAction(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
}) {
  const [race, user] = await Promise.all([
    prisma.race.findUnique({
      where: {
        id: input.raceId,
      },
    }),
    prisma.user.findUnique({
      where: {
        id: input.organizerId,
      },
      select: {
        rolesJson: true,
      },
    }),
  ]);

  const userRoles = user ? parseRolesJson(user.rolesJson) : [];
  const canUseSystem =
    Boolean(input.allowSystem) && hasRole(userRoles, "ADMIN");

  if (!race || (race.organizerId !== input.organizerId && !canUseSystem)) {
    throw new Error("无权操作这场比赛的正式榜单");
  }

  return race;
}

async function buildComputedAwardDrafts(raceId: string) {
  const judgingRecords = await prisma.judgingRecord.findMany({
    where: {
      submittedAt: {
        not: null,
      },
      judgeAssignment: {
        work: {
          registration: {
            raceId,
          },
        },
      },
    },
    include: {
      judgeAssignment: {
        include: {
          work: {
            include: {
              registration: {
                include: {
                  evidences: {
                    orderBy: {
                      createdAt: "asc",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [
      {
        submittedAt: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });

  const candidatesByRegistrationId = new Map<
    string,
    AwardCandidate & { resultScoreSum: number; ridingScoreSum: number }
  >();

  for (const record of judgingRecords) {
    const registration = record.judgeAssignment.work.registration;
    const resultScore = readJudgingScoreTotal(record.scoreResultJson);
    const ridingScore = readJudgingScoreTotal(record.scoreRidingJson);
    const existing = candidatesByRegistrationId.get(registration.id);

    if (existing) {
      existing.recordCount += 1;
      existing.resultScoreSum += resultScore;
      existing.ridingScoreSum += ridingScore;
      existing.averageResultScore = Number(
        (existing.resultScoreSum / existing.recordCount).toFixed(2),
      );
      existing.averageRidingScore = Number(
        (existing.ridingScoreSum / existing.recordCount).toFixed(2),
      );
      continue;
    }

    candidatesByRegistrationId.set(registration.id, {
      averageResultScore: resultScore,
      averageRidingScore: ridingScore,
      evidenceRefs: registration.evidences.map((evidence) => ({
        id: evidence.id,
        sourceDigest: evidence.sourceDigest,
        type: evidence.type,
      })),
      recordCount: 1,
      registrationId: registration.id,
      resultScoreSum: resultScore,
      ridingScoreSum: ridingScore,
      userId: registration.userId,
      work: {
        contentHash: record.judgeAssignment.work.contentHash,
        id: record.judgeAssignment.work.id,
        title: record.judgeAssignment.work.title,
      },
    });
  }

  const candidates = [...candidatesByRegistrationId.values()];

  if (candidates.length === 0) {
    throw new Error("当前还没有已提交的 JudgingRecord，无法生成正式榜单");
  }

  const computedAwards: ComputedAwardDraft[] = [];

  for (const definition of FORMAL_AWARD_DEFINITIONS) {
    const winner = [...candidates].sort((left, right) => {
      const scoreDiff = definition.scoreOf(right) - definition.scoreOf(left);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return left.registrationId.localeCompare(right.registrationId);
    })[0];

    if (!winner) {
      continue;
    }

    const sourceRef = buildAwardSourceRef({
      evidences: winner.evidenceRefs,
      registration: {
        id: winner.registrationId,
        userId: winner.userId,
      },
      work: winner.work,
    });
    const sourceDigest = buildPayloadDigest(sourceRef);
    const totalScore = Number(
      (winner.averageResultScore + winner.averageRidingScore).toFixed(2),
    );

    computedAwards.push({
      awardName: definition.awardName,
      decisionReason: `Published from ${winner.recordCount} submitted JudgingRecord(s): result ${winner.averageResultScore}, riding ${winner.averageRidingScore}, total ${totalScore}.`,
      rank: 1,
      registrationId: winner.registrationId,
      sourceDigest,
      sourceRefJson: JSON.stringify(sourceRef),
      workId: winner.work?.id ?? null,
    });
  }

  return computedAwards;
}

export async function generateAwardDraftsForRace(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
}) {
  await getRaceForManagedAwardAction(input);
  const computedAwards = await buildComputedAwardDrafts(input.raceId);

  return prisma.$transaction(async (tx) => {
    const draftedAwards = [];

    for (const award of computedAwards) {
      draftedAwards.push(
        await tx.award.upsert({
          where: {
            raceId_awardName_rank: {
              awardName: award.awardName,
              raceId: input.raceId,
              rank: award.rank,
            },
          },
          update: {
            decisionReason: award.decisionReason,
            publishedAt: null,
            registrationId: award.registrationId,
            sourceDigest: award.sourceDigest,
            sourceRefJson: award.sourceRefJson,
            workId: award.workId,
          },
          create: {
            awardName: award.awardName,
            decisionReason: award.decisionReason,
            publishedAt: null,
            raceId: input.raceId,
            rank: award.rank,
            registrationId: award.registrationId,
            sourceDigest: award.sourceDigest,
            sourceRefJson: award.sourceRefJson,
            workId: award.workId,
          },
        }),
      );
    }

    return draftedAwards;
  });
}

export async function updateAwardDraftForRace(input: {
  allowSystem?: boolean;
  awardId: string;
  awardName: string;
  decisionReason: string;
  organizerId: string;
  rank: number;
}) {
  const [award, user] = await Promise.all([
    prisma.award.findUnique({
      where: {
        id: input.awardId,
      },
      include: {
        race: true,
      },
    }),
    prisma.user.findUnique({
      where: {
        id: input.organizerId,
      },
      select: {
        rolesJson: true,
      },
    }),
  ]);

  const userRoles = user ? parseRolesJson(user.rolesJson) : [];
  const canUseSystem =
    Boolean(input.allowSystem) && hasRole(userRoles, "ADMIN");

  if (
    !award ||
    (award.race.organizerId !== input.organizerId && !canUseSystem)
  ) {
    throw new Error("无权编辑这份 Award 草稿");
  }

  if (award.publishedAt) {
    throw new Error("已发布 Award 不能直接编辑，请先撤回回草稿态");
  }

  const conflictingAward = await prisma.award.findFirst({
    where: {
      awardName: input.awardName,
      id: {
        not: award.id,
      },
      raceId: award.raceId,
      rank: input.rank,
    },
  });

  if (conflictingAward) {
    throw new Error("award draft slot already exists");
  }

  return prisma.award.update({
    where: {
      id: award.id,
    },
    data: {
      awardName: input.awardName,
      decisionReason: input.decisionReason,
      rank: input.rank,
    },
  });
}

export async function publishAwardsForRace(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
}) {
  await generateAwardDraftsForRace(input);
  const publishedAt = new Date();

  return prisma.$transaction(async (tx) => {
    await tx.award.updateMany({
      where: {
        raceId: input.raceId,
      },
      data: {
        publishedAt,
      },
    });

    return tx.award.findMany({
      orderBy: [
        {
          awardName: "asc",
        },
        {
          rank: "asc",
        },
      ],
      where: {
        raceId: input.raceId,
      },
    });
  });
}

export async function withdrawPublishedAwardsForRace(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
}) {
  await getRaceForManagedAwardAction(input);

  return prisma.$transaction(async (tx) => {
    await tx.award.updateMany({
      where: {
        publishedAt: {
          not: null,
        },
        raceId: input.raceId,
      },
      data: {
        publishedAt: null,
      },
    });

    return tx.award.findMany({
      orderBy: [
        {
          awardName: "asc",
        },
        {
          rank: "asc",
        },
      ],
      where: {
        raceId: input.raceId,
      },
    });
  });
}
