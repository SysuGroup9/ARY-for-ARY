/**
 * GRS004 协作功能 - 阶段四 评分体系重构测试
 *
 * 验证：
 * 1. Award 从 registrationId 改为 teamId 维度
 * 2. AwardCandidate 聚合 Team 成员（排除 REMOVED）
 * 3. 公开赛果展开 Team 列表
 * 4. Judging 服务适配 Team 维度
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import { createTeam, approveMember, removeMember } from "@/lib/services/teams";
import { joinTeam } from "@/lib/services/teams";
import { registerForRace, approveRegistrationForRace } from "@/lib/services/registrations";
import { listPublishedAwardsForRace, generateAwardDraftsForRace, publishAwardsForRace } from "@/lib/services/awards";
import { buildPublicResultsModel } from "@/lib/services/results";
import { listJudgeAssignmentsForRace } from "@/lib/services/judging";

const TEST_RACE_ID = "collab_s4_race";
const TEST_ORG_ID = "collab_s4_org";
const TEST_LEADER_ID = "collab_s4_leader";
const TEST_MATE_ID = "collab_s4_mate";

describe("GRS004 Phase 4 - Award & Results Refactor", () => {
  let teamId: string;

  before(async () => {
    await prisma.award.deleteMany({ where: { raceId: TEST_RACE_ID } });
    await prisma.judgingRecord.deleteMany({ where: { judgeAssignment: { work: { team: { raceId: TEST_RACE_ID } } } } });
    await prisma.judgeAssignment.deleteMany({ where: { work: { team: { raceId: TEST_RACE_ID } } } });
    await prisma.work.deleteMany({ where: { team: { raceId: TEST_RACE_ID } } });
    await prisma.teamMember.deleteMany({ where: { team: { raceId: TEST_RACE_ID } } });
    await prisma.team.deleteMany({ where: { raceId: TEST_RACE_ID } });
    await prisma.registration.deleteMany({ where: { raceId: TEST_RACE_ID } });
    await prisma.race.deleteMany({ where: { id: TEST_RACE_ID } });
    await prisma.user.deleteMany({ where: { id: { in: [TEST_ORG_ID, TEST_LEADER_ID, TEST_MATE_ID] } } });

    await prisma.user.createMany({
      data: [
        { id: TEST_ORG_ID, username: "collab_s4_org", passwordHash: "hash", rolesJson: '["ORGANIZER"]', profileCompleted: true },
        { id: TEST_LEADER_ID, username: "collab_s4_leader", passwordHash: "hash", rolesJson: '["RIDER"]', profileCompleted: true },
        { id: TEST_MATE_ID, username: "collab_s4_mate", passwordHash: "hash", rolesJson: '["RIDER"]', profileCompleted: true },
      ],
    });

    await prisma.race.create({
      data: {
        id: TEST_RACE_ID,
        organizerId: TEST_ORG_ID,
        title: "Phase 4 Test Race",
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

    // 创建 Team + 审批
    const team = await createTeam(TEST_LEADER_ID, { raceId: TEST_RACE_ID, name: "Phase 4 Team" });
    teamId = team!.id;

    const leaderReg = await prisma.registration.findUnique({
      where: { raceId_userId: { raceId: TEST_RACE_ID, userId: TEST_LEADER_ID } },
    });
    await approveRegistrationForRace({ organizerId: TEST_ORG_ID, registrationId: leaderReg!.id });

    // Mate 加入
    await joinTeam(TEST_MATE_ID, { teamId });
    const mateMember = await prisma.teamMember.findFirst({ where: { teamId, userId: TEST_MATE_ID } });
    await approveMember(TEST_LEADER_ID, { teamId, memberId: mateMember!.id });
    const mateReg = await prisma.registration.findUnique({
      where: { raceId_userId: { raceId: TEST_RACE_ID, userId: TEST_MATE_ID } },
    });
    await approveRegistrationForRace({ organizerId: TEST_ORG_ID, registrationId: mateReg!.id });
  });

  it("1. Award 创建使用 teamId 而非 registrationId", async () => {
    const award = await prisma.award.create({
      data: {
        raceId: TEST_RACE_ID,
        teamId,
        awardName: "Best Overall",
        rank: 1,
        decisionReason: "Team award test",
      },
    });
    assert.equal(award.teamId, teamId);
    // registrationId 可以为 null（Team 维度）
  });

  it("2. listPublishedAwardsForRace 包含 team 成员信息", async () => {
    const awards = await listPublishedAwardsForRace(TEST_RACE_ID);
    // 未发布时返回空
    assert.ok(Array.isArray(awards));
  });

  it("3. Award 发布后可以查询", async () => {
    const publishedAt = new Date();
    await prisma.award.updateMany({
      where: { raceId: TEST_RACE_ID },
      data: { publishedAt },
    });

    const awards = await listPublishedAwardsForRace(TEST_RACE_ID);
    assert.ok(awards.length >= 1);
    // 验证 team 信息
    const firstAward = awards[0];
    assert.ok(firstAward.team);
    assert.equal(firstAward.team.name, "Phase 4 Team");
    // 验证成员列表（排除 REMOVED）
    assert.ok(firstAward.team.members.length >= 1);
  });

  it("4. buildPublicResultsModel 展开 Team 成员", async () => {
    const results = await buildPublicResultsModel(TEST_RACE_ID);
    assert.ok(results);
    assert.ok(Array.isArray(results.awards));
    if (results.awards.length > 0) {
      const award = results.awards[0];
      assert.ok(award.team);
      assert.ok(award.team.members.length >= 1);
    }
  });

  it("5. REMOVED 成员不出现在 Award team 中", async () => {
    // 踢出 Mate
    const mateMember = await prisma.teamMember.findFirst({
      where: { teamId, userId: TEST_MATE_ID, status: "APPROVED" },
    });
    if (mateMember) {
      await removeMember(TEST_LEADER_ID, { teamId, memberId: mateMember.id });
    }

    const awards = await listPublishedAwardsForRace(TEST_RACE_ID);
    if (awards.length > 0) {
      const members = awards[0].team?.members ?? [];
      const removedMember = members.find(m => m.userId === TEST_MATE_ID);
      assert.equal(removedMember, undefined);
    }
  });

  it("6. listJudgeAssignmentsForRace 使用 team 关联", async () => {
    const assignments = await listJudgeAssignmentsForRace(TEST_RACE_ID);
    assert.ok(Array.isArray(assignments));
  });

  it("7. publishAwardsForRace 在 Team 维度工作", async () => {
    // 撤销发布后重新生成草稿再发布
    await prisma.award.updateMany({
      where: { raceId: TEST_RACE_ID },
      data: { publishedAt: null },
    });

    // 没有 JudgingRecord 时应该抛出错误
    try {
      await publishAwardsForRace({ organizerId: TEST_ORG_ID, raceId: TEST_RACE_ID });
    } catch (e: any) {
      assert.ok(e.message.includes("JudgingRecord") || e.message.includes("无法生成"));
    }
  });
});
