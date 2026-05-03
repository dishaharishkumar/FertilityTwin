import { Router } from "express";
import { db } from "@workspace/db";
import { dailyLogsTable } from "@workspace/db";
import { gte } from "drizzle-orm";
import { format, subDays, eachDayOfInterval, parseISO, startOfDay } from "date-fns";

const router = Router();

router.get("/symptoms/heatmap", async (_req, res) => {
  const since = format(subDays(new Date(), 364), "yyyy-MM-dd");

  const logs = await db
    .select()
    .from(dailyLogsTable)
    .where(gte(dailyLogsTable.date, since));

  // Build a map of date → { count, symptoms, mood, energy }
  const byDate: Record<string, { count: number; symptoms: string[]; mood: string | null; energy: number | null }> = {};
  for (const log of logs) {
    const syms = (log.symptoms as string[] ?? []);
    byDate[log.date] = {
      count: syms.length,
      symptoms: syms,
      mood: log.mood ?? null,
      energy: log.energyLevel ?? null,
    };
  }

  // Every day in the last 365 days
  const days = eachDayOfInterval({
    start: startOfDay(subDays(new Date(), 364)),
    end: startOfDay(new Date()),
  }).map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const entry = byDate[key];
    return {
      date: key,
      count: entry?.count ?? -1, // -1 = not logged
      symptoms: entry?.symptoms ?? [],
      mood: entry?.mood ?? null,
      energy: entry?.energy ?? null,
      logged: !!entry,
    };
  });

  // Aggregate stats
  const loggedDays = logs.length;
  const allSymptoms: string[] = [];
  for (const log of logs) allSymptoms.push(...(log.symptoms as string[] ?? []));
  const freq: Record<string, number> = {};
  for (const s of allSymptoms) freq[s] = (freq[s] ?? 0) + 1;
  const topSymptom = Object.entries(freq).sort((a, b) => b[1] - a[1])[0] ?? null;
  const maxCount = Math.max(...logs.map((l) => (l.symptoms as string[] ?? []).length), 0);

  // Longest streak of logged days
  let streak = 0, maxStreak = 0, cur = 0;
  for (const d of days) {
    if (d.logged) { cur++; maxStreak = Math.max(maxStreak, cur); }
    else cur = 0;
  }
  streak = cur; // current streak (trailing days)

  res.json({ days, loggedDays, topSymptom: topSymptom ? { name: topSymptom[0], count: topSymptom[1] } : null, maxCount, currentStreak: streak, longestStreak: maxStreak });
});

export default router;
