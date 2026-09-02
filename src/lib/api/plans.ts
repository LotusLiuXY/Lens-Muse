import { request } from "@/lib/api/request";
import type { PlanSection } from "@/lib/plan/types";

export interface PlanListItem {
  id: string;
  subjectName: string;
  source: "photo" | "text";
  faceShape: string;
  temperamentTags: string[];
  coverImageUrl: string | null;
  createdAt: string;
}

export interface PlanDetail extends PlanListItem {
  sections: PlanSection[];
}

export interface GeneratePlanInput {
  source: "photo" | "text";
  name?: string;
  imageUrl?: string;
  faceShape?: string;
  vibe?: string;
  direction?: string;
  gender?: string;
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function generatePlan(input: GeneratePlanInput): Promise<{ id: string }> {
  const res = await request("/api/plans/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parse<{ id: string }>(res);
}

export async function listPlans(): Promise<PlanListItem[]> {
  const res = await request("/api/plans");
  const data = await parse<{ plans: PlanListItem[] }>(res);
  return data.plans;
}

export async function getPlan(id: string): Promise<PlanDetail | null> {
  const res = await request(`/api/plans/${id}`);
  if (res.status === 404) return null;
  const data = await parse<{ plan: PlanDetail }>(res);
  return data.plan;
}

export async function deletePlan(id: string): Promise<void> {
  const res = await request(`/api/plans/${id}`, { method: "DELETE" });
  await parse<{ ok: boolean }>(res);
}
