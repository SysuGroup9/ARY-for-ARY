export interface RunnerConfig {
  aryBaseUrl: string;
  pollIntervalMs: number;
  raceId: string;
  runnerToken: string;
  taskTimeoutMs: number;
}

function requireEnv(env: NodeJS.ProcessEnv | Record<string, string>, key: string): string {
  const value = env[key];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
}

function parsePositiveInteger(
  value: string | undefined,
  key: string,
  fallback: number,
): number {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer.`);
  }

  return parsed;
}

export function loadRunnerConfig(
  env: NodeJS.ProcessEnv | Record<string, string>,
): RunnerConfig {
  return {
    aryBaseUrl: requireEnv(env, "ARY_BASE_URL"),
    pollIntervalMs: parsePositiveInteger(env.POLL_INTERVAL_MS, "POLL_INTERVAL_MS", 2_000),
    raceId: requireEnv(env, "ARY_RACE_ID"),
    runnerToken: requireEnv(env, "ARY_RUNNER_TOKEN"),
    taskTimeoutMs: parsePositiveInteger(env.TASK_TIMEOUT_MS, "TASK_TIMEOUT_MS", 5_000),
  };
}
