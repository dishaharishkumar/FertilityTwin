import { Router } from "express";
import { db } from "@workspace/db";
import { insightsTable, dailyLogsTable, cyclesTable } from "@workspace/db";
import { GenerateInsightBody, GetInsightsQueryParams } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { desc, eq } from "drizzle-orm";
import { differenceInDays, parseISO } from "date-fns";

const router = Router();

function detectPhase(cycleDay: number): string {
  if (cycleDay <= 5) return "menstrual";
  if (cycleDay <= 13) return "follicular";
  if (cycleDay <= 16) return "ovulation";
  return "tww";
}

function buildPrompt(insightType: string, log: any, cycleDay: number | null, phase: string | null, context?: string): string {
  const baseContext = log
    ? `Today is cycle day ${cycleDay ?? "unknown"} (${phase ?? "unknown phase"}).
BBT: ${log.bbt ?? "not logged"}°C
Cervical mucus: ${log.cervicalMucus ?? "not logged"}
Mood: ${log.mood ?? "not logged"}
Energy level: ${log.energyLevel ?? "not logged"}/10
Sleep: ${log.sleepHours ?? "not logged"} hours
Stress level: ${log.stressLevel ?? "not logged"}/10
Symptoms: ${(log.symptoms as string[]).join(", ") || "none"}
Supplements: ${(log.supplements as string[]).join(", ") || "none"}
Notes: ${log.notes ?? "none"}`
    : `No daily log for today. Cycle day: ${cycleDay ?? "unknown"}.`;

  const userContext = context ? `\nAdditional context: ${context}` : "";

  const systemVoice = `You are a warm, grounded, science-based fertility companion. You speak with calm confidence. 
You never create anxiety. You are empathetic, not clinical. You use plain language. No medical jargon unless you explain it simply.
Keep responses to 2-4 short paragraphs. Never be toxic-positive. Acknowledge real feelings.`;

  const prompts: Record<string, string> = {
    daily: `${systemVoice}\n\nGiven this fertility data:\n${baseContext}${userContext}\n\nProvide a warm, personalized daily insight. What might be happening hormonally? What should they focus on today? What gentle action can they take?`,

    tww_support: `${systemVoice}\n\nThis person is in the two-week wait (post-ovulation phase).\n${baseContext}${userContext}\n\nProvide gentle TWW support. Acknowledge the emotional weight of this phase. Give a calm, science-based explanation of what the body might be doing. Offer a gentle "don't symptom-spot" nudge without dismissing their feelings. Suggest a calming activity.`,

    body_signal: `${systemVoice}\n\nThis person wants to understand their body signals:\n${baseContext}${userContext}\n\nExplain what these symptoms could mean in simple, calm terms. Give context for whether to rest, act, or simply observe. Avoid creating alarm.`,

    energy: `${systemVoice}\n\nBased on this data:\n${baseContext}${userContext}\n\nExplain their Energy for Conception score in simple terms. What factors are affecting their fertility readiness today? Give 1-2 concrete, achievable suggestions to improve their score.`,

    boundary: `${systemVoice}\n\nThis person needs help protecting their energy and setting boundaries:\n${baseContext}${userContext}\n\nHelp them think about protecting their fertility window. Suggest a kind, gentle script for communicating boundaries with loved ones or managing stress. Remind them this is an act of love, not selfishness.`,
  };

  return prompts[insightType] ?? prompts.daily;
}

router.post("/insights/generate", async (req, res) => {
  const parsed = GenerateInsightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { logId, context, insightType } = parsed.data;

  let log = null;
  let cycleDay: number | null = null;
  let phase: string | null = null;

  if (logId) {
    const logs = await db.select().from(dailyLogsTable).where(eq(dailyLogsTable.id, logId));
    log = logs[0] ?? null;
  } else {
    const todayLogs = await db.select().from(dailyLogsTable).orderBy(desc(dailyLogsTable.date)).limit(1);
    log = todayLogs[0] ?? null;
  }

  const cycles = await db.select().from(cyclesTable).orderBy(desc(cyclesTable.startDate)).limit(1);
  if (cycles.length > 0) {
    const startDate = parseISO(cycles[0].startDate);
    cycleDay = differenceInDays(new Date(), startDate) + 1;
    phase = detectPhase(cycleDay);
  }

  const prompt = buildPrompt(insightType, log, cycleDay, phase, context ?? undefined);

  const completion = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const insightText = completion.choices[0]?.message?.content ?? "Unable to generate insight at this time.";
  const lines = insightText.split("\n").filter(Boolean);
  const recommendation = lines.length > 1 ? lines[lines.length - 1] : null;

  const inserted = await db
    .insert(insightsTable)
    .values({
      logId: logId ?? null,
      insightType,
      insight: insightText,
      recommendation,
    })
    .returning();

  res.json(inserted[0]);
});

router.get("/insights", async (req, res) => {
  const parsed = GetInsightsQueryParams.safeParse(req.query);
  const limit = parsed.success ? parsed.data.limit : 10;

  const insights = await db
    .select()
    .from(insightsTable)
    .orderBy(desc(insightsTable.createdAt))
    .limit(limit ?? 10);

  res.json(insights);
});

export default router;
