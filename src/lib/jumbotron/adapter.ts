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
  submissions: ArySubmissionData[];
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
  progress?: number | null;
  taskScore: number | null;
  tokenScore: number | null;
  dialogueScore: number | null;
  agentType: string;
  createdAt: Date;
}

export interface ArySubmissionData {
  id: string;
  teamId: string;
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
  const { teams, leaderboardEntries, submissions, teamArchives, feedbackThreads } = race;

  const ranked = [...leaderboardEntries].sort((a, b) => b.totalScore - a.totalScore);
  const maxScore = ranked[0]?.totalScore ?? 100;
  const archiveMap = new Map(teamArchives.map((a) => [a.teamId, a]));
  const feedbackMap = new Map(feedbackThreads.map((f) => [f.teamId, f]));
  const submissionCountMap = submissions.reduce((map, submission) => {
    map.set(submission.teamId, (map.get(submission.teamId) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
  const now = new Date();
  const allRankedProgressZero =
    ranked.length > 0 &&
    ranked.every((entry) => typeof entry.progress === "number" && entry.progress === 0);

  return teams.map((team) => {
    const rank = ranked.findIndex((e) => e.teamId === team.id);
    const entry = ranked[rank];
    const archive = archiveMap.get(team.id);
    const feedback = feedbackMap.get(team.id);
    const submissionCount = submissionCountMap.get(team.id) ?? 0;

    // overallProgress：分数相对最高分的比例
    const overallProgress =
      entry && maxScore > 0 ? Math.min(entry.totalScore / maxScore, 1) : 0.5;

    const rawProgress = entry?.progress ?? null;
    let roundProgress: number;
    const shouldIgnoreZeroProgressPlaceholder =
      !!entry &&
      allRankedProgressZero &&
      overallProgress > 0 &&
      ranked.length > 1;

    if (typeof rawProgress === "number" && !shouldIgnoreZeroProgressPlaceholder) {
      roundProgress = Math.max(0, Math.min(rawProgress, 1));
    } else if (shouldIgnoreZeroProgressPlaceholder) {
      // 当排行榜已有明显分布，但整批 progress 都被写成占位 0 时，
      // 退回到 overallProgress，避免所有马被压到同一个起点/终点位置。
      roundProgress = overallProgress;
    } else if (now >= race.raceEnd) {
      roundProgress = 1;
    } else if (now < race.raceStart) {
      roundProgress = 0;
    } else if (entry) {
      // Jumbotron 子系统要求在缺失 roundProgress 时显式退回到 overallProgress，
      // 而不是把所有正在比赛的队伍压回起点。
      roundProgress = overallProgress;
    } else {
      roundProgress = 0;
    }

    const status = deriveStatus(entry, race, roundProgress);

    // lastMessage — 优先真实反馈，否则不显示
    const lastMsg = feedback?.messages?.slice(-1)[0];
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
      : undefined;

    return {
      entryId: team.id,
      riderName: team.captain.username,
      projectName: team.name,
      cockpitId: undefined,
      caProvider: mapAgentType(archive?.agentType),
      rank: rank >= 0 ? rank + 1 : undefined,
      rankDelta: undefined,
      score: entry?.totalScore,
      overallProgress,
      roundProgress,
      phaseProgress: roundProgress,
      currentPhase: submissionCount > 2 ? "REL" : submissionCount > 0 ? "DEV" : "PRD",
      costTokens: archive?.tokenUsed ?? 0,
      submissionCount,
      costUsd: (archive?.tokenUsed ?? 0) * 0.0001,
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
  roundProgress: number,
): RacingEntrySnapshot["status"] {
  const now = new Date();
  if (now >= race.raceEnd) return "finished";
  if (!entry) return "idle";
  if (roundProgress >= 0.95) return "sprinting";
  if (roundProgress > 0) return "running";
  return "idle";
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
