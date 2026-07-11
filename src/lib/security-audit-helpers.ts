export function buildSecurityAuditRecord(input: {
  action: string;
  actorKind: string;
  caConnectionId?: null | string;
  details?: unknown;
  ipAddress?: null | string;
  payloadDigest?: string;
  raceId?: null | string;
  raceProjectId?: null | string;
  reason?: null | string;
  registrationId?: null | string;
  result: string;
  targetId: string;
  targetType: string;
  userAgent?: null | string;
  userId?: null | string;
}) {
  return {
    action: input.action,
    actorKind: input.actorKind,
    caConnectionId: input.caConnectionId ?? null,
    detailsJson: JSON.stringify(input.details ?? {}),
    ipAddress: input.ipAddress ?? null,
    payloadDigest: input.payloadDigest ?? "",
    raceId: input.raceId ?? null,
    raceProjectId: input.raceProjectId ?? null,
    reason: input.reason ?? "",
    registrationId: input.registrationId ?? null,
    result: input.result,
    targetId: input.targetId,
    targetType: input.targetType,
    userAgent: input.userAgent ?? null,
    userId: input.userId ?? null,
  };
}
