import type { InferSelectModel } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";
import type { PlanSection } from "@/lib/plan/types";

export const shootPlans = pgTable(
  "shoot_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subjectName: text("subject_name").notNull(),
    source: varchar("source", { length: 16 }).notNull(), // "photo" | "text"
    faceShape: text("face_shape").notNull(),
    temperamentTags: jsonb("temperament_tags").$type<string[]>().notNull().default([]),
    coverImageUrl: text("cover_image_url"),
    sections: jsonb("sections").$type<PlanSection[]>().notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("shoot_plans_user_idx").on(table.userId),
    createdAtIdx: index("shoot_plans_created_at_idx").on(table.createdAt),
  }),
);

export type ShootPlanRow = InferSelectModel<typeof shootPlans>;
