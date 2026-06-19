import assert from "node:assert/strict";
import test from "node:test";
import {
  buildJudgingScoreJson,
  getJudgingRecordState,
} from "./judging-helpers";

test("builds minimal judging score json from total scores", () => {
  assert.deepEqual(buildJudgingScoreJson(88), { overall: 88 });
  assert.deepEqual(buildJudgingScoreJson(0), { overall: 0 });
});

test("derives judging record state from submittedAt", () => {
  assert.equal(getJudgingRecordState(null), "DRAFT");
  assert.equal(
    getJudgingRecordState(new Date("2026-06-19T12:00:00Z")),
    "SUBMITTED",
  );
});
