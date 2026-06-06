import type {
  AryRunnerClient,
  RunnerEvaluationInput,
  RunnerEvaluationResult,
  RunnerLogger,
  RunnerResultPayload,
} from "./types";

export type WorkerIterationState = "idle" | "processed" | "error";

function buildUnsupportedHarnessResult(
  taskId: string,
  submissionId: string,
): RunnerResultPayload {
  return {
    runnerComment: "unsupported in organizer_demo PoC",
    score: 0,
    status: "failed",
    submissionId,
    taskId,
  };
}

export async function runWorkerIteration(input: {
  client: AryRunnerClient;
  evaluateTask: (task: RunnerEvaluationInput) => Promise<RunnerEvaluationResult>;
  logger: RunnerLogger;
  raceId: string;
  timeoutMs: number;
}): Promise<WorkerIterationState> {
  try {
    const task = await input.client.pullTask(input.raceId);
    if (!task) {
      input.logger.info(`No queued tasks for race ${input.raceId}.`);
      return "idle";
    }

    const result =
      task.taskType === "harness_eval"
        ? buildUnsupportedHarnessResult(task.taskId, task.submissionId)
        : {
            ...(await input.evaluateTask({
              codeContent: task.codeContent,
              taskType: task.taskType,
              timeoutMs: input.timeoutMs,
            })),
            submissionId: task.submissionId,
            taskId: task.taskId,
          };

    await input.client.submitResult(result);
    input.logger.info(`Processed ${task.taskType} task ${task.taskId}.`);
    return "processed";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    input.logger.error(`Runner iteration failed: ${message}`);
    return "error";
  }
}
