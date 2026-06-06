import { NextResponse } from "next/server";
import { DEFAULT_RUNNER_SECRET } from "@/lib/constants";
import { pullRunnerTask } from "@/lib/services/runner";

function isAuthorized(request: Request): boolean {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  return token === (process.env.RUNNER_TOKEN ?? DEFAULT_RUNNER_SECRET);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const raceId = searchParams.get("raceId");

  if (!raceId) {
    return NextResponse.json({ error: "raceId is required" }, { status: 400 });
  }

  const task = await pullRunnerTask(raceId);
  return NextResponse.json({ task });
}
