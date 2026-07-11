import assert from "node:assert/strict";
import test from "node:test";
import { buildReviewReadinessSummary } from "@/lib/review-readiness-helpers";

test("buildReviewReadinessSummary marks failed CA and missing evidence as review_needed during active phases", () => {
  const summary = buildReviewReadinessSummary({
    aggregateIngestionStatus: "FAILED",
    evidences: [],
    phase: "active",
  });

  assert.equal(summary.status, "review_needed");
  assert.deepEqual(
    summary.reasons.map((reason) => reason.code),
    ["ca_ingestion_failed", "no_internal_evidence"],
  );
});

test("buildReviewReadinessSummary surfaces evidence review flags and medium confidence evidence", () => {
  const summary = buildReviewReadinessSummary({
    aggregateIngestionStatus: "ACTIVE",
    evidences: [
      {
        confidenceLevel: "MEDIUM",
        integrityStatus: "REVIEW_NEEDED",
        reviewFlagJson: JSON.stringify(["source_event_review_needed"]),
        visibility: "INTERNAL",
      },
    ],
    phase: "judging",
  });

  assert.equal(summary.status, "review_needed");
  assert.equal(summary.reviewNeededEvidenceCount, 1);
  assert.equal(summary.mediumConfidenceEvidenceCount, 1);
  assert.deepEqual(summary.evidenceFlagCodes, ["source_event_review_needed"]);
  assert.deepEqual(
    summary.reasons.map((reason) => reason.code),
    ["evidence_review_flag", "medium_confidence_evidence"],
  );
});

test("buildReviewReadinessSummary only requires submitted work in judging and later phases", () => {
  const beforeSubmission = buildReviewReadinessSummary({
    aggregateIngestionStatus: "CONNECTED",
    evidences: [],
    hasWork: false,
    phase: "registration",
  });
  const duringJudging = buildReviewReadinessSummary({
    aggregateIngestionStatus: "CONNECTED",
    evidences: [{ integrityStatus: "OK", visibility: "INTERNAL" }],
    hasWork: false,
    phase: "judging",
  });

  assert.equal(
    beforeSubmission.reasons.some((reason) => reason.code === "missing_work"),
    false,
  );
  assert.equal(
    duringJudging.reasons.some((reason) => reason.code === "missing_work"),
    true,
  );
});

test("buildReviewReadinessSummary treats blank work content as an empty work risk", () => {
  const summary = buildReviewReadinessSummary({
    aggregateIngestionStatus: "ACTIVE",
    evidences: [{ integrityStatus: "OK", visibility: "INTERNAL" }],
    hasWork: true,
    phase: "submitting",
    workSummary: "",
    workTitle: "Work Title",
  });

  assert.equal(
    summary.reasons.some((reason) => reason.code === "empty_work"),
    true,
  );
});
