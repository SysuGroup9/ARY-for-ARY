// Jumbotron Adapter：ARY Prisma 数据 → RacingEntrySnapshot[] + Competition + KPI
// MVVP 阶段从 ARY 现有数据推导 + mock 补全缺失字段
// 预留 DCRaceDataProvider 接口供未来 DC 真实数据接入

import { getRacePhase, type RacePhase } from "@/lib/race-phase";
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
  registrations?: Array<{
    id: string;
    userId: string;
    user: { id: string; username: string };
    raceProject?: null | {
      aggregateIngestionStatus: string;
      caConnections?: Array<{
        caType?: string;
        ingestionStatus?: string;
        sessions?: Array<{
          id: string;
          lastActiveAt?: Date;
          latestActivity?: string;
          progressPercent?: number;
          riskLevel?: string;
          riskReason?: string;
          tokenCost?: number;
          updatedAt?: Date;
        }>;
      }>;
      id: string;
    };
    work?: null | {
      id: string;
      summary: string;
      title: string;
    };
  }>;
  projections?: Array<{
    id: string;
    payloadJson: string;
    type: string;
  }>;
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
  registrationId?: null | string;
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
  registrationId?: null | string;
  teamId: string;
  createdAt: Date;
}

export interface AryTeamArchiveData {
  registrationId?: null | string;
  teamId: string;
  agentType: string;
  tokenUsed: number;
  totalScore: number;
  antiCheatPenalty: number | null;
}

export interface AryFeedbackThreadData {
  registrationId?: null | string;
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
    phase === "finished" || phase === "completed" || phase === "archived"
      ? "finished"
      : phase === "active" || phase === "frozen" || phase === "running" || phase === "submitting" || phase === "judging"
        ? "live"
        : "not_started";

