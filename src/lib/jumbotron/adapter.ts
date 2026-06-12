// Jumbotron Adapter：ARY Prisma 数据 → RacingEntrySnapshot[] + Competition + KPI
// MVVP 阶段从 ARY 现有数据推导 + mock 补全缺失字段
// 预留 DCRaceDataProvider 接口供未来 DC 真实数据接入

import type {
  RacingEntrySnapshot,
  RidingMessageSnapshot,
  AttentionItem,
  Competition,
  CompetitionKPI,
} from "./track-runtime/types";

// ---- DCRaceDataProvider 接口（未来 DC 接入时替换实现） ----

export interface DCRaceDataProvider {
  getRaceEntries(raceId: string): Promise<RacingEntrySnapshot[]>;
  getRidingMessages(raceId: string): Promise<RidingMessageSnapshot[]>;
  getAttentionItems(raceId: string): Promise<AttentionItem[]>;
  getCompetitionKPI(raceId: string): Promise<CompetitionKPI>;
}

// ---- 从 ARY 数据库查询结果的类型（简化版，只映射需要的字段） ----

export interface AryRaceData {
  id: string;
  title: string;
  summary: string;
  signupStart: Date;
  signupEnd: Date;
  raceStart: Date;
  raceEnd: Date;
  organizer: { id: string; username: string };
  teams: AryTeamData[];
  leaderboardEntries: AryLeaderboardEntryData[];
  teamArchives: AryTeamArchiveData[];
  feedbackThreads: AryFeedbackThreadData[];
}

export interface AryTeamData {
  id: string;
  name: string;
  captain: { id: string; username: string };
}

export interface AryLeaderboardEntryData {
  id: string;
  teamId: string;
  totalScore: number;
  taskScore: number | null;
  tokenScore: number | null;
  dialogueScore: number | null;
  agentType: string;
  createdAt: Date;
}

export interface AryTeamArchiveData {
  teamId: string;
  agentType: string;
  tokenUsed: number;
  totalScore: number;
  antiCheatPenalty: number | null;
}

export interface AryFeedbackThreadData {
  teamId: string;
  messages: Array<{ content: string; createdAt: Date }>;
}

// ---- AryDerivedDataProvider ----

export class AryDerivedDataProvider implements DCRaceDataProvider {
  constructor(private raceData: AryRaceData) {}

  async getRaceEntries(_raceId: string): Promise<RacingEntrySnapshot[]> {
    return mapToRacingEntries(this.raceData);
  }

  async getRidingMessages(_raceId: string): Promise<RidingMessageSnapshot[]> {
    return generateMessages(this.raceData);
  }

  async getAttentionItems(_raceId: string): Promise<AttentionItem[]> {
    return generateAttentionItems(this.raceData);
  }

  async getCompetitionKPI(_raceId: string): Promise<CompetitionKPI> {
    return calculateKPIs(this.raceData);
  }
}

// ---- 映射函数 ----

/**
 * ARY 数据 → Competition
 */
export function mapToCompetition(race: AryRaceData, now: Date = new Date()): Competition {
  const phase = getRaceLivePhase(race, now);
  const liveStatus: Competition["liveStatus"] =
    phase === "finished" ? "finished" : now >= race.raceStart ? "live" : "not_started";

  return {
    competitionId: race.id,
    title: race.title,
    subtitle: race.summary,
    theme: "ARY GRS 001",
    organizer: race.organizer.username,
    liveStatus,
    currentPhase: phase,
    currentRound: 1,
    nextPhase: phase === "active" ? "封榜中" : phase === "registration" ? "比赛中" : "比赛结束",
    elapsedTime: Math.max(0, Math.floor((now.getTime() - race.raceStart.getTime()) / 1000)),
    systemTime: now.toISOString(),
  };
}

/**
 * ARY 数据 → RacingEntrySnapshot[]
 */
