import { prisma } from "@/lib/prisma";
import { getRacePhase } from "@/lib/race-phase";
import { assertManagedRaceActionAccess } from "@/lib/services/races";

export async function getTeamForCaptain(raceId: string, captainId: string) {
  return prisma.team.findFirst({
    where: {
      raceId,
      captainId,
    },
    include: {
      members: true,
    },
  });
}

export async function updateTeamComment(input: {
  allowSystem?: boolean;
  organizerId: string;
  raceId: string;
  teamId: string;
  content: string;
}) {
  await assertManagedRaceActionAccess({
    allowSystem: input.allowSystem,
    errorMessage: "无权修改队伍评语",
    raceId: input.raceId,
    userId: input.organizerId,
  });

  const team = await prisma.team.findUnique({
    where: {
      id: input.teamId,
    },
    select: {
      captainId: true,
      id: true,
      raceId: true,
    },
  });

  if (!team || team.raceId !== input.raceId) {
    throw new Error("队伍不存在");
  }

  const registration = await prisma.registration.findUnique({
    where: {
      raceId_userId: {
        raceId: input.raceId,
        userId: team.captainId,
      },
    },
    select: {
      id: true,
    },
  });

  const existingComment = registration
    ? await prisma.teamComment.findFirst({
        where: {
          raceId: input.raceId,
          registrationId: registration.id,
        },
      })
    : await prisma.teamComment.findFirst({
        where: {
          raceId: input.raceId,
          teamId: input.teamId,
        },
      });

  const payload = {
    content: input.content.trim(),
    raceId: input.raceId,
    registrationId: registration?.id ?? null,
    teamId: input.teamId,
  };

  if (existingComment) {
    return prisma.teamComment.update({
      where: {
        id: existingComment.id,
      },
      data: payload,
    });
  }

  return prisma.teamComment.create({
    data: payload,
  });
}
