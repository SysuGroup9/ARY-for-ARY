import { hashPassword } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

const ORGANIZER_ID = "user_organizer_demo";
const RIDER_ID = "user_rider_demo";
const RACE_ID = "race_sort_demo";
const TEAM_ID = "team_sort_demo";

async function main() {
  await prisma.runnerTask.deleteMany();
  await prisma.submissionArtifact.deleteMany();
  await prisma.teamComment.deleteMany();
  await prisma.ridingHighlight.deleteMany();
  await prisma.harnessEntry.deleteMany();
  await prisma.leaderboardEntry.deleteMany();
  await prisma.feedbackMessage.deleteMany();
  await prisma.feedbackThread.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.teamArchive.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.race.deleteMany();
  await prisma.user.deleteMany();

  const organizer = await prisma.user.create({
    data: {
      id: ORGANIZER_ID,
      passwordHash: await hashPassword("organizer123"),
      role: "ORGANIZER",
      username: "organizer_demo",
    },
  });

  const rider = await prisma.user.create({
    data: {
      id: RIDER_ID,
      passwordHash: await hashPassword("rider123"),
      role: "RIDER",
      username: "rider_demo",
    },
  });

  const now = new Date();
  const race = await prisma.race.create({
    data: {
      cloudStudioUrl: "https://cloudstudio.net/",
      displayHighlightCount: 3,
      displayShowOrganizerComment: true,
      displayShowRiderCode: true,
      displayShowTopHighlights: true,
      displayShowTrainingData: true,
      enableFreeze: true,
      evaluationNotes:
        "Organizer 私有 Runner 会执行隐藏排序用例，并仅回传一个最终分数。",
      freezeMinutesBeforeEnd: 30,
      hasTrainingData: true,
      id: RACE_ID,
      keywordsJson: JSON.stringify([
        "需求分析",
        "时间复杂度",
        "边界条件",
        "稳定性",
        "测试验证",
      ]),
      maxTeamSize: 5,
      organizerComment:
        "提交一个 TypeScript 排序解法，等待私有 Runner 完成评分，再使用现有发榜按钮刷新公开榜单。",
      organizerId: organizer.id,
      raceEnd: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      raceStart: new Date(now.getTime() - 30 * 60 * 1000),
      signupEnd: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      signupStart: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      submissionIntervalHours: 1,
      summary:
        "这是一个私有 Runner 排序题 PoC：Rider 提交 solve(input)，Organizer 私有 Runner 返回最终分数。",
      taskDescription:
        "请用 JavaScript 或 TypeScript 实现 solve(input: number[]): number[]，返回按升序排列后的数字数组。",
      taskPackageLabel: "sort-task-v1.zip",
      title: "排序 Runner 演示赛",
      tokenLimit: 4000,
      trainingDataSummary:
        "请重点覆盖空数组、逆序、重复元素、负数与混合值等情况。",
      updateGranularityMinutes: 30,
      weightCodeReview: 0.5,
      weightKeywords: 0.3,
      weightReasoning: 0.7,
      weightTaskPassRate: 0.5,
      weightTotalDialogue: 0.2,
      weightTotalTask: 0.5,
      weightTotalToken: 0.3,
    },
  });

  const team = await prisma.team.create({
    data: {
      captainId: rider.id,
      id: TEAM_ID,
      members: {
        create: [
          {
            displayName: "rider_demo",
            userId: rider.id,
          },
          {
            displayName: "队友 A",
          },
        ],
      },
      name: "排序演示队",
      raceId: race.id,
    },
  });

  const thread = await prisma.feedbackThread.create({
    data: {
      raceId: race.id,
      status: "PENDING",
      teamId: team.id,
    },
  });

  await prisma.feedbackMessage.createMany({
    data: [
      {
        authorId: rider.id,
        content: "请确认重复值是否需要保持稳定顺序？",
        threadId: thread.id,
      },
      {
        authorId: organizer.id,
        content: "需要。提交前请重点验证重复值与边界条件。",
        threadId: thread.id,
      },
    ],
  });

  await prisma.notification.create({
    data: {
      content:
        "排序演示赛已经开始。请使用种子 Rider 账号提交 solution.ts，并在私有 Runner 回分后手动发榜。",
      raceId: race.id,
      target: "ALL",
      title: "排序演示赛已开始",
    },
  });

  await prisma.teamComment.create({
    data: {
      content: "请使用这支种子队伍直接体验 Organizer 私有 Runner 提交流程。",
      raceId: race.id,
      teamId: team.id,
    },
  });

  // ── Jumbotron 演示赛 ────────────────────────────────────────────────────────
  // 8 支队伍，覆盖进度/质量/风险/违规/活跃度等多种展示状态，
  // 可直接用 /jumbotron?raceId=race_jumbotron_demo 查看大屏效果。

  const JT_RACE_ID = "race_jumbotron_demo";

  await prisma.race.create({
    data: {
      id: JT_RACE_ID,
      organizerId: organizer.id,   // organizer_demo 管理两场赛事，无需额外账号
      title: "Jumbotron 演示赛",
      summary: "用于测试 Jumbotron 大屏可视化的演示赛事，8 支队伍覆盖多种状态。",
      taskPackageLabel: "jt-demo-task.zip",
      taskDescription: "模拟多队伍并行竞争，用于验证 Jumbotron 进度可视化效果。",
      trainingDataSummary: "N/A",
      evaluationNotes: "演示用数据，由 seed 直接写入。",
      keywordsJson: JSON.stringify(["演示", "Jumbotron", "可视化"]),
      tokenLimit: 20000,
      signupStart: new Date("2026-06-08T09:00:00+08:00"),
      signupEnd:   new Date("2026-06-09T23:59:59+08:00"),
      raceStart:   new Date("2026-06-10T09:00:00+08:00"),
      raceEnd:     new Date("2026-06-20T18:00:00+08:00"),
      cloudStudioUrl: "https://cloudstudio.net/",
      checkpointCount: 3,
      weightTaskPassRate: 0.5,
      weightCodeReview:   0.2,
      weightReasoning:    0.5,
      weightKeywords:     0.3,
      weightTotalTask:    0.5,
      weightTotalToken:   0.2,
      weightTotalDialogue: 0.2,
    },
  });

  // 8 支队伍的演示数据
  // progress  = PROGRESS_EVAL 回传分（0–100），Runner 自动拉取，决定马匹在赛道上的位置
  // quality   = 最优 SUBMISSION_TEST 分（0–100），参赛者主动提交
  // subCount  = SCORED 提交次数（活跃骑手排名依据）
  // tokens    = 总 Token 消耗
  // penalty   = antiCheatPenalty（>0 → 高风险 + 违规标记）
  const JT_TEAMS = [
    { idx: 1, name: "AlphaBot 战队",   progress: 88, quality: 81, subCount: 5, tokens: 14200, penalty: 0  },
    { idx: 2, name: "BetaRun 快攻",    progress: 74, quality: 69, subCount: 4, tokens:  9800, penalty: 0  },
    { idx: 3, name: "GammaAI 突破",    progress: 67, quality: 72, subCount: 6, tokens: 17000, penalty: 0  },
    { idx: 4, name: "DeltaCraft 稳进", progress: 52, quality: 48, subCount: 2, tokens:  6100, penalty: 0  },
    { idx: 5, name: "EpsilonDev 新锐", progress: 41, quality: 38, subCount: 2, tokens:  5200, penalty: 0  },
    { idx: 6, name: "ZetaForce 违规",  progress: 75, quality: 30, subCount: 3, tokens:  8000, penalty: 15 },
    { idx: 7, name: "EtaLab 跟跑",     progress: 22, quality: 20, subCount: 1, tokens:  2100, penalty: 0  },
    { idx: 8, name: "ThetaSync 起步",  progress:  8, quality:  0, subCount: 0, tokens:     0, penalty: 0  },
  ] as const;

  for (const t of JT_TEAMS) {
    const userId = `user_jt_${t.idx}`;
    const teamId = `team_jt_${t.idx}`;

    await prisma.user.create({
      data: {
        id: userId,
        passwordHash: await hashPassword("rider123"),
        role: "RIDER",
        username: `jt_rider_${t.idx}`,
      },
    });

    await prisma.team.create({
      data: {
        id: teamId,
        raceId: JT_RACE_ID,
        captainId: userId,
        name: t.name,
        members: { create: [{ displayName: t.name, userId }] },
      },
    });

    // SCORED 提交（参赛者主动提交，SUBMISSION_TEST）
    let bestSubId: string | null = null;
    for (let i = 0; i < t.subCount; i++) {
      // 每次提交分数逐步提升，模拟真实改进过程
      const score = Math.round(t.quality * (0.6 + 0.4 * (i + 1) / t.subCount));
      const sub = await prisma.submission.create({
        data: {
          raceId: JT_RACE_ID,
          teamId,
          status: "SCORED",
          codeLabel: `solution_v${i + 1}.ts`,
          tokenUsed: Math.floor(t.tokens / t.subCount),
          agentType: "CLAUDE",
          totalScore: score,
          taskScore: score,
          scoredAt:  new Date(now.getTime() - (t.subCount - i) * 20 * 60 * 1000),
          createdAt: new Date(now.getTime() - (t.subCount - i) * 25 * 60 * 1000),
        },
      });
      bestSubId = sub.id;
    }

    // 无 SCORED 提交的队伍也需要一条占位 Submission 供 LeaderboardEntry FK 引用
    if (!bestSubId) {
      const sub = await prisma.submission.create({
        data: {
          raceId: JT_RACE_ID,
          teamId,
          status: "QUEUED",
          codeLabel: "pending.ts",
          tokenUsed: 0,
          agentType: "CLAUDE",
          createdAt: now,
        },
      });
      bestSubId = sub.id;
    }

    // LeaderboardEntry：来自 PROGRESS_EVAL，Runner 按颗粒度自动评估，与参赛者提交无关
    await prisma.leaderboardEntry.create({
      data: {
        raceId: JT_RACE_ID,
        teamId,
        submissionId: bestSubId,
        totalScore: t.progress,
        taskScore:  t.progress,
        agentType: "CLAUDE",
        createdAt: new Date(now.getTime() - 10 * 60 * 1000),
      },
    });

    // TeamArchive：记录 token 消耗与违规处罚
    if (t.tokens > 0 || t.penalty > 0) {
      await prisma.teamArchive.create({
        data: {
          raceId: JT_RACE_ID,
          teamId,
          submissionId: bestSubId,
          codeLabel: `solution_v${t.subCount}.ts`,
          codeContent: "// archived by Jumbotron demo seed",
          tokenUsed: t.tokens,
          agentType: "CLAUDE",
          totalScore: t.quality,
          taskScore:  t.quality,
          antiCheatPenalty: t.penalty,
          createdAt: now,
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
