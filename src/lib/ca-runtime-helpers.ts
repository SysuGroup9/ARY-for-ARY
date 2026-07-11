import type { IngestionStatus } from "@/generated/prisma/enums";

export type RidingSignalType =
  | "artifact_linked"
  | "cost_updated"
  | "milestone_reached"
  | "riding_finished"
  | "riding_paused"
  | "riding_resumed"
  | "riding_started"
  | "risk_detected"
  | "session_completed"
  | "session_started"
  | "task_blocked"
  | "task_completed"
  | "task_progress"
  | "task_started"
  | "validation_run";

export type RidingSignalInput = {
  counters: {
    messageCount?: number;
    sessionCount?: number;
    tokens?: number;
    toolCallCount?: number;
  };
  ingestion: null | {
    status: IngestionStatus;
    statusReason: string;
  };
  currentGoal?: string | null;
  latestActivity?: string | null;
  progressPercent?: number | null;
  riskLevel?: string | null;
  riskReason?: string | null;
  taskStatus?: string | null;
  timestamp: Date;
  type: RidingSignalType;
};

const ACTIVE_SIGNAL_TYPES = new Set<RidingSignalType>([
  "artifact_linked",
  "cost_updated",
  "milestone_reached",
  "riding_finished",
  "riding_paused",
  "riding_resumed",
  "riding_started",
  "risk_detected",
  "session_completed",
  "session_started",
  "task_blocked",
  "task_completed",
  "task_progress",
  "task_started",
  "validation_run",
]);

export function isFailureSignalPayload(signal: RidingSignalInput): boolean {
  return signal.ingestion?.status === "FAILED";
}

export function getNextConnectionStatusFromSignal(input: {
  currentStatus: IngestionStatus;
  signal: RidingSignalInput;
}): IngestionStatus {
  if (isFailureSignalPayload(input.signal)) {
    return "FAILED";
  }

  if (ACTIVE_SIGNAL_TYPES.has(input.signal.type)) {
    return "ACTIVE";
  }

  return input.currentStatus;
}

export function buildSessionPatchFromSignal(input: {
  existingSession: null | {
    caSessionId: null | string;
    currentGoal?: null | string;
    endedAt: Date | null;
    lastActiveAt: Date | null;
    latestActivity?: null | string;
    messageCount: number;
    progressPercent?: null | number;
    riskLevel?: null | string;
    riskReason?: null | string;
    startedAt: Date;
    taskStatus?: null | string;
    tokenCost: number;
    toolCallCount: number;
  };
  signal: RidingSignalInput;
}) {
  const existing = input.existingSession;

  return {
    caSessionId: existing?.caSessionId ?? null,
    currentGoal: input.signal.currentGoal ?? existing?.currentGoal ?? null,
    endedAt:
      input.signal.type === "session_completed" ? input.signal.timestamp : null,
    lastActiveAt: input.signal.timestamp,
    latestActivity:
      input.signal.latestActivity ?? existing?.latestActivity ?? null,
    messageCount: input.signal.counters.messageCount ?? existing?.messageCount ?? 0,
    progressPercent:
      input.signal.progressPercent ?? existing?.progressPercent ?? null,
    riskLevel: input.signal.riskLevel ?? existing?.riskLevel ?? null,
    riskReason: input.signal.riskReason ?? existing?.riskReason ?? null,
    startedAt:
      existing?.startedAt ??
      (input.signal.type === "session_started"
        ? input.signal.timestamp
        : input.signal.timestamp),
    taskStatus: input.signal.taskStatus ?? existing?.taskStatus ?? null,
    tokenCost: input.signal.counters.tokens ?? existing?.tokenCost ?? 0,
    toolCallCount:
      input.signal.counters.toolCallCount ?? existing?.toolCallCount ?? 0,
  };
}

export function shouldApplyFetchedSnapshot(input: {
  fetchedAt: Date;
  snapshotFetchedAt: Date | null;
}): boolean {
  return !input.snapshotFetchedAt || input.fetchedAt > input.snapshotFetchedAt;
}

export function buildSessionPatchFromSnapshot(input: {
  snapshot: {
    fetchedAt: Date;
    summary: {
      currentGoal: string;
      latestActivity: string;
      riskLevel: string;
      riskReason: string;
    };
    task: {
      taskId: string;
      progressPercent: number;
      taskStatus: string;
    };
    session: {
      allRidingMessageLength: number;
      endedAt: Date | null;
      lastActiveAt: Date | null;
      messageCount: number;
      startedAt: Date;
      tokens: number;
      toolCallCount: number;
    };
  };
}) {
  return {
    allRidingMessageLength: input.snapshot.session.allRidingMessageLength,
    currentGoal: input.snapshot.summary.currentGoal,
    endedAt: input.snapshot.session.endedAt,
    lastActiveAt: input.snapshot.session.lastActiveAt,
    latestActivity: input.snapshot.summary.latestActivity,
    messageCount: input.snapshot.session.messageCount,
    progressPercent: input.snapshot.task.progressPercent,
    riskLevel: input.snapshot.summary.riskLevel,
    riskReason: input.snapshot.summary.riskReason,
    snapshotFetchedAt: input.snapshot.fetchedAt,
    startedAt: input.snapshot.session.startedAt,
    taskStatus: input.snapshot.task.taskStatus,
    tokenCost: input.snapshot.session.tokens,
    toolCallCount: input.snapshot.session.toolCallCount,
  };
}
