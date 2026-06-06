import assert from "node:assert/strict";
import test from "node:test";
import { loadRunnerConfig } from "./config";

test("loads runner config from environment variables", () => {
  const config = loadRunnerConfig({
    ARY_BASE_URL: "http://localhost:3000",
    ARY_RACE_ID: "race_sort_demo",
    ARY_RUNNER_TOKEN: "secret-token",
    POLL_INTERVAL_MS: "1500",
    TASK_TIMEOUT_MS: "2500",
  });

  assert.deepEqual(config, {
    aryBaseUrl: "http://localhost:3000",
    pollIntervalMs: 1500,
    raceId: "race_sort_demo",
    runnerToken: "secret-token",
    taskTimeoutMs: 2500,
  });
});

test("rejects missing required runner configuration", () => {
  assert.throws(
    () =>
      loadRunnerConfig({
        ARY_BASE_URL: "",
        ARY_RACE_ID: "race_sort_demo",
        ARY_RUNNER_TOKEN: "",
      }),
    /ARY_BASE_URL|ARY_RUNNER_TOKEN/,
  );
});