export function mapToRacingEntries(race: AryRaceData): RacingEntrySnapshot[] {
  const { teams, leaderboardEntries, teamArchives, feedbackThreads } = race;

  // 按排名排序的榜单
  const ranked = [...leaderboardEntries].sort((a, b) => b.totalScore - a.totalScore);
  const maxScore = ranked[0]?.totalScore ?? 100;
  const archiveMap = new Map(teamArchives.map((a) => [a.teamId, a]));
  const feedbackMap = new Map(feedbackThreads.map((f) => [f.teamId, f]));

  return teams.map((team) => {
    const rank = ranked.findIndex((e) => e.teamId === team.id);
    const entry = ranked[rank];
    const archive = archiveMap.get(team.id);
    const feedback = feedbackMap.get(team.id);

    // roundProgress：按赛事阶段决定
    const now = new Date();
    const totalTeams = teams.length || 1;
    let roundProgress: number;
    if (now >= race.raceEnd) {
      // 已结束：所有马在赛道末端 0.90~0.98，形成"冲线"画面
      roundProgress = 0.90 + (1 - (rank + 1) / (totalTeams + 1)) * 0.08;
    } else if (now < race.raceStart) {
      // 未开赛：所有马在起跑线附近 0~0.08
      roundProgress = ((rank) / (totalTeams + 1)) * 0.08;
    } else {
      // 比赛中：按排名分布
      roundProgress = entry && totalTeams > 1
        ? 0.85 - (rank / (totalTeams - 1)) * 0.65
        : 0.5;
    }

    // overallProgress：分数相对最高分的比例
    const overallProgress =
      entry && maxScore > 0 ? Math.min(entry.totalScore / maxScore, 1) : 0.5;

    // status
    let status = deriveStatus(entry, race);
    // 比赛中最后一个为 stale（模拟离线）
    if (now >= race.raceStart && now < race.raceEnd && rank === totalTeams - 1) {
      status = "stale";
    }

    // lastMessage — 优先真实反馈，否则 mock
    const lastMsg = feedback?.messages?.slice(-1)[0];
    const mockMessages = [
      "正在优化边界条件处理",
      "已完成需求分析阶段",
      "开始编写核心算法",
      "Token 消耗优化中",
      "准备提交下一版方案",
      "测试用例通过率提升中",
      "正在 review 代码质量",
      "调试内存占用问题",
    ];
    const lastMessage: RidingMessageSnapshot | undefined = lastMsg
      ? {
          messageId: `msg-${team.id}`,
          entryId: team.id,
          source: "feedback",
          type: "progress_update",
          severity: "info",
          summary: lastMsg.content.slice(0, 50),
          createdAt: lastMsg.createdAt.toISOString(),
          displayMode: "ticker",
        }
      : {
          messageId: `msg-mock-${team.id}`,
          entryId: team.id,
          source: "dc",
          type: "progress_update",
          severity: "info",
          summary: mockMessages[rank >= 0 ? rank % mockMessages.length : 0],
          createdAt: new Date().toISOString(),
          displayMode: "bubble",
        };

    return {
      entryId: team.id,
      riderName: team.captain.username,
      projectName: team.name,
      cockpitId: undefined,
      caProvider: mapAgentType(archive?.agentType),
      rank: rank >= 0 ? rank + 1 : undefined,
      rankDelta: rank >= 0 ? (rank < 3 ? 1 : rank > 5 ? -1 : 0) : undefined, // mock: 前列上升，后列下降
      score: entry?.totalScore,
      overallProgress,
      roundProgress,
      phaseProgress: roundProgress, // mock：临时等同 roundProgress
      currentPhase: "DEV",          // mock
      costTokens: archive?.tokenUsed ?? 0,
      costUsd: (archive?.tokenUsed ?? 0) * 0.0001, // mock 费率
      riskLevel: (archive?.antiCheatPenalty ?? 0) > 0 ? "medium" : "low",
      obstacleCount: 0,             // mock
      violationCount: (archive?.antiCheatPenalty ?? 0) > 0 ? 1 : 0,
      status,
      laneId: undefined,            // 由 track-runtime lane-manager 分配
      lastMessage,
      updatedAt: entry?.createdAt.toISOString() ?? new Date().toISOString(),
    };
  });
}

/**
 * 生成 Mock Riding Messages
 */
