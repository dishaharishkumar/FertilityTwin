import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const cycleMarkersTable = pgTable("cycle_markers", {
  id: serial("id").primaryKey(),
  cycleDay: integer("cycle_day").notNull(),
  markerType: text("marker_type").notNull(),
  label: text("label"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CycleMarker = typeof cycleMarkersTable.$inferSelect;
