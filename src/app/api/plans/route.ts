import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listShootPlansByUser } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const rows = await listShootPlansByUser(auth.user.id, 30);
  const plans = rows.map((r) => ({
    id: r.id,
    subjectName: r.subjectName,
    source: r.source,
    faceShape: r.faceShape,
    temperamentTags: r.temperamentTags,
    coverImageUrl: r.coverImageUrl,
    createdAt: r.createdAt,
  }));
  return NextResponse.json({ plans });
}
