import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPayloadDigest,
  classifyDuplicatePayload,
  evaluateObservedAtWindow,
  evaluateSequenceProgression,
  summarizeEvidenceIntegrity,
} from "./ca-integrity-helpers";

test("buildPayloadDigest returns the same digest for the same normalized payload", () => {
  const left = buildPayloadDigest({
    schemaVersion: "ary.ca.riding_signal.v0.1",
    idempotencyKey: "k1",
    sequence: 7,
  });
  const right = buildPayloadDigest({
    schemaVersion: "ary.ca.riding_signal.v0.1",
    idempotencyKey: "k1",
    sequence: 7,
  });

  assert.equal(left, right);
  assert.match(left, /^[a-f0-9]{64}$/);
});

test("classifyDuplicatePayload marks different digests as integrity_gap", () => {
  assert.deepEqual(
    classifyDuplicatePayload({
      existingDigest: "aaa",
      incomingDigest: "bbb",
    }),
    {
      deduped: false,
      integrityStatus: "integrity_gap",
      shouldCreateConflictEvent: true,
    },
  );
});

test("evaluateObservedAtWindow marks stale signals as review_needed", () => {
  const result = evaluateObservedAtWindow({
    maxSkewMs: 5 * 60 * 1000,
    observedAt: new Date("2026-06-19T10:00:00Z"),
    receivedAt: new Date("2026-06-19T10:12:00Z"),
  });

  assert.equal(result.integrityStatus, "review_needed");
  assert.match(result.reviewFlags[0] ?? "", /timestamp/i);
});

test("summarizeEvidenceIntegrity downgrades evidence confidence when source events need review", () => {
  const summary = summarizeEvidenceIntegrity([
    { id: "evt_ok", integrityStatus: "ok" },
    { id: "evt_review", integrityStatus: "review_needed" },
  ]);

  assert.deepEqual(summary, {
    confidenceLevel: "medium",
    generatedFromEventIdsJson: JSON.stringify(["evt_ok", "evt_review"]),
    integrityStatus: "review_needed",
    reviewFlagJson: JSON.stringify(["source_event_review_needed"]),
  });
});

test("evaluateSequenceProgression marks repeated sequence as replayed", () => {
  assert.deepEqual(
    evaluateSequenceProgression({
      incomingSequence: 11,
      latestAcceptedSequence: 11,
    }),
    {
      integrityStatus: "integrity_gap",
      reason: "sequence_replayed",
      shouldAdvance: false,
    },
  );
});

test("evaluateSequenceProgression marks smaller sequence as out_of_order", () => {
  assert.deepEqual(
    evaluateSequenceProgression({
      incomingSequence: 9,
      latestAcceptedSequence: 12,
    }),
    {
      integrityStatus: "integrity_gap",
      reason: "sequence_out_of_order",
      shouldAdvance: false,
    },
  );
});
