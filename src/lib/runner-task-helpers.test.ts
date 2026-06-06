import assert from "node:assert/strict";
import test from "node:test";
import { buildRunnerTaskPayload } from "./runner-task-helpers";

const baseArtifact = {
  codeLabel: "solution.ts",
  codeContent: "export const solve = () => 1;",
  recordLabel: "riding-record.txt",
  ridingRecord: "先分析，再验证。",
  tokenUsed: 123,
  agentType: "OPENAI" as const,
};

test("omits riding record fields for submission_test tasks", () => {
  const payload = buildRunnerTaskPayload("SUBMISSION_TEST", baseArtifact);

  assert.equal(payload.codeLabel, "solution.ts");
  assert.equal(payload.recordLabel, null);
  assert.equal(payload.ridingRecord, null);
});

test("includes riding record fields for harness_eval tasks", () => {
  const payload = buildRunnerTaskPayload("HARNESS_EVAL", baseArtifact);

  assert.equal(payload.recordLabel, "riding-record.txt");
  assert.equal(payload.ridingRecord, "先分析，再验证。");
});
