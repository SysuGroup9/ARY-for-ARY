import { prisma } from "@/lib/prisma";
import { listAwardsForRace } from "@/lib/services/awards";
import { listJudgingRecordsForRace } from "@/lib/services/judging";

export async function buildPublicReviewModel(raceId: string) {
  const [awards, judgingRecords, evidenceHighlights] = await Promise.all([
    listAwardsForRace(raceId),
    listJudgingRecordsForRace(raceId),
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
