import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generatePlan, type AnalyzeInput } from "@/lib/plan/generate";
import { createShootPlan } from "@/lib/db/queries";
import { AppAIUnavailableError } from "@/lib/eazo-ai-billing";

export const maxDuration = 60;

async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`);
  const mime = res.headers.get("content-type") || "image/jpeg";
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const source = body.source === "photo" ? "photo" : "text";

  if (source === "photo" && typeof body.imageUrl !== "string") {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }
  if (
    source === "text" &&
    (typeof body.name !== "string" || !body.name.trim() ||
      typeof body.faceShape !== "string" || !body.faceShape.trim())
  ) {
    return NextResponse.json({ error: "name and faceShape are required" }, { status: 400 });
  }

  const coverImageUrl = typeof body.imageUrl === "string" ? body.imageUrl : undefined;

  const input: AnalyzeInput = {
    source,
    name: typeof body.name === "string" ? body.name : undefined,
    faceShape: typeof body.faceShape === "string" ? body.faceShape : undefined,
    vibe: typeof body.vibe === "string" ? body.vibe : undefined,
    direction: typeof body.direction === "string" ? body.direction : undefined,
    gender: typeof body.gender === "string" ? body.gender : undefined,
  };

  try {
    if (source === "photo" && coverImageUrl) {
      input.imageDataUrl = await toDataUrl(coverImageUrl);
    }

    const generated = await generatePlan(input, auth.user.id);

    const row = await createShootPlan({
      userId: auth.user.id,
      subjectName: generated.subjectName,
      source,
      faceShape: generated.faceShape,
      temperamentTags: generated.temperamentTags,
      coverImageUrl: coverImageUrl ?? null,
      sections: generated.sections,
    });

    return NextResponse.json({ id: row.id });
  } catch (error) {
    if (error instanceof AppAIUnavailableError) {
      return NextResponse.json(
        { code: "app_ai_unavailable", message: error.message },
        { status: 402 },
      );
    }
    console.error("[plans/generate] failed", error);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
