import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ReviewReadinessCard } from "./review-readiness-card";

test("review readiness card renders localized labels for status, ingestion, counts, reasons, and flags", () => {
  const html = renderToStaticMarkup(
    <ReviewReadinessCard
      summary={{
        aggregateIngestionStatus: "FAILED",
        evidenceFlagCodes: ["source_event_review_needed"],
        internalEvidenceCount: 0,
        mediumConfidenceEvidenceCount: 1,
        reasons: [
          {
            code: "ca_ingestion_failed",
            label: "CA 接入失败",
            severity: "high",
          },
        ],
        reviewNeededEvidenceCount: 2,
        status: "review_needed",
      }}
    />,
  );

  assert.match(html, /评审前风险提示/);
  assert.match(html, /状态：需要复核/);
  assert.match(html, /CA 接入：接入失败/);
  assert.match(html, /内部证据数：0/);
  assert.match(html, /需复核证据数：2/);
  assert.match(html, /中可信度证据数：1/);
  assert.match(html, /复核原因：CA 接入失败（高）/);
  assert.match(html, /复核标记：source_event_review_needed/);
});

test("review readiness card renders localized ready state with no reasons", () => {
  const html = renderToStaticMarkup(
    <ReviewReadinessCard
      summary={{
        aggregateIngestionStatus: "ACTIVE",
        evidenceFlagCodes: [],
        internalEvidenceCount: 3,
        mediumConfidenceEvidenceCount: 0,
        reasons: [],
        reviewNeededEvidenceCount: 0,
        status: "ready",
      }}
    />,
  );

  assert.match(html, /状态：已就绪/);
  assert.match(html, /CA 接入：活跃中/);
  assert.match(html, /复核原因：无/);
});
