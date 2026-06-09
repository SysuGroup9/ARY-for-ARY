import type {
  AttentionItem,
  CaProvider,
  CompetitionKpiSnapshot,
  CompetitionSnapshot,
  EntryStatus,
  JumbotronSnapshot,
  RacingEntrySnapshot,
  RidingMessageSnapshot,
  RiskLevel,
} from "@/lib/jumbotron/contracts";
import { mockJumbotronSnapshot } from "@/lib/jumbotron/mock-racing-data";
import type { TrackProfile } from "@/lib/jumbotron/track-profile";

interface DcrTeam {
  id: string;
  members: Array<{ displayName: string }>;
  name: string;
}

interface DcrLeaderboardEntry {
  agentType: string;
  createdAt: Date;
  rank?: number;
  team: DcrTeam;
  teamId: string;
  totalScore: number;
}

interface DcrSubmission {
  agentType: string;
  createdAt: Date;
  runnerStatus?: string | null;
  status: string;
  teamId: string;
  tokenUsed: number;
  totalScore?: number | null;
}

interface DcrRunnerTask {
  createdAt: Date;
  runnerComment?: string | null;
  status: string;
  teamId: string;
  taskType: string;
}

interface DcrNotification {
  content: string;
  createdAt: Date;
  id: string;
  title: string;
}

interface DcrFeedbackThread {
  id: string;
  messages: Array<{
    content: string;
    createdAt: Date;
    id: string;
  }>;
  status: string;
  team: DcrTeam;
  teamId: string;
}

export interface DcrRaceInput {
  cloudStudioUrl?: string;
  evaluationNotes: string;
  id: string;
  leaderboardEntries: DcrLeaderboardEntry[];
  notifications: DcrNotification[];
  organizer?: { username: string };
  phase: string;
  raceEnd: Date;
  raceStart: Date;
  runnerTasks: DcrRunnerTask[];
  submissions: DcrSubmission[];
  summary: string;
  taskPackageLabel: string;
  teams: DcrTeam[];
  title: string;
  feedbackThreads: DcrFeedbackThread[];
}

export function buildJumbotronSnapshotFromRace(
  race: DcrRaceInput | null,
  track: TrackProfile,
  now = new Date(),
): JumbotronSnapshot {
  if (!race) {
    return {
      ...mockJumbotronSnapshot,
      competition: {
        ...mockJumbotronSnapshot.competition,
        systemTime: formatSystemTime(now),
      },
      track,
    };
  }

  const entries = buildEntries(race, track, now);
  const messages = buildMessages(race, entries, now);
  const entriesWithMessages = attachLatestMessages(entries, messages);
  const attentionItems = buildAttentionItems(race, entriesWithMessages);

  return {
    attentionItems,
    competition: buildCompetition(race, entriesWithMessages, now),
    entries: entriesWithMessages,
    kpis: buildKpis(entriesWithMessages, attentionItems),
    messages,
    track,
  };
}

function buildCompetition(
  race: DcrRaceInput,
  entries: RacingEntrySnapshot[],
  now: Date,
): CompetitionSnapshot {
  return {
    competitionId: race.id,
    currentPhase: formatPhase(race.phase),
    currentRound: inferRoundLabel(race, now),
    elapsedTime: formatElapsedTime(race.raceStart, now),
    liveStatus: race.phase === "finished" ? "finished" : "live",
    nextPhase: race.phase === "active" ? "Freeze / Showcase" : "Race Start",
    onlineRiders: entries.length,
    organizer: race.organizer?.username ?? "Organizer",
    subtitle: race.summary,
    systemTime: formatSystemTime(now),
    theme: race.taskPackageLabel,
    title: race.title,
  };
}

function buildEntries(
  race: DcrRaceInput,
  track: TrackProfile,
  now: Date,
): RacingEntrySnapshot[] {
  const leaderboardByTeam = new Map(
    race.leaderboardEntries.map((entry) => [entry.teamId, entry]),
  );

  return race.teams.map((team, index) => {
    const leaderboardEntry = leaderboardByTeam.get(team.id);
    const latestSubmission = findLatestSubmission(race.submissions, team.id);
    const progress = deriveProgress(leaderboardEntry, latestSubmission, index, race.teams.length);
    const rank = leaderboardEntry?.rank ?? index + 1;

    return {
      caProvider: mapCaProvider(leaderboardEntry?.agentType ?? latestSubmission?.agentType),
      cockpitId: race.cloudStudioUrl || undefined,
      costTokens: latestSubmission?.tokenUsed ?? 0,
      currentPhase: deriveEntryPhase(progress.roundProgress),
      entryId: team.id,
      laneId: track.lanes[index % track.lanes.length]?.laneId,
      obstacleCount: latestSubmission?.status === "FAILED" ? 1 : 0,
      overallProgress: progress.overallProgress,
      phaseProgress: progress.phaseProgress,
      positionSource: progress.positionSource,
      projectName: team.name,
      rank,
      riderName: team.members[0]?.displayName ?? team.name,
      riskLevel: deriveRiskLevel(latestSubmission),
      roundProgress: progress.roundProgress,
      status: deriveEntryStatus(latestSubmission, now),
      updatedAt: latestSubmission?.createdAt.toISOString() ?? race.raceStart.toISOString(),
      violationCount: latestSubmission?.runnerStatus === "ANTI_CHEAT" ? 1 : 0,
    };
  });
}

