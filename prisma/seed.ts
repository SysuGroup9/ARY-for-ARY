import { hashPassword } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import { generateRaceSnapshot } from "../src/lib/services/race-snapshot";

async function main() {
  // 清空所有数据
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

  const pw = await hashPassword("organizer123");
  const riderPw = await hashPassword("rider123");
  const now = new Date();

  // ---- 用户 ----
  const organizer = await prisma.user.create({
    data: { id: "org_01", username: "organizer_demo", passwordHash: pw, role: "ORGANIZER" },
  });

  const riderNames = [
    "Alice", "Bob", "Charlie", "Diana", "Eve",
    "Frank", "Grace", "Henry", "Iris", "Jack",
    "Kate", "Leo", "Mia", "Noah", "Olivia",
  ];

  const riders = await Promise.all(
    riderNames.map((name, i) =>
      prisma.user.create({
        data: {
          id: `rider_${String(i + 1).padStart(2, "0")}`,
          username: `rider_${name.toLowerCase()}`,
          passwordHash: riderPw,
          role: "RIDER",
        },
      }),
    ),
  );

  // ---- 队伍名称池 ----
  const teamNames = [
    "极速排序队", "奶茶码农", "Bug 粉碎机",
    "深夜提交组", "需求分析大师", "边界测试团",
    "重构先锋", "性能猎手",
  ];

  const agentTypes = ["CLAUDE", "OPENAI", "COPILOT", "DEEPSEEK", "CLAUDE", "OPENAI", "COPILOT", "CLAUDE"] as const;

  // ================================================================
  // Race 1: 正在进行中的比赛
  // ================================================================
  const race1 = await prisma.race.create({
    data: {
      id: "race_active",
      cloudStudioUrl: "https://cloudstudio.net/",
      displayHighlightCount: 3,
      displayShowOrganizerComment: true,
      displayShowRiderCode: true,
      displayShowTopHighlights: true,
      displayShowTrainingData: true,
      enableFreeze: false,
      evaluationNotes: "Runner 将根据通过率、代码质量和推理过程综合评分。",
      freezeMinutesBeforeEnd: 30,
      hasTrainingData: true,
      keywordsJson: JSON.stringify(["需求分析", "时间复杂度", "边界条件", "稳定性", "测试验证"]),
      maxTeamSize: 5,
      organizerComment: "",
      organizerId: organizer.id,
      raceEnd: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),      // 2天后结束
      raceStart: new Date(now.getTime() - 3 * 60 * 60 * 1000),         // 3小时前开始
      signupEnd: new Date(now.getTime() - 26 * 60 * 60 * 1000),        // 26小时前报名截止
      signupStart: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),  // 3天前报名开始
      submissionIntervalHours: 1,
      summary: "验证 Agent 在算法问题上的实现、推理与成本控制能力。8 支队伍在赛道上激烈竞速！",
      taskDescription: "实现一个稳定排序模块，支持整数数组升序输出，并在边界输入下保持正确性。",
      taskPackageLabel: "sort-task-v1.zip",
      title: "🏁 排序算法挑战赛",
      tokenLimit: 4000,
      trainingDataSummary: "训练数据包含小规模样例、重复元素、逆序输入和空数组。",
      updateGranularityMinutes: 30,
      weightCodeReview: 0.5, weightKeywords: 0.3, weightReasoning: 0.7,
      weightTaskPassRate: 0.5, weightTotalDialogue: 0.2,
      weightTotalTask: 0.5, weightTotalToken: 0.3,
      lastLeaderboardSyncAt: new Date(),
    },
  });

  // 8 支队伍，不同分数 → 不同赛道位置
  const scores1 = [92.5, 87.3, 81.0, 75.8, 68.2, 60.4, 52.1, 38.9];
  const tokens1 = [1320, 2150, 1800, 2900, 3500, 4200, 1680, 5100];

  for (let i = 0; i < 8; i++) {
    const team = await prisma.team.create({
      data: {
        id: `team_active_${i}`,
        raceId: race1.id,
        captainId: riders[i].id,
        name: teamNames[i],
        members: {
          create: [
            { displayName: riders[i].username, userId: riders[i].id },
            { displayName: `${teamNames[i]}助理` },
          ],
        },
      },
    });

    // TeamArchive（最高分归档）
    await prisma.teamArchive.create({
      data: {
        raceId: race1.id,
        teamId: team.id,
        submissionId: `sub_active_${i}`,
        codeLabel: "solution.ts",
        codeContent: "export function solve(input: number[]) { return [...input].sort((a,b) => a-b); }",
        recordLabel: "riding-record.txt",
        ridingRecord: "先澄清输入边界，再验证复杂度，最后用正反例检查排序稳定性。",
        tokenUsed: tokens1[i],
        agentType: agentTypes[i],
        taskScore: Math.round(scores1[i] * 0.9 * 10) / 10,
        dialogueScore: Math.round(scores1[i] * 0.85 * 10) / 10,
        tokenScore: Math.round((100 - tokens1[i] / 60) * 10) / 10,
        reasoningScore: Math.round(scores1[i] * 0.88 * 10) / 10,
        keywordScore: Math.round(scores1[i] * 0.8 * 10) / 10,
        totalScore: scores1[i],
        antiCheatPenalty: i === 3 ? 10 : 0, // 第四队有违规扣分
      },
    });

    // LeaderboardEntry
    await prisma.leaderboardEntry.create({
      data: {
        raceId: race1.id,
        teamId: team.id,
        submissionId: `sub_active_${i}`,
        totalScore: scores1[i],
        taskScore: Math.round(scores1[i] * 0.9 * 10) / 10,
        tokenScore: Math.round((100 - tokens1[i] / 60) * 10) / 10,
        dialogueScore: Math.round(scores1[i] * 0.85 * 10) / 10,
        agentType: agentTypes[i],
      },
    });

    // 反馈（部分队伍）
    if (i < 3) {
      const thread = await prisma.feedbackThread.create({
        data: { raceId: race1.id, teamId: team.id, status: i === 0 ? "RESOLVED" : "PENDING" },
      });
      await prisma.feedbackMessage.createMany({
        data: [
          { threadId: thread.id, authorId: riders[i].id, content: `[${team.name}] 题目第${i + 2}段描述有歧义，请补充边界条件。` },
        ],
      });
      if (i === 0) {
        await prisma.feedbackMessage.create({
          data: { threadId: thread.id, authorId: organizer.id, content: "已在题面补充了空数组和重复元素的处理要求。" },
        });
      }
    }
  }

  // 通知
  await prisma.notification.create({
    data: { raceId: race1.id, target: "ALL", title: "比赛进行中", content: "排序算法挑战赛正在进行，请各队伍尽快提交！" },
  });

  // ================================================================
  // Race 2: 报名中的比赛（未开始）
  // ================================================================
  const race2 = await prisma.race.create({
    data: {
      id: "race_signup",
      cloudStudioUrl: "https://cloudstudio.net/",
      displayHighlightCount: 3,
      displayShowOrganizerComment: true,
      displayShowRiderCode: false,
      displayShowTopHighlights: true,
      displayShowTrainingData: false,
      enableFreeze: false,
      evaluationNotes: "评估 API 设计的 RESTful 规范、可扩展性和文档质量。",
      freezeMinutesBeforeEnd: 0,
      hasTrainingData: false,
      keywordsJson: JSON.stringify(["RESTful", "可扩展性", "错误处理", "版本控制", "文档"]),
      maxTeamSize: 4,
      organizerComment: "",
      organizerId: organizer.id,
      raceEnd: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),      // 5天后结束
      raceStart: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),    // 1天后开始
      signupEnd: new Date(now.getTime() + 20 * 60 * 60 * 1000),        // 20小时后报名截止
      signupStart: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),  // 1天前报名开始
      submissionIntervalHours: 12,
      summary: "设计一套符合 RESTful 规范的 Task Manager API，关注可扩展性和错误处理。",
      taskDescription: "设计并实现 Task Manager REST API，包含 CRUD 操作、状态流转和分页查询。",
      taskPackageLabel: "api-design-v1.zip",
      title: "📋 API 设计大赛",
      tokenLimit: 3000,
      trainingDataSummary: "",
      updateGranularityMinutes: 30,
      weightCodeReview: 0.6, weightKeywords: 0.2, weightReasoning: 0.8,
      weightTaskPassRate: 0.4, weightTotalDialogue: 0.3,
      weightTotalTask: 0.4, weightTotalToken: 0.3,
    },
  });

  // 3 支队伍已报名（尚未比赛，无提交无分数）
  const signupTeamNames = ["接口艺术家", "REST 大师", "API 工匠"];
  for (let i = 0; i < 3; i++) {
    await prisma.team.create({
      data: {
        id: `team_signup_${i}`,
        raceId: race2.id,
        captainId: riders[i + 8].id,
        name: signupTeamNames[i],
        members: {
          create: [
            { displayName: riders[i + 8].username, userId: riders[i + 8].id },
            { displayName: `${signupTeamNames[i]}组员` },
          ],
        },
      },
    });
  }

  // ================================================================
  // Race 3: 已结束的比赛
  // ================================================================
  const race3 = await prisma.race.create({
    data: {
      id: "race_finished",
      cloudStudioUrl: "",
      displayHighlightCount: 3,
      displayShowOrganizerComment: true,
      displayShowRiderCode: true,
      displayShowTopHighlights: true,
      displayShowTrainingData: true,
      enableFreeze: true,
      evaluationNotes: "关注页面加载时间、内存占用和渲染帧率三个维度的改善。",
      freezeMinutesBeforeEnd: 60,
      hasTrainingData: true,
      keywordsJson: JSON.stringify(["性能瓶颈", "缓存策略", "懒加载", "内存泄漏", "渲染优化"]),
      maxTeamSize: 5,
      organizerComment: "所有队伍都展示了出色的优化思路。第一名在缓存策略上尤其出色，值得所有人学习。",
      organizerId: organizer.id,
      raceEnd: new Date(now.getTime() - 2 * 60 * 60 * 1000),           // 2小时前结束
      raceStart: new Date(now.getTime() - 26 * 60 * 60 * 1000),        // 26小时前开始
      signupEnd: new Date(now.getTime() - 28 * 60 * 60 * 1000),        // 28小时前报名截止
      signupStart: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),  // 5天前报名开始
      submissionIntervalHours: 6,
      summary: "优化一个 React 电商首页的性能，目标是 FCP < 1.5s 且内存占用降低 30%。",
      taskDescription: "优化提供的电商首页代码，降低首屏加载时间、减少内存占用并提升渲染帧率。",
      taskPackageLabel: "perf-opt-v2.zip",
      title: "⚡ 性能优化马拉松",
      tokenLimit: 5000,
      trainingDataSummary: "原始页面 FCP=3.2s, 内存占用=120MB, 帧率=42fps。",
      updateGranularityMinutes: 30,
      weightCodeReview: 0.4, weightKeywords: 0.4, weightReasoning: 0.6,
      weightTaskPassRate: 0.6, weightTotalDialogue: 0.15,
      weightTotalTask: 0.55, weightTotalToken: 0.3,
      lastLeaderboardSyncAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      lastShowcaseSyncAt: new Date(now.getTime() - 30 * 60 * 1000),
    },
  });

  // 6 支队伍，已完成比赛
  const finishedScores = [94.1, 89.7, 85.2, 78.3, 71.6, 64.0];
  const finishedTokens = [2100, 3400, 2800, 4600, 5200, 6100];
  const finishedTeamNames = ["渲染超快队", "内存优化组", "懒加载专家", "缓存大师", "帧率狂魔", "重构小分队"];

  for (let i = 0; i < 6; i++) {
    const riderIdx = i < 8 ? i : i % 8; // 复用前 8 个 rider
    const team = await prisma.team.create({
      data: {
        id: `team_finished_${i}`,
        raceId: race3.id,
        captainId: riders[riderIdx].id,
        name: finishedTeamNames[i],
        members: {
          create: [
            { displayName: riders[riderIdx].username, userId: riders[riderIdx].id },
            { displayName: `${finishedTeamNames[i]}成员` },
          ],
        },
      },
    });

    await prisma.teamArchive.create({
      data: {
        raceId: race3.id, teamId: team.id, submissionId: `sub_finished_${i}`,
        codeLabel: "optimized.tsx", codeContent: "// 优化后的组件代码...",
        recordLabel: "riding-record.txt",
        ridingRecord: "首先用 Lighthouse 定位瓶颈，然后引入虚拟列表和图片懒加载，最后用 useMemo 减少重渲染。",
        tokenUsed: finishedTokens[i], agentType: agentTypes[i],
        taskScore: Math.round(finishedScores[i] * 0.92 * 10) / 10,
        dialogueScore: Math.round(finishedScores[i] * 0.9 * 10) / 10,
        tokenScore: Math.round((100 - finishedTokens[i] / 100) * 10) / 10,
        reasoningScore: Math.round(finishedScores[i] * 0.85 * 10) / 10,
        keywordScore: Math.round(finishedScores[i] * 0.88 * 10) / 10,
        totalScore: finishedScores[i], antiCheatPenalty: 0,
      },
    });

    await prisma.leaderboardEntry.create({
      data: {
        raceId: race3.id, teamId: team.id, submissionId: `sub_finished_${i}`,
        totalScore: finishedScores[i],
        taskScore: Math.round(finishedScores[i] * 0.92 * 10) / 10,
        tokenScore: Math.round((100 - finishedTokens[i] / 100) * 10) / 10,
        dialogueScore: Math.round(finishedScores[i] * 0.9 * 10) / 10,
        agentType: agentTypes[i],
      },
    });

    // 赛后评语
    const comments = [
      "缓存策略出色，FCP 降低明显。", "代码改动量小效果好。", "懒加载方案可维护性高。",
      "内存优化可以更彻底。", "方案方向正确但实施偏保守。", "仍有较大的优化空间。",
    ];
    await prisma.teamComment.create({
      data: { raceId: race3.id, teamId: team.id, content: comments[i] },
    });

    // Riding Highlight（前 3 名）
    if (i < 3) {
      await prisma.ridingHighlight.create({
        data: {
          raceId: race3.id, teamId: team.id,
          score: finishedScores[i], agentType: agentTypes[i],
          excerpt: `[${finishedTeamNames[i]}] 首先用 Lighthouse 定位瓶颈，然后引入虚拟列表和图片懒加载。`,
          codeSnippet: `// ${finishedTeamNames[i]} 的优化方案\nconst MemoizedList = React.memo(VirtualList);`,
        },
      });
    }
  }

  await prisma.notification.create({
    data: { raceId: race3.id, target: "ALL", title: "比赛已结束", content: "性能优化马拉松已结束，最终排名已公布！" },
  });

  // ================================================================
  // 生成所有赛事的 Jumbotron 快照
  // ================================================================
  for (const raceId of [race1.id, race2.id, race3.id]) {
    try {
      const snap = await generateRaceSnapshot(raceId);
      console.log(`✅ Jumbotron snapshot generated: ${raceId} (${snap.entries.length} entries, "${snap.competition.title}")`);
    } catch (err) {
      console.error(`❌ Failed to generate snapshot for ${raceId}:`, err);
    }
  }

  console.log("\n🎉 种子数据生成完成！");
  console.log("   赛事 1 (race_active): 排序算法挑战赛 - 8 队竞速中");
  console.log("   赛事 2 (race_signup): API 设计大赛 - 3 队已报名，1天后开始");
  console.log("   赛事 3 (race_finished): 性能优化马拉松 - 6 队已完赛");
  console.log("\n   账户: organizer_demo / organizer123");
  console.log("   Rider: rider_alice ~ rider_olivia / rider123\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
