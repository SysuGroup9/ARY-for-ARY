import type {
  RacingEntrySnapshot,
  RaceSnapshot,
  CompetitionKPI,
} from "./types";

export interface LeaderboardRow {
  teamId: string;
  teamName: string;
  /** From LeaderboardEntry.totalScore — PROGRESS_EVAL result (0–100). Determines horse position. */
  progressScore: number;
  /** From latest Submission.totalScore — SUBMISSION_TEST result (0–100). 0 if no scored submission. */
  qualityScore: number;
  rank: number;
  createdAt: Date;
  /** From TeamArchive.antiCheatPenalty — covers plagiarism and malicious submissions. */
  antiCheatPenalty?: number | null;
  /** From TeamArchive.tokenUsed — total tokens consumed by this team. */
  tokenUsed?: number;
  /** Number of SCORED submissions this team has made — proxy for "how actively submitting". */
  submissionCount?: number;
  /** True when a RunnerTask with status RUNNING exists for this team — shown as pit_stop on track. */
  hasActiveTask?: boolean;
}

export interface RaceContext {
  raceId: string;
  title: string;
  currentPhase: string;
  raceStart?: Date | null;
}

/**
 * Composite risk:
 * - antiCheatPenalty > 0 → always high (violation, regardless of scores)
 * - Otherwise: worst of progressScore vs qualityScore drives the level
 */
function deriveRiskLevel(
  progressScore: number,
  qualityScore: number,
  antiCheatPenalty: number
): RacingEntrySnapshot["riskLevel"] {
  if (antiCheatPenalty > 0) return "high";
  const worstScore = Math.min(progressScore, qualityScore);
  if (worstScore < 20) return "high";
  if (worstScore < 40) return "medium";
  if (worstScore < 60) return "low";
  return "none";
}

const STALE_THRESHOLD_MS = 60 * 60 * 1000;

function deriveStatus(
  progressScore: number,
  updatedAt: Date,
  hasActiveTask?: boolean,
): RacingEntrySnapshot["status"] {
  if (hasActiveTask) return "pit_stop";
  if (Date.now() - updatedAt.getTime() > STALE_THRESHOLD_MS) return "stale";
  if (progressScore >= 95) return "finished";
  if (progressScore === 0) return "idle";
  if (progressScore < 20) return "blocked";
  return "running";
}

function formatElapsed(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function adaptToRaceSnapshot(
  rows: LeaderboardRow[],
  ctx: RaceContext
): RaceSnapshot {
  const entries: RacingEntrySnapshot[] = rows.map((row, idx) => {
    // roundProgress = progressScore / 100.
    // LeaderboardEntry.totalScore 是 PROGRESS_EVAL 的结果（0–100），ARY 归一化后映射到赛道位置。
    const roundProgress = row.progressScore / 100;
    return {
      entryId: row.teamId,
      riderName: row.teamName,
      projectName: row.teamName,
      displayName: row.teamName,
      caProvider: "claude",
      rank: row.rank,
      overallProgress: roundProgress,
      roundProgress,
      progressScore: row.progressScore,
      qualityScore: row.qualityScore,
      riskLevel: deriveRiskLevel(row.progressScore, row.qualityScore, row.antiCheatPenalty ?? 0),
      violationPenalty: row.antiCheatPenalty ?? 0,
      submissionCount: row.submissionCount ?? 0,
      status: deriveStatus(row.progressScore, row.createdAt, row.hasActiveTask),
      laneId: `lane-${idx % 8}`,
      updatedAt: row.createdAt.toISOString(),
    };
  });

  // completionRate = average progress score across all teams
  const completionRate =
    rows.length > 0
      ? Math.round(
          rows.reduce((sum, r) => sum + r.progressScore, 0) / rows.length
        )
      : 0;

  // Active riders = teams that have at least one scored submission (proactively submitting).
  const activeRiders = rows.filter((r) => (r.submissionCount ?? 0) > 0).length;

  const riskCount = entries.filter(
    (e) => e.riskLevel === "high" || e.riskLevel === "medium"
  ).length;

  const violationCount = entries.filter((e) => e.violationPenalty > 0).length;

  const totalTokens = rows.reduce((sum, r) => sum + (r.tokenUsed ?? 0), 0);

  const kpi: CompetitionKPI = {
    completionRate,
    activeRiders,
    onlineRiders: rows.length,
    riskCount,
    violationCount,
    totalTokens,
  };

  return {
    competitionId: ctx.raceId,
    title: ctx.title,
    currentRound: 1,
    currentPhase: ctx.currentPhase,
    elapsedTime: ctx.raceStart
      ? formatElapsed(Date.now() - ctx.raceStart.getTime())
      : "00:00:00",
    liveStatus: "live",
    kpi,
    entries,
    recentMessages: [],
  };
}
