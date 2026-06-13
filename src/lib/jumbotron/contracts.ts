import type { Point, TrackProfile } from "@/lib/jumbotron/track-profile";

export type CaProvider = "claude" | "codex" | "other";
export type RiskLevel = "none" | "low" | "medium" | "high";
export type AttentionSeverity = "critical" | "high" | "low" | "medium";
export type AttentionCategory = "obstacle" | "risk" | "violation";
export type EntryStatus =
  | "blocked"
  | "finished"
  | "idle"
  | "pit_stop"
  | "running"
  | "stale"
  | "takeover";
export type HorseMotionState = EntryStatus | "slowed" | "sprinting";
export type RacePhaseCode = "DEV" | "OPS" | "PM" | "PRD" | "REL";

export interface RidingMessageSnapshot {
  createdAt: string;
  displayMode: "bubble" | "ticker";
  entryId: string;
  messageId: string;
  severity: AttentionSeverity | "info";
  source: "agent" | "organizer" | "rider" | "runner" | "system";
  summary: string;
  targetUrl?: string;
  type:
    | "milestone"
    | "obstacle"
    | "pit_stop"
    | "progress_update"
    | "quality_signal"
    | "risk_alert"
    | "strategy_change"
    | "takeover"
    | "violation";
}

export interface RacingEntrySnapshot {
  caProvider: CaProvider;
  cockpitId?: string;
  costTokens?: number;
  costUsd?: number;
  currentPhase?: RacePhaseCode;
  entryId: string;
  laneId?: string;
  lastMessage?: RidingMessageSnapshot;
  obstacleCount: number;
  overallProgress: number;
  phaseProgress?: number;
  positionSource: "overallProgress_fallback" | "roundProgress";
  projectName: string;
  rank?: number;
  riderName: string;
  riskLevel: RiskLevel;
  roundProgress: number;
  status: EntryStatus;
  updatedAt: string;
  violationCount: number;
}

export interface CompetitionSnapshot {
  competitionId: string;
  currentPhase: string;
  currentRound: string;
  elapsedTime: string;
  liveStatus: "finished" | "live" | "scheduled";
  nextPhase: string;
  onlineRiders: number;
  organizer: string;
  subtitle: string;
  systemTime: string;
  theme: string;
  title: string;
}

export interface CompetitionKpiSnapshot {
  activeCockpits: number;
  activeRiders: number;
  claudeShare: number;
  claudeTokens: number;
  codexShare: number;
  codexTokens: number;
  completionRate: number;
  obstacleCount: number;
  onlineRiders: number;
  riskCount: number;
  totalTokens: number;
  violationCount: number;
}

export interface AttentionItem {
  category: AttentionCategory;
  createdAt: string;
  entryId?: string;
  itemId: string;
  severity: AttentionSeverity;
  status: "active" | "resolved";
  summary: string;
  targetUrl?: string;
}

export interface JumbotronSnapshot {
  attentionItems: AttentionItem[];
  competition: CompetitionSnapshot;
  entries: RacingEntrySnapshot[];
  kpis: CompetitionKpiSnapshot;
  messages: RidingMessageSnapshot[];
  track: TrackProfile;
}

export interface HorsePose {
  collisionBox: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
  entryId: string;
  laneId: string;
  laneResolvedByFallback: boolean;
  normal: Point;
  rotation: number;
  s: number;
  state: HorseMotionState;
  tangent: Point;
  x: number;
  y: number;
  zIndex: number;
}

export interface RaceSnapshot {
  attentionItems: AttentionItem[];
  competition: CompetitionSnapshot;
  entries: RacingEntrySnapshot[];
  kpis?: CompetitionKpiSnapshot;
  messages: RidingMessageSnapshot[];
}

export interface MessageBubbleCandidate {
  entryId: string;
  height: number;
  message: RidingMessageSnapshot;
  width: number;
  x: number;
  y: number;
}
