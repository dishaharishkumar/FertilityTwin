import { Router } from "express";
import { db } from "@workspace/db";
import { journalEntries, dailyLogsTable, cyclesTable } from "@workspace/db";
import { CreateJournalEntryBody, DeleteJournalEntryParams } from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";
import { differenceInDays, parseISO } from "date-fns";

const router = Router();

const phaseResponses: Record<string, string[]> = {
  menstrual: [
    "Writing during your menstrual phase takes real courage — this is often when emotions rise closest to the surface. What you're feeling is valid. Your body is in full release right now, and sometimes the feelings follow.",
    "There's something quietly powerful about putting words to this phase. Your body is doing so much. Thank you for taking a moment to be with yourself instead of pushing through.",
    "This is a tender time, and you showed up for it anyway. Whatever you're carrying right now — it's allowed to be here.",
  ],
  follicular: [
    "There's something fresh about writing now, as your energy begins to rebuild. Whatever you're noticing, it's worth paying attention to — this phase often brings clarity.",
    "You're in a time of rising. Whatever you wrote today, it matters — you matter. This is a good moment to be gentle and curious with yourself.",
    "The follicular phase can bring a subtle optimism. Whatever you're sitting with, I hope writing it helped it feel a little less heavy.",
  ],
  ovulation: [
    "You wrote at your most energetically open moment of the cycle. Whatever came up — hopes, fears, observations — your feelings are never too much.",
    "Writing at peak energy doesn't always mean peak certainty. It's okay to feel complex things even when your body is at its strongest.",
    "Whatever you're holding right now is real and worth acknowledging. I'm glad you gave it space on the page.",
  ],
  "two-week wait": [
    "The TWW asks so much of you, emotionally. Writing through it — even imperfectly, even messily — is an act of care for yourself. I hope it helped even a little.",
    "This is one of the hardest phases to sit with. You wrote anyway. That matters. Whatever happens, you are not alone in this.",
    "The uncertainty of this phase is real, not a sign that you're doing something wrong. Writing through it is a small act of courage. Be gentle with yourself today.",
  ],
  default: [
    "What you wrote belongs to you. I'm glad you took the time to put it into words — there's real value in that, even when it's hard.",
    "Thank you for trusting this space with your thoughts. Whatever you're carrying, you don't have to carry it silently.",
    "Journaling through a fertility journey takes something out of you — and gives something back. I hope writing helped, even a little.",
    "You showed up for yourself today. That's not nothing. Whatever you wrote, it's a part of your story and it deserves space.",
    "I hear you. This journey has so many layers — the physical, the emotional, the waiting, the hoping. All of it belongs here.",
  ],
};

function getJournalResponse(phase: string | null): string {
  const key = phase ?? "default";
  const options = phaseResponses[key] ?? phaseResponses.default;
  return options[Math.floor(Math.random() * options.length)];
}

router.get("/journal", async (_req, res) => {
  const entries = await db
    .select()
    .from(journalEntries)
    .orderBy(desc(journalEntries.createdAt))
    .limit(50);
  res.json(entries);
});

router.post("/journal", async (req, res) => {
  const parsed = CreateJournalEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { content } = parsed.data;

  const recentCycle = await db.select().from(cyclesTable).orderBy(desc(cyclesTable.startDate)).limit(1);

  let phase: string | null = null;
  if (recentCycle.length > 0) {
    const day = differenceInDays(new Date(), parseISO(recentCycle[0].startDate)) + 1;
    if (day <= 5) phase = "menstrual";
    else if (day <= 13) phase = "follicular";
    else if (day <= 16) phase = "ovulation";
    else phase = "two-week wait";
  }

  const aiResponse = getJournalResponse(phase);

  const inserted = await db
    .insert(journalEntries)
    .values({ content, aiResponse })
    .returning();

  res.status(201).json(inserted[0]);
});

router.delete("/journal/:id", async (req, res) => {
  const parsed = DeleteJournalEntryParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await db.delete(journalEntries).where(eq(journalEntries.id, parsed.data.id));
  res.status(204).send();
});

export default router;
