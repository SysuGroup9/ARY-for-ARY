import assert from "node:assert/strict";
import test from "node:test";
import type { AryRunnerClient, AryRunnerTask } from "./types";
import { runWorkerIteration } from "./worker";

function createTask(taskType: AryRunnerTask["taskType"]): AryRunnerTask {
  return {
    agentType: "OPENAI",
    codeContent:
      "export function solve(input: number[]) { return [...input].sort((a, b) => a - b); }",
    codeLabel: "solution.ts",
    createdAt: "2026-06-06T10:00:00.000Z",
    keywords: [],
    metadata: {
      attemptNo: 1,
      fileName: "solution.ts",
      fileSize: 128,
      status: "queued",
      uploadedAt: "2026-06-06T10:00:00.000Z",
    },
    raceId: "race_sort_demo",
    recordLabel: null,
    ridingRecord: null,
    submissionId: "submission_001",
    taskDescription: "Sort integers ascending.",
    taskId: "task_001",
    taskPackageLabel: "sort-task-v1.zip",
    taskType,
    teamId: "team_sort_demo",
    teamName: "Sort Demo Team",
    tokenUsed: 100,
  };
}

function createLogger() {
  const info: string[] = [];
  const error: string[] = [];

  return {
    error,
    info,
    logger: {
      error(message: string) {
        error.push(message);
      },
      info(message: string) {
        info.push(message);
      },
    },
  };
}

test("worker iteration idles when no task is available", async () => {
  let evaluated = false;
  let submitted = false;
  const logs = createLogger();

  const client: AryRunnerClient = {
    async pullTask() {
      return null;
    },
    async submitResult() {
      submitted = true;
    },
  };

  const state = await runWorkerIteration({
    client,
    evaluateTask: async () => {
      evaluated = true;
      throw new Error("should not run");
    },
    logger: logs.logger,
    raceId: "race_sort_demo",
    timeoutMs: 1_000,
  });

  assert.equal(state, "idle");
  assert.equal(evaluated, false);
  assert.equal(submitted, false);
  assert.match(logs.info[0] ?? "", /no queued task/i);
});

test("worker iteration evaluates and submits supported tasks", async () => {
  let submittedPayload: unknown;
  const logs = createLogger();
  const task = createTask("SUBMISSION_TEST");

  const client: AryRunnerClient = {
    async pullTask() {
      return task;
    },
    async submitResult(payload) {
      submittedPayload = payload;
    },
  };

  const state = await runWorkerIteration({
    client,
    evaluateTask: async (input) => {
      assert.equal(input.taskType, "SUBMISSION_TEST");
      return {
        runnerComment: "Passed 8/8 hidden sorting cases",
        score: 100,
        status: "succeeded",
      };
    },
    logger: logs.logger,
    raceId: "race_sort_demo",
    timeoutMs: 1_000,
  });

  assert.equal(state, "processed");
  assert.deepEqual(submittedPayload, {
    runnerComment: "Passed 8/8 hidden sorting cases",
    score: 100,
    status: "succeeded",
    submissionId: "submission_001",
    taskId: "task_001",
  });
});

test("worker iteration fails unsupported harness tasks without calling the evaluator", async () => {
  let evaluated = false;
  let submittedPayload: unknown;
  const logs = createLogger();

  const client: AryRunnerClient = {
    async pullTask() {
      return createTask("HARNESS_EVAL");
    },
    async submitResult(payload) {
      submittedPayload = payload;
    },
  };

  const state = await runWorkerIteration({
    client,
    evaluateTask: async () => {
      evaluated = true;
      throw new Error("should not run");
    },
    logger: logs.logger,
    raceId: "race_sort_demo",
    timeoutMs: 1_000,
  });

  assert.equal(state, "processed");
  assert.equal(evaluated, false);
  assert.deepEqual(submittedPayload, {
    runnerComment: "unsupported in organizer_demo PoC",
    score: 0,
    status: "failed",
    submissionId: "submission_001",
    taskId: "task_001",
  });
});

test("worker iteration logs pull failures and keeps the loop alive", async () => {
  const logs = createLogger();

  const client: AryRunnerClient = {
    async pullTask() {
      throw new Error("401 unauthorized");
    },
    async submitResult() {},
  };

  const state = await runWorkerIteration({
    client,
    evaluateTask: async () => {
      throw new Error("should not run");
    },
    logger: logs.logger,
    raceId: "race_sort_demo",
    timeoutMs: 1_000,
  });

  assert.equal(state, "error");
  assert.match(logs.error[0] ?? "", /401/);
});

test("worker iteration logs submit failures and keeps the loop alive", async () => {
  const logs = createLogger();
  const task = createTask("PROGRESS_EVAL");

  const client: AryRunnerClient = {
    async pullTask() {
      return task;
    },
    async submitResult() {
      throw new Error("500 server error");
    },
  };

  const state = await runWorkerIteration({
    client,
    evaluateTask: async () => ({
      runnerComment: "Passed 8/8 hidden sorting cases",
      score: 100,
      status: "succeeded",
    }),
    logger: logs.logger,
    raceId: "race_sort_demo",
    timeoutMs: 1_000,
  });

  assert.equal(state, "error");
  assert.match(logs.error[0] ?? "", /500/);
});
