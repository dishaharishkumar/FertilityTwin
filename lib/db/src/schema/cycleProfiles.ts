import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const cycleProfilesTable = pgTable("cycle_profiles", {
  id: serial("id").primaryKey(),
  anonymousId: text("anonymous_id").notNull().unique(),
  cycleLengthBucket: text("cycle_length_bucket").notNull(),
  topSymptoms: jsonb("top_symptoms").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CycleProfile = typeof cycleProfilesTable.$inferSelect;
