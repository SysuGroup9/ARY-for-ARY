import { prisma } from "@/lib/prisma";
import { listPublishedAwardsForRace } from "@/lib/services/awards";
import { listJudgingRecordsForRace } from "@/lib/services/judging";

export async function buildPublicReviewModel(raceId: string) {
  const [awards, judgingRecords, evidenceHighlights] = await Promise.all([
    listPublishedAwardsForRace(raceId),
    listJudgingRecordsForRace(raceId, { submittedOnly: true }),
    prisma.evidence.findMany({
      where: {
        registration: {
          raceId,
        },
        visibility: "PUBLIC",
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        summary: true,
        title: true,
      },
      take: 8,
    }),
  ]);

  return {
    awards,
    evidenceHighlights,
    judgingRecords,
  };
}
