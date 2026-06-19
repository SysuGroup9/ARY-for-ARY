import {
  buildPublicSiteModel,
  buildRaceSlug,
  buildWorkSlug,
  getRaceIdFromSlug,
  getRiderIdFromSlug,
  getWorkPartsFromSlug,
} from "@/lib/public-site";
import { prisma } from "@/lib/prisma";
import { listRaces } from "@/lib/services/races";
import { getPublishedReviewSummaryForRace, listPublishedRiderReportsForUser } from "@/lib/services/reports";
import { getWorkForLegacyTeamSlug, getWorkForPublicSlug } from "@/lib/services/works";

export async function getRaceBySlug(raceSlug: string) {
  const races = await listRaces();
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
    evidenceSummaries: work.registration.evidences.map((evidence) => evidence.summary),
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
  const races = await listRaces();
  const model = buildPublicSiteModel(races);
  const rider = model.featuredRiders.find((item) => item.id === riderId);

  if (!rider) {
    return null;
  }

  const registrations = await prisma.registration.findMany({
    where: {
      userId: riderId,
    },
    include: {
      awards: true,
      evidences: true,
      race: true,
      raceProject: {
        include: {
          caConnections: {
            include: {
              sessions: true,
            },
          },
        },
      },
      work: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const riderReports = await listPublishedRiderReportsForUser(riderId);
  const reviewReports = await Promise.all(
    registrations.map((registration) => getPublishedReviewSummaryForRace(registration.raceId)),
  );
  const works = await prisma.work.findMany({
    where: {
      registration: {
        userId: riderId,
      },
    },
    include: {
      judgeAssignments: {
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

  const raceRecords = registrations.map((registration) => ({
    awardNames: registration.awards.map((award) => award.awardName),
    awardScore: registration.awards[0]?.rank ?? null,
    comment:
      reviewReports.find((report) => report?.raceId === registration.raceId)?.summary ?? null,
    evidenceCount: registration.evidences.length,
    phase: registration.race.raceEnd < new Date() ? "finished" : "active",
    raceId: registration.race.id,
    raceSlug: buildRaceSlug(registration.race.id, registration.race.title),
    raceTitle: registration.race.title,
    workTitle: registration.work?.title ?? null,
  }));
  const allSessions = registrations.flatMap((registration) =>
    registration.raceProject?.caConnections.flatMap(
      (connection) => connection.sessions,
    ) ?? [],
  );
  const totalTokens = allSessions.reduce(
    (sum, session) => sum + session.tokenCost,
    0,
  );
  const progressSamples = allSessions
    .map((session) => session.progressPercent)
    .filter((value): value is number => typeof value === "number");
  const averageProgressPercent = progressSamples.length
    ? Math.round(
        progressSamples.reduce((sum, value) => sum + value, 0) /
          progressSamples.length,
      )
    : 0;
  const riskCount = allSessions.filter(
    (session) => session.riskLevel && session.riskLevel !== "low" && session.riskLevel !== "none",
  ).length;
  const judgeComments = works.flatMap((work) =>
    work.judgeAssignments
      .filter((assignment) => assignment.judgingRecord?.comments)
      .map((assignment) => ({
        raceTitle: work.registration.race.title,
        summary: assignment.judgingRecord!.comments,
      })),
  );
  const derivedSkillTags = new Set<string>();
  if (totalTokens > 0) {
    derivedSkillTags.add("成本控制");
  }
  if (riskCount > 0) {
    derivedSkillTags.add("风险处理");
  }
  if (judgeComments.length > 0 || riderReports.length > 0) {
    derivedSkillTags.add("复盘表达");
  }

  return {
    ...rider,
    judgeComments,
    performanceSummary: {
      averageProgressPercent,
      riskCount,
      totalTokens,
    },
    publicWorkLinks: registrations
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
    raceRecords,
    reportSummaries: riderReports.map((report) => report.summary),
    skillTags: [...derivedSkillTags],
  };
}
