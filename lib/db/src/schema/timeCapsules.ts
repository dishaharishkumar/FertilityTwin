import { pgTable, serial, text, date, boolean, timestamp } from "drizzle-orm/pg-core";

export const timeCapsulesTable = pgTable("time_capsules", {
  id: serial("id").primaryKey(),
  title: text("title"),
  message: text("message").notNull(),
  unlockDate: date("unlock_date").notNull(),
  isOpened: boolean("is_opened").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TimeCapsule = typeof timeCapsulesTable.$inferSelect;
