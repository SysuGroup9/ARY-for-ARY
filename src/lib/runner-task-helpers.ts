import type { AgentType } from "@/generated/prisma/enums";

export type RunnerTaskTypeValue =
  | "SUBMISSION_TEST"
  | "PROGRESS_EVAL"
  | "HARNESS_EVAL";

export type RunnerTaskStatusValue =
  | "QUEUED"
  | "CLAIMED"
  | "SUCCEEDED"
  | "FAILED"
  | "STALE";

export interface RunnerTaskArtifactPayloadInput {
  codeLabel: string;
  codeContent: string;
  recordLabel: null | string;
  ridingRecord: null | string;
  tokenUsed: number;
  agentType: AgentType;
}

export const ACTIVE_RUNNER_TASK_STATUSES: RunnerTaskStatusValue[] = [
  "QUEUED",
  "CLAIMED",
];

export function buildRunnerTaskPayload(
  taskType: RunnerTaskTypeValue,
  artifact: RunnerTaskArtifactPayloadInput,
) {
  const shouldIncludeRecord = taskType === "HARNESS_EVAL";

  return {
    codeLabel: artifact.codeLabel,
    codeContent: artifact.codeContent,
    recordLabel: shouldIncludeRecord ? artifact.recordLabel : null,
    ridingRecord: shouldIncludeRecord ? artifact.ridingRecord : null,
    tokenUsed: artifact.tokenUsed,
    agentType: artifact.agentType,
  };
}

export function formatRunnerTaskTypeLabel(taskType: RunnerTaskTypeValue): string {
  switch (taskType) {
    case "SUBMISSION_TEST":
      return "提交测试";
    case "PROGRESS_EVAL":
      return "进度评测";
    case "HARNESS_EVAL":
      return "Harness 评测";
  }
}

export function formatRunnerTaskStatusLabel(
  status: RunnerTaskStatusValue,
): string {
  switch (status) {
    case "QUEUED":
      return "排队中";
    case "CLAIMED":
      return "已拉取";
    case "SUCCEEDED":
      return "成功";
    case "FAILED":
      return "失败";
    case "STALE":
      return "已失效";
  }
}
