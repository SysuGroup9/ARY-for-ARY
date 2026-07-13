/**
 * GRS004 协作功能 - 阶段一 Schema 迁移回归测试
 * 
 * 验证 Prisma Schema 变更后的模型可用性：
 * 1. Team 模型新增 leaderId + @@unique([raceId, name])
 * 2. TeamMember 模型新增 role/status 枚举 + @@unique([teamId, userId])
 * 3. Registration 模型新增 teamId
 * 4. Work 模型 registrationId 改为可选，新增 teamId @unique
 * 5. Submission 模型新增 modifiedByUserId/changeSummary
 * 6. Award 模型 registrationId 改为可选，新增 teamId
 * 7. TeamTask / CollaborationMessage 新模型可创建
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";

const TEST_RACE_ID = "collab_test_race";
const TEST_ORG_ID = "collab_test_org";
const TEST_LEADER_ID = "collab_test_leader";
const TEST_MATE_ID = "collab_test_mate";

describe("GRS004 Schema Migration", () => {
  before(async () => {
    // 清理旧测试数据
    await prisma.collaborationMessage.deleteMany({ where: { teamId: { startsWith: "collab_" } } });
    await prisma.teamTask.deleteMany({ where: { teamId: { startsWith: "collab_" } } });
    await prisma.award.deleteMany({ where: { raceId: TEST_RACE_ID } });
    await prisma.submission.deleteMany({ where: { raceId: TEST_RACE_ID } });
    await prisma.work.deleteMany({ where: { teamId: { startsWith: "collab_" } } });
    await prisma.teamMember.deleteMany({ where: { teamId: { startsWith: "collab_" } } });
    await prisma.team.deleteMany({ where: { id: { startsWith: "collab_" } } });
    await prisma.registration.deleteMany({ where: { raceId: TEST_RACE_ID } });
    await prisma.race.deleteMany({ where: { id: TEST_RACE_ID } });
    await prisma.user.deleteMany({ where: { id: { in: [TEST_ORG_ID, TEST_LEADER_ID, TEST_MATE_ID] } } });

    // 创建测试用户
    await prisma.user.createMany({
      data: [
        { id: TEST_ORG_ID, username: "collab_org", passwordHash: "hash", rolesJson: '["ORGANIZER"]', profileCompleted: true },
        { id: TEST_LEADER_ID, username: "collab_leader", passwordHash: "hash", rolesJson: '["RIDER"]', profileCompleted: true },
        { id: TEST_MATE_ID, username: "collab_mate", passwordHash: "hash", rolesJson: '["RIDER"]', profileCompleted: true },
      ],
    });

    // 创建测试 Race
    await prisma.race.create({
      data: {
        id: TEST_RACE_ID,
        organizerId: TEST_ORG_ID,
        title: "Collaboration Test Race",
        summary: "Test",
        taskPackageLabel: "test",
        taskDescription: "test",
        keywordsJson: "[]",
        tokenLimit: 1000,
        signupStart: new Date("2026-01-01"),
        signupEnd: new Date("2026-12-31"),
        raceStart: new Date("2026-01-15"),
        raceEnd: new Date("2026-12-31"),
        weightTaskPassRate: 0.2,
        weightCodeReview: 0.2,
        weightReasoning: 0.2,
        weightKeywords: 0.1,
        weightTotalTask: 0.1,
        weightTotalToken: 0.1,
        weightTotalDialogue: 0.1,
        cloudStudioUrl: "",
        trainingDataSummary: "",
        evaluationNotes: "",
      },
    });
  });

  it("1. Team 模型支持 leaderId 和 @@unique([raceId, name])", async () => {
    const team = await prisma.team.create({
      data: {
        id: "collab_team_1",
        raceId: TEST_RACE_ID,
        captainId: TEST_LEADER_ID,
        leaderId: TEST_LEADER_ID,
        name: "Collab Test Team",
      },
    });
    assert.equal(team.leaderId, TEST_LEADER_ID);
    assert.equal(team.name, "Collab Test Team");

    // 验证 Team 名在 Race 内唯一
    await assert.rejects(
      () => prisma.team.create({
        data: {
          id: "collab_team_dup",
          raceId: TEST_RACE_ID,
          captainId: TEST_MATE_ID,
          leaderId: TEST_MATE_ID,
          name: "Collab Test Team",
        },
      }),
    );
  });

  it("2. TeamMember 支持 role/status 枚举和 @@unique([teamId, userId])", async () => {
    const member = await prisma.teamMember.create({
      data: {
        teamId: "collab_team_1",
        userId: TEST_LEADER_ID,
        displayName: "Leader",
        role: "LEADER",
        status: "APPROVED",
      },
    });
    assert.equal(member.role, "LEADER");
    assert.equal(member.status, "APPROVED");

    // 验证同一用户不能重复加入同一 Team
    await assert.rejects(
      () => prisma.teamMember.create({
        data: {
          teamId: "collab_team_1",
          userId: TEST_LEADER_ID,
          displayName: "Dup",
          role: "MATE",
          status: "PENDING",
        },
      }),
    );
  });

  it("3. Registration 模型支持 teamId", async () => {
    const reg = await prisma.registration.create({
      data: {
        raceId: TEST_RACE_ID,
        userId: TEST_LEADER_ID,
        teamId: "collab_team_1",
        status: "SUBMITTED",
      },
    });
    assert.equal(reg.teamId, "collab_team_1");
  });

  it("4. Work 模型 teamId @unique 可用", async () => {
    const work = await prisma.work.create({
      data: {
        teamId: "collab_team_1",
        title: "Test Work",
        summary: "Test",
      },
    });
    assert.equal(work.teamId, "collab_team_1");

    // 验证 teamId 唯一
    await assert.rejects(
      () => prisma.work.create({
        data: {
          teamId: "collab_team_1",
          title: "Dup Work",
          summary: "Dup",
        },
      }),
    );
  });

  it("5. Submission 模型支持 modifiedByUserId 和 changeSummary", async () => {
    const sub = await prisma.submission.create({
      data: {
        raceId: TEST_RACE_ID,
        teamId: "collab_team_1",
        codeLabel: "test.py",
        codeContent: "print('hello')",
        tokenUsed: 0,
        agentType: "CLAUDE",
        modifiedByUserId: TEST_LEADER_ID,
        changeSummary: "初始提交",
      },
    });
    assert.equal(sub.modifiedByUserId, TEST_LEADER_ID);
    assert.equal(sub.changeSummary, "初始提交");
  });

  it("6. Award 模型支持 teamId", async () => {
    const award = await prisma.award.create({
      data: {
        raceId: TEST_RACE_ID,
        teamId: "collab_team_1",
        awardName: "最佳协作奖",
        rank: 1,
      },
    });
    assert.equal(award.teamId, "collab_team_1");
  });

  it("7. TeamTask 模型可创建和查询", async () => {
    const task = await prisma.teamTask.create({
      data: {
        teamId: "collab_team_1",
        creatorId: TEST_LEADER_ID,
        assigneeId: TEST_MATE_ID,
        title: "完成前端页面",
        description: "实现协作页面 UI",
        status: "TODO",
      },
    });
    assert.equal(task.status, "TODO");
    assert.equal(task.title, "完成前端页面");

    // 更新为 DONE
    const updated = await prisma.teamTask.update({
      where: { id: task.id },
      data: { status: "DONE", completedAt: new Date() },
    });
    assert.equal(updated.status, "DONE");
    assert.ok(updated.completedAt);
  });

  it("8. CollaborationMessage 模型可创建和查询", async () => {
    const msg = await prisma.collaborationMessage.create({
      data: {
        teamId: "collab_team_1",
        senderId: TEST_LEADER_ID,
        receiverId: TEST_MATE_ID,
        content: "请检查最新提交的代码",
        linkedAssetType: "submission",
        linkedAssetId: "test_sub_1",
      },
    });
    assert.equal(msg.content, "请检查最新提交的代码");
    assert.equal(msg.linkedAssetType, "submission");

    // 查询团队消息
    const messages = await prisma.collaborationMessage.findMany({
      where: { teamId: "collab_team_1" },
      orderBy: { createdAt: "asc" },
    });
    assert.equal(messages.length, 1);
  });

  it("9. Team 可关联多个 Registration（通过 teamId）", async () => {
    // Mate 的 Registration
    const mateReg = await prisma.registration.create({
      data: {
        raceId: TEST_RACE_ID,
        userId: TEST_MATE_ID,
        teamId: "collab_team_1",
        status: "SUBMITTED",
      },
    });

    // 查询 Team 下的所有 Registration
    const regs = await prisma.registration.findMany({
      where: { teamId: "collab_team_1" },
    });
    assert.ok(regs.length >= 2);
    const mateIds = regs.map(r => r.userId);
    assert.ok(mateIds.includes(TEST_MATE_ID));
  });

  it("10. RaceProject 模型支持 teamId", async () => {
    const rp = await prisma.raceProject.create({
      data: {
        teamId: "collab_team_1",
        aggregateIngestionStatus: "NOT_CONFIGURED",
      },
    });
    assert.equal(rp.teamId, "collab_team_1");
  });
});
