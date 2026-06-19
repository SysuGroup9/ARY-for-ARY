import assert from "node:assert/strict";
import test from "node:test";
import { buildRiderConsoleReportModel } from "@/lib/services/rider-console";

test("builds rider console report model from published rider report and review summary", async () => {
  const result = await buildRiderConsoleReportModel({
    raceId: "race_finished",
    userId: "rider_01",
  });

  assert.equal(result.reviewSummary?.type, "REVIEW_SUMMARY");
  assert.equal(result.riderReports.length > 0, true);
  assert.equal(result.riderReports[0]?.type, "RIDER_REPORT");
});
