export interface TrackProfile {
  schemaVersion: string;
  trackId: string;
  name: string;
  viewBox: { width: number; height: number };
  centerline: {
    type: "polyline";
    closed: boolean;
    points: [number, number][];
    smoothing: "catmull-rom" | "none";
  };
  direction: "clockwise" | "counterclockwise";
  startFinish: { s: number };
  lanes: Array<{ laneId: string; offset: number }>;
  checkpoints: Array<{ id: string; s: number; label: string }>;
  messageZones?: Array<{ sStart: number; sEnd: number; side: "left" | "right" }>;
  noBubbleZones?: Array<{ sStart: number; sEnd: number }>;
}

export interface RacingEntrySnapshot {
  entryId: string;
  riderName: string;
  projectName: string;
  displayName: string;
  caProvider: "codex" | "claude" | "other";
  rank?: number;
  overallProgress: number;
  /** 0–1 arc-length position on track. Derived from progressScore / 100. */
  roundProgress: number;
  /** From LeaderboardEntry.totalScore — PROGRESS_EVAL result (0–100). Drives horse position. */
  progressScore: number;
  /** From latest Submission.totalScore — SUBMISSION_TEST result (0–100). 0 if no scored submission yet. */
  qualityScore: number;
  /**
   * Composite risk: antiCheatPenalty>0 → always high; otherwise
   * worst of (progressScore, qualityScore): <20 high, <40 medium, <60 low, ≥60 none.
   */
  riskLevel: "none" | "low" | "medium" | "high";
  /**
   * >0 means antiCheatPenalty was applied.
   * Covers: plagiarism, malicious submissions (score manipulation or ARY platform attacks).
   */
  violationPenalty: number;
  /** Number of SCORED submissions this team has made (participant-initiated, not Runner-auto). */
  submissionCount: number;
  status:
    | "idle"
    | "running"
    | "blocked"
    | "pit_stop"
    | "takeover"
    | "finished"
    | "stale";
  laneId?: string;
  lastMessage?: RidingMessageSnapshot;
  updatedAt: string;
}

export interface RidingMessageSnapshot {
  messageId: string;
  entryId: string;
  type: string;
  severity: "info" | "warning" | "critical";
  summary: string;
  createdAt: string;
}

export interface HorsePose {
  entryId: string;
  x: number;
  y: number;
  /** degrees, 0 = pointing right */
  rotation: number;
  /** 0–1 arc-length parameter on the centerline */
  s: number;
  /** perpendicular offset from centerline in SVG units (positive = outside normal) */
  laneOffset: number;
  zIndex: number;
}

export interface CompetitionKPI {
  completionRate: number;
  activeRiders: number;
  onlineRiders: number;
  riskCount: number;
  violationCount: number;
  /** Sum of TeamArchive.tokenUsed across all participating teams. */
  totalTokens: number;
}

export interface RaceSnapshot {
  competitionId: string;
  title: string;
  currentRound: number;
  currentPhase: string;
  elapsedTime: string;
  liveStatus: "live" | "paused" | "finished";
  kpi: CompetitionKPI;
  entries: RacingEntrySnapshot[];
  recentMessages: RidingMessageSnapshot[];
}
