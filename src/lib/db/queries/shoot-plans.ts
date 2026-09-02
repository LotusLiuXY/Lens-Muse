import { and, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { shootPlans, type ShootPlanRow } from "../schema/shoot-plans";
import type { PlanSection } from "@/lib/plan/types";

export interface NewShootPlan {
  userId: string;
  subjectName: string;
  source: "photo" | "text";
  faceShape: string;
  temperamentTags: string[];
  coverImageUrl?: string | null;
  sections: PlanSection[];
}

export async function createShootPlan(data: NewShootPlan): Promise<ShootPlanRow> {
  const rows = await db
    .insert(shootPlans)
    .values({
      userId: data.userId,
      subjectName: data.subjectName,
      source: data.source,
      faceShape: data.faceShape,
      temperamentTags: data.temperamentTags,
      coverImageUrl: data.coverImageUrl ?? null,
      sections: data.sections,
    })
    .returning();
  return rows[0];
}

export async function listShootPlansByUser(
  userId: string,
  limit = 20,
): Promise<ShootPlanRow[]> {
  return db
    .select()
    .from(shootPlans)
    .where(eq(shootPlans.userId, userId))
    .orderBy(desc(shootPlans.createdAt))
    .limit(limit);
}

export async function getShootPlan(
  id: string,
  userId: string,
): Promise<ShootPlanRow | undefined> {
  const rows = await db
    .select()
    .from(shootPlans)
    .where(and(eq(shootPlans.id, id), eq(shootPlans.userId, userId)))
    .limit(1);
  return rows[0];
}

export async function deleteShootPlan(id: string, userId: string): Promise<boolean> {
  const rows = await db
    .delete(shootPlans)
    .where(and(eq(shootPlans.id, id), eq(shootPlans.userId, userId)))
    .returning({ id: shootPlans.id });
  return rows.length > 0;
}
