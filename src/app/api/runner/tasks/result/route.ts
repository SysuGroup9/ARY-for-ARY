import { NextResponse } from "next/server";
import { DEFAULT_RUNNER_SECRET } from "@/lib/constants";
import { completeRunnerTask } from "@/lib/services/runner";

function isAuthorized(request: Request): boolean {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  return token === (process.env.RUNNER_TOKEN ?? DEFAULT_RUNNER_SECRET);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  await completeRunnerTask({
    taskId: String(body.taskId ?? ""),
    submissionId: String(body.submissionId ?? ""),
    status: String(body.status ?? "") as "failed" | "succeeded",
    progress: typeof body.progress === "number" ? body.progress : undefined,
    passRate: typeof body.passRate === "number" ? body.passRate : undefined,
    codeReviewScore:
      typeof body.codeReviewScore === "number" ? body.codeReviewScore : undefined,
    reasoningScore: typeof body.reasoningScore === "number" ? body.reasoningScore : undefined,
    keywordScore: typeof body.keywordScore === "number" ? body.keywordScore : undefined,
    runnerComment: String(body.runnerComment ?? ""),
    resultHash:
      typeof body.resultHash === "string" && body.resultHash.length > 0
        ? body.resultHash
        : undefined,
    finishedAt:
      typeof body.finishedAt === "string" && body.finishedAt.length > 0
        ? body.finishedAt
        : undefined,
  });

  return NextResponse.json({
    ok: true,
  });
}
