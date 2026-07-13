import { NextResponse } from "next/server";
import { loadDatabaseUser } from "@/lib/auth";
import { canAccessKnowledgeBase, exportKnowledgeBaseZip } from "@/lib/services/knowledge-base";

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

  try {
    const { buffer, filename, contentType } = await exportKnowledgeBaseZip(teamId);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "export failed" },
      { status: 500 },
    );
  }
}
