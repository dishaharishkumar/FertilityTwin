import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const bodyMapLogsTable = pgTable("body_map_logs", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(),
  sensation: text("sensation").notNull(),
  intensity: integer("intensity").notNull().default(1),
  notes: text("notes"),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
});

export type BodyMapLog = typeof bodyMapLogsTable.$inferSelect;
export type InsertBodyMapLog = typeof bodyMapLogsTable.$inferInsert;
