import { pgTable, serial, text, integer, real, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyLogsTable = pgTable("daily_logs", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  bbt: real("bbt"),
  cervicalMucus: text("cervical_mucus"),
  mood: text("mood"),
  energyLevel: integer("energy_level"),
  sleepHours: real("sleep_hours"),
  stressLevel: integer("stress_level"),
  symptoms: jsonb("symptoms").$type<string[]>().notNull().default([]),
  supplements: jsonb("supplements").$type<string[]>().notNull().default([]),
  notes: text("notes"),
  cycleDay: integer("cycle_day"),
  phase: text("phase"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDailyLogSchema = createInsertSchema(dailyLogsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDailyLog = z.infer<typeof insertDailyLogSchema>;
export type DailyLog = typeof dailyLogsTable.$inferSelect;
