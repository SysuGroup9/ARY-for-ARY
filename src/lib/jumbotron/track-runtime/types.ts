// Jumbotron track-runtime 核心类型定义
// 所有渲染层和计算层共享的数据契约

// ---- Track Profile ----

export interface TrackProfile {
  schemaVersion: string;
  trackId: string;
  name: string;
  viewBox: { w: number; h: number };
  background: {
    src: string;
    naturalWidth: number;
    naturalHeight: number;
  };
  centerline: {
    type: "polyline";
    closed: boolean;
    points: Point[];
    smoothing: "catmull-rom" | "linear";
  };
  direction: "clockwise" | "counterclockwise";
  startFinish: { s: number };
  lanes: Lane[];
  checkpoints: Checkpoint[];
  messageZones?: MessageZone[];
  noBubbleZones?: NoBubbleZone[];
}

export interface Point {
  x: number;
  y: number;
}

export interface Lane {
  id: string;
  name: string;
  offset: number;
}

export interface Checkpoint {
  id: string;
  name: string;
  s: number;
}

export interface MessageZone {
  id: string;
  sRange: [number, number];
  preferredSide: "left" | "right" | "top";
}

export interface NoBubbleZone {
  sRange: [number, number];
}

// ---- Racing Entry Snapshot ----

export interface RacingEntrySnapshot {
  entryId: string;
  riderName: string;
  projectName: string;
  cockpitId?: string;
  caProvider: "codex" | "claude" | "other";
  rank?: number;
  rankDelta?: number;    // 排名变化，正=上升，负=下降，0=不变
  score?: number;        // 当前总分
  overallProgress: number;
  roundProgress: number;
  phaseProgress?: number;
  currentPhase?: "PRD" | "DEV" | "REL" | "OPS" | "PM";
  costTokens?: number;
  costUsd?: number;
  riskLevel: "none" | "low" | "medium" | "high";
  obstacleCount: number;
  violationCount: number;
  status: HorseMotionState;
  laneId?: string;
  lastMessage?: RidingMessageSnapshot;
  updatedAt: string;
}

// ---- Horse Pose ----

export interface HorsePose {
  entryId: string;
  x: number;
  y: number;
  rotation: number;
  s: number;
  laneId: string;
  state: HorseMotionState;
  zIndex: number;
}

export type HorseMotionState =
  | "idle"
  | "running"
  | "sprinting"
  | "slowed"
  | "blocked"
  | "pit_stop"
  | "takeover"
  | "finished"
  | "stale";

// ---- Race Snapshot ----

export interface RaceSnapshot {
  generatedAt: string;
  raceId: string;
  trackId: string;
  competition: Competition;
  entries: RacingEntrySnapshot[];
  kpis: CompetitionKPI;
  messages: RidingMessageSnapshot[];
  attentionItems: AttentionItem[];
}

export interface Competition {
  competitionId: string;
  title: string;
  subtitle: string;
  theme: string;
  organizer: string;
  liveStatus: "not_started" | "live" | "finished";
  currentPhase: string;
  currentRound: number;
  nextPhase: string;
  elapsedTime: number;
  systemTime: string;
}

export interface CompetitionKPI {
  completionRate: number;
  totalTokens: number;
  activeRiders: number;
  onlineRiders: number;
  activeCockpits: number;
  codexTokens: number;
  claudeTokens: number;
  codexShare: number;
  claudeShare: number;
  riskCount: number;
  obstacleCount: number;
  violationCount: number;
}

// ---- Riding Message ----

export interface RidingMessageSnapshot {
  messageId: string;
  entryId: string;
  source: string;
  type:
    | "progress_update"
    | "milestone"
    | "strategy_change"
    | "quality_signal"
    | "risk_alert"
    | "obstacle"
    | "violation"
    | "takeover"
    | "pit_stop";
  severity: "info" | "warning" | "critical";
  summary: string;
  createdAt: string;
  displayMode: "bubble" | "ticker" | "both";
  targetUrl?: string;
}

// ---- Attention Item ----

export interface AttentionItem {
  itemId: string;
  entryId: string;
  category: "risk" | "obstacle" | "violation";
  severity: "low" | "medium" | "high" | "critical";
  summary: string;
  status: "active" | "acknowledged" | "resolved";
  createdAt: string;
  targetUrl?: string;
}

// ---- Validation Result ----

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}