function buildMessages(
  race: DcrRaceInput,
  entries: RacingEntrySnapshot[],
  now: Date,
): RidingMessageSnapshot[] {
  const feedbackMessages = race.feedbackThreads.flatMap((thread) => {
    const latest = thread.messages.at(-1);
    if (!latest) {
      return [];
    }

    return [{
      createdAt: latest.createdAt.toISOString(),
      displayMode: "bubble" as const,
      entryId: thread.teamId,
      messageId: latest.id,
      severity: thread.status === "PENDING" ? "medium" as const : "info" as const,
      source: "rider" as const,
      summary: latest.content,
      type: thread.status === "PENDING" ? "obstacle" as const : "progress_update" as const,
    }];
  });

  const runnerMessages = race.runnerTasks
    .filter((task) => task.status === "FAILED" || task.status === "STALE")
    .map((task) => ({
      createdAt: task.createdAt.toISOString(),
      displayMode: "ticker" as const,
      entryId: task.teamId,
      messageId: task.taskType + task.createdAt.toISOString(),
      severity: task.status === "FAILED" ? "high" as const : "medium" as const,
      source: "runner" as const,
      summary: task.runnerComment ?? `${task.taskType} ${task.status}`,
      type: task.status === "FAILED" ? "risk_alert" as const : "obstacle" as const,
    }));

  const statusMessages = entries.slice(0, 3).map((entry) => ({
    createdAt: now.toISOString(),
    displayMode: entry.riskLevel === "none" ? "bubble" as const : "ticker" as const,
    entryId: entry.entryId,
    messageId: `${entry.entryId}-status`,
    severity: entry.riskLevel === "high" ? "high" as const : "info" as const,
    source: "system" as const,
    summary: `${entry.projectName} 当前进度 ${Math.round(entry.roundProgress * 100)}%。`,
    type: "progress_update" as const,
  }));

  const notifications = race.notifications.slice(0, 4).map((notification) => ({
    createdAt: notification.createdAt.toISOString(),
    displayMode: "ticker" as const,
    entryId: entries[0]?.entryId ?? race.id,
    messageId: notification.id,
    severity: "info" as const,
    source: "organizer" as const,
    summary: `${notification.title}: ${notification.content}`,
    type: "strategy_change" as const,
  }));

  return [...feedbackMessages, ...runnerMessages, ...statusMessages, ...notifications]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 12);
}

function buildAttentionItems(
  race: DcrRaceInput,
  entries: RacingEntrySnapshot[],
): AttentionItem[] {
  const entryItems = entries.flatMap((entry) => {
    const items: AttentionItem[] = [];
    if (entry.riskLevel === "high") {
      items.push({
        category: "risk",
        createdAt: entry.updatedAt,
        entryId: entry.entryId,
        itemId: `${entry.entryId}-risk`,
        severity: "high",
        status: "active",
        summary: `${entry.projectName} 处于高风险状态。`,
      });
    }

    if (entry.obstacleCount > 0) {
      items.push({
        category: "obstacle",
        createdAt: entry.updatedAt,
        entryId: entry.entryId,
        itemId: `${entry.entryId}-obstacle`,
        severity: "medium",
        status: "active",
        summary: `${entry.projectName} 有 ${entry.obstacleCount} 个阻碍待处理。`,
      });
    }

    return items;
  });

  const pendingFeedback = race.feedbackThreads
    .filter((thread) => thread.status === "PENDING")
    .map((thread) => ({
      category: "obstacle" as const,
      createdAt: thread.messages.at(-1)?.createdAt.toISOString() ?? new Date().toISOString(),
      entryId: thread.teamId,
      itemId: `${thread.id}-feedback`,
      severity: "medium" as const,
      status: "active" as const,
      summary: `${thread.team.name} 有未解决反馈。`,
    }));

  return [...entryItems, ...pendingFeedback].slice(0, 10);
}

function attachLatestMessages(
  entries: RacingEntrySnapshot[],
  messages: RidingMessageSnapshot[],
): RacingEntrySnapshot[] {
  return entries.map((entry) => ({
    ...entry,
    lastMessage: messages.find((message) => message.entryId === entry.entryId),
  }));
}

