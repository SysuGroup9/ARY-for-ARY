export type RunnerTaskType =
  | "submission_test"
  | "progress_eval"
  | "harness_eval";

export type RunnerResultStatus = "succeeded" | "failed";

export type AgentType =
  | "CLAUDE"
  | "COPILOT"
  | "DEEPSEEK"
  | "ZHIPU"
  | "OPENAI"
  | "CUSTOM";

export interface AryRunnerTask {
  agentType: AgentType;
  codeContent: string;
  codeLabel: string;
  createdAt: string;
  keywords: string[];
  metadata: {
    attemptNo: number;
    fileName: string;
    fileSize: number;
    status: string;
    uploadedAt: string;
  };
  raceId: string;
  recordLabel: null | string;
  ridingRecord: null | string;
  submissionId: string;
  taskDescription: string;
  taskId: string;
  taskPackageLabel: string;
  taskType: RunnerTaskType;
  teamId: string;
  teamName: string;
  tokenUsed: number;
}

export interface RunnerEvaluationInput {
  codeContent: string;
  taskType: RunnerTaskType;
  timeoutMs: number;
}

export interface RunnerEvaluationResult {
  runnerComment: string;
  score: number;
  status: RunnerResultStatus;
}

export interface RunnerResultPayload extends RunnerEvaluationResult {
  finishedAt?: string;
  keywordScore?: number;
  reasoningScore?: number;
  resultHash?: string;
  submissionId: string;
  taskId: string;
}

export interface AryRunnerClient {
  pullTask(raceId: string): Promise<AryRunnerTask | null>;
  submitResult(payload: RunnerResultPayload): Promise<void>;
}

export interface RunnerLogger {
  error(message: string): void;
  info(message: string): void;
}
