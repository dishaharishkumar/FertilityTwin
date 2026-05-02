import { pgTable, serial, text, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cyclesTable = pgTable("cycles", {
  id: serial("id").primaryKey(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  cycleLength: integer("cycle_length"),
  ovulationDay: integer("ovulation_day"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCycleSchema = createInsertSchema(cyclesTable).omit({ id: true, createdAt: true });
export type InsertCycle = z.infer<typeof insertCycleSchema>;
export type Cycle = typeof cyclesTable.$inferSelect;
