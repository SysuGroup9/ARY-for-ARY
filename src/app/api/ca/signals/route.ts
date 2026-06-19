import { NextResponse } from "next/server";
import { ingestRidingSignalMessage } from "@/lib/services/ca-ingestion";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const body = await request.json();

  const result = await ingestRidingSignalMessage({
    authToken: token,
    body,
  });

  if (!result.accepted) {
    return NextResponse.json(result, { status: 401 });
  }

  return NextResponse.json(result);
}
