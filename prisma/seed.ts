import { hashPassword } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

const ORGANIZER_ID = "user_organizer_demo";
const RIDER_ID = "user_rider_demo";
const RACE_ID = "race_sort_demo";
const TEAM_ID = "team_sort_demo";

const riderFixtures = [
  {
    id: RIDER_ID,
    password: "rider123",
    username: "rider_demo",
  },
  {
    id: "user_rider_orbit",
    password: "rider123",
    username: "rider_orbit",
  },
  {
    id: "user_rider_pulse",
    password: "rider123",
    username: "rider_pulse",
  },
  {
    id: "user_rider_cedar",
    password: "rider123",
    username: "rider_cedar",
  },
] as const;

const teamFixtures = [
  {
    agentType: "OPENAI",
    captainId: RIDER_ID,
    codeLabel: "solution-vector.ts",
    comment: "领先队伍保持稳定推进，公开榜单分数来自上一轮 Runner 投影。",
    feedbackStatus: "RESOLVED",
    feedbackMessages: [
      "已补充重复元素和负数混合用例。",
      "Runner 确认本轮通过率稳定，可以继续冲刺 token 优化。",
    ],
    id: TEAM_ID,
    members: ["rider_demo", "队友 A"],
    name: "Vector Stable Sort",
    resultHash: "sha256-vector-demo",
    runnerComment: "LIVE_RUNNING: hidden sort cases passed, reasoning still being reviewed.",
    runnerStatus: "LIVE_RUNNING",
    score: 86,
    status: "PULLED",
    taskStatus: "CLAIMED",
    taskType: "PROGRESS_EVAL",
    tokenUsed: 18420,
  },
  {
    agentType: "CLAUDE",
    captainId: "user_rider_orbit",
    codeLabel: "solution-orbit.ts",
    comment: "Orbit 已完成一次发榜，当前处于复盘和二次提交准备。",
    feedbackStatus: "PENDING",
    feedbackMessages: [
      "请确认重复值是否需要保持稳定顺序？",
      "需要。提交前请重点验证重复值与边界条件。",
    ],
    id: "team_orbit_demo",
    members: ["rider_orbit", "队友 B"],
    name: "Orbit Merge Harness",
    resultHash: "sha256-orbit-demo",
    runnerComment: "SUCCEEDED: scored from private harness and projected to leaderboard.",
    runnerStatus: "SCORED",
    score: 79,
    status: "SCORED",
    taskStatus: "SUCCEEDED",
    taskType: "SUBMISSION_TEST",
    tokenUsed: 15860,
  },
  {
    agentType: "OPENAI",
    captainId: "user_rider_pulse",
    codeLabel: "solution-pulse.ts",
    comment: "Pulse 触发 token 风险和一次 Runner 失败，用于 Jumbotron 风险提示演示。",
    feedbackStatus: "PENDING",
    feedbackMessages: [
      "当前实现对空数组返回 undefined。",
      "Runner 已标记失败，请先修复边界输入再继续提交。",
    ],
    id: "team_pulse_demo",
    members: ["rider_pulse", "队友 C"],
    name: "Pulse Boundary Check",
    resultHash: "sha256-pulse-demo",
    runnerComment: "FAILED: empty input and duplicate value cases failed.",
    runnerStatus: "ANTI_CHEAT",
    score: 63,
    status: "FAILED",
    taskStatus: "FAILED",
    taskType: "SUBMISSION_TEST",
    tokenUsed: 21200,
  },
  {
    agentType: "ZHIPU",
    captainId: "user_rider_cedar",
    codeLabel: "solution-cedar.ts",
    comment: "Cedar 刚进入队列，适合展示排队、追赶和 fallback 进度。",
    feedbackStatus: "RESOLVED",
    feedbackMessages: [
      "已确认输入规模上限，准备提交第一版。",
    ],
    id: "team_cedar_demo",
    members: ["rider_cedar", "队友 D"],
    name: "Cedar Input Map",
    resultHash: "sha256-cedar-demo",
    runnerComment: "QUEUED: waiting for organizer private runner.",
    runnerStatus: "QUEUED",
    score: 45,
    status: "QUEUED",
    taskStatus: "QUEUED",
    taskType: "SUBMISSION_TEST",
    tokenUsed: 9880,
  },
] as const;

