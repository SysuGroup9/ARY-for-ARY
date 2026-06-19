import { prisma } from "@/lib/prisma";

export async function getCompatibilityContainerForRegistration(input: {
  raceId: string;
  userId: string;
}) {
  return prisma.team.findFirst({
    where: {
      captainId: input.userId,
      raceId: input.raceId,
    },
    include: {
      members: true,
    },
  });
}
