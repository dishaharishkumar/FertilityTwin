import { Router } from "express";
import { db } from "@workspace/db";
import { cyclesTable, dailyLogsTable } from "@workspace/db";
import { CreateCycleBody } from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";
import { differenceInDays, format, addDays, parseISO } from "date-fns";

const router = Router();

function detectPhase(cycleDay: number, cycleLength = 28): { phase: string; phaseDescription: string; daysUntilNext: number } {
  if (cycleDay <= 5) {
    return { phase: "menstrual", phaseDescription: "Your body is shedding the uterine lining. Rest and gentle care.", daysUntilNext: 5 - cycleDay + 1 };
  }
  if (cycleDay <= 13) {
    return { phase: "follicular", phaseDescription: "Follicles are maturing. Energy rising. A great time to nourish your body.", daysUntilNext: 13 - cycleDay + 1 };
  }
  if (cycleDay <= 16) {
    return { phase: "ovulation", phaseDescription: "Peak fertility window. Your body is at its most vibrant.", daysUntilNext: 16 - cycleDay + 1 };
  }
  const twwStart = 17;
  const lutealEnd = Math.min(cycleLength - 1, 28);
  if (cycleDay >= twwStart) {
    return { phase: "tww", phaseDescription: "Two-week wait. Focus on gentle self-care. Your body is doing incredible work.", daysUntilNext: lutealEnd - cycleDay + 1 };
  }
  return { phase: "luteal", phaseDescription: "Post-ovulation phase. Progesterone rising to support implantation.", daysUntilNext: twwStart - cycleDay };
}

router.get("/cycles", async (_req, res) => {
  const cycles = await db.select().from(cyclesTable).orderBy(desc(cyclesTable.startDate));
  res.json(cycles);
});

router.post("/cycles", async (req, res) => {
  const parsed = CreateCycleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const startDateStr = parsed.data.startDate instanceof Date
    ? format(parsed.data.startDate, "yyyy-MM-dd")
    : String(parsed.data.startDate);

  const inserted = await db
    .insert(cyclesTable)
    .values({
      startDate: startDateStr,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json(inserted[0]);
});

router.get("/cycles/current", async (_req, res) => {
  const cycles = await db.select().from(cyclesTable).orderBy(desc(cyclesTable.startDate)).limit(1);

  if (cycles.length === 0) {
    res.status(404).json({ error: "No active cycle" });
    return;
  }

  const cycle = cycles[0];
  const startDate = parseISO(cycle.startDate);
  const today = new Date();
  const cycleDay = differenceInDays(today, startDate) + 1;
  const cycleLength = cycle.cycleLength ?? 28;

  const { phase, phaseDescription, daysUntilNext } = detectPhase(cycleDay, cycleLength);
  const ovulationCycleDay = cycle.ovulationDay ?? 14;
  const estimatedOvulationDate = format(addDays(startDate, ovulationCycleDay - 1), "yyyy-MM-dd");

  res.json({
    cycle,
    cycleDay,
    phase,
    phaseDescription,
    daysUntilNextPhase: daysUntilNext,
    estimatedOvulationDate,
    isInTww: phase === "tww",
  });
});

export default router;
