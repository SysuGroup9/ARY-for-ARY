import type { AryRunnerClient, AryRunnerTask, RunnerResultPayload } from "./types";

type FetchImpl = typeof fetch;

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

async function readErrorBody(response: Response): Promise<string> {
  const text = await response.text();
  return text.trim() || "unknown error";
}

export function createAryRunnerClient(input: {
  baseUrl: string;
  fetchImpl?: FetchImpl;
  runnerToken: string;
}): AryRunnerClient {
  const baseUrl = trimTrailingSlash(input.baseUrl);
  const fetchImpl = input.fetchImpl ?? fetch;

  return {
    async pullTask(raceId: string): Promise<AryRunnerTask | null> {
      const response = await fetchImpl(
        `${baseUrl}/api/runner/tasks/pull?raceId=${encodeURIComponent(raceId)}`,
        {
          headers: {
            Authorization: `Bearer ${input.runnerToken}`,
          },
          method: "GET",
        },
      );

      if (!response.ok) {
        throw new Error(
          `ARY pullTask failed with ${response.status}: ${await readErrorBody(response)}`,
        );
      }

      const body = (await response.json()) as { task: AryRunnerTask | null };
      return body.task ?? null;
    },

    async submitResult(payload: RunnerResultPayload): Promise<void> {
      const response = await fetchImpl(`${baseUrl}/api/runner/tasks/result`, {
        body: JSON.stringify(payload),
        headers: {
          Authorization: `Bearer ${input.runnerToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          `ARY submitResult failed with ${response.status}: ${await readErrorBody(response)}`,
        );
      }
    },
  };
}
