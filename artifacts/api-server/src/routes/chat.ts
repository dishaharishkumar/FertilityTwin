import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages, dailyLogsTable, cyclesTable } from "@workspace/db";
import { SendChatMessageBody, GetChatHistoryQueryParams } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { desc, eq, asc } from "drizzle-orm";
import { differenceInDays, parseISO } from "date-fns";

const router = Router();

async function getOrCreateConversation(): Promise<number> {
  const existing = await db.select().from(conversations).limit(1);
  if (existing.length > 0) return existing[0].id;
  const inserted = await db.insert(conversations).values({ title: "My Bloom Chat" }).returning();
  return inserted[0].id;
}

async function buildSystemPrompt(): Promise<string> {
  const recentLogs = await db.select().from(dailyLogsTable).orderBy(desc(dailyLogsTable.date)).limit(3);
  const recentCycles = await db.select().from(cyclesTable).orderBy(desc(cyclesTable.startDate)).limit(1);

  let context = "You have no logged data yet for this user.";
  if (recentLogs.length > 0) {
    const log = recentLogs[0];
    let cycleDay: number | null = null;
    let phase: string | null = null;
    if (recentCycles.length > 0) {
      cycleDay = differenceInDays(new Date(), parseISO(recentCycles[0].startDate)) + 1;
      if (cycleDay <= 5) phase = "menstrual";
      else if (cycleDay <= 13) phase = "follicular";
      else if (cycleDay <= 16) phase = "ovulation";
      else phase = "two-week wait (luteal/TWW)";
    }
    context = `User's most recent data:
- Cycle day: ${cycleDay ?? "unknown"}, Phase: ${phase ?? "unknown"}
- BBT: ${log.bbt ?? "not logged"}°C
- Cervical mucus: ${log.cervicalMucus ?? "not logged"}
- Mood: ${log.mood ?? "not logged"}, Energy: ${log.energyLevel ?? "??"}/10, Sleep: ${log.sleepHours ?? "??"}h, Stress: ${log.stressLevel ?? "??"}/10
- Symptoms: ${(log.symptoms as string[]).join(", ") || "none"}
- Supplements taken: ${(log.supplements as string[]).join(", ") || "none"}
- Notes: ${log.notes ?? "none"}`;
  }

  return `You are Bloom, a warm and deeply knowledgeable AI fertility companion. You are like a best friend who happens to understand hormones, cycles, and the emotional complexity of a fertility journey.

${context}

Your principles:
1. You NEVER diagnose or replace medical care. If something sounds urgent, gently suggest speaking to a doctor.
2. You combat over-Googling by grounding users in their actual data, not hypotheticals.
3. You speak to loneliness — fertility is isolating. Acknowledge that directly when you sense it.
4. You give PERSONALIZED guidance based on the user's data above, not generic advice.
5. You are calm, grounded, science-based, and warm. Never toxic-positive. Never dismissive.
6. When asked "what is happening in my body?", you explain their current phase and symptoms in plain, compassionate language.
7. Keep responses concise — 2-4 paragraphs max. Use plain language.`;
}

router.get("/chat/history", async (req, res) => {
  const parsed = GetChatHistoryQueryParams.safeParse(req.query);
  const limit = parsed.success ? parsed.data.limit : 50;

  const convId = await getOrCreateConversation();
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, convId))
    .orderBy(asc(messages.createdAt))
    .limit(limit);

  res.json(history);
});

router.post("/chat/send", async (req, res) => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message } = parsed.data;
  const convId = await getOrCreateConversation();

  const userMsg = await db
    .insert(messages)
    .values({ conversationId: convId, role: "user", content: message })
    .returning();

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, convId))
    .orderBy(asc(messages.createdAt))
    .limit(20);

  const systemPrompt = await buildSystemPrompt();

  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 400,
    messages: [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
  });

  const aiContent = completion.choices[0]?.message?.content ?? "I'm here with you. Could you say more about what you're experiencing?";

  const aiMsg = await db
    .insert(messages)
    .values({ conversationId: convId, role: "assistant", content: aiContent })
    .returning();

  res.json({ userMessage: userMsg[0], assistantMessage: aiMsg[0] });
});

export default router;
