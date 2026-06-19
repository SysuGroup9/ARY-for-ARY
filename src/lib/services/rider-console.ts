import { getPublishedReviewSummaryForRace, listPublishedRiderReportsForUser } from "@/lib/services/reports";

export async function buildRiderConsoleReportModel(input: {
  raceId: string;
  userId: string;
}) {
  const [reviewSummary, riderReports] = await Promise.all([
    getPublishedReviewSummaryForRace(input.raceId),
    listPublishedRiderReportsForUser(input.userId),
  ]);

  return {
    reviewSummary,
    riderReports,
  };
}
