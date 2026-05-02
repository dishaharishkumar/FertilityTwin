import { Router } from "express";
import { db } from "@workspace/db";
import { journalEntries, dailyLogsTable, cyclesTable } from "@workspace/db";
import { CreateJournalEntryBody, DeleteJournalEntryParams } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { desc, eq } from "drizzle-orm";
import { differenceInDays, parseISO } from "date-fns";

const router = Router();

router.get("/journal", async (req, res) => {
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

  const recentLog = await db.select().from(dailyLogsTable).orderBy(desc(dailyLogsTable.date)).limit(1);
  const recentCycle = await db.select().from(cyclesTable).orderBy(desc(cyclesTable.startDate)).limit(1);

  let cycleContext = "";
  if (recentCycle.length > 0) {
    const day = differenceInDays(new Date(), parseISO(recentCycle[0].startDate)) + 1;
    let phase = day <= 5 ? "menstrual" : day <= 13 ? "follicular" : day <= 16 ? "ovulation" : "two-week wait";
    cycleContext = `She is on cycle day ${day} (${phase} phase).`;
  }
  const logContext = recentLog.length > 0
    ? `Recent data: mood ${recentLog[0].mood ?? "not logged"}, energy ${recentLog[0].energyLevel ?? "??"}/10, symptoms: ${(recentLog[0].symptoms as string[]).join(", ") || "none"}.`
    : "";

  const prompt = `You are a warm, empathetic fertility companion. Someone has written a private journal entry and is looking for a gentle, compassionate response — not advice, not solutions. Just acknowledgment, warmth, and a little science-backed reassurance if relevant.

${cycleContext} ${logContext}

Journal entry:
"${content}"

Respond with warmth and understanding. 2-3 sentences. Acknowledge what they shared. Do not be clinical. Do not give a list. Do not be toxic-positive ("Everything will work out!"). Be real, warm, and human.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const aiResponse = completion.choices[0]?.message?.content ?? null;

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
