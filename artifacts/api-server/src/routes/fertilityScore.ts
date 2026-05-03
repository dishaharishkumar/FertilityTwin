import { Router } from "express";
import { db } from "@workspace/db";
import { cyclesTable, dailyLogsTable } from "@workspace/db";
import { desc, gte } from "drizzle-orm";
import { differenceInDays, parseISO, format, subDays } from "date-fns";

const router = Router();

function cycleDayScore(day: number, cycleLength: number): number {
  // Expected ovulation day ~ cycleLength - 14
  const ovDay = cycleLength - 14;
  const fertiStart = ovDay - 4; // 5 days before ovulation
  const fertiEnd = ovDay + 1;   // ovulation day

  if (day < 1) return 5;
  if (day <= 5) return Math.round(5 + (day / 5) * 10); // 5-15 (menstrual)
  if (day < fertiStart) {
    // Rising from 15 → 45 during follicular
    const t = (day - 5) / (fertiStart - 5);
    return Math.round(15 + t * 30);
  }
  if (day <= ovDay) {
    // Peak fertile window: 45 → 100 → 100
    const t = (day - fertiStart) / (ovDay - fertiStart);
    return Math.round(45 + t * 55);
  }
  if (day === fertiEnd) return 70; // day after ovulation, egg still viable
  if (day <= fertiEnd + 3) return Math.round(70 - (day - fertiEnd) * 18); // rapid drop
  // Luteal: 20 → 5
  const t = Math.min((day - fertiEnd - 3) / (cycleLength - fertiEnd - 3), 1);
  return Math.round(20 - t * 15);
}

function sleepScore(hours: number): number {
  if (hours <= 0) return 50; // unknown
  if (hours < 5) return 15;
  if (hours < 6) return 35;
  if (hours < 7) return 60;
  if (hours <= 9) return 100;
  if (hours <= 10) return 80;
  return 55; // oversleeping
}

function stressScore(level: number): number {
  if (level <= 0) return 60;
  if (level <= 3) return 100;
  if (level <= 5) return 75;
  if (level <= 7) return 45;
  return 20;
}

function energyScore(level: number): number {
  if (level <= 0) return 50;
  return Math.round((level / 10) * 100);
}

router.get("/fertility-score", async (_req, res) => {
  const cycles = await db.select().from(cyclesTable).orderBy(desc(cyclesTable.startDate)).limit(4);

  // Average cycle length
  let avgCycleLen = 28;
  if (cycles.length >= 2) {
    const diffs = cycles.slice(0, -1).map((c, i) =>
      differenceInDays(parseISO(c.startDate), parseISO(cycles[i + 1].startDate))
    );
    avgCycleLen = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    avgCycleLen = Math.max(21, Math.min(35, avgCycleLen));
  }

  const currentCycle = cycles[0] ?? null;
  const currentDay = currentCycle
    ? differenceInDays(new Date(), parseISO(currentCycle.startDate)) + 1
    : null;

  // Today's log
  const today = format(new Date(), "yyyy-MM-dd");
  const since = format(subDays(new Date(), 3), "yyyy-MM-dd");
  const recentLogs = await db.select().from(dailyLogsTable).where(gte(dailyLogsTable.date, since));
  const todayLog = recentLogs.find((l) => l.date === today) ?? recentLogs[0] ?? null;

  const sleep = todayLog?.sleepHours ? Number(todayLog.sleepHours) : 0;
  const stress = todayLog?.stressLevel ?? 0;
  const energy = todayLog?.energyLevel ?? 0;
  const bbt = todayLog?.bbt ? Number(todayLog.bbt) : null;

  const day = currentDay ?? Math.ceil(avgCycleLen / 2);
  const ovulationDay = avgCycleLen - 14;

  // Component scores
  const cdScore = cycleDayScore(day, avgCycleLen);
  const slScore = sleepScore(sleep);
  const stScore = stressScore(stress);
  const enScore = energyScore(energy);

  // Weights
  const hasLifestyle = sleep > 0 || stress > 0 || energy > 0;
  let total: number;
  if (hasLifestyle) {
    total = Math.round(cdScore * 0.45 + slScore * 0.20 + stScore * 0.20 + enScore * 0.15);
  } else {
    total = cdScore;
  }
  total = Math.max(1, Math.min(100, total));

  const phase =
    day <= 5 ? "Menstrual"
    : day <= ovulationDay - 4 ? "Follicular"
    : day <= ovulationDay + 1 ? "Ovulation"
    : "Luteal";

  const fertiWindow = day >= ovulationDay - 4 && day <= ovulationDay + 1;

  let interpretation = "";
  if (total >= 80) interpretation = "Your fertile window is open. Conditions are optimal.";
  else if (total >= 60) interpretation = "Fertility conditions are favourable today.";
  else if (total >= 40) interpretation = "Moderate fertility likelihood — outside peak window.";
  else if (total >= 20) interpretation = "Low fertility likelihood based on your cycle phase.";
  else interpretation = "Fertility is unlikely today — rest and recover.";

  res.json({
    score: total,
    currentDay: day,
    cycleLength: avgCycleLen,
    ovulationDay,
    phase,
    inFertileWindow: fertiWindow,
    interpretation,
    components: {
      cycleDay: { score: cdScore, label: "Cycle timing", weight: 45 },
      sleep: { score: todayLog ? slScore : null, label: "Sleep quality", weight: 20 },
      stress: { score: todayLog ? stScore : null, label: "Stress level", weight: 20 },
      energy: { score: todayLog ? enScore : null, label: "Energy", weight: 15 },
    },
    hasLog: !!todayLog,
    bbt,
  });
});

export default router;