function buildKpis(
  entries: RacingEntrySnapshot[],
  attentionItems: AttentionItem[],
): CompetitionKpiSnapshot {
  const totalTokens = entries.reduce((total, entry) => total + (entry.costTokens ?? 0), 0);
  const codexTokens = entries
    .filter((entry) => entry.caProvider === "codex")
    .reduce((total, entry) => total + (entry.costTokens ?? 0), 0);
  const claudeTokens = entries
    .filter((entry) => entry.caProvider === "claude")
    .reduce((total, entry) => total + (entry.costTokens ?? 0), 0);

  return {
    activeCockpits: entries.length,
    activeRiders: entries.filter((entry) => entry.status !== "stale").length,
    claudeShare: totalTokens === 0 ? 0 : claudeTokens / totalTokens,
    claudeTokens,
    codexShare: totalTokens === 0 ? 0 : codexTokens / totalTokens,
    codexTokens,
    completionRate: average(entries.map((entry) => entry.overallProgress)),
    obstacleCount: attentionItems.filter((item) => item.category === "obstacle").length,
    onlineRiders: entries.length,
    riskCount: attentionItems.filter((item) => item.category === "risk").length,
    totalTokens,
    violationCount: entries.reduce((total, entry) => total + entry.violationCount, 0),
  };
}

function deriveProgress(
  leaderboardEntry: DcrLeaderboardEntry | undefined,
  submission: DcrSubmission | undefined,
  index: number,
  totalTeams: number,
): Pick<RacingEntrySnapshot, "overallProgress" | "phaseProgress" | "positionSource" | "roundProgress"> {
  const scoreProgress = normalizeScore(leaderboardEntry?.totalScore ?? submission?.totalScore);
  if (leaderboardEntry || submission?.totalScore != null) {
    return {
      overallProgress: scoreProgress,
      phaseProgress: scoreProgress,
      positionSource: "roundProgress",
      roundProgress: scoreProgress,
    };
  }

  const fallback = totalTeams <= 1 ? 0.18 : 0.18 + (index / totalTeams) * 0.58;
  return {
    overallProgress: fallback,
    phaseProgress: fallback,
    positionSource: "overallProgress_fallback",
    roundProgress: fallback,
  };
}

function deriveEntryStatus(
  submission: DcrSubmission | undefined,
  now: Date,
): EntryStatus {
  if (!submission) {
    return "idle";
  }

  if (now.getTime() - submission.createdAt.getTime() > 90_000) {
    return "stale";
  }

  if (submission.status === "FAILED") {
    return "blocked";
  }

  if (submission.status === "SCORED") {
    return "finished";
  }

  return "running";
}

function deriveRiskLevel(submission: DcrSubmission | undefined): RiskLevel {
  if (!submission) {
    return "none";
  }

  if (submission.status === "FAILED" || submission.runnerStatus === "ANTI_CHEAT") {
    return "high";
  }

  if (submission.status === "PULLED") {
    return "medium";
  }

  return "low";
}

function deriveEntryPhase(progress: number): RacingEntrySnapshot["currentPhase"] {
  if (progress < 0.2) {
    return "PRD";
  }
  if (progress < 0.72) {
    return "DEV";
  }
  if (progress < 0.9) {
    return "REL";
  }

  return "OPS";
}

function findLatestSubmission(
  submissions: DcrSubmission[],
  teamId: string,
): DcrSubmission | undefined {
  return submissions
    .filter((submission) => submission.teamId === teamId)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];
}

function mapCaProvider(agentType: string | undefined): CaProvider {
  if (agentType === "CLAUDE") {
    return "claude";
  }

  if (agentType === "OPENAI") {
    return "codex";
  }

  return "other";
}

function normalizeScore(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value / 100));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatPhase(phase: string): string {
  const labels: Record<string, string> = {
    active: "Race Live",
    finished: "Showcase",
    frozen: "Frozen Board",
    preparation: "Preparation",
    registration: "Registration",
  };

  return labels[phase] ?? phase;
}

function inferRoundLabel(race: DcrRaceInput, now: Date): string {
  const duration = race.raceEnd.getTime() - race.raceStart.getTime();
  if (duration <= 0) {
    return "ROUND 1";
  }

  const elapsed = now.getTime() - race.raceStart.getTime();
  const round = Math.min(4, Math.max(1, Math.floor((elapsed / duration) * 4) + 1));
  return `ROUND ${round}`;
}

function formatElapsedTime(start: Date, now: Date): string {
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((elapsedSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function formatSystemTime(now: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    hour12: false,
    timeStyle: "short",
  }).format(now);
}
