/**
 * GRS004 协作功能 - 知识库服务层
 *
 * 聚合视图（不新增存储），汇总 Work + Submission 历史 + Task 看板 + 协作交流记录。
 * 支持 ZIP 导出，按权限分层下载。
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const archiver = require("archiver") as (format: string, options?: Record<string, unknown>) => import("archiver").Archiver;
import { prisma } from "@/lib/prisma";
import { hasRole, parseRolesJson } from "@/lib/user-roles";

// ---- 聚合查询 ----

export async function getKnowledgeBase(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { race: true },
  });
  if (!team) throw new Error("队伍不存在");

  const [works, submissions, tasks, messages] = await Promise.all([
    prisma.work.findMany({
      where: { teamId },
      orderBy: { updatedAt: "desc" },
      take: 1,
    }),
    prisma.submission.findMany({
      where: { teamId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        codeLabel: true,
        codeContent: true,
        changeSummary: true,
        modifiedByUserId: true,
        tokenUsed: true,
        agentType: true,
        createdAt: true,
        modifiedBy: { select: { id: true, username: true } },
      },
    }),
    prisma.teamTask.findMany({
      where: { teamId },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, username: true } },
        assignee: { select: { id: true, username: true } },
      },
    }),
    prisma.collaborationMessage.findMany({
      where: { teamId },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } },
      },
      take: 200,
    }),
  ]);

  return {
    team: { id: team.id, name: team.name, raceTitle: team.race.title },
    work: works[0] ?? null,
    submissions,
    tasks,
    messages,
    exportable: true,
  };
}

export async function getLatestCode(teamId: string) {
  const latestSubmission = await prisma.submission.findFirst({
    where: { teamId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      codeLabel: true,
      codeContent: true,
      createdAt: true,
      modifiedByUserId: true,
      changeSummary: true,
      modifiedBy: { select: { username: true } },
    },
  });

  return latestSubmission
    ? {
        codeLabel: latestSubmission.codeLabel,
        codeContent: latestSubmission.codeContent,
        submittedAt: latestSubmission.createdAt,
        modifiedBy: latestSubmission.modifiedBy?.username ?? "未知",
        changeSummary: latestSubmission.changeSummary,
      }
    : null;
}

// ---- ZIP 导出 ----

export async function exportKnowledgeBaseZip(teamId: string): Promise<{
  buffer: Buffer;
  filename: string;
  contentType: string;
}> {
  const kb = await getKnowledgeBase(teamId);

  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  archive.on("data", (chunk: Buffer) => chunks.push(chunk));

  // Work
  if (kb.work) {
    archive.append(JSON.stringify(kb.work, null, 2), {
      name: "work.json",
    });
  }

  // Submissions
  archive.append(JSON.stringify(kb.submissions, null, 2), {
    name: "submissions.json",
  });

  // Latest code as a file
  const latestCode = kb.submissions[0];
  if (latestCode?.codeContent) {
    const ext = latestCode.codeLabel?.includes(".") ? "" : ".txt";
    archive.append(latestCode.codeContent, {
      name: `latest_code${ext}`,
    });
  }

  // Tasks
  archive.append(JSON.stringify(kb.tasks, null, 2), {
    name: "tasks.json",
  });

  // Messages
  archive.append(JSON.stringify(kb.messages, null, 2), {
    name: "messages.json",
  });

  // README
  archive.append(
    `# ${kb.team.name} 知识库导出\n\n` +
    `赛事：${kb.team.raceTitle}\n` +
    `导出时间：${new Date().toISOString()}\n\n` +
    `## 内容\n` +
    `- work.json: 作品资产\n` +
    `- submissions.json: 提交历史（最近20条）\n` +
    `- latest_code: 最新提交代码\n` +
    `- tasks.json: 任务看板\n` +
    `- messages.json: 协作交流记录\n`,
    { name: "README.md" },
  );

  archive.finalize();

  return new Promise((resolve, reject) => {
    archive.on("end", () => {
      resolve({
        buffer: Buffer.concat(chunks),
        filename: `${kb.team.name}_知识库_${new Date().toISOString().slice(0, 10)}.zip`,
        contentType: "application/zip",
      });
    });
    archive.on("error", reject);
  });
}

// ---- 权限校验 ----

export async function canAccessKnowledgeBase(teamId: string, userId: string): Promise<"member" | "organizer" | "admin" | "public"> {
  // Team 成员
  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId, status: "APPROVED" },
  });
  if (member) return "member";

  // Organizer / Admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { rolesJson: true },
  });
  if (user) {
    const roles = parseRolesJson(user.rolesJson);
    if (hasRole(roles, "ADMIN")) return "admin";

    if (hasRole(roles, "ORGANIZER")) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: { race: { select: { organizerId: true } } },
      });
      if (team && team.race.organizerId === userId) return "organizer";
    }
  }

  return "public";
}
