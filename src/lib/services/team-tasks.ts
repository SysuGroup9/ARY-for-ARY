/**
 * GRS004 协作功能 - TeamTask 服务层
 *
 * Leader 发布任务 → Mate 确认完成 → 看板同步状态
 */

import { prisma } from "@/lib/prisma";
import { createTaskSchema, completeTaskSchema } from "@/lib/validation";

export async function createTask(userId: string, input: {
  teamId: string;
  title: string;
  description?: string;
  assigneeId: string;
}) {
  const parsed = createTaskSchema.parse(input);

  // 验证调用者是 Team Leader
  const team = await prisma.team.findUnique({
    where: { id: parsed.teamId },
    include: { members: { where: { status: "APPROVED" } } },
  });
  if (!team) throw new Error("队伍不存在");
  if (team.leaderId !== userId) throw new Error("只有队长才能发布任务");

  // 验证 assignee 是 APPROVED 成员
  const assignee = team.members.find(m => m.userId === parsed.assigneeId);
  if (!assignee) throw new Error("指定的负责人不是该队伍的活跃成员");

  return prisma.teamTask.create({
    data: {
      teamId: parsed.teamId,
      creatorId: userId,
      assigneeId: parsed.assigneeId,
      title: parsed.title,
      description: parsed.description ?? "",
      status: "TODO",
    },
  });
}

export async function completeTask(userId: string, input: { taskId: string }) {
  const parsed = completeTaskSchema.parse(input);

  const task = await prisma.teamTask.findUnique({
    where: { id: parsed.taskId },
    include: { team: true },
  });
  if (!task) throw new Error("任务不存在");

  // 只有被分配者或 Leader 可以标记完成
  if (task.assigneeId !== userId && task.team.leaderId !== userId) {
    throw new Error("只有任务负责人或队长才能标记完成");
  }

  if (task.status === "DONE") throw new Error("任务已完成");

  return prisma.teamTask.update({
    where: { id: task.id },
    data: {
      status: "DONE",
      completedAt: new Date(),
    },
  });
}

export async function listTasksForTeam(teamId: string, userId?: string) {
  // GRS004: 验证访问者是否为团队 APPROVED 成员
  if (userId) {
    const member = await prisma.teamMember.findFirst({
      where: { teamId, userId, status: "APPROVED" },
    });
    if (!member) return [];
  }

  return prisma.teamTask.findMany({
    where: { teamId },
    include: {
      creator: { select: { id: true, username: true } },
      assignee: { select: { id: true, username: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getTaskStats(teamId: string) {
  const [total, done] = await Promise.all([
    prisma.teamTask.count({ where: { teamId } }),
    prisma.teamTask.count({ where: { teamId, status: "DONE" } }),
  ]);
  return { total, done, todo: total - done };
}
