type ReviewReadinessReasonCode =
  | "ca_ingestion_failed"
  | "empty_work"
  | "evidence_review_flag"
  | "medium_confidence_evidence"
  | "missing_work"
  | "no_ca_connection"
  | "no_internal_evidence";

type ReviewReadinessSeverity = "high" | "medium";

export interface ReviewReadinessEvidenceInput {
  confidenceLevel?: null | string;
  integrityStatus?: null | string;
  reviewFlagJson?: null | string;
  visibility?: null | string;
}

export interface ReviewReadinessSummary {
  aggregateIngestionStatus: string;
  evidenceFlagCodes: string[];
  internalEvidenceCount: number;
  mediumConfidenceEvidenceCount: number;
  reasons: Array<{
    code: ReviewReadinessReasonCode;
    label: string;
    severity: ReviewReadinessSeverity;
  }>;
  reviewNeededEvidenceCount: number;
  status: "ready" | "review_needed";
}

export function buildReviewReadinessSummary(input: {
  aggregateIngestionStatus?: null | string;
  evidences: ReviewReadinessEvidenceInput[];
  hasWork?: boolean;
  phase: string;
  workSummary?: null | string;
  workTitle?: null | string;
}): ReviewReadinessSummary {
  const aggregateIngestionStatus = String(
    input.aggregateIngestionStatus ?? "NOT_CONFIGURED",
  ).toUpperCase();
  const evidences = input.evidences ?? [];
  const internalEvidences = evidences.filter((evidence) =>
    isInternalEvidence(evidence.visibility),
  );
  const reviewFlagCodes = [
    ...new Set(
      internalEvidences.flatMap((evidence) =>
        parseReviewFlags(evidence.reviewFlagJson),
      ),
    ),
  ];
  const reviewNeededEvidenceCount = internalEvidences.filter(
    (evidence) => normalizeUpper(evidence.integrityStatus) !== "OK",
  ).length;
  const mediumConfidenceEvidenceCount = internalEvidences.filter(
    (evidence) => normalizeUpper(evidence.confidenceLevel) === "MEDIUM",
  ).length;
  const reasons = new Map<
    ReviewReadinessReasonCode,
    {
      code: ReviewReadinessReasonCode;
      label: string;
      severity: ReviewReadinessSeverity;
    }
  >();

  if (requiresRidingEvidence(input.phase)) {
    if (aggregateIngestionStatus === "FAILED") {
      reasons.set("ca_ingestion_failed", {
        code: "ca_ingestion_failed",
        label: "CA 接入失败",
        severity: "high",
      });
    } else if (aggregateIngestionStatus === "NOT_CONFIGURED") {
      reasons.set("no_ca_connection", {
        code: "no_ca_connection",
        label: "未接入 CA",
        severity: "high",
      });
    }

    if (internalEvidences.length === 0) {
      reasons.set("no_internal_evidence", {
        code: "no_internal_evidence",
        label: "缺少内部证据",
        severity: "high",
      });
    }
  }

  if (reviewFlagCodes.length || reviewNeededEvidenceCount > 0) {
    reasons.set("evidence_review_flag", {
      code: "evidence_review_flag",
      label: "存在证据复核标记",
      severity: "high",
    });
  }

  if (mediumConfidenceEvidenceCount > 0) {
    reasons.set("medium_confidence_evidence", {
      code: "medium_confidence_evidence",
      label: "存在中可信度证据",
      severity: "medium",
    });
  }

  if (requiresSubmittedWork(input.phase)) {
    if (input.hasWork === false) {
      reasons.set("missing_work", {
        code: "missing_work",
        label: "缺少作品",
        severity: "high",
      });
    } else if (
      input.hasWork &&
      (!String(input.workTitle ?? "").trim() ||
        !String(input.workSummary ?? "").trim())
    ) {
      reasons.set("empty_work", {
        code: "empty_work",
        label: "作品内容为空",
        severity: "medium",
      });
    }
  }

  const orderedReasons = [...reasons.values()].sort(
    (left, right) => severityRank(right.severity) - severityRank(left.severity),
  );

  return {
    aggregateIngestionStatus,
    evidenceFlagCodes: reviewFlagCodes,
    internalEvidenceCount: internalEvidences.length,
    mediumConfidenceEvidenceCount,
    reasons: orderedReasons,
    reviewNeededEvidenceCount,
    status: orderedReasons.length ? "review_needed" : "ready",
  };
}

function parseReviewFlags(reviewFlagJson: null | string | undefined): string[] {
  if (!reviewFlagJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(reviewFlagJson);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function normalizeUpper(value: null | string | undefined): string {
  return String(value ?? "").trim().toUpperCase();
}

function isInternalEvidence(visibility: null | string | undefined): boolean {
  const normalized = normalizeUpper(visibility);
  return normalized === "" || normalized === "INTERNAL";
}

function requiresRidingEvidence(phase: string): boolean {
  return new Set([
    "ACTIVE",
    "ARCHIVED",
    "COMPLETED",
    "FINISHED",
    "FROZEN",
    "JUDGING",
    "RUNNING",
    "SUBMITTING",
  ]).has(normalizeUpper(phase));
}

function requiresSubmittedWork(phase: string): boolean {
  return new Set([
    "ARCHIVED",
    "COMPLETED",
    "FINISHED",
    "FROZEN",
    "JUDGING",
    "SUBMITTING",
  ]).has(normalizeUpper(phase));
}

function severityRank(severity: ReviewReadinessSeverity): number {
  return severity === "high" ? 2 : 1;
}
