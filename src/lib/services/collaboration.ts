/**
 * GRS004 协作功能 - 协作交流服务层
 *
 * Team 内指定成员私聊（Send/Receive），消息关联知识库，记录完整历史。
 */

import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validation";

export async function sendMessage(userId: string, input: {
  teamId: string;
  receiverId: string;
  content: string;
  linkedAssetType?: string;
  linkedAssetId?: string;
}) {
  const parsed = sendMessageSchema.parse(input);

  // 验证 sender 和 receiver 都是 Team 的 APPROVED 成员
  const team = await prisma.team.findUnique({
    where: { id: parsed.teamId },
    include: {
      members: { where: { status: "APPROVED" } },
    },
  });
  if (!team) throw new Error("队伍不存在");

  const senderMember = team.members.find(m => m.userId === userId);
  if (!senderMember) throw new Error("只有队伍成员才能发送消息");

  const receiverMember = team.members.find(m => m.userId === parsed.receiverId);
  if (!receiverMember) throw new Error("接收者不是该队伍的活跃成员");

  if (userId === parsed.receiverId) {
    throw new Error("不能给自己发消息");
  }

  return prisma.collaborationMessage.create({
    data: {
      teamId: parsed.teamId,
      senderId: userId,
      receiverId: parsed.receiverId,
      content: parsed.content,
      linkedAssetType: parsed.linkedAssetType ?? "",
      linkedAssetId: parsed.linkedAssetId ?? "",
    },
  });
}

export async function listMessagesForTeam(teamId: string, userId?: string) {
  // 验证用户是 Team 成员（仅当提供了 userId 时）
  if (userId) {
    const member = await prisma.teamMember.findFirst({
      where: { teamId, userId, status: "APPROVED" },
    });
    if (!member) return [];
  }

  return prisma.collaborationMessage.findMany({
    where: { teamId },
    include: {
      sender: { select: { id: true, username: true } },
      receiver: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getConversation(teamId: string, userA: string, userB: string) {
  return prisma.collaborationMessage.findMany({
    where: {
      teamId,
      OR: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
      ],
    },
    include: {
      sender: { select: { id: true, username: true } },
      receiver: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getMessageStats(teamId: string) {
  const count = await prisma.collaborationMessage.count({
    where: { teamId },
  });
  return { totalMessages: count };
}
