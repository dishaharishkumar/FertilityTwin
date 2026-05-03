import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages, dailyLogsTable, cyclesTable } from "@workspace/db";
import { SendChatMessageBody, GetChatHistoryQueryParams } from "@workspace/api-zod";
import { desc, eq, asc } from "drizzle-orm";
import { differenceInDays, parseISO } from "date-fns";

const router = Router();

async function getOrCreateConversation(): Promise<number> {
  const existing = await db.select().from(conversations).limit(1);
  if (existing.length > 0) return existing[0].id;
  const inserted = await db.insert(conversations).values({ title: "My Bloom Chat" }).returning();
  return inserted[0].id;
}

function getPhaseLabel(cycleDay: number) {
  if (cycleDay <= 5) return "menstrual";
  if (cycleDay <= 13) return "follicular";
  if (cycleDay <= 16) return "ovulation";
  return "two-week wait";
}

function generateResponse(message: string, cycleDay: number | null, phase: string | null, log: any): string {
  const msg = message.toLowerCase();

  const phaseExplainers: Record<string, string> = {
    menstrual: "You're in your menstrual phase — your body is shedding last cycle's lining. Estrogen and progesterone are at their lowest, which is why rest feels so necessary right now. This is a real biological signal, not weakness. Warmth, iron-rich foods, and gentleness are your best friends today.",
    follicular: "You're in your follicular phase — estrogen is rising beautifully and follicles in your ovaries are maturing. This is often when energy picks up and you feel more like yourself. It's a great time to nourish your body with protein and leafy greens, and to start or return to gentle movement.",
    ovulation: "You're in your ovulation window — your body is at peak fertility right now. LH surge has triggered (or will soon trigger) the release of an egg. This is your most energetic phase. If you're trying to conceive, this is the key time. Cervical mucus that looks like raw egg whites is a positive sign.",
    "two-week wait": "You're in the two-week wait — progesterone is rising to support a potential implantation. This phase can feel emotionally heavy, and that's real. Your body is doing quiet, invisible work. Many TWW symptoms (fatigue, bloating, tender breasts) overlap with both PMS and early pregnancy, so they're genuinely hard to interpret. Being gentle with yourself is the only wise move right now.",
  };

  const twwResponses = [
    "The two-week wait is genuinely one of the hardest parts of a fertility journey. The uncertainty is real, and it's okay to feel all of it. Try to anchor yourself in small, nourishing things today — a warm drink, a short walk, something that doesn't require an outcome.",
    "I hear you. The TWW asks so much of you emotionally. What your body is doing right now — rising progesterone, a thickening uterine lining — is real and meaningful work, even when you can't feel it. You're not just waiting. You're tending.",
    "Symptom-spotting in the TWW is almost impossible to interpret accurately — progesterone causes so many of the same symptoms as early pregnancy. I know that's frustrating to hear. The kindest thing you can do is redirect your attention, not because the feelings aren't valid, but because you deserve a break from the uncertainty.",
  ];

  const tiredResponses = [
    `Fatigue during your ${phase ?? "cycle"} phase is very real and hormonal — not a sign that something is wrong. ${phase === "menstrual" ? "During menstruation, low iron and prostaglandins actively sap your energy." : phase === "two-week wait" ? "Rising progesterone in the TWW is sedating by design — your body is preparing for potential implantation." : "Hormonal shifts affect your cellular energy production."} Rest is not laziness right now. It's biology.`,
    "Your body uses an enormous amount of energy across a cycle. If you're feeling drained, that's worth honoring rather than pushing through. Even 20 minutes of lying down without a screen can help your nervous system reset.",
  ];

  const symptomResponses = [
    `Symptoms during your ${phase ?? "current"} phase often reflect what's happening hormonally. ${phase === "menstrual" ? "Cramping, bloating and lower back ache are caused by prostaglandins — inflammatory compounds that trigger uterine contractions." : phase === "ovulation" ? "Mittelschmerz (a twinge on one side) is a real phenomenon — it's the follicle rupturing during ovulation. Completely normal." : phase === "two-week wait" ? "Breast tenderness, bloating, and fatigue in the TWW can be progesterone — regardless of whether implantation has occurred." : "Many mid-cycle symptoms are tied to estrogen fluctuations."}`,
    "If any symptom feels severe or unusual for you personally, it's always worth mentioning to your doctor. I'll never replace that conversation — but I can help you feel less alone in what you're noticing.",
  ];

  const anxietyResponses = [
    "I hear that you're carrying a lot right now. Fertility journeys can be isolating in a way that's hard to explain to people who haven't lived it. Whatever you're feeling — fear, hope, grief, numbness — it belongs here.",
    "Anxiety on this journey is almost universal, and it makes complete sense. Your nervous system is responding to something deeply uncertain and deeply important. Taking one small grounding action — even just slow breaths or a short walk outside — can interrupt the spiral without dismissing the feeling.",
    "You're not alone in this, even when it feels that way. The emotional weight of trying to conceive is real and valid. Being kind to yourself isn't a luxury — it's actually part of taking care of your body.",
  ];

  const bbtResponses = [
    "BBT (basal body temperature) is most useful when tracked as a pattern over time rather than day-to-day. A sustained rise of 0.2°C or more after your lowest point usually signals that ovulation has occurred. One high reading alone isn't meaningful — look for the shift.",
    "BBT tracking works best taken at the same time every morning before getting up, after at least 3 hours of uninterrupted sleep. Even alcohol, illness, or a restless night can shift your temp. I'd look at the trend over your whole chart, not individual days.",
  ];

  const mucusResponses = [
    "Cervical mucus is one of the most reliable fertility signs. As ovulation approaches, it typically shifts from dry or sticky → creamy → watery → raw egg-white consistency (clear, stretchy). That egg-white mucus is your peak fertile signal. After ovulation, it returns to dry or sticky.",
    "Peak fertile mucus — clear, slippery, stretchy like egg whites — indicates your peak fertility window. Sperm can survive in this environment for up to 5 days, which is why the days leading up to ovulation matter as much as ovulation day itself.",
  ];

  const greetings = [
    `Hello! I'm Bloom, your fertility companion. ${cycleDay ? `You're on cycle day ${cycleDay} — ${phase ?? "tracking along"}.` : "I'm here whenever you need me."} What's on your mind today?`,
    `Hi, I'm here. ${phase ? `You're currently in your ${phase} phase.` : ""} What would you like to talk through?`,
  ];

  const defaultResponses = [
    `That's a thoughtful thing to bring up. ${cycleDay ? `On cycle day ${cycleDay} in your ${phase} phase, ` : ""}every part of this journey matters. Would you like me to explain what's happening hormonally right now, help you interpret a symptom, or just talk through how you're feeling?`,
    "I'm here with you. Could you tell me a bit more about what you're experiencing? I can help with understanding your cycle phases, symptoms, BBT patterns, or just listen.",
    "Thank you for sharing that with me. Fertility journeys have so many layers — the physical, the emotional, the waiting. What would feel most helpful to explore right now?",
  ];

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  if (msg.match(/\b(hi|hello|hey|good morning|good evening)\b/)) return pick(greetings);
  if (msg.match(/\b(tww|two.?week|two week|waiting|wait)\b/)) return pick(twwResponses);
  if (msg.match(/\b(tired|exhausted|fatigue|drained|sleep|sleepy|no energy)\b/)) return pick(tiredResponses);
  if (msg.match(/\b(cramp|pain|bloat|symptom|ache|tender|sore|nausea|headache)\b/)) return pick(symptomResponses);
  if (msg.match(/\b(anxious|anxiety|worried|scared|fear|stress|overwhelm|panic)\b/)) return pick(anxietyResponses);
  if (msg.match(/\b(bbt|temperature|temp|basal)\b/)) return pick(bbtResponses);
  if (msg.match(/\b(mucus|cervical|discharge|cm|egg white|ewcm)\b/)) return pick(mucusResponses);
  if (msg.match(/\b(phase|what.?happening|what.?going on|my body|body doing)\b/) && phase) {
    return phaseExplainers[phase] ?? pick(defaultResponses);
  }
  if (msg.match(/\b(menstrual|period|bleed|flow)\b/)) return phaseExplainers["menstrual"];
  if (msg.match(/\b(follicular|rising|energy|new cycle)\b/)) return phaseExplainers["follicular"];
  if (msg.match(/\b(ovulat|fertile|lh|surge|egg)\b/)) return phaseExplainers["ovulation"];

  if (phase) {
    return `${pick(defaultResponses)}\n\nFor reference: you're on cycle day ${cycleDay ?? "?"} in your ${phase} phase. ${phaseExplainers[phase] ?? ""}`;
  }

  return pick(defaultResponses);
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

  const recentLog = await db.select().from(dailyLogsTable).orderBy(desc(dailyLogsTable.date)).limit(1);
  const recentCycle = await db.select().from(cyclesTable).orderBy(desc(cyclesTable.startDate)).limit(1);

  let cycleDay: number | null = null;
  let phase: string | null = null;
  const log = recentLog[0] ?? null;

  if (recentCycle.length > 0) {
    cycleDay = differenceInDays(new Date(), parseISO(recentCycle[0].startDate)) + 1;
    phase = getPhaseLabel(cycleDay);
  }

  const aiContent = generateResponse(message, cycleDay, phase, log);

  const aiMsg = await db
    .insert(messages)
    .values({ conversationId: convId, role: "assistant", content: aiContent })
    .returning();

  res.json({ userMessage: userMsg[0], assistantMessage: aiMsg[0] });
});

export default router;
