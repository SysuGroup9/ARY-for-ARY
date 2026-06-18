import assert from "node:assert/strict";
import test from "node:test";
import { runnerResultSchema } from "./validation";

test("accepts weighted runner result payload", () => {
  const parsed = runnerResultSchema.parse({
    taskId: "task_001",
    submissionId: "sub_001",
    status: "succeeded",
    passRate: 90,
    codeReviewScore: 82,
    reasoningScore: 88,
    keywordScore: 76,
    progress: 0.64,
  });

  assert.equal(parsed.taskId, "task_001");
  assert.equal(parsed.submissionId, "sub_001");
  assert.equal(parsed.status, "succeeded");
  assert.equal(parsed.passRate, 90);
  assert.equal(parsed.keywordScore, 76);
});

test("still accepts failed runner result without breakdown fields", () => {
  const parsed = runnerResultSchema.parse({
    taskId: "task_002",
    submissionId: "sub_002",
    status: "failed",
    runnerComment: "timeout",
  });

  assert.equal(parsed.runnerComment, "timeout");
});
