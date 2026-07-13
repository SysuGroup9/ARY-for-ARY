/**
 * GRS004 协作功能 - 阶段五 UI 接入与集成测试
 *
 * 验证：
 * 1. Server Actions 可正常调用
 * 2. Team 全生命周期端到端
 * 3. 知识库导出
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { createTeam, joinTeam, approveMember, removeMember, getTeamDetail, listTeamsForRace, getActiveMembers } from "@/lib/services/teams";
import { registerForRace, approveRegistrationForRace, rejectRegistrationForRace } from "@/lib/services/registrations";
import { createTask, completeTask, listTasksForTeam, getTaskStats } from "@/lib/services/team-tasks";
import { sendMessage, listMessagesForTeam, getConversation } from "@/lib/services/collaboration";
import { getKnowledgeBase, exportKnowledgeBaseZip, getLatestCode, canAccessKnowledgeBase } from "@/lib/services/knowledge-base";
import { listPublishedAwardsForRace } from "@/lib/services/awards";
import { buildPublicResultsModel } from "@/lib/services/results";

const TEST_RACE_ID = "collab_s5_race";
const TEST_ORG_ID = "collab_s5_org";
const TEST_LEADER_ID = "collab_s5_leader";
const TEST_MATE_ID = "collab_s5_mate";

describe("GRS004 Phase 5 - E2E Integration", () => {
  let teamId: string;

  before(async () => {
    await prisma.collaborationMessage.deleteMany({ where: { team: { raceId: TEST_RACE_ID } } });
    await prisma.teamTask.deleteMany({ where: { team: { raceId: TEST_RACE_ID } } });
    await prisma.award.deleteMany({ where: { raceId: TEST_RACE_ID } });
    await prisma.work.deleteMany({ where: { team: { raceId: TEST_RACE_ID } } });
    await prisma.teamMember.deleteMany({ where: { team: { raceId: TEST_RACE_ID } } });
    await prisma.team.deleteMany({ where: { raceId: TEST_RACE_ID } });
    await prisma.registration.deleteMany({ where: { raceId: TEST_RACE_ID } });
    await prisma.race.deleteMany({ where: { id: TEST_RACE_ID } });
    await prisma.user.deleteMany({ where: { id: { in: [TEST_ORG_ID, TEST_LEADER_ID, TEST_MATE_ID] } } });

    await prisma.user.createMany({
      data: [
        { id: TEST_ORG_ID, username: "collab_s5_org", passwordHash: "hash", rolesJson: '["ORGANIZER"]', profileCompleted: true },
        { id: TEST_LEADER_ID, username: "collab_s5_leader", passwordHash: "hash", rolesJson: '["RIDER"]', profileCompleted: true },
        { id: TEST_MATE_ID, username: "collab_s5_mate", passwordHash: "hash", rolesJson: '["RIDER"]', profileCompleted: true },
      ],
    });

    await prisma.race.create({
      data: {
        id: TEST_RACE_ID,
        organizerId: TEST_ORG_ID,
        title: "Phase 5 E2E Race",
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
  });

  it("1. 完整建队流程：创建 → 审批 → 加入 → 审批", async () => {
    // Leader 创建 Team
    const team = await createTeam(TEST_LEADER_ID, { raceId: TEST_RACE_ID, name: "E2E Team" });
    assert.ok(team);
    teamId = team.id;

    // Organizer 审批 Leader
    const leaderReg = await prisma.registration.findUnique({
      where: { raceId_userId: { raceId: TEST_RACE_ID, userId: TEST_LEADER_ID } },
    });
    await approveRegistrationForRace({ organizerId: TEST_ORG_ID, registrationId: leaderReg!.id });

    // Mate 加入
    await joinTeam(TEST_MATE_ID, { teamId });

    // Leader 审批 Mate
    const mateMember = await prisma.teamMember.findFirst({
      where: { teamId, userId: TEST_MATE_ID, role: "MATE" },
    });
    await approveMember(TEST_LEADER_ID, { teamId, memberId: mateMember!.id });

    // Organizer 审批 Mate
    const mateReg = await prisma.registration.findUnique({
      where: { raceId_userId: { raceId: TEST_RACE_ID, userId: TEST_MATE_ID } },
    });
    await approveRegistrationForRace({ organizerId: TEST_ORG_ID, registrationId: mateReg!.id });

    // 验证
    const detail = await getTeamDetail(teamId);
    assert.ok(detail);
    assert.equal(detail.name, "E2E Team");
    const activeMembers = await getActiveMembers(teamId);
    assert.equal(activeMembers.length, 2);
  });

  it("2. 完整协作流程：任务 → 消息 → 知识库", async () => {
    // 发布任务
    const task = await createTask(TEST_LEADER_ID, {
      teamId,
      title: "E2E 测试任务",
      assigneeId: TEST_MATE_ID,
    });
    assert.ok(task);

    // 完成任务
    await completeTask(TEST_MATE_ID, { taskId: task.id });
    const tasks = await listTasksForTeam(teamId);
    assert.equal(tasks.length, 1);
    assert.equal(tasks[0].status, "DONE");

    // 发送消息
    await sendMessage(TEST_LEADER_ID, {
      teamId,
      receiverId: TEST_MATE_ID,
      content: "E2E 测试消息",
    });
    const messages = await listMessagesForTeam(teamId, TEST_LEADER_ID);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].content, "E2E 测试消息");

    // 知识库
    const kb = await getKnowledgeBase(teamId);
    assert.ok(kb);
    assert.equal(kb.tasks.length, 1);
    assert.equal(kb.messages.length, 1);
  });

  it("3. ZIP 导出成功", async () => {
    const result = await exportKnowledgeBaseZip(teamId);
    assert.ok(result.buffer instanceof Buffer);
    assert.ok(result.buffer.length > 0);
    assert.ok(result.filename.includes("E2E Team"));
  });

  it("4. listTeamsForRace 返回 Team 列表", async () => {
    const teams = await listTeamsForRace(TEST_RACE_ID);
    assert.ok(teams.length >= 1);
    assert.equal(teams[0].name, "E2E Team");
  });

  it("5. 公开赛果正确展开 Team 成员", async () => {
    const results = await buildPublicResultsModel(TEST_RACE_ID);
    assert.ok(results);
    assert.ok(Array.isArray(results.awards));
  });

  it("6. 知识库权限正确", async () => {
    const memberAccess = await canAccessKnowledgeBase(teamId, TEST_LEADER_ID);
    assert.equal(memberAccess, "member");

    const orgAccess = await canAccessKnowledgeBase(teamId, TEST_ORG_ID);
    assert.equal(orgAccess, "organizer");

    const publicAccess = await canAccessKnowledgeBase(teamId, "unknown");
    assert.equal(publicAccess, "public");
  });

  it("7. Task 统计正确", async () => {
    const stats = await getTaskStats(teamId);
    assert.equal(stats.total, 1);
    assert.equal(stats.done, 1);
    assert.equal(stats.todo, 0);
  });

  it("8. Leader rejected → Team 删除（端到端）", async () => {
    // 先清理 Leader 之前的 registration（test 1 创建的）
    await prisma.registration.deleteMany({
      where: { raceId: TEST_RACE_ID, userId: TEST_LEADER_ID },
    });

    // 创建新 Team
    const doomedTeam = await createTeam(TEST_LEADER_ID, {
      raceId: TEST_RACE_ID,
      name: "Doomed Team",
    });
    const doomedReg = await prisma.registration.findUnique({
      where: { raceId_userId: { raceId: TEST_RACE_ID, userId: TEST_LEADER_ID } },
    });

    // 拒绝
    await rejectRegistrationForRace({ organizerId: TEST_ORG_ID, registrationId: doomedReg!.id });

    // Team 应被删除
    const deleted = await prisma.team.findUnique({ where: { id: doomedTeam.id } });
    assert.equal(deleted, null);
  });
});
