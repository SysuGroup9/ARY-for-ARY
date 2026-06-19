import assert from "node:assert/strict";
import test from "node:test";
import { buildPublicReviewModel } from "@/lib/services/review";

test("builds public review model with public evidence highlights", async () => {
  const result = await buildPublicReviewModel("race_finished");

  assert.equal(result.awards.length > 0, true);
  assert.equal(result.judgingRecords.length > 0, true);
  assert.equal(result.evidenceHighlights.length > 0, true);
});
