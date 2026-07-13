/**
 * GRS004 协作功能 - Team 服务层
 *
 * 提供 Team 创建、加入、审批、踢出、查询等功能。
 * Team 是新的参赛主体，Registration 降级为个人参赛申请记录。
 */

import { prisma } from "@/lib/prisma";
import { getRacePhase } from "@/lib/race-phase";
import {
  createTeamSchema,
  joinTeamSchema,
  approveMemberSchema,
  removeMemberSchema,
} from "@/lib/validation";

// ---- Team CRUD ----

export async function createTeam(userId: string, input: { raceId: string; name: string }) {
  const parsed = createTeamSchema.parse(input);

  const race = await prisma.race.findUnique({ where: { id: parsed.raceId } });
  if (!race) throw new Error("赛事不存在");

  if (getRacePhase(race) !== "registration") {
    throw new Error("只有报名阶段才能创建队伍");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("用户不存在");

  // 检查用户是否已有队伍（通过 Registration.teamId）
  const existingReg = await prisma.registration.findUnique({
    where: { raceId_userId: { raceId: parsed.raceId, userId } },
  });
  if (existingReg?.teamId) {
    throw new Error("你已有队伍，不能重复创建");
  }

  return prisma.$transaction(async (tx) => {
    // 1. 创建 Team
    const team = await tx.team.create({
      data: {
        raceId: parsed.raceId,
        captainId: userId,
        leaderId: userId,
        name: parsed.name,
      },
    });

    // 2. 创建 TeamMember (Leader, 自动 APPROVED)
    await tx.teamMember.create({
      data: {
        teamId: team.id,
        userId,
        displayName: user.username,
        role: "LEADER",
        status: "APPROVED",
      },
    });

    // 3. 创建或更新 Registration (关联到新 Team)
    if (existingReg) {
      await tx.registration.update({
        where: { id: existingReg.id },
        data: { teamId: team.id },
      });
    } else {
      await tx.registration.create({
        data: {
          raceId: parsed.raceId,
          userId,
          teamId: team.id,
          status: "SUBMITTED",
        },
      });
    }

    return tx.team.findUnique({
      where: { id: team.id },
      include: {
        members: { include: { user: true } },
        leader: true,
      },
    });
  });
}

export async function joinTeam(userId: string, input: { teamId: string }) {
  const parsed = joinTeamSchema.parse(input);

  const team = await prisma.team.findUnique({
    where: { id: parsed.teamId },
    include: {
      members: true,
      race: true,
    },
  });
  if (!team) throw new Error("队伍不存在");

  // 只有已 approved 的 Team 才能被 Mate 加入
  const leaderReg = await prisma.registration.findUnique({
    where: { raceId_userId: { raceId: team.raceId, userId: team.captainId } },
  });
  if (!leaderReg || leaderReg.status !== "APPROVED") {
    throw new Error("该队伍尚未通过审核，暂不能加入");
  }

  // 检查人数限制
  if (team.members.length >= (team.race.maxTeamSize || 5)) {
    throw new Error("队伍人数已满");
  }

  // 检查用户是否已报名此赛事且已有队伍
  const existingReg = await prisma.registration.findUnique({
    where: { raceId_userId: { raceId: team.raceId, userId } },
  });
  if (existingReg?.teamId) {
    throw new Error("你已有队伍，不能加入其他队伍");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("用户不存在");

  return prisma.$transaction(async (tx) => {
    // 1. 创建或更新 Registration (关联到 Team)
    if (existingReg) {
      await tx.registration.update({
        where: { id: existingReg.id },
        data: { teamId: team.id },
      });
    } else {
      await tx.registration.create({
        data: {
          raceId: team.raceId,
          userId,
          teamId: team.id,
          status: "SUBMITTED",
        },
      });
    }

    // 2. 创建 TeamMember (MATE, PENDING, 等待 Leader 审批)
    const member = await tx.teamMember.create({
      data: {
        teamId: team.id,
        userId,
        displayName: user.username,
        role: "MATE",
        status: "PENDING",
      },
    });

    return member;
  });
}

export async function approveMember(leaderId: string, input: { teamId: string; memberId: string }) {
  const parsed = approveMemberSchema.parse(input);

  const team = await prisma.team.findUnique({
    where: { id: parsed.teamId },
  });
  if (!team || team.leaderId !== leaderId) {
    throw new Error("只有队长才能审批成员");
  }

  const member = await prisma.teamMember.findFirst({
    where: { id: parsed.memberId, teamId: parsed.teamId },
  });
  if (!member) throw new Error("成员记录不存在");
  if (member.status !== "PENDING") throw new Error("该成员不在待审批状态");

  // 检查对应的 Registration 是否也已 APPROVED
  // 注意：入队条件 = Registration.APPROVED AND TeamMember.APPROVED
  // 此处只处理 TeamMember 侧的审批
  return prisma.teamMember.update({
    where: { id: member.id },
    data: { status: "APPROVED" },
  });
}

export async function rejectMember(leaderId: string, input: { teamId: string; memberId: string }) {
  const parsed = approveMemberSchema.parse(input);

  const team = await prisma.team.findUnique({
    where: { id: parsed.teamId },
  });
  if (!team || team.leaderId !== leaderId) {
    throw new Error("只有队长才能拒绝成员");
  }

  const member = await prisma.teamMember.findFirst({
    where: { id: parsed.memberId, teamId: parsed.teamId },
  });
  if (!member) throw new Error("成员记录不存在");
  if (member.status !== "PENDING") throw new Error("该成员不在待审批状态");

  return prisma.teamMember.update({
    where: { id: member.id },
    data: { status: "REJECTED" },
  });
}

export async function removeMember(leaderId: string, input: { teamId: string; memberId: string }) {
  const parsed = removeMemberSchema.parse(input);

  const team = await prisma.team.findUnique({
    where: { id: parsed.teamId },
  });
  if (!team || team.leaderId !== leaderId) {
    throw new Error("只有队长才能移除成员");
  }

  const member = await prisma.teamMember.findFirst({
    where: { id: parsed.memberId, teamId: parsed.teamId },
  });
  if (!member) throw new Error("成员记录不存在");
  if (member.role === "LEADER") throw new Error("不能移除队长");
  if (member.status === "REMOVED") throw new Error("该成员已被移除");

  return prisma.teamMember.update({
    where: { id: member.id },
    data: { status: "REMOVED" },
  });
}

export async function getTeamDetail(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: { status: { not: "REMOVED" } },
        include: { user: true },
      },
      leader: true,
      race: true,
      raceProject: true,
      works: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });
}