  return {
    competitionId: race.id,
    title: race.title,
    subtitle: race.summary,
    theme: "ARY GRS 001",
    organizer: race.organizer.username,
    liveStatus,
    currentPhase: phase,
    currentRound: 1,
    nextPhase:
      phase === "registration"
        ? "比赛中"
        : phase === "preparation"
          ? "比赛中"
          : phase === "active"
            ? "封榜中"
            : phase === "frozen"
              ? "比赛结束"
              : "已结束",
    elapsedTime:
      phase === "active" || phase === "frozen"
        ? Math.max(0, Math.floor((now.getTime() - race.raceStart.getTime()) / 1000))
        : 0,
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
  // 构建 teamId → registrations[] 的映射（Team 维度聚合）
  const registrationsByTeamId = new Map<string, Array<typeof race.registrations extends Array<infer T> ? T : never>>();
  for (const registration of race.registrations ?? []) {
    // 从 leaderboardEntries 推断 teamId（leaderboardEntry.teamId 是可靠的 Team 标识）
    const leaderboardEntry = leaderboardEntries.find(
      (entry) => entry.registrationId === registration.id || entry.teamId === registration.id,
    );
    const teamId = leaderboardEntry?.teamId ?? registration.id;
    if (!registrationsByTeamId.has(teamId)) {
      registrationsByTeamId.set(teamId, []);
    }
    registrationsByTeamId.get(teamId)!.push(registration);
  }
  // 构建 registrationId → teamId 映射
  const teamIdByRegistrationId = new Map<string, string>();
  for (const [teamId, regs] of registrationsByTeamId) {
    for (const reg of regs) {
      teamIdByRegistrationId.set(reg.id, teamId);
    }
  }

  const archiveMap = new Map(
    teamArchives.map((archive) => [archive.teamId, archive]),
  );
  const feedbackMap = new Map(
    feedbackThreads.map((thread) => [thread.teamId, thread]),
  );
  const submissionCountMap = submissions.reduce((map, submission) => {
    const containerId = submission.teamId;
    map.set(containerId, (map.get(containerId) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
  const now = new Date();
  const allRankedProgressZero =
    ranked.length > 0 &&
    ranked.every((entry) => typeof entry.progress === "number" && entry.progress === 0);
  const projectedLeaderboard = race.projections?.find(
    (projection) => projection.type === "CURRENT_LEADERBOARD",
  );
  let projectedEntries = new Map<
    string,
    {
      entryId: string;
      progressPercent: number;
      rank: number;
      tokenCost: number;
      username: string;
    }
  >();
  let projectedRows: Array<{
    entryId: string;
    progressPercent: number;
    rank: number;
    tokenCost: number;
    username: string;
  }> = [];
  if (projectedLeaderboard) {
    try {
      const parsed = JSON.parse(projectedLeaderboard.payloadJson) as Array<{
        entryId: string;
        progressPercent: number;
        rank: number;
        tokenCost: number;
        username: string;
      }>;
      projectedRows = parsed;
      projectedEntries = new Map(parsed.map((item) => [item.entryId, item]));
    } catch {
      projectedEntries = new Map();
      projectedRows = [];
    }
  }

  // 以 Team 为单位构建 roster（不再以 registration 为单位）
  const rosterTeams = teams.length > 0
    ? teams.map((team) => ({
        id: team.id,
        name: team.name,
        captain: team.captain,
      }))
    : (race.registrations ?? []).map((registration) => ({
        id: registration.id,
        name: registration.work?.title ?? registration.user.username,
        captain: registration.user,
      }));

  return rosterTeams.map((team) => {
    const teamRegistrations = registrationsByTeamId.get(team.id) ?? [];
    const projected =
      projectedEntries.get(team.id) ??
      projectedRows.find((item) => item.username === team.captain.username);
    const rank = projected?.rank
      ? projected.rank - 1
      : ranked.findIndex(
          (entry) =>
            entry.teamId === team.id ||
            entry.registrationId === team.id ||
            teamIdByRegistrationId.get(entry.registrationId ?? "") === team.id,
        );
    const entry = ranked[rank];
    const archive = archiveMap.get(team.id);
    const feedback = feedbackMap.get(team.id);
    const submissionCount = submissionCountMap.get(team.id) ?? 0;

    // 聚合 Team 下所有 Registration 的 CA Connection 数据
    const allConnections = teamRegistrations.flatMap(
      (reg) => reg.raceProject?.caConnections ?? [],
    );
    const sessionTokenCost = allConnections.reduce(
      (sum, connection) =>
        sum +
        (connection.sessions?.reduce(
          (inner, session) => inner + (session.tokenCost ?? 0),
          0,
        ) ?? 0),
      0,
    );
    const primaryConnection = allConnections[0];
    const latestSession =
      allConnections
        .flatMap((connection) => connection.sessions ?? [])
        .sort(
          (left, right) =>
            getSessionActivityTime(right) - getSessionActivityTime(left),
        )[0] ?? null;
    const effectiveTokenCost =
      sessionTokenCost > 0 ? sessionTokenCost : (archive?.tokenUsed ?? 0);

    // overallProgress：分数相对最高分的比例
    const overallProgress =
      projected?.progressPercent != null
        ? Math.max(0, Math.min(projected.progressPercent / 100, 1))
        : entry && maxScore > 0
          ? Math.min(entry.totalScore / maxScore, 1)
          : 0.5;

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
    } else if (projected) {
      roundProgress = overallProgress;
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
      : latestSession?.latestActivity
        ? {
            messageId: `msg-${team.id}-session`,
            entryId: team.id,
            source: "session",
            type: "progress_update",
            severity: "info",
            summary: latestSession.latestActivity,
            createdAt: new Date().toISOString(),
            displayMode: "ticker",
          }
      : undefined;

    // ── 综合风险推导：CA接入失败 + 会话风险 + 反作弊扣分 ──
    // 聚合 Team 下所有 Registration 的风险
    const antiCheatPenalty = archive?.antiCheatPenalty ?? 0;
    const ingestionFailed = teamRegistrations.some(
      (reg) =>
        reg.raceProject?.aggregateIngestionStatus === "FAILED" ||
        (reg.raceProject?.caConnections ?? []).some(
          (connection) => connection.ingestionStatus === "FAILED",
        ),
    );
    const sessionRiskLevel = latestSession?.riskLevel?.toLowerCase();
    const sessionRiskReason =
      latestSession?.riskReason && latestSession.riskReason !== "none"
        ? latestSession.riskReason
        : undefined;

    const riskReasons: string[] = [];
    let riskLevel: RacingEntrySnapshot["riskLevel"] = "low";
    let violationCount = 0;

    if (antiCheatPenalty > 0) {
      riskLevel = "high";
      violationCount += 1;
      riskReasons.push(`检测到诱导词，扣 ${antiCheatPenalty} 分`);
    }
    if (ingestionFailed) {
      if (riskLevel !== "high") riskLevel = "medium";
      riskReasons.push("CA 接入失败，实况数据中断");
    }
    if (sessionRiskLevel === "high" || sessionRiskLevel === "medium") {
      if (riskLevel === "low") {
        riskLevel = sessionRiskLevel as RacingEntrySnapshot["riskLevel"];
      }
      riskReasons.push(sessionRiskReason ?? "会话风险等级偏高");
    }
    const riskReason = riskReasons.length > 0 ? riskReasons.join("；") : undefined;

    // 判断 Team 是否有 ACTIVE 状态的 RaceProject（任一成员）
    const hasActiveIngestion = teamRegistrations.some(
      (reg) => reg.raceProject?.aggregateIngestionStatus === "ACTIVE",
    );

    return {
      entryId: team.id,
      riderName: team.name,
      projectName: team.name,
      cockpitId: undefined,
      caProvider: mapCAType(primaryConnection?.caType) ?? mapAgentType(archive?.agentType),
      rank: projected?.rank ?? (rank >= 0 ? rank + 1 : undefined),
      rankDelta: undefined,
      score: entry?.totalScore ?? projected?.progressPercent,
      overallProgress,
      roundProgress,
      phaseProgress: roundProgress,
      currentPhase: submissionCount > 2 ? "REL" : submissionCount > 0 ? "DEV" : "PRD",
      costTokens: effectiveTokenCost,
      submissionCount,
      costUsd: effectiveTokenCost * 0.0001,
      riskLevel,
      obstacleCount: 0,             // mock
      violationCount,
      riskReason,
      status:
        hasActiveIngestion
          ? "running"
          : status,
      laneId: undefined,            // 由 track-runtime lane-manager 分配
      lastMessage,
      updatedAt:
        latestSession?.lastActiveAt?.toISOString() ??
        latestSession?.updatedAt?.toISOString() ??
        entry?.createdAt.toISOString() ??
        new Date().toISOString(),
    };
  });
}

/**
 * 生成 Mock Riding Messages
 */
export function generateMessages(race: AryRaceData): RidingMessageSnapshot[] {
  const projected = race.projections?.find((projection) => projection.type === "SCREEN_FEED");
  if (projected) {
    try {
      const parsed = JSON.parse(projected.payloadJson) as {
        items?: Array<{ summary: string; type: string }>;
      };
      if (parsed.items?.length) {
        return parsed.items.map((item, index) => ({
          messageId: `screen-feed-${index}`,
          entryId: race.teams[index]?.id ?? race.id,
          source: "projection",
          type:
            item.type === "current_leaderboard_projection" ||
            item.type === "leaderboard_read_model"
              ? "milestone"
              : "progress_update",
          severity: "info",
          summary: item.summary,
          createdAt: new Date().toISOString(),
          displayMode: "ticker",
        }));
      }
    } catch {
      // fall back to legacy/mock generation
    }
  }

  const messages: RidingMessageSnapshot[] = [];
  const now = new Date();

  // 构建 teamId → registrations 映射
  const registrationsByTeamId = new Map<string, Array<typeof race.registrations extends Array<infer T> ? T : never>>();
  for (const registration of race.registrations ?? []) {
    const leaderboardEntry = race.leaderboardEntries.find(
      (entry) => entry.registrationId === registration.id || entry.teamId === registration.id,
    );
    const teamId = leaderboardEntry?.teamId ?? registration.id;
    if (!registrationsByTeamId.has(teamId)) {
      registrationsByTeamId.set(teamId, []);
    }
    registrationsByTeamId.get(teamId)!.push(registration);
  }

  const sessionMessages = (race.teams ?? []).flatMap((team) => {
    const teamRegs = registrationsByTeamId.get(team.id) ?? [];
    return teamRegs.flatMap((registration) =>
      registration.raceProject?.caConnections?.flatMap((connection) =>
        (connection.sessions ?? [])
          .filter((session) => session.latestActivity)
          .map((session, index) => ({
            messageId: `session-${team.id}-${index}`,
            entryId: team.id,
            source: "session",
            type: "progress_update" as const,
            severity: "info" as const,
            summary: session.latestActivity!,
            createdAt: now.toISOString(),
            displayMode: "ticker" as const,
          })),
      ) ?? [],
    );
  });

  if (sessionMessages.length > 0) {
    return sessionMessages;
  }

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

  return messages;
}

/**
 * 生成 Attention Items（风险/阻碍/违规）
 */
export function generateAttentionItems(race: AryRaceData): AttentionItem[] {
  const items: AttentionItem[] = [];

  // 构建 teamId → registrations 映射
  const registrationsByTeamId = new Map<string, Array<typeof race.registrations extends Array<infer T> ? T : never>>();
  for (const registration of race.registrations ?? []) {
    const leaderboardEntry = race.leaderboardEntries.find(
      (entry) => entry.registrationId === registration.id || entry.teamId === registration.id,
    );
    const teamId = leaderboardEntry?.teamId ?? registration.id;
    if (!registrationsByTeamId.has(teamId)) {
      registrationsByTeamId.set(teamId, []);
    }
    registrationsByTeamId.get(teamId)!.push(registration);
  }

  // 按 Team 维度聚合 Attention Items
  for (const team of race.teams ?? []) {
    const teamRegs = registrationsByTeamId.get(team.id) ?? [];
    const allConnections = teamRegs.flatMap(
      (reg) => reg.raceProject?.caConnections ?? [],
    );

    const ingestionFailed =
      teamRegs.some(
        (reg) =>
          reg.raceProject?.aggregateIngestionStatus === "FAILED" ||
          (reg.raceProject?.caConnections ?? []).some(
            (connection) => connection.ingestionStatus === "FAILED",
          ),
      );
    if (ingestionFailed) {
      items.push({
        itemId: `risk-ca-${team.id}`,
        entryId: team.id,
        category: "risk",
        severity: "medium",
        summary: `${team.name}: CA 接入失败，实况数据中断`,
        status: "active",
        createdAt: new Date().toISOString(),
      });
    }

    // 会话级风险（中/高）
    const riskySession = allConnections
      .flatMap((connection) => connection.sessions ?? [])
      .find((session) => {
        const level = session.riskLevel?.toLowerCase();
        return level === "medium" || level === "high";
      });
    if (riskySession) {
      const reason =
        riskySession.riskReason && riskySession.riskReason !== "none"
          ? riskySession.riskReason
          : "会话风险等级偏高";
      items.push({
        itemId: `risk-session-${team.id}`,
        entryId: team.id,
        category: "risk",
        severity:
          riskySession.riskLevel?.toLowerCase() === "high" ? "high" : "medium",
        summary: `${team.name}: ${reason}`,
        status: "active",
        createdAt: new Date().toISOString(),
      });
    }
  }

  for (const archive of race.teamArchives) {
    if ((archive.antiCheatPenalty ?? 0) > 0) {
      const team = race.teams.find((t) => t.id === archive.teamId);
      const entryId = archive.teamId;
      const label = team?.name ?? archive.teamId;
      items.push({
        itemId: `risk-${entryId}`,
        entryId,
        category: "violation",
        severity: "medium",
        summary: `${label}: 检测到诱导词，扣 ${archive.antiCheatPenalty} 分`,
        status: "active",
        createdAt: new Date().toISOString(),
      });
    }
  }

  return items;
}

/**
 * 计算 Competition KPI
 */
export function calculateKPIs(race: AryRaceData): CompetitionKPI {
  const totalTeams = race.teams.length > 0 ? race.teams.length : (race.registrations?.length ?? 0);

  // 构建 teamId → registrations 映射
  const registrationsByTeamId = new Map<string, Array<typeof race.registrations extends Array<infer T> ? T : never>>();
  for (const registration of race.registrations ?? []) {
    const leaderboardEntry = race.leaderboardEntries.find(
      (entry) => entry.registrationId === registration.id || entry.teamId === registration.id,
    );
    const teamId = leaderboardEntry?.teamId ?? registration.id;
    if (!registrationsByTeamId.has(teamId)) {
      registrationsByTeamId.set(teamId, []);
    }
    registrationsByTeamId.get(teamId)!.push(registration);
  }

  // 有至少一个 RaceProject 的 Team 数
  const activeRaceProjects = race.teams.length > 0
    ? race.teams.filter((team) => {
        const regs = registrationsByTeamId.get(team.id) ?? [];
        return regs.some((reg) => reg.raceProject != null);
      }).length
    : (race.registrations ?? []).filter((reg) => reg.raceProject).length;

  // 有 ACTIVE ingestion 的 Team 数
  const activeRegistrations = race.teams.length > 0
    ? race.teams.filter((team) => {
        const regs = registrationsByTeamId.get(team.id) ?? [];
        return regs.some(
          (reg) => reg.raceProject?.aggregateIngestionStatus === "ACTIVE",
        );
      }).length
    : (race.registrations ?? []).filter(
        (reg) => reg.raceProject?.aggregateIngestionStatus === "ACTIVE",
      ).length;

  const sessionTokenCosts = (race.registrations ?? []).flatMap((registration) =>
    registration.raceProject?.caConnections?.flatMap((connection) =>
      connection.sessions?.map((session) => session.tokenCost ?? 0) ?? [],
    ) ?? [],
  );
  const totalTokens = sessionTokenCosts.length
    ? sessionTokenCosts.reduce((sum, tokenCost) => sum + tokenCost, 0)
    : race.teamArchives.reduce((sum, a) => sum + a.tokenUsed, 0);
  const codexTokens = sessionTokenCosts.length
    ? sessionTokenCosts.reduce((sum, tokenCost) => sum + tokenCost, 0)
    : race.teamArchives
        .filter((a) => a.agentType === "COPILOT")
        .reduce((sum, a) => sum + a.tokenUsed, 0);
  const claudeTokens = sessionTokenCosts.length
    ? 0
    : race.teamArchives
        .filter((a) => a.agentType === "CLAUDE")
        .reduce((sum, a) => sum + a.tokenUsed, 0);
  const totalTokensWithCA = codexTokens + claudeTokens || 1;

  // 有 FAILED ingestion 或反作弊扣分的 Team 数
  const riskCount = race.teams.length > 0
    ? race.teams.filter((team) => {
        const regs = registrationsByTeamId.get(team.id) ?? [];
        const hasFailed = regs.some(
          (reg) => reg.raceProject?.aggregateIngestionStatus === "FAILED",
        );
        const hasPenalty = race.teamArchives.some(
          (a) => a.teamId === team.id && (a.antiCheatPenalty ?? 0) > 0,
        );
        return hasFailed || hasPenalty;
      }).length
    : (race.registrations ?? []).filter(
        (reg) => reg.raceProject?.aggregateIngestionStatus === "FAILED",
      ).length || race.teamArchives.filter((a) => (a.antiCheatPenalty ?? 0) > 0).length;

  return {
    completionRate: totalTeams > 0 ? Math.round((activeRaceProjects / totalTeams) * 100) : 0,
    totalTokens,
    activeRiders: activeRegistrations,
    onlineRiders: totalTeams,
    activeCockpits: activeRaceProjects,
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

function mapCAType(caType?: string): "codex" | "claude" | "other" | null {
  switch (caType) {
    case "CODEX":
      return "codex";
    case "CLAUDE_CODE":
      return "claude";
    case "OTHER":
      return "other";
    default:
      return null;
  }
}

function getSessionActivityTime(session: {
  lastActiveAt?: Date;
  updatedAt?: Date;
}): number {
  return (
    session.lastActiveAt?.getTime() ??
    session.updatedAt?.getTime() ??
    0
  );
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

function getRaceLivePhase(race: AryRaceData, now: Date): RacePhase {
  return getRacePhase(
    {
      signupStart: race.signupStart,
      signupEnd: race.signupEnd,
      raceStart: race.raceStart,
      raceEnd: race.raceEnd,
      enableFreeze: false,
      freezeMinutesBeforeEnd: 0,
    },
    now,
  );
}
