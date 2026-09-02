import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getShootPlan, deleteShootPlan } from "@/lib/db/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const row = await getShootPlan(id, auth.user.id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    plan: {
      id: row.id,
      subjectName: row.subjectName,
      source: row.source,
      faceShape: row.faceShape,
      temperamentTags: row.temperamentTags,
      coverImageUrl: row.coverImageUrl,
      sections: row.sections,
      createdAt: row.createdAt,
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const ok = await deleteShootPlan(id, auth.user.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