export async function listTeamsForRace(raceId: string) {
  return prisma.team.findMany({
    where: { raceId },
    include: {
      members: {
        where: { status: { not: "REMOVED" } },
        include: { user: true },
      },
      leader: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTeamForUser(raceId: string, userId: string) {
  const registration = await prisma.registration.findUnique({
    where: { raceId_userId: { raceId, userId } },
    include: { team: true },
  });
  return registration?.team ?? null;
}

export async function getActiveMembers(teamId: string) {
  return prisma.teamMember.findMany({
    where: {
      teamId,
      status: { in: ["APPROVED"] },
    },
    include: { user: true },
  });
}

export async function getTeamForCaptain(userId: string, raceId: string) {
  return prisma.team.findFirst({
    where: { raceId, leaderId: userId },
    include: {
      members: {
        where: { status: { not: "REMOVED" } },
        include: { user: true },
      },
      leader: true,
      works: { orderBy: { updatedAt: "desc" }, take: 1 },
      submissions: { take: 1 },
    },
  });
}

export async function updateTeamComment(input: {
  allowSystem: boolean;
  organizerId: string;
  raceId: string;
  teamId: string;
  content: string;
}) {
  return prisma.teamComment.upsert({
    where: { raceId_teamId: { raceId: input.raceId, teamId: input.teamId } },
    create: {
      raceId: input.raceId,
      teamId: input.teamId,
      content: input.content,
    },
    update: {
      content: input.content,
    },
  });
}
