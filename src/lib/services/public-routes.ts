import {
  buildRaceSlug,
  buildWorkSlug,
  getRaceIdFromSlug,
  getRiderIdFromSlug,
  getWorkPartsFromSlug,
} from "@/lib/public-site";
import { buildRankedLeaderboardEntries } from "@/lib/leaderboard";
import { verifyWorkReadIntegrity } from "@/lib/material-integrity-helpers";
import { prisma } from "@/lib/prisma";
import { listRaces } from "@/lib/services/races";
import { getPublishedReviewSummaryForRace } from "@/lib/services/reports";
import {
  getWorkForLegacyTeamSlug,
  getWorkForPublicSlug,
  sanitizePublicWork,
} from "@/lib/services/works";
import { getRacePhase } from "@/lib/race-phase";
import { normalizeScreenDisplayState } from "@/lib/services/screen-display";
import { parseKeywords } from "@/lib/services/scoring";

export async function listPublicRaces() {
  const races = await prisma.race.findMany({
    include: {
      announcements: {
        where: {
          publishedAt: {
            not: null,
          },
          visibility: "PUBLIC",
        },
        orderBy: [
          {
            publishedAt: "desc",
          },
          {
            updatedAt: "desc",
          },
        ],
      },
      awards: {
        where: {
          publishedAt: {
            not: null,
          },
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
      },
      highlights: {
        include: {
          team: true,
        },
        orderBy: {
          score: "desc",
        },
      },
      leaderboardEntries: {
        include: {
          team: true,
        },
        orderBy: [
          {
            totalScore: "desc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
      projections: {
        orderBy: {
          updatedAt: "desc",
        },
      },
      screenDisplay: true,
      registrations: {
        include: {
          awards: {
            where: {
              publishedAt: {
                not: null,
              },
            },
          },
          evidences: {
            where: {
              visibility: "PUBLIC",
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          raceProject: {
            include: {
              caConnections: {
                orderBy: {
                  registeredAt: "desc",
                },
                select: {
                  id: true,
                  ingestionStatus: true,
                },
              },
            },
          },
          work: true,
          user: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      teamArchives: {
        include: {
          team: true,
        },
        orderBy: {
          totalScore: "desc",
        },
      },
      teams: {
        include: {
          captain: {
            select: {
              id: true,
              username: true,
            },
          },
          members: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const publicRaces = await Promise.all(
    races.map(async (race) => ({
      ...race,
      awards: await Promise.all(
        race.awards.map(async (award) => ({
          ...award,
          work:
            award.work && (await verifyWorkReadIntegrity({ work: award.work })).ok
              ? award.work
              : null,
        })),
      ),
      keywords: parseKeywords(race.keywordsJson),
      leaderboardEntries: buildRankedLeaderboardEntries(race.leaderboardEntries),
      phase: getRacePhase(race),
      screenDisplay: normalizeScreenDisplayState(race.screenDisplay),
      registrations: await Promise.all(
        race.registrations.map(async (registration) => ({
          ...registration,
          work: await sanitizePublicWork(registration.work),
        })),
      ),
    })),
  );

  return publicRaces.filter((race) => race.phase !== "draft");
}

export type PublicRaceListItem = Awaited<ReturnType<typeof listPublicRaces>>[number];

export async function getRaceBySlug(raceSlug: string) {
  const races = await listPublicRaces();
  const exactMatch = races.find(
    (item) => buildRaceSlug(item.id, item.title) === raceSlug,
  );
  const race = exactMatch ?? races.find((item) => item.id === getRaceIdFromSlug(raceSlug));

  if (!race) {
    return null;
  }

  return {
    ...race,
    slug: buildRaceSlug(race.id, race.title),
  };
}

export async function getWorkBySlug(workSlug: string) {
  const { raceId, workId } = getWorkPartsFromSlug(workSlug);
  const work =
    (await getWorkForPublicSlug({ raceId, workId })) ??
    (await getWorkForLegacyTeamSlug({ raceId, teamId: workId }));

  if (!work) {
    return null;
  }

  return {
    awards: work.awards,
    author: work.registration.user.username,
    demoUrl: work.demoUrl,
    evidenceSummaries: filterPublicEvidences(work.registration.evidences).map(
      (evidence) => evidence.summary,
    ),
    excerpt: work.summary,
    id: workSlug,
    judgeComments: work.judgeAssignments
      .filter((assignment) => assignment.judgingRecord?.comments)
      .map((assignment) => ({
        judgeName: assignment.judge.username,
        summary: assignment.judgingRecord!.comments,
      })),
    raceSlug: buildRaceSlug(work.registration.race.id, work.registration.race.title),
    raceTitle: work.registration.race.title,
    repoUrl: work.repoUrl,
    score: work.awards[0] ? 100 - work.awards[0].rank + 1 : 0,
    techNotes: work.techNotes,
    title: work.title,
    videoUrl: work.videoUrl,
  };
}

export async function getRiderBySlug(riderSlug: string) {
  const riderId = getRiderIdFromSlug(riderSlug);
  const rider = await prisma.user.findUnique({
    where: {
      id: riderId,
    },
    select: {
      id: true,
      profileOrgLabel: true,
      username: true,
    },
  });

  if (!rider) {
    return null;
  }

  const registrations = await prisma.registration.findMany({
    where: {
      userId: riderId,
    },
    include: {
      awards: {
        where: {
          publishedAt: {
            not: null,
          },
        },
      },
      evidences: {
        where: {
          visibility: "PUBLIC",
        },
      },
      race: {
        include: {
          projections: true,
        },
      },
      work: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (registrations.length === 0) {
    return null;
  }

  const sanitizedRegistrations = await Promise.all(
    registrations.map(async (registration) => ({
      ...registration,
      work: await sanitizePublicWork(registration.work),
    })),
  );

  const reviewReports = await Promise.all(
    sanitizedRegistrations.map((registration) =>
      getPublishedReviewSummaryForRace(registration.raceId),
    ),
  );
  const rawWorks = await prisma.work.findMany({
    where: {
      registration: {
        userId: riderId,
      },
    },
    include: {
      judgeAssignments: {
        where: {
          judgingRecord: {
            submittedAt: {
              not: null,
            },
          },
        },
        include: {
          judge: true,
          judgingRecord: true,
        },
      },
      registration: {
        include: {
          race: true,
        },
      },
    },
  });
  const works = (
    await Promise.all(
      rawWorks.map((work) => sanitizePublicWork(work)),
    )
  ).filter((work): work is (typeof rawWorks)[number] => !!work);

  const raceRecords = sanitizedRegistrations.map((registration) => ({
    awardNames: registration.awards.map((award) => award.awardName),
    awardScore: registration.awards[0]?.rank ?? null,
    comment:
      reviewReports.find((report) => report?.raceId === registration.raceId)
        ?.summary ?? null,
    evidenceCount: registration.evidences.length,
    phase: registration.race.raceEnd < new Date() ? "finished" : "active",
    raceId: registration.race.id,
    raceSlug: buildRaceSlug(registration.race.id, registration.race.title),
    raceTitle: registration.race.title,
    workTitle: registration.work?.title ?? null,
  }));
  const performanceSummary = buildPublicRiderPerformanceSummary(
    sanitizedRegistrations,
  );
  const judgeComments = works.flatMap((work) =>
    work.judgeAssignments
      .filter((assignment) => assignment.judgingRecord?.comments)
      .map((assignment) => ({
        raceTitle: work.registration.race.title,
        summary: assignment.judgingRecord!.comments,
      })),
  );
  const derivedSkillTags = new Set<string>();
  if (performanceSummary.totalTokens > 0) {
    derivedSkillTags.add("成本控制");
  }
  if (performanceSummary.riskCount > 0) {
    derivedSkillTags.add("风险处理");
  }
  if (judgeComments.length > 0 || reviewReports.some(Boolean)) {
    derivedSkillTags.add("复盘表达");
  }

  return {
    featuredRaceTitle: sanitizedRegistrations[0]?.race.title ?? null,
    featuredWorkTitle:
      sanitizedRegistrations.find((registration) => registration.work)?.work
        ?.title ?? null,
    judgeComments,
    orgLabel: rider.profileOrgLabel || "ARY",
    performanceSummary,
    publicWorkLinks: sanitizedRegistrations
      .filter((registration) => registration.work)
      .map((registration) => {
        return {
          href: `/works/${buildWorkSlug(
            registration.race.id,
            registration.work!.id,
            registration.work!.title,
          )}`,
          title: registration.work!.title,
        };
      }),
    raceCount: sanitizedRegistrations.length,
    raceRecords,
    reportSummaries: [],
    skillTags: [...derivedSkillTags],
    username: rider.username,
    workCount: sanitizedRegistrations.filter((registration) => registration.work)
      .length,
  };
}

function buildPublicRiderPerformanceSummary(
  registrations: Array<{
    id: string;
    race: {
      projections: Array<{
        payloadJson: string;
        type: string;
      }>;
    };
  }>,
) {
  const progressSamples = registrations
    .map((registration) =>
      parseCurrentLeaderboardProjection(registration.race.projections).find(
        (entry) => entry.entryId === registration.id,
      )?.progressPercent,
    )
    .filter((value): value is number => typeof value === "number");
  const totalTokens = registrations.reduce((sum, registration) => {
    const tokenCost =
      parseCostProjection(registration.race.projections).find(
        (entry) => entry.registrationId === registration.id,
      )?.tokenCost ?? 0;
    return sum + tokenCost;
  }, 0);
  const riskCount = registrations.filter((registration) => {
    const aggregateIngestionStatus =
      parseRiskProjection(registration.race.projections).find(
        (entry) => entry.registrationId === registration.id,
      )?.aggregateIngestionStatus ?? "NOT_CONFIGURED";
    return (
      aggregateIngestionStatus === "FAILED" ||
      aggregateIngestionStatus === "NOT_CONFIGURED"
    );
  }).length;

  return {
    averageProgressPercent: progressSamples.length
      ? Math.round(
          progressSamples.reduce((sum, value) => sum + value, 0) /
            progressSamples.length,
        )
      : 0,
    riskCount,
    totalTokens,
  };
}

function parseCurrentLeaderboardProjection(
  projections: Array<{ payloadJson: string; type: string }>,
): Array<{
  entryId: string;
  progressPercent?: number;
}> {
  return parseProjectionArray<{
    entryId: string;
    progressPercent?: number;
  }>(projections, "CURRENT_LEADERBOARD");
}

function parseCostProjection(
  projections: Array<{ payloadJson: string; type: string }>,
): Array<{
  registrationId: string;
  tokenCost: number;
}> {
  return parseProjectionArray<{
    registrationId: string;
    tokenCost: number;
  }>(projections, "COST");
}

function parseRiskProjection(
  projections: Array<{ payloadJson: string; type: string }>,
): Array<{
  aggregateIngestionStatus: string;
  registrationId: string;
}> {
  return parseProjectionArray<{
    aggregateIngestionStatus: string;
    registrationId: string;
  }>(projections, "RISK");
}

function parseProjectionArray<T>(
  projections: Array<{ payloadJson: string; type: string }>,
  type: string,
): T[] {
  const payloadJson = projections.find((projection) => projection.type === type)
    ?.payloadJson;
  if (!payloadJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(payloadJson);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function filterPublicEvidences<
  T extends {
    visibility?: null | string;
  },
>(evidences: T[]) {
  return evidences.filter(
    (evidence) => String(evidence.visibility ?? "").toUpperCase() === "PUBLIC",
  );
}
