import assert from "node:assert/strict";
import test from "node:test";
import { evaluateRunnerTask } from "./evaluator";

test("scores a named solve export with full marks for submission test", async () => {
  const result = await evaluateRunnerTask({
    codeContent:
      "export function solve(input: number[]) { return [...input].sort((a, b) => a - b); }",
    taskType: "SUBMISSION_TEST",
    timeoutMs: 1_000,
  });

  assert.equal(result.status, "succeeded");
  assert.equal(result.score, 100);
  assert.match(result.runnerComment, /8\/8/);
});

test("supports default export fallback for progress evaluation", async () => {
  const result = await evaluateRunnerTask({
    codeContent:
      "export default function solve(input: number[]) { return [...input].sort((a, b) => a - b); }",
    taskType: "PROGRESS_EVAL",
    timeoutMs: 1_000,
  });

  assert.equal(result.status, "succeeded");
  assert.equal(result.score, 100);
});

test("returns partial score and first failure details for incorrect solutions", async () => {
  const result = await evaluateRunnerTask({
    codeContent: "export function solve(input: number[]) { return input; }",
    taskType: "SUBMISSION_TEST",
    timeoutMs: 1_000,
  });

  assert.equal(result.status, "succeeded");
  assert.notEqual(result.score, 100);
  assert.match(result.runnerComment, /Passed/);
  assert.match(result.runnerComment, /First failure/);
});

test("fails when solve export is missing", async () => {
  const result = await evaluateRunnerTask({
    codeContent:
      "export function notSolve(input: number[]) { return [...input].sort((a, b) => a - b); }",
    taskType: "SUBMISSION_TEST",
    timeoutMs: 1_000,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.score, 0);
  assert.match(result.runnerComment, /solve/);
});

test("fails on syntax errors", async () => {
  const result = await evaluateRunnerTask({
    codeContent: "export function solve( {",
    taskType: "SUBMISSION_TEST",
    timeoutMs: 1_000,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.score, 0);
  assert.match(result.runnerComment, /syntax/i);
});

test("fails on runtime errors", async () => {
  const result = await evaluateRunnerTask({
    codeContent: "export function solve() { throw new Error('boom'); }",
    taskType: "SUBMISSION_TEST",
    timeoutMs: 1_000,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.score, 0);
  assert.match(result.runnerComment, /boom/);
});

test("fails on timeout", async () => {
  const result = await evaluateRunnerTask({
    codeContent: "export function solve() { while (true) {} }",
    taskType: "SUBMISSION_TEST",
    timeoutMs: 50,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.score, 0);
  assert.match(result.runnerComment, /timeout/i);
});

test("fails when solve does not return an array", async () => {
  const result = await evaluateRunnerTask({
    codeContent: "export function solve() { return 42 as unknown as number[]; }",
    taskType: "SUBMISSION_TEST",
    timeoutMs: 1_000,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.score, 0);
  assert.match(result.runnerComment, /array/i);
});

test("rejects unsupported harness tasks in the organizer demo runner", async () => {
  const result = await evaluateRunnerTask({
    codeContent:
      "export function solve(input: number[]) { return [...input].sort((a, b) => a - b); }",
    taskType: "HARNESS_EVAL",
    timeoutMs: 1_000,
  });

  assert.equal(result.status, "failed");
  assert.equal(result.score, 0);
  assert.match(result.runnerComment, /unsupported/i);
});
