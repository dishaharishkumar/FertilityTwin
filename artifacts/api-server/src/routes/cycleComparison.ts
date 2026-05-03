import { Router } from "express";
import { db } from "@workspace/db";
import { cyclesTable, dailyLogsTable } from "@workspace/db";
import { desc, gte, lte, and } from "drizzle-orm";
import { differenceInDays, parseISO, addDays, format } from "date-fns";

const router = Router();

router.get("/cycles/comparison", async (_req, res) => {
  const cycles = await db.select().from(cyclesTable).orderBy(desc(cyclesTable.startDate)).limit(4);

  if (cycles.length === 0) {
    res.json({ cycles: [], days: [] });
    return;
  }

  // build up to 3 comparison cycles
  const comparisons = [];
  for (let i = 0; i < Math.min(3, cycles.length); i++) {
    const cycle = cycles[i];
    const start = parseISO(cycle.startDate);
    const end = cycle.endDate
      ? parseISO(cycle.endDate)
      : i === 0
      ? new Date()
      : cycles[i - 1]
      ? addDays(parseISO(cycles[i - 1].startDate), -1)
      : addDays(start, 27);

    const logs = await db
      .select()
      .from(dailyLogsTable)
      .where(
        and(
          gte(dailyLogsTable.date, format(start, "yyyy-MM-dd")),
          lte(dailyLogsTable.date, format(end, "yyyy-MM-dd"))
        )
      );

    const byDay: Record<number, { bbt: number | null; energy: number | null; stress: number | null; symptoms: number }> = {};
    for (const log of logs) {
      const day = differenceInDays(parseISO(log.date), start) + 1;
      if (day >= 1 && day <= 35) {
        byDay[day] = {
          bbt: log.bbt ? Number(log.bbt) : null,
          energy: log.energyLevel ?? null,
          stress: log.stressLevel ?? null,
          symptoms: (log.symptoms as string[] ?? []).length,
        };
      }
    }

    const length = differenceInDays(end, start) + 1;
    comparisons.push({
      id: cycle.id,
      startDate: cycle.startDate,
      label: format(start, "MMM yyyy"),
      isCurrent: i === 0,
      length: Math.min(length, 35),
      loggedDays: logs.length,
      byDay,
    });
  }

  // build a unified day axis (1..maxLength)
  const maxLen = Math.max(...comparisons.map((c) => c.length));
  const days = Array.from({ length: maxLen }, (_, i) => {
    const day = i + 1;
    const row: Record<string, number | null | string> = { day };
    for (const c of comparisons) {
      const d = c.byDay[day];
      row[`bbt_${c.label}`] = d?.bbt ?? null;
      row[`energy_${c.label}`] = d?.energy ?? null;
      row[`stress_${c.label}`] = d?.stress ?? null;
      row[`symptoms_${c.label}`] = d?.symptoms ?? null;
    }
    return row;
  });

  res.json({ cycles: comparisons.map(({ byDay: _b, ...c }) => c), days });
});

export default router;
