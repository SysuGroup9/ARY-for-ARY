import {
  getPublishedReviewSummaryForRace,
  listPrivateRiderReportsForUserInRace,
} from "@/lib/services/reports";

export async function buildRiderConsoleReportModel(input: {
  raceId: string;
  userId: string;
}) {
  const [reviewSummary, riderReports] = await Promise.all([
    getPublishedReviewSummaryForRace(input.raceId),
    listPrivateRiderReportsForUserInRace({
      raceId: input.raceId,
      userId: input.userId,
    }),
  ]);

  return {
    reviewSummary,
    riderReports,
  };
}
