import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { SORT_HIDDEN_CASES } from "./hidden-cases";
import type { RunnerEvaluationInput, RunnerEvaluationResult } from "./types";

interface ChildExecutionResult {
  error?: string;
  result?: number[];
  timedOut?: boolean;
}

function fail(runnerComment: string): RunnerEvaluationResult {
  return {
    runnerComment,
    score: 0,
    status: "failed",
  };
}

function roundScore(value: number): number {
  return Math.round(value * 10) / 10;
}

function compileSolution(codeContent: string): { error?: string; outputText?: string } {
  const compiled = ts.transpileModule(codeContent, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    reportDiagnostics: true,
  });

  const diagnostics = compiled.diagnostics?.filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );

  if (diagnostics && diagnostics.length > 0) {
    const message = diagnostics
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
      .join("; ");

    return {
      error: `Syntax error: ${message}`,
    };
  }

  return {
    outputText: compiled.outputText,
  };
}

async function writeRunnerScript(path: string) {
  const runnerSource = `
import { pathToFileURL } from "node:url";

const [solutionPath, inputJson] = process.argv.slice(2);

try {
  const mod = await import(pathToFileURL(solutionPath).href + "?cacheBust=" + Date.now());
  const solve =
    typeof mod.solve === "function"
      ? mod.solve
      : typeof mod.default === "function"
        ? mod.default
        : null;

  if (!solve) {
    throw new Error("Expected a solve export.");
  }

  const input = JSON.parse(inputJson);
  const output = await solve(input);

  if (!Array.isArray(output)) {
    throw new Error("solve must return an array.");
  }

  if (!output.every((item) => typeof item === "number" && Number.isFinite(item))) {
    throw new Error("solve must return an array of finite numbers.");
  }

  process.stdout.write(JSON.stringify({ ok: true, result: output }));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stdout.write(JSON.stringify({ ok: false, error: message }));
  process.exitCode = 1;
}
`.trim();

  await writeFile(path, `${runnerSource}\n`, "utf8");
}

function runCaseInChild(input: {
  inputValues: number[];
  runnerPath: string;
  solutionPath: string;
  timeoutMs: number;
}): Promise<ChildExecutionResult> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [input.runnerPath, input.solutionPath, JSON.stringify(input.inputValues)],
      {
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      },
    );

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, input.timeoutMs);

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += String(chunk);
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({
        error: error.message,
      });
    });

    child.on("close", () => {
      clearTimeout(timer);

      if (timedOut) {
        resolve({
          error: `timeout after ${input.timeoutMs}ms`,
          timedOut: true,
        });
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as
          | { error: string; ok: false }
          | { ok: true; result: number[] };

        if (!parsed.ok) {
          resolve({
            error: parsed.error,
          });
          return;
        }

        resolve({
          result: parsed.result,
        });
      } catch {
        resolve({
          error: stderr.trim() || stdout.trim() || "Unknown child-process failure",
        });
      }
    });
  });
}

export async function evaluateRunnerTask(
  input: RunnerEvaluationInput,
): Promise<RunnerEvaluationResult> {
  if (input.taskType === "harness_eval") {
    return fail("unsupported in organizer_demo PoC");
  }

  const compilation = compileSolution(input.codeContent);
  if (!compilation.outputText) {
    return fail(compilation.error ?? "Syntax error");
  }

  const tempDir = await mkdtemp(join(tmpdir(), "ary-runner-demo-"));
  const solutionPath = join(tempDir, "solution.mjs");
  const runnerPath = join(tempDir, "runner.mjs");

  try {
    await writeFile(solutionPath, compilation.outputText, "utf8");
    await writeRunnerScript(runnerPath);

    let passedCases = 0;
    let firstFailure: null | string = null;

    for (const hiddenCase of SORT_HIDDEN_CASES) {
      const execution = await runCaseInChild({
        inputValues: hiddenCase.input,
        runnerPath,
        solutionPath,
        timeoutMs: input.timeoutMs,
      });

      if (execution.error) {
        return fail(
          execution.timedOut
            ? `Execution timeout: ${execution.error}`
            : `Execution failed: ${execution.error}`,
        );
      }

      const actual = execution.result ?? [];
      const expectedJson = JSON.stringify(hiddenCase.expected);
      const actualJson = JSON.stringify(actual);

      if (actualJson === expectedJson) {
        passedCases += 1;
        continue;
      }

      if (!firstFailure) {
        firstFailure = `case "${hiddenCase.name}" expected ${expectedJson} but received ${actualJson}`;
      }
    }

    const totalCases = SORT_HIDDEN_CASES.length;
    const score = roundScore((passedCases / totalCases) * 100);
    const runnerComment = firstFailure
      ? `Passed ${passedCases}/${totalCases} hidden sorting cases. First failure: ${firstFailure}`
      : `Passed ${passedCases}/${totalCases} hidden sorting cases`;

    return {
      runnerComment,
      score,
      status: "succeeded",
    };
  } finally {
    await rm(tempDir, {
      force: true,
      recursive: true,
    });
  }
}
