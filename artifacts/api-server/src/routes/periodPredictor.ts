import { Router } from "express";
import { db } from "@workspace/db";
import { cyclesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { differenceInDays, parseISO, addDays, format } from "date-fns";

const router = Router();

router.get("/period-predictor", async (_req, res) => {
  const cycles = await db.select().from(cyclesTable).orderBy(desc(cyclesTable.startDate)).limit(12);

  if (cycles.length === 0) {
    res.json({ predictions: [], avgCycleLength: null, confidence: "none", cycleLengths: [] });
    return;
  }

  const cycleLengths: number[] = [];
  for (let i = 0; i < cycles.length - 1; i++) {
    const len = differenceInDays(parseISO(cycles[i].startDate), parseISO(cycles[i + 1].startDate));
    if (len >= 21 && len <= 45) cycleLengths.push(len);
  }

  const lastStart = parseISO(cycles[0].startDate);
  let avgLength = 28;
  let stdDev = 3;
  let confidence: "high" | "medium" | "low" | "none" = "none";

  if (cycleLengths.length >= 3) {
    avgLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
    const variance = cycleLengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / cycleLengths.length;
    stdDev = Math.round(Math.sqrt(variance));
    confidence = stdDev <= 2 ? "high" : stdDev <= 4 ? "medium" : "low";
  } else if (cycleLengths.length >= 1) {
    avgLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
    confidence = "low";
    stdDev = 4;
  } else {
    confidence = "none";
  }

  const margin = Math.max(stdDev, 2);

  const today = new Date();
  const daysSinceLast = differenceInDays(today, lastStart);
  const daysUntilNext = avgLength - daysSinceLast;

  const predictions = [1, 2, 3].map((n) => {
    const predictedDate = addDays(lastStart, avgLength * n);
    const earlyDate = addDays(predictedDate, -margin);
    const lateDate = addDays(predictedDate, margin);
    const daysAway = differenceInDays(predictedDate, today);
    return {
      cycleNumber: n,
      predictedDate: format(predictedDate, "yyyy-MM-dd"),
      earlyDate: format(earlyDate, "yyyy-MM-dd"),
      lateDate: format(lateDate, "yyyy-MM-dd"),
      daysAway,
      windowDays: margin * 2,
    };
  });

  res.json({
    predictions,
    avgCycleLength: avgLength,
    currentCycleDay: daysSinceLast + 1,
    daysUntilNext,
    confidence,
    cycleLengths,
    stdDev,
    margin,
  });
});

export default router;
