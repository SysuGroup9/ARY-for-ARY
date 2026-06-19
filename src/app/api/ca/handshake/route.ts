import { NextResponse } from "next/server";
import { completeCAConnectionHandshake } from "@/lib/services/ca-fetch";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const body = await request.json();
  const result = await completeCAConnectionHandshake({
    authToken: token,
    body,
  });

  if (!result.accepted) {
    return NextResponse.json(result, { status: 401 });
  }

  return NextResponse.json(result);
}
