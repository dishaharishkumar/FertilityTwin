import { Router } from "express";
import { db } from "@workspace/db";
import { dailyLogsTable } from "@workspace/db";
import { asc } from "drizzle-orm";

const router = Router();

router.get("/stress-sleep-impact", async (_req, res) => {
  const logs = await db.select().from(dailyLogsTable).orderBy(asc(dailyLogsTable.date));

  if (logs.length === 0) {
    res.json({ stressBuckets: [], sleepBuckets: [], moodByStress: [], timeline: [], totalDays: 0 });
    return;
  }

  const stressGroups: Record<string, { bbtSum: number; symptomSum: number; moodSum: number; count: number }> = {
    "Low (1–3)": { bbtSum: 0, symptomSum: 0, moodSum: 0, count: 0 },
    "Medium (4–6)": { bbtSum: 0, symptomSum: 0, moodSum: 0, count: 0 },
    "High (7–10)": { bbtSum: 0, symptomSum: 0, moodSum: 0, count: 0 },
  };

  const sleepGroups: Record<string, { bbtSum: number; symptomSum: number; energySum: number; count: number }> = {
    "< 6h": { bbtSum: 0, symptomSum: 0, energySum: 0, count: 0 },
    "6–7h": { bbtSum: 0, symptomSum: 0, energySum: 0, count: 0 },
    "7–8h": { bbtSum: 0, symptomSum: 0, energySum: 0, count: 0 },
    "> 8h": { bbtSum: 0, symptomSum: 0, energySum: 0, count: 0 },
  };

  const moodMap: Record<string, number> = { positive: 1, neutral: 0, negative: -1 };

  const timeline = logs.map((log) => ({
    date: log.date,
    stress: log.stressLevel ?? 0,
    sleep: log.sleepHours ?? 0,
    energy: log.energyLevel ?? 0,
    symptoms: (log.symptoms as string[] ?? []).length,
    bbt: log.bbt ? Number(log.bbt) : null,
    mood: log.mood ?? "neutral",
  }));

  for (const log of logs) {
    const stress = log.stressLevel ?? 5;
    const sleep = log.sleepHours ? Number(log.sleepHours) : 7;
    const bbt = log.bbt ? Number(log.bbt) : null;
    const symptoms = (log.symptoms as string[] ?? []).length;
    const mood = moodMap[log.mood ?? "neutral"] ?? 0;
    const energy = log.energyLevel ?? 5;

    const sg = stress <= 3 ? "Low (1–3)" : stress <= 6 ? "Medium (4–6)" : "High (7–10)";
    stressGroups[sg].count++;
    stressGroups[sg].symptomSum += symptoms;
    stressGroups[sg].moodSum += mood;
    if (bbt) stressGroups[sg].bbtSum += bbt;

    const slg = sleep < 6 ? "< 6h" : sleep < 7 ? "6–7h" : sleep < 8 ? "7–8h" : "> 8h";
    sleepGroups[slg].count++;
    sleepGroups[slg].symptomSum += symptoms;
    sleepGroups[slg].energySum += energy;
    if (bbt) sleepGroups[slg].bbtSum += bbt;
  }

  const stressBuckets = Object.entries(stressGroups)
    .filter(([, g]) => g.count > 0)
    .map(([label, g]) => ({
      label,
      days: g.count,
      avgSymptoms: parseFloat((g.symptomSum / g.count).toFixed(1)),
      avgMood: parseFloat((g.moodSum / g.count).toFixed(2)),
      avgBbt: g.bbtSum > 0 ? parseFloat((g.bbtSum / g.count).toFixed(2)) : null,
    }));

  const sleepBuckets = Object.entries(sleepGroups)
    .filter(([, g]) => g.count > 0)
    .map(([label, g]) => ({
      label,
      days: g.count,
      avgSymptoms: parseFloat((g.symptomSum / g.count).toFixed(1)),
      avgEnergy: parseFloat((g.energySum / g.count).toFixed(1)),
      avgBbt: g.bbtSum > 0 ? parseFloat((g.bbtSum / g.count).toFixed(2)) : null,
    }));

  // Insight generation
  const highStress = stressBuckets.find((b) => b.label.startsWith("High"));
  const lowStress = stressBuckets.find((b) => b.label.startsWith("Low"));
  const bestSleep = sleepBuckets.find((b) => b.label === "7–8h") ?? sleepBuckets.sort((a, b) => b.avgEnergy - a.avgEnergy)[0];
  const worstSleep = sleepBuckets.sort((a, b) => b.avgSymptoms - a.avgSymptoms)[0];

  let insight = "";
  if (highStress && lowStress && highStress.avgSymptoms > lowStress.avgSymptoms) {
    insight = `On high-stress days you log ${(highStress.avgSymptoms - lowStress.avgSymptoms).toFixed(1)} more symptoms on average than on low-stress days. Stress directly amplifies physical symptom perception.`;
  } else if (logs.length < 5) {
    insight = "Log more days to unlock your personal stress and sleep correlations. Patterns become visible after about 2 weeks of tracking.";
  } else {
    insight = "Your data so far doesn't show a strong stress–symptom link — this could mean you manage stress well, or your symptoms are driven more by hormonal phase than lifestyle.";
  }

  if (bestSleep && bestSleep.avgEnergy > 5) {
    insight += ` On nights with ${bestSleep.label} of sleep, your average energy is ${bestSleep.avgEnergy}/10.`;
  }

  res.json({ stressBuckets, sleepBuckets, timeline, totalDays: logs.length, insight });
});

export default router;
