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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
