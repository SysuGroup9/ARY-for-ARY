/**
 * GRS004 协作功能 - 阶段三 协作模块测试
 *
 * 验证：
 * 1. TeamTask：createTask / completeTask / listTasksForTeam / getTaskStats
 * 2. CollaborationMessage：sendMessage / listMessagesForTeam / getConversation
 * 3. KnowledgeBase：getKnowledgeBase / getLatestCode / exportKnowledgeBaseZip / canAccessKnowledgeBase
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { createTeam, approveMember } from "@/lib/services/teams";
import { joinTeam } from "@/lib/services/teams";
import { registerForRace, approveRegistrationForRace } from "@/lib/services/registrations";
import { createTask, completeTask, listTasksForTeam, getTaskStats } from "@/lib/services/team-tasks";
import { sendMessage, listMessagesForTeam, getConversation } from "@/lib/services/collaboration";
import { getKnowledgeBase, getLatestCode, exportKnowledgeBaseZip, canAccessKnowledgeBase } from "@/lib/services/knowledge-base";

const TEST_RACE_ID = "collab_s3_race";
const TEST_ORG_ID = "collab_s3_org";
const TEST_LEADER_ID = "collab_s3_leader";
const TEST_MATE_ID = "collab_s3_mate";

describe("GRS004 Phase 3 - Task & Collaboration & KnowledgeBase", () => {
  let teamId: string;

  before(async () => {
    // 清理
    await prisma.collaborationMessage.deleteMany({ where: { teamId: { startsWith: "collab_s3_" } } });
    await prisma.teamTask.deleteMany({ where: { teamId: { startsWith: "collab_s3_" } } });
    await prisma.work.deleteMany({ where: { teamId: { startsWith: "collab_s3_" } } });
    await prisma.teamMember.deleteMany({ where: { teamId: { startsWith: "collab_s3_" } } });
    await prisma.team.deleteMany({ where: { id: { startsWith: "collab_s3_" } } });
    await prisma.registration.deleteMany({ where: { raceId: TEST_RACE_ID } });
    await prisma.race.deleteMany({ where: { id: TEST_RACE_ID } });
    await prisma.user.deleteMany({ where: { id: { in: [TEST_ORG_ID, TEST_LEADER_ID, TEST_MATE_ID] } } });

    await prisma.user.createMany({
      data: [
        { id: TEST_ORG_ID, username: "collab_s3_org", passwordHash: "hash", rolesJson: '["ORGANIZER"]', profileCompleted: true },
        { id: TEST_LEADER_ID, username: "collab_s3_leader", passwordHash: "hash", rolesJson: '["RIDER"]', profileCompleted: true },
        { id: TEST_MATE_ID, username: "collab_s3_mate", passwordHash: "hash", rolesJson: '["RIDER"]', profileCompleted: true },
      ],
    });

    await prisma.race.create({
      data: {
        id: TEST_RACE_ID,
        organizerId: TEST_ORG_ID,
        title: "Phase 3 Test Race",
        summary: "Test", taskPackageLabel: "test", taskDescription: "test",
        keywordsJson: "[]", tokenLimit: 1000,
        signupStart: new Date("2026-01-01"), signupEnd: new Date("2030-12-31"),
        raceStart: new Date("2031-01-15"), raceEnd: new Date("2031-12-31"),
        weightTaskPassRate: 0.2, weightCodeReview: 0.2, weightReasoning: 0.2,
        weightKeywords: 0.1, weightTotalTask: 0.1, weightTotalToken: 0.1, weightTotalDialogue: 0.1,
        cloudStudioUrl: "",
        trainingDataSummary: "",
        evaluationNotes: "",
      },
    });

    // 创建 Team + 审批 Leader + 加入 Mate + 审批 Mate
    const team = await createTeam(TEST_LEADER_ID, { raceId: TEST_RACE_ID, name: "Phase 3 Team" });
    teamId = team!.id;

    const leaderReg = await prisma.registration.findUnique({
      where: { raceId_userId: { raceId: TEST_RACE_ID, userId: TEST_LEADER_ID } },
    });
    await approveRegistrationForRace({ organizerId: TEST_ORG_ID, registrationId: leaderReg!.id });

    await joinTeam(TEST_MATE_ID, { teamId });

    const mateMember = await prisma.teamMember.findFirst({
      where: { teamId, userId: TEST_MATE_ID },
    });
    await approveMember(TEST_LEADER_ID, { teamId, memberId: mateMember!.id });

    // 审批 Mate 的 Registration
    const mateReg = await prisma.registration.findUnique({
      where: { raceId_userId: { raceId: TEST_RACE_ID, userId: TEST_MATE_ID } },
    });
    await approveRegistrationForRace({ organizerId: TEST_ORG_ID, registrationId: mateReg!.id });
  });

  // ---- Task 看板测试 ----

  it("1. Leader 发布任务给 Mate", async () => {
    const task = await createTask(TEST_LEADER_ID, {
      teamId,
      title: "实现登录页面",
      description: "用 React 实现登录表单",
      assigneeId: TEST_MATE_ID,
    });
    assert.ok(task);
    assert.equal(task.title, "实现登录页面");
    assert.equal(task.status, "TODO");
    assert.equal(task.assigneeId, TEST_MATE_ID);
  });

  it("2. Mate 标记任务完成", async () => {
    const tasks = await listTasksForTeam(teamId);
    const todoTask = tasks.find(t => t.status === "TODO");
    assert.ok(todoTask);

    const completed = await completeTask(TEST_MATE_ID, { taskId: todoTask!.id });
    assert.equal(completed.status, "DONE");
    assert.ok(completed.completedAt);
  });

  it("3. Leader 也可以标记任务完成", async () => {
    const task = await createTask(TEST_LEADER_ID, {
      teamId,
      title: "Leader 自己完成的任务",
      assigneeId: TEST_MATE_ID,
    });
    const completed = await completeTask(TEST_LEADER_ID, { taskId: task.id });
    assert.equal(completed.status, "DONE");
  });

  it("4. 非 Leader 不能发布任务", async () => {
    await assert.rejects(
      () => createTask(TEST_MATE_ID, {
        teamId,
        title: "Mate 尝试发布",
        assigneeId: TEST_LEADER_ID,
      }),
      /只有队长才能发布任务/,
    );
  });

  it("5. getTaskStats 返回正确统计", async () => {
    const stats = await getTaskStats(teamId);
    assert.ok(stats.total >= 2);
    assert.ok(stats.done >= 2);
  });

  // ---- 协作交流测试 ----

  it("6. Leader 发送消息给 Mate", async () => {
    const msg = await sendMessage(TEST_LEADER_ID, {
      teamId,
      receiverId: TEST_MATE_ID,
      content: "请检查最新提交",
      linkedAssetType: "submission",
      linkedAssetId: "test_sub",
    });
    assert.equal(msg.content, "请检查最新提交");
    assert.equal(msg.linkedAssetType, "submission");
  });

  it("7. Mate 回复 Leader", async () => {
    const msg = await sendMessage(TEST_MATE_ID, {
      teamId,
      receiverId: TEST_LEADER_ID,
      content: "收到，马上检查",
    });
    assert.equal(msg.senderId, TEST_MATE_ID);
    assert.equal(msg.receiverId, TEST_LEADER_ID);
  });

  it("8. 不能给自己发消息", async () => {
    await assert.rejects(
      () => sendMessage(TEST_LEADER_ID, {
        teamId,
        receiverId: TEST_LEADER_ID,
        content: "给自己",
      }),
      /不能给自己发消息/,
    );
  });

  it("9. 非成员不能发消息", async () => {
    await assert.rejects(
      () => sendMessage(TEST_ORG_ID, {
        teamId,
        receiverId: TEST_MATE_ID,
        content: "外部消息",
      }),
      /只有队伍成员/,
    );
  });

  it("10. listMessagesForTeam 返回团队消息", async () => {
    const messages = await listMessagesForTeam(teamId, TEST_LEADER_ID);
    assert.ok(messages.length >= 2);
  });

  it("11. getConversation 返回两人对话", async () => {
    const conv = await getConversation(teamId, TEST_LEADER_ID, TEST_MATE_ID);
    assert.ok(conv.length >= 2);
    assert.ok(conv.every(m =>
      (m.senderId === TEST_LEADER_ID && m.receiverId === TEST_MATE_ID) ||
      (m.senderId === TEST_MATE_ID && m.receiverId === TEST_LEADER_ID),
    ));
  });

  // ---- 知识库测试 ----

  it("12. getKnowledgeBase 聚合查询成功", async () => {
    const kb = await getKnowledgeBase(teamId);
    assert.ok(kb);
    assert.equal(kb.team.name, "Phase 3 Team");
    assert.equal(kb.tasks.length, 2);
    assert.ok(kb.messages.length >= 2);
    assert.equal(kb.exportable, true);
  });

  it("13. getLatestCode 返回 null（无提交时）", async () => {
    const code = await getLatestCode(teamId);
    // 没有 Submission 时返回 null
    assert.equal(code, null);
  });

  it("14. exportKnowledgeBaseZip 生成 ZIP buffer", async () => {
    const result = await exportKnowledgeBaseZip(teamId);
    assert.ok(result.buffer instanceof Buffer);
    assert.ok(result.buffer.length > 0);
    assert.ok(result.filename.endsWith(".zip"));
    assert.equal(result.contentType, "application/zip");
  });

  it("15. canAccessKnowledgeBase 区分角色", async () => {
    // 成员
    const memberAccess = await canAccessKnowledgeBase(teamId, TEST_LEADER_ID);
    assert.equal(memberAccess, "member");

    // Organizer
    const orgAccess = await canAccessKnowledgeBase(teamId, TEST_ORG_ID);
    assert.equal(orgAccess, "organizer");

    // Public（不存在的用户）
    const publicAccess = await canAccessKnowledgeBase(teamId, "nonexistent_user");
    assert.equal(publicAccess, "public");
  });
});
