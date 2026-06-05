import { prisma } from "@/lib/prisma";
import { getRacePhase } from "@/lib/race-phase";
import { parseMembers } from "@/lib/services/scoring";
import { registerTeamSchema } from "@/lib/validation";

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

export async function registerTeam(captainId: string, formData: FormData) {
  const parsed = registerTeamSchema.parse({
    raceId: formData.get("raceId"),
    teamName: formData.get("teamName"),
    membersText: formData.get("membersText"),
  });

  const race = await prisma.race.findUnique({
    where: {
      id: parsed.raceId,
    },
  });

  if (!race) {
    throw new Error("赛事不存在");
  }

  if (getRacePhase(race) !== "registration") {
    throw new Error("当前不在报名阶段");
  }

  const existing = await prisma.team.findFirst({
    where: {
      raceId: parsed.raceId,
      captainId,
    },
  });

  if (existing) {
    throw new Error("你已经报名过这场比赛");
  }

  const members = parseMembers(parsed.membersText);
  if (members.length > race.maxTeamSize) {
    throw new Error(`本场比赛每组最多 ${race.maxTeamSize} 人`);
  }

  return prisma.team.create({
    data: {
      raceId: parsed.raceId,
      captainId,
      name: parsed.teamName,
      members: {
        create: members.map((displayName) => ({
          displayName,
          userId: null,
        })),
      },
    },
    include: {
      members: true,
    },
  });
}

export async function updateTeamComment(input: {
  organizerId: string;
  raceId: string;
  teamId: string;
  content: string;
}) {
  const race = await prisma.race.findUnique({
    where: {
      id: input.raceId,
    },
  });

  if (!race || race.organizerId !== input.organizerId) {
    throw new Error("无权修改队伍评语");
  }

  return prisma.teamComment.upsert({
    where: {
      raceId_teamId: {
        raceId: input.raceId,
        teamId: input.teamId,
      },
    },
    update: {
      content: input.content.trim(),
    },
    create: {
      raceId: input.raceId,
      teamId: input.teamId,
      content: input.content.trim(),
    },
  });
}
