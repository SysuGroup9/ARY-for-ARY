import { createAryRunnerClient } from "./ary-client";
import { loadRunnerConfig } from "./config";
import { evaluateRunnerTask } from "./evaluator";
import { runWorkerIteration } from "./worker";

function sleep(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

async function main() {
  const config = loadRunnerConfig(process.env);
  const client = createAryRunnerClient({
    baseUrl: config.aryBaseUrl,
    runnerToken: config.runnerToken,
  });

  console.info(
    `[runner_demo] polling race ${config.raceId} every ${config.pollIntervalMs}ms on ${config.aryBaseUrl}`,
  );

  while (true) {
    await runWorkerIteration({
      client,
      evaluateTask: evaluateRunnerTask,
      logger: console,
      raceId: config.raceId,
      timeoutMs: config.taskTimeoutMs,
    });

    await sleep(config.pollIntervalMs);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[runner_demo] fatal error: ${message}`);
  process.exit(1);
});
