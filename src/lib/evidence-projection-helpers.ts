export function buildSessionSummaryEvidenceRecord(input: {
  caConnectionId: string;
  caProjectId: string;
  caSessionId: string;
  caType: "CLAUDE_CODE" | "CODEX" | "OTHER";
  confidenceLevel: "high" | "medium";
  generatedFromEventIdsJson: string;
  integrityStatus: "ok" | "review_needed";
  messageCount: number;
  registrationId: string;
  reviewFlagJson: string;
  sourceDigest: string;
  startedAt: Date;
  tokenCost: number;
  toolCallCount: number;
}) {
  return {
    confidenceLevel: input.confidenceLevel,
    generatedFromEventIdsJson: input.generatedFromEventIdsJson,
    integrityStatus: input.integrityStatus,
    registrationId: input.registrationId,
    reviewFlagJson: input.reviewFlagJson,
    sourceDigest: input.sourceDigest,
    sourceRefJson: JSON.stringify({
      caConnectionId: input.caConnectionId,
      caProjectId: input.caProjectId,
      caSessionId: input.caSessionId,
    }),
    summary: `${input.caType} session ${input.caSessionId} produced ${input.messageCount} messages, ${input.toolCallCount} tool calls, and ${input.tokenCost} tokens.`,
    title: `Session ${input.caSessionId}`,
    type: "SESSION_SUMMARY" as const,
    visibility: "INTERNAL" as const,
  };
}

export function buildRegistrationStatusProjectionPayload(input: {
  aggregateIngestionStatus: "ACTIVE" | "CONNECTED" | "FAILED" | "NOT_CONFIGURED";
  caConnectionCount: number;
  raceProjectId: null | string;
  registrationId: string;
  registrationStatus: "APPROVED" | "REJECTED" | "SUBMITTED" | "WITHDRAWN";
  sessionCount: number;
  username: string;
}) {
  return {
    aggregateIngestionStatus: input.aggregateIngestionStatus,
    caConnectionCount: input.caConnectionCount,
    raceProjectId: input.raceProjectId,
    registrationId: input.registrationId,
    registrationStatus: input.registrationStatus,
    sessionCount: input.sessionCount,
    username: input.username,
  };
}

export function buildRaceProgressProjectionPayload(input: {
  activeConnections: number;
  activeRegistrations: number;
  activeSessions: number;
  raceId: string;
  totalRegistrations: number;
}) {
  return {
    activeConnections: input.activeConnections,
    activeRegistrations: input.activeRegistrations,
    activeSessions: input.activeSessions,
    raceId: input.raceId,
    totalRegistrations: input.totalRegistrations,
  };
}

export function buildScreenFeedProjectionPayload(input: {
  items: Array<{
    summary: string;
    type:
      | "announcement"
      | "current_leaderboard_projection"
      | "leaderboard_read_model"
      | "works"
      | "session_summary";
  }>;
  raceId: string;
}) {
  return {
    items: input.items,
    raceId: input.raceId,
  };
}

export function buildEventStreamProjectionPayload(input: {
  items: Array<{
    createdAt: string;
    registrationId?: null | string;
    severity: "critical" | "info" | "warning";
    summary: string;
    type: "announcement" | "risk" | "session_activity";
    username?: null | string;
  }>;
  raceId: string;
}) {
  return {
    items: [...input.items].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    ),
    raceId: input.raceId,
  };
}

export function buildCurrentLeaderboardProjectionPayload(
  items: Array<{
    entryId: string;
    progressPercent: number;
    tokenCost: number;
    username: string;
  }>,
) {
  return [...items]
    .sort((left, right) => {
      if (right.progressPercent !== left.progressPercent) {
        return right.progressPercent - left.progressPercent;
      }
      if (left.tokenCost !== right.tokenCost) {
        return left.tokenCost - right.tokenCost;
      }
      return left.username.localeCompare(right.username, "en");
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}
