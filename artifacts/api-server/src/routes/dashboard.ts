import { Router } from "express";
import { db } from "@workspace/db";
import { dailyLogsTable, cyclesTable, insightsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { differenceInDays, parseISO, format, subDays } from "date-fns";

const router = Router();

function detectPhase(cycleDay: number): string {
  if (cycleDay <= 5) return "menstrual";
  if (cycleDay <= 13) return "follicular";
  if (cycleDay <= 16) return "ovulation";
  return "tww";
}

function computeReadinessScore(log: any): { overall: number; sleepScore: number | null; stressScore: number | null; energyScore: number | null } {
  let scores: number[] = [];
  let sleepScore: number | null = null;
  let stressScore: number | null = null;
  let energyScore: number | null = null;

  if (log.sleepHours != null) {
    sleepScore = log.sleepHours >= 8 ? 100 : log.sleepHours >= 7 ? 85 : log.sleepHours >= 6 ? 65 : 40;
    scores.push(sleepScore);
  }
  if (log.stressLevel != null) {
    stressScore = Math.round(((10 - log.stressLevel) / 9) * 100);
    scores.push(stressScore);
  }
  if (log.energyLevel != null) {
    energyScore = Math.round((log.energyLevel / 10) * 100);
    scores.push(energyScore);
  }

  const overall = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 50;
  return { overall, sleepScore, stressScore, energyScore };
}

router.get("/dashboard/summary", async (_req, res) => {
  const cycles = await db.select().from(cyclesTable).orderBy(desc(cyclesTable.startDate)).limit(10);
  const totalCycles = cycles.length;
  const latestCycle = cycles[0];

  let cycleDay: number | null = null;
  let currentPhase: string | null = null;
  let isInTww = false;
  let avgCycleLength: number | null = null;

  if (latestCycle) {
    const startDate = parseISO(latestCycle.startDate);
    cycleDay = differenceInDays(new Date(), startDate) + 1;
    currentPhase = detectPhase(cycleDay);
    isInTww = currentPhase === "tww";
  }

  if (cycles.length >= 2) {
    const lengths = cycles
      .slice(0, -1)
      .map((c, i) => differenceInDays(parseISO(cycles[i + 1].startDate), parseISO(c.startDate)))
      .filter(l => l > 0 && l < 60);
    if (lengths.length > 0) {
      avgCycleLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
    }
  }

  const recentLogs = await db
    .select()
    .from(dailyLogsTable)
    .orderBy(desc(dailyLogsTable.date))
    .limit(3);

  const recentSymptoms: string[] = [];
  recentLogs.forEach(log => {
    (log.symptoms as string[]).forEach(s => {
      if (!recentSymptoms.includes(s)) recentSymptoms.push(s);
    });
  });

  const lastLogDate = recentLogs[0]?.date ?? null;

  // Compute streak
  let streakDays = 0;
  const allLogs = await db.select().from(dailyLogsTable).orderBy(desc(dailyLogsTable.date));
  const logDates = new Set(allLogs.map(l => l.date));
  let checkDate = new Date();
  while (logDates.has(format(checkDate, "yyyy-MM-dd"))) {
    streakDays++;
    checkDate = subDays(checkDate, 1);
  }

  const latestInsights = await db.select().from(insightsTable).orderBy(desc(insightsTable.createdAt)).limit(1);
  const latestInsight = latestInsights[0]?.insight ?? null;

  const latestLog = recentLogs[0];
  let readinessScore: number | null = null;
  if (latestLog && lastLogDate === format(new Date(), "yyyy-MM-dd")) {
    readinessScore = computeReadinessScore(latestLog).overall;
  }

  res.json({
    currentPhase,
    cycleDay,
    readinessScore,
    isInTww,
    recentSymptoms,
    lastLogDate,
    totalCycles,
    avgCycleLength,
    latestInsight,
    streakDays,
  });
});

router.get("/dashboard/readiness-score", async (_req, res) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const logs = await db.select().from(dailyLogsTable).orderBy(desc(dailyLogsTable.date)).limit(1);
  const log = logs[0];

  if (!log) {
    res.json({
      overall: 50,
      sleepScore: null,
      stressScore: null,
      energyScore: null,
      date: today,
      message: "Log your day to get a personalized readiness score.",
    });
    return;
  }

  const { overall, sleepScore, stressScore, energyScore } = computeReadinessScore(log);
  const msg = overall >= 80
    ? "Your body is well-rested and ready. A great day to support your fertility."
    : overall >= 60
    ? "Good foundations. A little extra rest or stress management today could help."
    : "Your body may need extra care today. Prioritize rest, hydration, and gentle movement.";

  res.json({
    overall,
    sleepScore,
    stressScore,
    energyScore,
    date: log.date,
    message: msg,
  });
});

export default router;
