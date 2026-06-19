import assert from "node:assert/strict";
import test from "node:test";
import { buildPublicResultsModel } from "@/lib/services/results";

test("builds public results model with work slugs and riding skill highlights", async () => {
  const result = await buildPublicResultsModel("race_finished");

  assert.equal(result.awards.length > 0, true);
  assert.equal(
    result.awards.some((award) => award.work?.slug?.startsWith("race_finished__")),
    true,
  );
  assert.equal(result.ridingSkillHighlights.length > 0, true);
});
