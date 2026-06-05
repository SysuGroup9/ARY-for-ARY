import { NextResponse } from "next/server";
import { DEFAULT_RUNNER_SECRET } from "@/lib/constants";
import { scoreRunnerTask } from "@/lib/services/submissions";

function isAuthorized(request: Request): boolean {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  return token === (process.env.RUNNER_TOKEN ?? DEFAULT_RUNNER_SECRET);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const formData = new FormData();
  formData.set("submissionId", String(body.submissionId ?? ""));
  formData.set("passRate", String(body.passRate ?? ""));
  formData.set("codeReviewScore", String(body.codeReviewScore ?? ""));
  formData.set("reasoningScore", String(body.reasoningScore ?? ""));
  formData.set("runnerComment", String(body.runnerComment ?? ""));
  formData.set("status", String(body.status ?? ""));

  await scoreRunnerTask(formData);

  return NextResponse.json({
    ok: true,
  });
}
