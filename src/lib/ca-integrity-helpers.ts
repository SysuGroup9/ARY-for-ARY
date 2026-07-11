import { createHash } from "node:crypto";

type IntegrityStatus = "integrity_gap" | "ok" | "review_needed";

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right, "en"))
        .map(([key, innerValue]) => [key, normalizeValue(innerValue)]),
    );
  }

  return value;
}

export function buildPayloadDigest(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(normalizeValue(payload)))
    .digest("hex");
}

export function classifyDuplicatePayload(input: {
  existingDigest: string;
  incomingDigest: string;
}): {
  deduped: boolean;
  integrityStatus: IntegrityStatus;
  shouldCreateConflictEvent: boolean;
} {
  if (input.existingDigest === input.incomingDigest) {
    return {
      deduped: true,
      integrityStatus: "ok",
      shouldCreateConflictEvent: false,
    };
  }

  return {
    deduped: false,
    integrityStatus: "integrity_gap",
    shouldCreateConflictEvent: true,
  };
}

export function evaluateObservedAtWindow(input: {
  maxSkewMs: number;
  observedAt: Date;
  receivedAt: Date;
}): {
  integrityStatus: IntegrityStatus;
  reviewFlags: string[];
} {
  const skewMs = Math.abs(input.receivedAt.getTime() - input.observedAt.getTime());
  if (skewMs <= input.maxSkewMs) {
    return {
      integrityStatus: "ok",
      reviewFlags: [],
    };
  }

  return {
    integrityStatus: "review_needed",
    reviewFlags: ["timestamp_window_exceeded"],
  };
}

export function evaluateSequenceProgression(input: {
  incomingSequence: number;
  latestAcceptedSequence: null | number;
}): {
  integrityStatus: "integrity_gap" | "ok";
  reason: "" | "sequence_out_of_order" | "sequence_replayed";
  shouldAdvance: boolean;
} {
  if (input.latestAcceptedSequence === null) {
    return {
      integrityStatus: "ok",
      reason: "",
      shouldAdvance: true,
    };
  }

  if (input.incomingSequence === input.latestAcceptedSequence) {
    return {
      integrityStatus: "integrity_gap",
      reason: "sequence_replayed",
      shouldAdvance: false,
    };
  }

  if (input.incomingSequence < input.latestAcceptedSequence) {
    return {
      integrityStatus: "integrity_gap",
      reason: "sequence_out_of_order",
      shouldAdvance: false,
    };
  }

  return {
    integrityStatus: "ok",
    reason: "",
    shouldAdvance: true,
  };
}

export function summarizeEvidenceIntegrity(
  events: Array<{ id: string; integrityStatus: IntegrityStatus }>,
): {
  confidenceLevel: "high" | "medium";
  generatedFromEventIdsJson: string;
  integrityStatus: "ok" | "review_needed";
  reviewFlagJson: string;
} {
  const generatedFromEventIdsJson = JSON.stringify(events.map((event) => event.id));

  if (events.some((event) => event.integrityStatus === "integrity_gap")) {
    return {
      confidenceLevel: "medium",
      generatedFromEventIdsJson,
      integrityStatus: "review_needed",
      reviewFlagJson: JSON.stringify(["source_event_integrity_gap"]),
    };
  }

  if (events.some((event) => event.integrityStatus === "review_needed")) {
    return {
      confidenceLevel: "medium",
      generatedFromEventIdsJson,
      integrityStatus: "review_needed",
      reviewFlagJson: JSON.stringify(["source_event_review_needed"]),
    };
  }

  return {
    confidenceLevel: "high",
    generatedFromEventIdsJson,
    integrityStatus: "ok",
    reviewFlagJson: JSON.stringify([]),
  };
}
