import { Router } from "express";
import { db } from "@workspace/db";
import { cyclesTable, dailyLogsTable } from "@workspace/db";
import { desc, gte, lte, and } from "drizzle-orm";
import { differenceInDays, parseISO, format, addDays } from "date-fns";

const router = Router();

type Grade = "A" | "B" | "C" | "D" | "F";

function scoreToGrade(score: number): Grade {
  if (score >= 88) return "A";
  if (score >= 74) return "B";
  if (score >= 58) return "C";
  if (score >= 42) return "D";
  return "F";
}

function sleepScore(avg: number | null): number {
  if (avg === null) return 60;
  if (avg >= 8) return 100;
  if (avg >= 7.5) return 90;
  if (avg >= 7) return 78;
  if (avg >= 6) return 60;
  if (avg >= 5) return 42;
  return 25;
}

function stressScore(avg: number | null): number {
  if (avg === null) return 60;
  const inverted = 10 - avg;
  return Math.round((inverted / 9) * 100);
}

function energyScore(avg: number | null): number {
  if (avg === null) return 60;
  return Math.round((avg / 10) * 100);
}

function symptomScore(avgCount: number): number {
  if (avgCount <= 0.5) return 100;
  if (avgCount <= 1) return 88;
  if (avgCount <= 2) return 72;
  if (avgCount <= 3.5) return 54;
  if (avgCount <= 5) return 38;
  return 20;
}

function consistencyScore(logged: number, length: number): number {
  const pct = length > 0 ? logged / length : 0;
  return Math.round(pct * 100);
}

function bbtStabilityScore(bbts: number[]): number {
  if (bbts.length < 3) return 60;
  const mean = bbts.reduce((a, b) => a + b, 0) / bbts.length;
  const variance = bbts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / bbts.length;
  const stddev = Math.sqrt(variance);
  if (stddev < 0.05) return 100;
  if (stddev < 0.1) return 88;
  if (stddev < 0.18) return 72;
  if (stddev < 0.25) return 52;
  return 30;
}

function avg(arr: number[]): number | null {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
}

function overallGrade(scores: number[]): Grade {
  const valid = scores.filter((s) => s > 0);
  if (valid.length === 0) return "C";
  return scoreToGrade(Math.round(valid.reduce((a, b) => a + b, 0) / valid.length));
}

router.get("/cycles/report-cards", async (_req, res) => {
  const cycles = await db
    .select()
    .from(cyclesTable)
    .orderBy(desc(cyclesTable.startDate))
    .limit(12);

  const cards = await Promise.all(
    cycles.map(async (cycle, idx) => {
      const nextCycle = cycles[idx - 1];
      const startDate = parseISO(cycle.startDate);
      const endDate = nextCycle
        ? parseISO(nextCycle.startDate)
        : cycle.endDate
        ? parseISO(cycle.endDate)
        : new Date();

      const cycleLength = differenceInDays(endDate, startDate);
      const isComplete = !!nextCycle || !!cycle.endDate;

      const logs = await db
        .select()
        .from(dailyLogsTable)
        .where(
          and(
            gte(dailyLogsTable.date, cycle.startDate),
            lte(
              dailyLogsTable.date,
              format(endDate, "yyyy-MM-dd")
            )
          )
        );

      const sleepVals = logs.map((l) => l.sleepHours).filter((v): v is number => v != null);
      const stressVals = logs.map((l) => l.stressLevel).filter((v): v is number => v != null);
      const energyVals = logs.map((l) => l.energyLevel).filter((v): v is number => v != null);
      const bbtVals = logs.map((l) => l.bbt).filter((v): v is number => v != null);
      const symptomCounts = logs.map((l) => (l.symptoms as string[]).length);

      const sSleep = sleepScore(avg(sleepVals));
      const sStress = stressScore(avg(stressVals));
      const sEnergy = energyScore(avg(energyVals));
      const sBbt = bbtStabilityScore(bbtVals);
      const sSymptom = symptomScore(avg(symptomCounts) ?? 0);
      const sConsistency = consistencyScore(logs.length, Math.max(cycleLength, 1));

      const overall = overallGrade([sSleep, sStress, sEnergy, sBbt, sSymptom, sConsistency]);

      return {
        cycleId: cycle.id,
        startDate: cycle.startDate,
        cycleLength: Math.max(cycleLength, 0),
        logCount: logs.length,
        isComplete,
        overall,
        grades: {
          sleep: scoreToGrade(sSleep),
          stress: scoreToGrade(sStress),
          energy: scoreToGrade(sEnergy),
          bbtStability: scoreToGrade(sBbt),
          symptoms: scoreToGrade(sSymptom),
          consistency: scoreToGrade(sConsistency),
        },
        scores: {
          sleep: sSleep,
          stress: sStress,
          energy: sEnergy,
          bbtStability: sBbt,
          symptoms: sSymptom,
          consistency: sConsistency,
        },
        highlights: {
          avgSleep: avg(sleepVals),
          avgStress: avg(stressVals),
          avgEnergy: avg(energyVals),
          bbtReadings: bbtVals.length,
        },
      };
    })
  );

  res.json(cards);
});

export default router;
