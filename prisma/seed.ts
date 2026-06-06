import { AgentType } from "../src/generated/prisma/enums";
import { hashPassword } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

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
      username: "organizer_demo",
      displayName: "Demo Organizer",
      passwordHash: await hashPassword("organizer123"),
      role: "ORGANIZER",
    },
  });

  const rider = await prisma.user.create({
    data: {
      username: "rider_demo",
      displayName: "Demo Rider",
      passwordHash: await hashPassword("rider123"),
      role: "RIDER",
    },
  });

  const now = new Date();
  const race = await prisma.race.create({
    data: {
      organizerId: organizer.id,
      title: "排序算法挑战赛",
      summary: "验证 Agent 在算法问题上的实现、推理与成本控制能力。",
      taskPackageLabel: "sort-task-v1.zip",
      taskDescription:
        "实现一个稳定排序模块，支持整数数组升序输出，并在边界输入下保持正确性。",
      trainingDataSummary:
        "训练数据包含小规模样例、重复元素、逆序输入和空数组。",
      hasTrainingData: true,
      evaluationNotes:
        "Runner 根据通过率、代码质量、推理过程和关键词覆盖度综合评分。",
      keywordsJson: JSON.stringify([
        "需求分析",
        "时间复杂度",
        "边界条件",
        "稳定性",
        "测试验证",
      ]),
      tokenLimit: 4000,
      signupStart: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      signupEnd: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      raceStart: new Date(now.getTime() + 25 * 60 * 60 * 1000),
      raceEnd: new Date(now.getTime() + 72 * 60 * 60 * 1000),
      enableFreeze: true,
      freezeMinutesBeforeEnd: 30,
      updateGranularityMinutes: 30,
      maxTeamSize: 5,
      submissionIntervalHours: 24,
      cloudStudioUrl: "https://cloudstudio.net/",
      displayShowTrainingData: true,
      displayShowOrganizerComment: true,
      displayShowTopHighlights: true,
      displayHighlightCount: 3,
      displayShowRiderCode: true,
      weightTaskPassRate: 0.5,
      weightCodeReview: 0.5,
      weightReasoning: 0.7,
      weightKeywords: 0.3,
      weightTotalTask: 0.5,
      weightTotalToken: 0.3,
      weightTotalDialogue: 0.2,
      organizerComment: "当前 demo 版本已切到真实数据库实现。",
    },
  });

  const team = await prisma.team.create({
    data: {
      raceId: race.id,
      captainId: rider.id,
      name: "排序小分队",
      members: {
        create: [
          {
            displayName: "Rider Demo",
            userId: rider.id,
          },
          {
            displayName: "Teammate A",
          },
        ],
      },
    },
  });

  const submission = await prisma.submission.create({
    data: {
      raceId: race.id,
      teamId: team.id,
      status: "SCORED",
      codeLabel: "solution.ts",
      codeContent: null,
      recordLabel: null,
      ridingRecord: null,
      tokenUsed: 1320,
      agentType: AgentType.OPENAI,
      totalScore: 83.5,
      antiCheatPenalty: 0,
      runnerComment: "边界处理完整，复杂度解释清晰。",
      runnerStatus: "succeeded",
      pulledAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      scoredAt: new Date(now.getTime() - 90 * 60 * 1000),
    },
  });

  const artifact = await prisma.submissionArtifact.create({
    data: {
      raceId: race.id,
      teamId: team.id,
      submissionId: submission.id,
      codeLabel: "solution.ts",
      codeContent:
        "export function solve(input: number[]) { return [...input].sort((a, b) => a - b); }",
      recordLabel: "riding-record.txt",
      ridingRecord:
        "先澄清输入边界，再验证复杂度，最后用正反例检查排序稳定性。",
      tokenUsed: 1320,
      agentType: AgentType.OPENAI,
    },
  });

  await prisma.runnerTask.createMany({
    data: [
      {
        raceId: race.id,
        teamId: team.id,
        submissionId: submission.id,
        artifactId: artifact.id,
        taskType: "SUBMISSION_TEST",
        status: "SUCCEEDED",
        score: 83.5,
        runnerComment: "基础测试通过，进入公开进度评测。",
        resultHash: "sha256:submission-test-demo",
        claimedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        finishedAt: new Date(now.getTime() - 150 * 60 * 1000),
      },
      {
        raceId: race.id,
        teamId: team.id,
        submissionId: submission.id,
        artifactId: artifact.id,
        taskType: "PROGRESS_EVAL",
        status: "SUCCEEDED",
        score: 83.5,
        runnerComment: "当前公开进度稳定，可进入榜单。",
        resultHash: "sha256:progress-eval-demo",
        claimedAt: new Date(now.getTime() - 140 * 60 * 1000),
        finishedAt: new Date(now.getTime() - 90 * 60 * 1000),
      },
      {
        raceId: race.id,
        teamId: team.id,
        submissionId: submission.id,
        artifactId: artifact.id,
        taskType: "HARNESS_EVAL",
        status: "SUCCEEDED",
        score: 86,
        runnerComment: "对话过程清晰，具备较好的驾驭能力。",
        resultHash: "sha256:harness-eval-demo",
        claimedAt: new Date(now.getTime() - 80 * 60 * 1000),
        finishedAt: new Date(now.getTime() - 30 * 60 * 1000),
      },
    ],
  });

  await prisma.teamArchive.create({
    data: {
      raceId: race.id,
      teamId: team.id,
      submissionId: submission.id,
      codeLabel: "solution.ts",
      codeContent: artifact.codeContent,
      recordLabel: "riding-record.txt",
      ridingRecord: artifact.ridingRecord,
      tokenUsed: 1320,
      agentType: AgentType.OPENAI,
      taskScore: null,
      dialogueScore: null,
      tokenScore: null,
      reasoningScore: null,
      keywordScore: null,
      totalScore: 83.5,
      antiCheatPenalty: 0,
    },
  });

  await prisma.leaderboardEntry.create({
    data: {
      raceId: race.id,
      teamId: team.id,
      submissionId: submission.id,
      totalScore: 83.5,
      taskScore: null,
      tokenScore: null,
      dialogueScore: null,
      agentType: AgentType.OPENAI,
    },
  });

  await prisma.harnessEntry.create({
    data: {
      raceId: race.id,
      teamId: team.id,
      harnessScore: 86,
      reasoningScore: null,
      keywordScore: null,
    },
  });

  await prisma.ridingHighlight.create({
    data: {
      raceId: race.id,
      teamId: team.id,
      score: 83.5,
      agentType: AgentType.OPENAI,
      excerpt: "先澄清输入边界，再验证复杂度，最后用正反例检查排序稳定性。",
      codeSnippet:
        "export function solve(input: number[]) { return [...input].sort((a, b) => a - b); }",
    },
  });

  const thread = await prisma.feedbackThread.create({
    data: {
      raceId: race.id,
      teamId: team.id,
      status: "PENDING",
    },
  });

  await prisma.feedbackMessage.createMany({
    data: [
      {
        threadId: thread.id,
        authorId: rider.id,
        content: "题目描述第 2 段对输入规模说明有歧义，请补充边界条件。",
      },
      {
        threadId: thread.id,
        authorId: organizer.id,
        content: "已在题面补充空数组与重复元素的处理要求。",
      },
    ],
  });

  await prisma.notification.create({
    data: {
      raceId: race.id,
      title: "题目已更新",
      content: "Organizer 已补充边界条件说明，请 Rider 重新阅读题面。",
      target: "ALL",
    },
  });

  await prisma.teamComment.create({
    data: {
      raceId: race.id,
      teamId: team.id,
      content: "实现稳健，建议补充更多极端输入下的性能说明。",
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
