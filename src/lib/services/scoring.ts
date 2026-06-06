import type { AgentType } from "@/generated/prisma/enums";
import { INDUCEMENT_TERMS } from "@/lib/constants";

export interface ScoreWeights {
  taskPassRate: number;
  codeReview: number;
  reasoning: number;
  keywords: number;
  totalTask: number;
  totalToken: number;
  totalDialogue: number;
}

export interface SubmissionArtifactInput {
  codeLabel: string;
  codeContent: string;
  recordLabel: string;
  ridingRecord: string;
  tokenUsed: number;
  agentType: AgentType;
}

export interface RunnerScoreInput {
  passRate: number;
  codeReviewScore: number;
  reasoningScore: number;
  runnerComment: string;
  status: "success" | "failed";
}

export interface ScoreResult {
  passRate: number;
  codeReviewScore: number;
  reasoningScore: number;
  keywordScore: number;
  tokenScore: number;
  taskScore: number;
  dialogueScore: number;
  totalScore: number;
  antiCheatPenalty: number;
  runnerComment: string;
  runnerStatus: string;
}

export function parseKeywords(text: string): string[] {
  return text
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseMembers(text: string): string[] {
  return text
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeWeights(weights: ScoreWeights): ScoreWeights {
  const task = normalizePair(weights.taskPassRate, weights.codeReview);
  const dialogue = normalizePair(weights.reasoning, weights.keywords);
  const total = normalizeTriple(
    weights.totalTask,
    weights.totalToken,
    weights.totalDialogue,
  );

  return {
    taskPassRate: task[0],
    codeReview: task[1],
    reasoning: dialogue[0],
    keywords: dialogue[1],
    totalTask: total[0],
    totalToken: total[1],
    totalDialogue: total[2],
  };
}

export function buildScoreResult(input: {
  weights: ScoreWeights;
  tokenLimit: number;
  keywords: string[];
  artifact: SubmissionArtifactInput;
  runner: RunnerScoreInput;
}): ScoreResult {
  const weights = normalizeWeights(input.weights);
  const keywordScore = getKeywordScore(input.artifact.ridingRecord, input.keywords);
  const tokenScore = getTokenScore(input.artifact.tokenUsed, input.tokenLimit);
  const taskScore =
    input.runner.passRate * weights.taskPassRate +
    input.runner.codeReviewScore * weights.codeReview;
  const dialogueScore =
    input.runner.reasoningScore * weights.reasoning +
    keywordScore * weights.keywords;
  const antiCheatPenalty = getAntiCheatPenalty(input.artifact);
  const totalScore =
    taskScore * weights.totalTask +
    tokenScore * weights.totalToken +
    dialogueScore * weights.totalDialogue -
    antiCheatPenalty;

  return {
    passRate: roundScore(input.runner.passRate),
    codeReviewScore: roundScore(input.runner.codeReviewScore),
    reasoningScore: roundScore(input.runner.reasoningScore),
    keywordScore: roundScore(keywordScore),
    tokenScore: roundScore(tokenScore),
    taskScore: roundScore(taskScore),
    dialogueScore: roundScore(dialogueScore),
    totalScore: roundScore(Math.max(0, totalScore)),
    antiCheatPenalty: roundScore(antiCheatPenalty),
    runnerComment: input.runner.runnerComment.trim(),
    runnerStatus: input.runner.status,
  };
}

export function extractHighlight(record: string): string {
  const lines = record
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (lines[0] ?? record.trim()).slice(0, 140);
}

export function extractCodeSnippet(code: string): string {
  return code
    .split(/\r?\n/)
    .slice(0, 8)
    .join("\n");
}

function getKeywordScore(text: string, keywords: string[]): number {
  if (keywords.length === 0) {
    return 100;
  }

  const matched = keywords.filter((keyword) => text.includes(keyword)).length;
  return (matched / keywords.length) * 100;
}

function getTokenScore(tokenUsed: number, tokenLimit: number): number {
  if (tokenLimit <= 0) {
    return 100;
  }

  return Math.max(0, 100 * (1 - tokenUsed / tokenLimit));
}

function getAntiCheatPenalty(artifact: SubmissionArtifactInput): number {
  const combined = `${artifact.codeContent}\n${artifact.ridingRecord}`.toLowerCase();

  return INDUCEMENT_TERMS.some((term) => combined.includes(term.toLowerCase()))
    ? 20
    : 0;
}

function normalizePair(left: number, right: number): [number, number] {
  const safeLeft = left > 0 ? left : 1;
  const safeRight = right > 0 ? right : 1;
  const total = safeLeft + safeRight;

  return [safeLeft / total, safeRight / total];
}

function normalizeTriple(
  first: number,
  second: number,
  third: number,
): [number, number, number] {
  const safe = [first, second, third].map((value) => (value > 0 ? value : 1));
  const total = safe.reduce((sum, value) => sum + value, 0);

  return [safe[0] / total, safe[1] / total, safe[2] / total];
}

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}
