export type CAType = "CLAUDE_CODE" | "CODEX" | "OTHER";

export interface ConnectorConfig {
  aryBaseUrl: string;
  caConnectorBaseUrl: string;
  caConnectionId: string;
  caConnectorSecret: string;
  caConnectorId: string;
  caConnectorVersion: string;
  caProjectId: string;
  caRaceId: string;
  caRaceProjectId: string;
  caRegistrationId: string;
  caSessionId: string;
  caType: CAType;
  port: number;
}

export interface HandshakePayload {
  caConnectionId: string;
  caProjectId: string;
  connectorId: string;
  connectorVersion: string;
  timestamp: string;
}

export interface RidingSignalPayload {
  ca: {
    caConnectionId: string;
    caProjectId: string;
    caSessionId: string;
    caType: CAType;
    connectorId: string;
    connectorVersion: string;
  };
  counters: {
    allRidingMessageLength: number;
    messageCount: number;
    sessionCount: number;
    tokens: number;
    toolCallCount: number;
  };
  idempotencyKey: string;
  ingestion: {
    scope: string;
    status: "ACTIVE" | "CONNECTED" | "FAILED" | "PENDING";
    statusReason: string;
  } | null;
  messageId: string;
  race: {
    raceId: string;
    taskId?: string;
  };
  rider: {
    raceProjectId: string;
    registrationId: string;
  };
  signal: {
    kind: "event" | "note";
    phase?: string;
    progressPercent?: number;
    taskStatus?: string;
    type: "risk_detected" | "session_completed" | "session_started" | "task_progress";
  };
  summary?: {
    currentGoal?: string;
    latestActivity?: string;
    riskLevel?: string;
    riskReason?: string;
  };
  timestamp: string;
}

export interface SnapshotPayload {
  ca: {
    caConnectionId: string;
    caProjectId: string;
    caSessionId: string;
  };
  fetchedAt: string;
  schemaVersion: string;
  session: {
    allRidingMessageLength: number;
    endedAt: null | string;
    lastActiveAt: null | string;
    messageCount: number;
    startedAt: string;
    tokenCost: number;
    toolCallCount: number;
  };
  summary: {
    currentGoal: string;
    latestActivity: string;
    riskLevel: string;
    riskReason: string;
  };
  task: {
    progressPercent: number;
    taskStatus: string;
  };
}
