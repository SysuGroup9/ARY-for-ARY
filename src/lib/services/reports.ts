import { ReportType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function getPublishedReviewSummaryForRace(raceId: string) {
  return prisma.report.findFirst({
    where: {
      raceId,
      status: "PUBLISHED",
      type: ReportType.REVIEW_SUMMARY,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });
}

export async function getPublishedRaceReportForRace(raceId: string) {
  return prisma.report.findFirst({
    where: {
      raceId,
      status: "PUBLISHED",
      type: ReportType.RACE_REPORT,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });
}

export async function listPublishedRiderReportsForUser(userId: string) {
  return prisma.report.findMany({
    where: {
      status: "PUBLISHED",
      subjectRegistration: {
        userId,
      },
      type: ReportType.RIDER_REPORT,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });
}