export function generateMessages(race: AryRaceData): RidingMessageSnapshot[] {
  const messages: RidingMessageSnapshot[] = [];
  const now = new Date();

  // 从 feedback 生成消息
  for (const fb of race.feedbackThreads) {
    for (const msg of fb.messages.slice(-2)) {
      messages.push({
        messageId: `msg-${fb.teamId}-${Date.now()}-${Math.random()}`,
        entryId: fb.teamId,
        source: "feedback",
        type: "progress_update",
        severity: "info",
        summary: msg.content.slice(0, 80),
        createdAt: msg.createdAt.toISOString(),
        displayMode: "ticker",
      });
    }
  }

  // 补充 mock 消息
  const milestones = [
    "提交通过所有测试用例 ✓",
    "已完成需求分析阶段",
    "正在进行代码实现",
    "开始测试验证",
    "优化 Token 消耗策略",
  ];

  for (const team of race.teams.slice(0, 3)) {
    const randomMilestone = milestones[Math.floor(Math.random() * milestones.length)];
    messages.push({
      messageId: `msg-mock-${team.id}`,
      entryId: team.id,
      source: "dc",
      type: "milestone",
      severity: "info",
      summary: `${team.name}: ${randomMilestone}`,
      createdAt: new Date(now.getTime() - Math.random() * 600000).toISOString(),
      displayMode: "bubble",
    });
  }

  return messages;
}

/**
 * 生成 Attention Items（风险/阻碍/违规）
 */
export function generateAttentionItems(race: AryRaceData): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const archive of race.teamArchives) {
    if ((archive.antiCheatPenalty ?? 0) > 0) {
      const team = race.teams.find((t) => t.id === archive.teamId);
      items.push({
        itemId: `risk-${archive.teamId}`,
        entryId: archive.teamId,
        category: "violation",
        severity: "medium",
        summary: `${team?.name ?? archive.teamId}: 检测到诱导词，扣 ${archive.antiCheatPenalty} 分`,
        status: "active",
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Mock 风险项
  const riskTeams = race.teams.slice(0, 2);
  for (const team of riskTeams) {
    items.push({
      itemId: `risk-mock-${team.id}`,
      entryId: team.id,
      category: "risk",
      severity: "low",
      summary: `${team.name}: 提交间隔即将到期，请尽快提交`,
      status: "active",
      createdAt: new Date().toISOString(),
    });
  }

  return items;
}

/**
 * 计算 Competition KPI
 */
export function calculateKPIs(race: AryRaceData): CompetitionKPI {
  const totalTeams = race.teams.length;
  const scoredTeams = race.leaderboardEntries.length;

  const totalTokens = race.teamArchives.reduce((sum, a) => sum + a.tokenUsed, 0);
  const codexTokens = race.teamArchives
    .filter((a) => a.agentType === "COPILOT")
    .reduce((sum, a) => sum + a.tokenUsed, 0);
  const claudeTokens = race.teamArchives
    .filter((a) => a.agentType === "CLAUDE")
    .reduce((sum, a) => sum + a.tokenUsed, 0);
  const totalTokensWithCA = codexTokens + claudeTokens || 1;

  const riskCount = race.teamArchives.filter((a) => (a.antiCheatPenalty ?? 0) > 0).length;

  return {
    completionRate: totalTeams > 0 ? Math.round((scoredTeams / totalTeams) * 100) : 0,
    totalTokens,
    activeRiders: scoredTeams,
    onlineRiders: totalTeams,
    activeCockpits: scoredTeams,
    codexTokens,
    claudeTokens,
    codexShare: Math.round((codexTokens / totalTokensWithCA) * 100),
    claudeShare: Math.round((claudeTokens / totalTokensWithCA) * 100),
    riskCount,
    obstacleCount: 0,
    violationCount: riskCount,
  };
}

// ---- 辅助函数 ----

function mapAgentType(agentType?: string): "codex" | "claude" | "other" {
  switch (agentType) {
    case "CLAUDE":
      return "claude";
    case "COPILOT":
      return "codex";
    default:
      return "other";
  }
}

function deriveStatus(
  entry: AryLeaderboardEntryData | undefined,
  race: AryRaceData,
): RacingEntrySnapshot["status"] {
  const now = new Date();
  if (now >= race.raceEnd) return "finished";
  if (!entry) return "idle";
  if (entry.totalScore >= 80) return "sprinting";
  if (entry.totalScore >= 50) return "running";
  return "running";
}

function getRaceLivePhase(
  race: AryRaceData,
  now: Date,
): "registration" | "preparation" | "active" | "frozen" | "finished" {
  if (now >= race.raceEnd) return "finished";
  if (now >= race.raceStart) return "active";
  if (now > race.signupEnd || now < race.signupStart) return "preparation";
  return "registration";
}
