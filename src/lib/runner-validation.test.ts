import assert from "node:assert/strict";
import test from "node:test";
import { runnerResultSchema } from "./validation";

test("accepts final-score-only runner result payload", () => {
  const parsed = runnerResultSchema.parse({
    taskId: "task_001",
    submissionId: "sub_001",
    status: "succeeded",
    score: 83.5,
  });

  assert.equal(parsed.taskId, "task_001");
  assert.equal(parsed.submissionId, "sub_001");
  assert.equal(parsed.status, "succeeded");
  assert.equal(parsed.score, 83.5);
});

test("does not require scoring breakdown fields", () => {
  const parsed = runnerResultSchema.parse({
    taskId: "task_002",
    submissionId: "sub_002",
    status: "failed",
    score: 0,
    runnerComment: "timeout",
  });

  assert.equal(parsed.runnerComment, "timeout");
});