async function main() {
  await clearDatabase();

  const organizer = await prisma.user.create({
    data: {
      id: ORGANIZER_ID,
      passwordHash: await hashPassword("organizer123"),
      role: "ORGANIZER",
      username: "organizer_demo",
    },
  });

  await Promise.all(
    riderFixtures.map(async (rider) =>
      prisma.user.create({
        data: {
          id: rider.id,
          passwordHash: await hashPassword(rider.password),
          role: "RIDER",
          username: rider.username,
        },
      }),
    ),
  );

  const now = new Date();
  const race = await createDemoRace(organizer.id, now);

  for (const [index, fixture] of teamFixtures.entries()) {
    await createDemoTeamBundle(race.id, fixture, now, index);
  }

  await createRaceNotifications(race.id, now);
}

async function clearDatabase(): Promise<void> {
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
}

async function createDemoRace(organizerId: string, now: Date) {
  return prisma.race.create({
    data: {
      cloudStudioUrl: `/races/${RACE_ID}`,
      displayHighlightCount: 3,
      displayShowOrganizerComment: true,
      displayShowRiderCode: true,
      displayShowTopHighlights: true,
      displayShowTrainingData: true,
      enableFreeze: true,
      evaluationNotes:
        "Organizer 私有 Runner 会执行隐藏排序用例，并回传公开榜单投影、风险信号与进度评测结果。",
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
        "Jumbotron 使用这场种子赛事展示 RaceSnapshot、Racing Entry、Riding Message 与风险数据如何映射到现场大屏。",
      organizerId,
      raceEnd: minutesFrom(now, 36 * 60),
      raceStart: minutesFrom(now, -30),
      signupEnd: minutesFrom(now, -24 * 60),
      signupStart: minutesFrom(now, -2 * 24 * 60),
      submissionIntervalHours: 1,
      summary:
        "这是一个私有 Runner 排序题 PoC：Rider 提交 solve(input)，Organizer 私有 Runner 返回分数，Jumbotron 将公开投影转为赛道态势。",
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
}

async function createDemoTeamBundle(
  raceId: string,
  fixture: (typeof teamFixtures)[number],
  now: Date,
  index: number,
): Promise<void> {
  const team = await prisma.team.create({
    data: {
      captainId: fixture.captainId,
      id: fixture.id,
      members: {
        create: fixture.members.map((displayName, memberIndex) => ({
          displayName,
          userId: memberIndex === 0 ? fixture.captainId : undefined,
        })),
      },
      name: fixture.name,
      raceId,
    },
  });

  const submission = await prisma.submission.create({
    data: {
      agentType: fixture.agentType,
      codeContent: demoSolutionCode(fixture.name),
      codeLabel: fixture.codeLabel,
      createdAt: minutesFrom(now, -1 - index * 3),
      passRate: fixture.score / 100,
      reasoningScore: Math.min(100, fixture.score + 4),
      recordLabel: `${fixture.name} riding record`,
      ridingRecord: `Seed riding record for ${fixture.name}: plan, run private runner, inspect feedback, then publish public projection.`,
      runnerComment: fixture.runnerComment,
      runnerStatus: fixture.runnerStatus,
      status: fixture.status,
      taskScore: fixture.score,
      teamId: team.id,
      tokenScore: Math.max(0, 100 - fixture.tokenUsed / 500),
      tokenUsed: fixture.tokenUsed,
      totalScore: fixture.score,
      raceId,
    },
  });

  const artifact = await prisma.submissionArtifact.create({
    data: {
      agentType: fixture.agentType,
      codeContent: demoSolutionCode(fixture.name),
      codeLabel: fixture.codeLabel,
      createdAt: submission.createdAt,
      raceId,
      recordLabel: submission.recordLabel,
      ridingRecord: submission.ridingRecord,
      submissionId: submission.id,
      teamId: team.id,
      tokenUsed: fixture.tokenUsed,
    },
  });

  await createDemoProjection(raceId, team.id, submission.id, fixture);
  await createDemoRunnerTask(raceId, team.id, submission.id, artifact.id, fixture, now, index);
  await createDemoFeedback(raceId, team.id, fixture, now, index);
  await createDemoHighlight(raceId, team.id, fixture, now, index);
}

async function createDemoProjection(
  raceId: string,
  teamId: string,
  submissionId: string,
  fixture: (typeof teamFixtures)[number],
): Promise<void> {
  await prisma.leaderboardEntry.create({
    data: {
      agentType: fixture.agentType,
      raceId,
      submissionId,
      taskScore: fixture.score,
      teamId,
      tokenScore: Math.max(0, 100 - fixture.tokenUsed / 500),
      totalScore: fixture.score,
    },
  });

  await prisma.harnessEntry.create({
    data: {
      harnessScore: fixture.score,
      keywordScore: Math.min(100, fixture.score + 2),
      raceId,
      reasoningScore: Math.min(100, fixture.score + 4),
      teamId,
    },
  });

  await prisma.teamComment.create({
    data: {
      content: fixture.comment,
      raceId,
      teamId,
    },
  });
}

async function createDemoRunnerTask(
  raceId: string,
  teamId: string,
  submissionId: string,
  artifactId: string,
  fixture: (typeof teamFixtures)[number],
  now: Date,
  index: number,
): Promise<void> {
  await prisma.runnerTask.create({
    data: {
      artifactId,
      claimedAt: minutesFrom(now, -1 - index * 3),
      createdAt: minutesFrom(now, -2 - index * 3),
      finishedAt:
        fixture.taskStatus === "CLAIMED" || fixture.taskStatus === "QUEUED"
          ? undefined
          : minutesFrom(now, -1 - index * 3),
      raceId,
      resultHash: fixture.resultHash,
      runnerComment: fixture.runnerComment,
      score: fixture.score,
      status: fixture.taskStatus,
      submissionId,
      taskType: fixture.taskType,
      teamId,
    },
  });
}

async function createDemoFeedback(
  raceId: string,
  teamId: string,
  fixture: (typeof teamFixtures)[number],
  now: Date,
  index: number,
): Promise<void> {
  const thread = await prisma.feedbackThread.create({
    data: {
      createdAt: minutesFrom(now, -12 - index * 4),
      raceId,
      status: fixture.feedbackStatus,
      teamId,
      updatedAt: minutesFrom(now, -6 - index * 3),
    },
  });

  await prisma.feedbackMessage.createMany({
    data: fixture.feedbackMessages.map((content, messageIndex) => ({
      authorId: messageIndex % 2 === 0 ? fixture.captainId : ORGANIZER_ID,
      content,
      createdAt: minutesFrom(now, -10 - index * 4 + messageIndex),
      threadId: thread.id,
    })),
  });
}

async function createDemoHighlight(
  raceId: string,
  teamId: string,
  fixture: (typeof teamFixtures)[number],
  now: Date,
  index: number,
): Promise<void> {
  await prisma.ridingHighlight.create({
    data: {
      agentType: fixture.agentType,
      codeSnippet: demoSolutionCode(fixture.name),
      createdAt: minutesFrom(now, -3 - index * 2),
      excerpt: `${fixture.name} 通过 Agent + Runner 闭环生成公开进度投影。`,
      raceId,
      score: fixture.score,
      teamId,
    },
  });
}

async function createRaceNotifications(raceId: string, now: Date): Promise<void> {
  await prisma.notification.createMany({
    data: [
      {
        content:
          "排序演示赛已经开始。Jumbotron 正在读取公开榜单、Runner task、反馈线程和通知生成现场态势。",
        createdAt: minutesFrom(now, -20),
        raceId,
        target: "ALL",
        title: "排序演示赛已开始",
      },
      {
        content:
          "Pulse Boundary Check 触发边界输入失败，请 Organizer 关注风险提示。",
        createdAt: minutesFrom(now, -6),
        raceId,
        target: "ALL",
        title: "Runner 风险提示",
      },
      {
        content:
          "Vector Stable Sort 进入领先冲刺，建议观察 TOP3 和 Entry Inspect 面板。",
        createdAt: minutesFrom(now, -2),
        raceId,
        target: "ALL",
        title: "领先者更新",
      },
    ],
  });
}

function demoSolutionCode(teamName: string): string {
  return `// ${teamName}\nexport function solve(input: number[]): number[] {\n  return [...input].sort((a, b) => a - b);\n}\n`;
}

function minutesFrom(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
