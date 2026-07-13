import { NextResponse } from "next/server";
import { loadDatabaseUser } from "@/lib/auth";
import { canAccessKnowledgeBase, getLatestCode } from "@/lib/services/knowledge-base";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const user = await loadDatabaseUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { teamId } = await params;
  const access = await canAccessKnowledgeBase(teamId, user.id);
  if (access === "public") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const code = await getLatestCode(teamId);
  if (!code) {
    return NextResponse.json({ error: "no_code" }, { status: 404 });
  }

  return new NextResponse(code.codeContent, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(code.codeLabel)}"`,
    },
  });
}
