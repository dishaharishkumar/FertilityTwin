import { Router } from "express";
import { db } from "@workspace/db";
import { cyclesTable, dailyLogsTable } from "@workspace/db";
import { desc, gte } from "drizzle-orm";
import { differenceInDays, parseISO, subDays, format } from "date-fns";

const router = Router();

router.get("/quiz/context", async (_req, res) => {
  const cycles = await db.select().from(cyclesTable).orderBy(desc(cyclesTable.startDate)).limit(3);

  const since = format(subDays(new Date(), 60), "yyyy-MM-dd");
  const logs = await db
    .select()
    .from(dailyLogsTable)
    .where(gte(dailyLogsTable.date, since));

  const currentCycle = cycles[0] ?? null;
  const currentDay = currentCycle
    ? differenceInDays(new Date(), parseISO(currentCycle.startDate)) + 1
    : null;

  const currentPhase = currentDay
    ? currentDay <= 5 ? "menstrual"
      : currentDay <= 13 ? "follicular"
      : currentDay <= 16 ? "ovulation"
      : "luteal"
    : null;

  const allSymptoms: string[] = [];
  let bbtSum = 0; let bbtCount = 0;
  let energySum = 0; let energyCount = 0;
  let stressSum = 0; let stressCount = 0;

  for (const log of logs) {
    const syms = (log.symptoms as string[] ?? []);
    allSymptoms.push(...syms);
    if (log.bbt) { bbtSum += Number(log.bbt); bbtCount++; }
    if (log.energyLevel) { energySum += log.energyLevel; energyCount++; }
    if (log.stressLevel) { stressSum += log.stressLevel; stressCount++; }
  }

  const symptomFreq: Record<string, number> = {};
  for (const s of allSymptoms) symptomFreq[s] = (symptomFreq[s] ?? 0) + 1;
  const topSymptoms = Object.entries(symptomFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s);

  const avgCycleLength = cycles.length >= 2
    ? Math.round(cycles.slice(0, -1).reduce((acc, c, i) => {
        const next = cycles[i + 1];
        return acc + differenceInDays(parseISO(c.startDate), parseISO(next.startDate));
      }, 0) / (cycles.length - 1))
    : null;

  res.json({
    currentPhase,
    currentDay,
    topSymptoms,
    avgBbt: bbtCount > 0 ? parseFloat((bbtSum / bbtCount).toFixed(2)) : null,
    avgEnergy: energyCount > 0 ? parseFloat((energySum / energyCount).toFixed(1)) : null,
    avgStress: stressCount > 0 ? parseFloat((stressSum / stressCount).toFixed(1)) : null,
    loggedDays: logs.length,
    cycleCount: cycles.length,
    avgCycleLength,
    hasData: logs.length > 0,
  });
});

export default router;
