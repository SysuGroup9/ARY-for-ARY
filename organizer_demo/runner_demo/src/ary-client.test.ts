import assert from "node:assert/strict";
import test from "node:test";
import { createAryRunnerClient } from "./ary-client";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
    },
    status,
  });
}

test("pullTask returns null when ARY has no queued task", async () => {
  let capturedUrl = "";
  let capturedHeaders: Record<string, string> | undefined;

  const client = createAryRunnerClient({
    baseUrl: "http://ary.local",
    fetchImpl: async (input, init) => {
      capturedUrl = String(input);
      capturedHeaders = init?.headers as Record<string, string> | undefined;
      return jsonResponse({ task: null });
    },
    runnerToken: "secret-token",
  });

  const task = await client.pullTask("race_sort_demo");

  assert.equal(task, null);
  assert.equal(
    capturedUrl,
    "http://ary.local/api/runner/tasks/pull?raceId=race_sort_demo",
  );
  assert.equal(capturedHeaders?.Authorization, "Bearer secret-token");
});

test("submitResult posts runner results back to ARY", async () => {
  let capturedBody = "";
  let capturedMethod = "";

  const client = createAryRunnerClient({
    baseUrl: "http://ary.local",
    fetchImpl: async (_input, init) => {
      capturedMethod = String(init?.method);
      capturedBody = String(init?.body);
      return jsonResponse({ ok: true });
    },
    runnerToken: "secret-token",
  });

  await client.submitResult({
    runnerComment: "Passed 8/8 hidden sorting cases",
    score: 100,
    status: "succeeded",
    submissionId: "submission_001",
    taskId: "task_001",
  });

  assert.equal(capturedMethod, "POST");
  assert.deepEqual(JSON.parse(capturedBody), {
    runnerComment: "Passed 8/8 hidden sorting cases",
    score: 100,
    status: "succeeded",
    submissionId: "submission_001",
    taskId: "task_001",
  });
});

test("pullTask throws a descriptive error for unauthorized responses", async () => {
  const client = createAryRunnerClient({
    baseUrl: "http://ary.local",
    fetchImpl: async () => jsonResponse({ error: "unauthorized" }, 401),
    runnerToken: "secret-token",
  });

  await assert.rejects(() => client.pullTask("race_sort_demo"), /401/);
});

test("submitResult throws a descriptive error for server failures", async () => {
  const client = createAryRunnerClient({
    baseUrl: "http://ary.local",
    fetchImpl: async () => jsonResponse({ error: "server exploded" }, 500),
    runnerToken: "secret-token",
  });

  await assert.rejects(
    () =>
      client.submitResult({
        runnerComment: "failed",
        score: 0,
        status: "failed",
        submissionId: "submission_001",
        taskId: "task_001",
      }),
    /500/,
  );
});
