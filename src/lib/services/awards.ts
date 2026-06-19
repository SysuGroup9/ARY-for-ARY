import { prisma } from "@/lib/prisma";

export async function listAwardsForRace(raceId: string) {
  return prisma.award.findMany({
    where: {
      raceId,
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
}
