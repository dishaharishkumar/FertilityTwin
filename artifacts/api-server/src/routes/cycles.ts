import { Router } from "express";
import { db } from "@workspace/db";
import { cyclesTable, dailyLogsTable } from "@workspace/db";
import { CreateCycleBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { desc, gte } from "drizzle-orm";
import { differenceInDays, format, addDays, parseISO, subDays } from "date-fns";

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

router.get("/cycles/story", async (req, res) => {
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

  function getPhase(day: number) {
    if (day <= 5) return "menstrual";
    if (day <= 13) return "follicular";
    if (day <= 16) return "ovulation";
    return "two-week wait";
  }
  const phase = getPhase(cycleDay);

  const cutoff = subDays(today, cycleDay - 1);
  const logs = await db.select().from(dailyLogsTable)
    .where(gte(dailyLogsTable.date, format(cutoff, "yyyy-MM-dd")))
    .orderBy(desc(dailyLogsTable.date));

  const logSummary = logs.length === 0
    ? "No logs recorded this cycle yet."
    : logs.slice(0, 7).map(l =>
        `Day ${differenceInDays(parseISO(l.date), startDate) + 1}: mood ${l.mood ?? "?"}, energy ${l.energyLevel ?? "?"}/10, sleep ${l.sleepHours ?? "?"}h, stress ${l.stressLevel ?? "?"}/10, symptoms: ${(l.symptoms as string[]).join(", ") || "none"}`
      ).join("\n");

  const prompt = `You are Bloom, a warm fertility companion. Write a short, beautiful, first-person narrative (3–4 paragraphs) for a woman to read about her current cycle. Make it feel like a personal memoir chapter — warm, grounded, and emotionally honest. Avoid clinical language.

Cycle data:
- Cycle start: ${format(startDate, "MMMM d, yyyy")}
- Current cycle day: ${cycleDay} of approximately ${cycleLength}
- Current phase: ${phase}
- Days logged: ${logs.length}
- Estimated ovulation: day ${cycle.ovulationDay ?? 14}
- Recent log summary:
${logSummary}

Write the narrative in second person ("you") — warm and compassionate, like a wise friend reflecting back what this cycle held. Reference specific data points naturally. End with a sentence of quiet encouragement.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500,
    temperature: 0.8,
  });

  const story = completion.choices[0]?.message?.content ?? "Your story is still being written.";

  res.json({
    story,
    cycleDay,
    phase,
    startDate: format(startDate, "yyyy-MM-dd"),
    logCount: logs.length,
  });
});

export default router;
