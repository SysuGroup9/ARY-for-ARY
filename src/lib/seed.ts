import type {
  AgentType,
  AryState,
  HarnessEntry,
  LeaderboardEntry,
  Race,
  RidingHighlight,
  Team,
  TeamArchive,
  User,
} from "../types";

function makeIso(hoursFromNow: number): string {
  const stamp = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  return stamp.toISOString();
}

function buildLeaderboard(
  teamId: string,
  teamName: string,
  submissionId: string,
  agentType: AgentType,
  totalScore: number,
): LeaderboardEntry[] {
  return [
    {
      teamId,
      teamName,
      submissionId,
      totalScore,
      taskScore: 83.5,
      tokenScore: 90,
      dialogueScore: 88,
      agentType,
      updatedAt: new Date().toISOString(),
    },
  ];
}

function buildHarness(
  teamId: string,
  teamName: string,
  score: number,
): HarnessEntry[] {
  return [
    {
      teamId,
      teamName,
      harnessScore: score,
      reasoningScore: 91,
      keywordScore: 84,
      updatedAt: new Date().toISOString(),
    },
  ];
}

function buildHighlights(
  teamId: string,
  teamName: string,
  agentType: AgentType,
): RidingHighlight[] {
  return [
    {
      teamId,
      teamName,
      score: 91.2,
      agentType,
      excerpt:
        "先拆分需求边界，再反推数据结构与排序不变量，最后用回归样例校准边界条件。",
      codeSnippet: "function quickSort(list) {\n  if (list.length < 2) return list;\n  ...\n}",
    },
  ];
}

function buildRace(
  id: string,
  organizerId: string,
  title: string,
  summary: string,
  offsets: {
    signupStart: number;
    signupEnd: number;
    raceStart: number;
    raceEnd: number;
  },
  extras: Partial<Race>,
): Race {
  return {
    id,
    organizerId,
    title,
    summary,
    taskPackageLabel: `${title} Starter Pack`,
    taskDescription: "实现一个可审计、可解释的智能体编程竞赛流程。",
    trainingDataSummary: "提供 3 组排序案例与 2 组异常输入样例。",
    hasTrainingData: true,
    evaluationNotes: "Runner 只回传最终分数与公开榜单投影。",
    keywords: ["需求分析", "复杂度", "测试验证", "回归样例", "边界条件"],
    tokenLimit: 4000,
    signupStart: makeIso(offsets.signupStart),
    signupEnd: makeIso(offsets.signupEnd),
    raceStart: makeIso(offsets.raceStart),
    raceEnd: makeIso(offsets.raceEnd),
    enableFreeze: true,
    freezeMinutesBeforeEnd: 30,
    updateGranularityMinutes: 30,
    maxTeamSize: 5,
    submissionIntervalHours: 6,
    cloudStudioUrl: "https://cloudstudio.net/",
    display: {
      showTrainingData: true,
      showOrganizerComment: true,
      showTopRidingHighlights: true,
      highlightCount: 3,
      showRiderCode: true,
    },
    weights: {
      taskPassRate: 0.5,
      codeReview: 0.5,
      reasoning: 0.7,
      keywords: 0.3,
      totalTask: 0.5,
      totalToken: 0.3,
      totalDialogue: 0.2,
    },
    organizerComment: "",
    teamComments: [],
    publicLeaderboard: [],
    harnessLeaderboard: [],
    publishedHighlights: [],
    lastLeaderboardSyncAt: null,
    lastShowcaseSyncAt: null,
    lastUpdatedAt: new Date().toISOString(),
    ...extras,
  };
}

export function createSeedState(): AryState {
  const organizer: User = {
    id: "user-organizer",
    username: "organizer_demo",
    password: "organizer123",
    displayName: "ARY Organizer",
    role: "organizer",
    createdAt: new Date().toISOString(),
  };

  const rider: User = {
    id: "user-rider",
    username: "rider_demo",
    password: "rider123",
    displayName: "Sorting Squad",
    role: "rider",
    createdAt: new Date().toISOString(),
  };

  const warmupRace = buildRace(
    "race-finished",
    organizer.id,
    "GRS 001 Warmup Finals",
    "一个已完赛的展示样例，方便验证赛后公开投影与亮点展示。",
    {
      signupStart: -72,
      signupEnd: -60,
      raceStart: -54,
      raceEnd: -30,
    },
    {},
  );

  const activeRace = buildRace(
    "race-active",
    organizer.id,
    "GRS 001 Live Track",
    "一个进行中的样例赛事，便于验证报名、提交、Runner 拉取与榜单同步。",
    {
      signupStart: -12,
      signupEnd: -6,
      raceStart: -5,
      raceEnd: 8,
    },
    {},
  );

  const warmupTeam: Team = {
    id: "team-warmup",
    raceId: warmupRace.id,
    captainId: rider.id,
    name: "排序小分队",
    members: ["Owen", "Rider Alpha", "Rider Beta"],
    createdAt: new Date().toISOString(),
  };

  const archive: TeamArchive = {
    id: "archive-warmup",
    raceId: warmupRace.id,
    teamId: warmupTeam.id,
    teamName: warmupTeam.name,
    submissionId: "submission-warmup",
    code: "export function quickSort(input: number[]): number[] { return [...input].sort((a, b) => a - b); }",
    ridingRecord:
      "先定义输入输出契约，再分析递归基线，最后用随机样例做回归，保证算法正确性。",
    codeLabel: "quick-sort.ts",
    recordLabel: "riding-record.txt",
    tokenUsed: 1320,
    agentType: "openai",
    totalScore: 91.2,
    taskScore: 83.5,
    dialogueScore: 88,
    tokenScore: 90,
    reasoningScore: 91,
    keywordScore: 84,
    antiCheatPenalty: 0,
    createdAt: new Date().toISOString(),
  };

  warmupRace.organizerComment =
    "整体实现具备良好的边界意识，最好的队伍在解释复杂度与测试闭环上明显更成熟。";
  warmupRace.teamComments = [
    {
      teamId: warmupTeam.id,
      content: "你们的测试意识很强，建议继续加强异常处理与对数规模分析。",
    },
  ];
  warmupRace.publicLeaderboard = buildLeaderboard(
    warmupTeam.id,
    warmupTeam.name,
    archive.submissionId,
    archive.agentType,
    archive.totalScore,
  );
  warmupRace.harnessLeaderboard = buildHarness(
    warmupTeam.id,
    warmupTeam.name,
    88.2,
  );
  warmupRace.publishedHighlights = buildHighlights(
    warmupTeam.id,
    warmupTeam.name,
    archive.agentType,
  );
  warmupRace.lastLeaderboardSyncAt = new Date().toISOString();
  warmupRace.lastShowcaseSyncAt = new Date().toISOString();

  return {
    version: 2,
    users: [organizer, rider],
    session: {
      userId: null,
    },
    races: [activeRace, warmupRace],
    teams: [warmupTeam],
    submissions: [],
    teamArchives: [archive],
    feedbackThreads: [],
    notifications: [],
    lastCleanupAt: new Date().toISOString(),
  };
}
