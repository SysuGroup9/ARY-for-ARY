import assert from "node:assert/strict";
import test from "node:test";
import { buildSecurityAuditRecord } from "./security-audit-helpers";

test("buildSecurityAuditRecord normalizes detailsJson and reason", () => {
  const record = buildSecurityAuditRecord({
    action: "ca_signal.ingest",
    actorKind: "CONNECTOR",
    caConnectionId: "conn_1",
    details: {
      idempotencyKey: "idem_1",
      sequence: 7,
    },
    payloadDigest: "digest_1",
    raceId: "race_1",
    reason: "",
    registrationId: "reg_1",
    result: "accepted",
    targetId: "session_1",
    targetType: "Session",
    userId: "user_1",
  });

  assert.equal(record.action, "ca_signal.ingest");
  assert.equal(record.reason, "");
  assert.equal(
    record.detailsJson,
    JSON.stringify({ idempotencyKey: "idem_1", sequence: 7 }),
  );
});
