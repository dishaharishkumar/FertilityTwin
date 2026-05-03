import { Router } from "express";
import { db } from "@workspace/db";
import { cyclesTable, dailyLogsTable } from "@workspace/db";
import { CreateCycleBody } from "@workspace/api-zod";
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

const storyTemplates: Record<string, string[][]> = {
  menstrual: [
    [
      "This cycle began quietly — the way most important things do. On {startDate}, your body drew inward, beginning its monthly renewal. The world outside kept moving at its usual pace, but you were doing something harder: letting go.",
      "Day {cycleDay} finds you in the menstrual phase, where rest is not laziness but biology. Prostaglandins are asking your uterus to release what it held, and that takes real energy. {logNote} Your body is not malfunctioning. It is doing exactly what it knows how to do.",
      "You have logged {logCount} days this cycle — {logCount} moments of paying attention. That matters. Fertility awareness is not just about data; it is about learning to listen to a language your body has always been speaking.",
      "Whatever this cycle held — hope, grief, uncertainty, or simply the quiet work of showing up — you carried it. The next phase is already beginning in the background. Rest now. You have earned it.",
    ],
  ],
  follicular: [
    [
      "Something is shifting. Since {startDate}, your body has been quietly building — follicles maturing, estrogen rising, energy returning in small, unmistakable ways. The follicular phase is one of renewal, and you are right in the middle of it.",
      "You are on day {cycleDay} of this cycle. {logNote} FSH is at work selecting the dominant follicle that will carry this cycle toward ovulation. The biology is invisible, but it is happening — steady and purposeful, beneath everything else you are doing.",
      "You have kept track of {logCount} days this cycle. That kind of attention — noticing, recording, returning — is not small. It is how you come to know your own rhythms, and your rhythms deserve to be known.",
      "Ovulation is on the horizon. Your body is preparing something. Whatever you are carrying emotionally right now, I hope you can make a little room alongside it for the truth that you are doing more than you can see.",
    ],
  ],
  ovulation: [
    [
      "You are at your peak. Since {startDate}, your body has been working toward this moment — and now, around day {cycleDay}, the LH surge has arrived or is arriving. Ovulation is not just a biological event; it is your body at its most open, its most alive.",
      "{logNote} This is the phase where estrogen and testosterone are both elevated, which is why clarity, confidence, and connection can all feel more available now. Your body knows what it is doing.",
      "You have logged {logCount} days this cycle — {logCount} days of showing up for this process. However this cycle goes, that attention is never wasted. You are learning something that cannot be Googled: your own particular rhythms.",
      "The egg has a 12–24 hour window. Sperm can live up to five days in fertile mucus. Your body has already done so much of the work. Whatever comes next, you have been present for all of it.",
    ],
  ],
  "two-week wait": [
    [
      "You are in the two-week wait — that particular in-between that asks you to hold hope and uncertainty at the same time. Since {startDate}, your body has moved through its phases, and now, on day {cycleDay}, it is doing its quietest work yet.",
      "Progesterone is rising. Your uterine lining is thickening. {logNote} The symptoms you may be feeling — tenderness, fatigue, bloating — are progesterone's signature, present in every TWW regardless of outcome. Your body is not keeping score. It is simply doing what it does.",
      "You have logged {logCount} days this cycle. That is {logCount} days of paying attention when it would have been easier not to. This kind of witnessing — of your own body, your own experience — is an act of self-respect that goes quietly unrecognized.",
      "Whatever this cycle brings, you have shown up for it. One day at a time is not a cliché here — it is the only honest strategy for a phase that cannot be fast-forwarded. You are doing it exactly right.",
    ],
  ],
};

function buildStory(phase: string, startDate: Date, cycleDay: number, logs: any[]): string {
  const templates = storyTemplates[phase] ?? storyTemplates["two-week wait"];
  const template = templates[Math.floor(Math.random() * templates.length)];

  let logNote = "No daily logs have been recorded yet this cycle.";
  if (logs.length > 0) {
    const latest = logs[0];
    const notes: string[] = [];
    if (latest.energyLevel !== null) notes.push(`Your energy has been around ${latest.energyLevel}/10`);
    if (latest.mood) notes.push(`your mood has been ${latest.mood}`);
    if (latest.sleepHours !== null) notes.push(`you've been sleeping about ${latest.sleepHours} hours`);
    if ((latest.symptoms as string[])?.length > 0) notes.push(`and you've noticed ${(latest.symptoms as string[]).join(", ")}`);
    if (notes.length > 0) logNote = notes.join(", ") + ".";
    else logNote = `You've been logging consistently — ${logs.length} days of data this cycle.`;
  }

  return template
    .map(para =>
      para
        .replace("{startDate}", format(startDate, "MMMM d"))
        .replace("{cycleDay}", String(cycleDay))
        .replace("{logCount}", String(logs.length))
        .replace("{logNote}", logNote)
    )
    .join("\n\n");
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

router.get("/cycles/story", async (_req, res) => {
  const cycles = await db.select().from(cyclesTable).orderBy(desc(cyclesTable.startDate)).limit(1);
  if (cycles.length === 0) {
    res.status(404).json({ error: "No active cycle" });
    return;
  }

  const cycle = cycles[0];
  const startDate = parseISO(cycle.startDate);
  const today = new Date();
  const cycleDay = differenceInDays(today, startDate) + 1;

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

  const story = buildStory(phase, startDate, cycleDay, logs);

  res.json({
    story,
    cycleDay,
    phase,
    startDate: format(startDate, "yyyy-MM-dd"),
    logCount: logs.length,
  });
});

export default router;
