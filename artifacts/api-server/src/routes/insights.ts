import { Router } from "express";
import { db } from "@workspace/db";
import { insightsTable, dailyLogsTable, cyclesTable } from "@workspace/db";
import { GenerateInsightBody, GetInsightsQueryParams } from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";
import { differenceInDays, parseISO } from "date-fns";

const router = Router();

function detectPhase(cycleDay: number): string {
  if (cycleDay <= 5) return "menstrual";
  if (cycleDay <= 13) return "follicular";
  if (cycleDay <= 16) return "ovulation";
  return "tww";
}

const insightLibrary: Record<string, Record<string, string[]>> = {
  daily: {
    menstrual: [
      "Your body is doing profound work right now — shedding and renewing. Prostaglandins are causing contractions, which is why cramping happens. Warmth on your abdomen, magnesium-rich foods (dark chocolate, almonds, leafy greens), and reducing caffeine can genuinely ease symptoms today. Rest is not laziness — it's the biologically correct choice.",
      "Estrogen and progesterone are at their lowest point today. This explains the fatigue, the emotional rawness, and the inward pull. Iron-rich foods like lentils and spinach help replenish what you're losing. A gentle walk (if your energy allows) can ease cramping by releasing endorphins.",
    ],
    follicular: [
      "Estrogen is rising and your follicles are beginning to mature. You may notice a lift in mood and energy over the next few days — this is biology, not coincidence. Your body is preparing for its peak. Protein-rich foods and leafy greens support follicular development. This is a great window for starting something new.",
      "FSH (follicle-stimulating hormone) is at work now, selecting the dominant follicle that will release an egg. Your energy is building. Use this phase to nourish yourself with iron, zinc, and healthy fats — your body is investing in ovulation.",
    ],
    ovulation: [
      "You're at your hormonal peak. LH has surged, and ovulation is occurring (or about to). If you're tracking with BBT, expect a slight dip followed by a rise. Egg-white cervical mucus is a key positive sign. Your mood and libido are often highest now — estrogen and testosterone are both elevated.",
      "This is your most energetically vibrant time of the month. The LH surge triggers the follicle to release an egg, which has a 12–24 hour window of viability. Sperm can survive up to 5 days in fertile mucus, which is why the days leading up to today matter just as much.",
    ],
    tww: [
      "Progesterone is rising now, which can feel sedating — fatigue, breast tenderness, and bloating are all progesterone effects, not necessarily pregnancy signs. This phase is genuinely one of the hardest emotionally. Give yourself permission to feel uncertain. Gentle movement, warmth, and anything that grounds you in the present moment is a good focus.",
      "Your uterine lining is thickening under progesterone's influence. The TWW asks you to hold both hope and uncertainty at once — that is genuinely hard. Many symptoms of early pregnancy and PMS are identical, which is why symptom-spotting is so exhausting. One day at a time is not a cliché — it's the only strategy that works here.",
    ],
  },
  tww_support: {
    tww: [
      "The two-week wait is one of fertility's hardest emotional landscapes. What your body is doing right now — progesterone rising, lining thickening, potentially implantation happening — is invisible but real. The symptoms you're feeling (tender breasts, bloating, fatigue) are largely progesterone-driven regardless of outcome, which makes them genuinely unreadable. That's not a failure of your intuition — it's just biology being ambiguous. Be as gentle as you can with yourself today.",
      "Implantation, if it occurs, typically happens 6–12 days after ovulation. Before that, no symptom can tell you what the outcome will be. The kindest thing you can do in the TWW is redirect your attention — not because your hope doesn't matter, but because you deserve rest from the uncertainty. A short walk, a warm bath, a gentle distraction — these aren't giving up. They're self-care.",
    ],
    menstrual: [
      "If this cycle didn't result in a pregnancy, that grief is real and it belongs. Many cycles need to pass before conception happens — even for people with no fertility challenges. This is a moment to rest, to replenish, and to begin again when you're ready. You are not behind.",
    ],
    follicular: [
      "A new cycle beginning is a genuine fresh start — not just emotionally but biologically. A new cohort of follicles is beginning to develop. This is a good moment to reflect on what you want to prioritize this cycle and to nourish your body as it prepares.",
    ],
    ovulation: [
      "You're heading toward your fertile window. This is a time of possibility. Make sure you're resting well, eating nourishing food, and keeping stress manageable — all of these affect egg quality and hormonal balance. You're doing everything right by paying attention.",
    ],
  },
  body_signal: {
    menstrual: [
      "During menstruation, cramping is caused by prostaglandins — inflammatory compounds that signal uterine contractions. Heavy flow, clots smaller than a quarter, and lower back ache are all within the normal range. If flow is very heavy (soaking through a pad hourly), that's worth mentioning to your doctor. Fatigue and emotional sensitivity are real hormonal effects, not signs that something is wrong.",
    ],
    follicular: [
      "Rising estrogen in the follicular phase can bring clearer skin, better sleep, and more mental sharpness. If you notice bloating or mild breast tenderness, that's estrogen beginning to rise. Clear or white cervical mucus that's slightly sticky is normal now — it will become more slippery as ovulation approaches.",
    ],
    ovulation: [
      "Ovulation signals to watch: a twinge or ache on one side (mittelschmerz), clear egg-white cervical mucus, a slight BBT dip followed by a rise, and heightened libido. Not everyone notices all of these. A positive OPK (ovulation predictor kit) typically means ovulation is 12–36 hours away.",
    ],
    tww: [
      "In the TWW, progesterone causes: breast tenderness, bloating, mild cramping, fatigue, and emotional sensitivity. These symptoms are present in virtually every TWW regardless of whether implantation has occurred, which is why they can't be reliably interpreted as pregnancy signs. Light spotting around 6–10 DPO can occasionally be implantation bleeding — but it can also be nothing. Observe, but try not to analyze.",
    ],
  },
  energy: {
    menstrual: [
      "Your energy is naturally lower now — this is the correct biological response, not a flaw. Iron loss during menstruation can contribute to fatigue. Focus on iron-rich foods (red meat, lentils, spinach with vitamin C for absorption), warmth, and rest. Skip intense workouts today; your body is working hard already.",
    ],
    follicular: [
      "Energy is rising with estrogen. This is your window for more demanding exercise, social commitments, and starting projects. Your insulin sensitivity improves here, so whole grains and complex carbohydrates will sustain you well. Sleep quality is usually better in the follicular phase too.",
    ],
    ovulation: [
      "Peak energy, peak clarity. Testosterone joins estrogen at its monthly high, giving you confidence and drive. Use this window — it's short. If you're exercising, you can go harder now than any other phase. Hydration matters more around ovulation; cervical mucus production increases your fluid needs.",
    ],
    tww: [
      "Progesterone is your dominant hormone now, and it's sedating by design. Your body temperature is slightly elevated, your metabolism is slightly higher, and your immune system is modulating. All of this takes energy. Gentle movement (walking, yoga, swimming) is ideal — not complete rest, but not pushing hard either. Prioritize 7–9 hours of sleep.",
    ],
  },
  boundary: {
    menstrual: [
      "Your menstrual phase is the one time each cycle when your body most loudly requests withdrawal. Saying no to social plans, skipping a commitment, or asking for help isn't weakness — it's respecting a real biological need. A gentle script: \"I'm not feeling well and I need to rest today. I'll be back to normal in a few days.\" You don't owe anyone an explanation beyond that.",
    ],
    follicular: [
      "As energy rises, it's tempting to say yes to everything. Protecting your energy this cycle means being intentional about what you commit to leading up to ovulation. Your fertile window is coming — preserving calm, sleep, and low stress in the lead-up genuinely supports ovulation. Choosing rest over social obligation is an act of care for your fertility journey.",
    ],
    ovulation: [
      "Your peak window deserves protection. If you're trying to conceive, reducing high-stress situations around ovulation can help — cortisol can delay or suppress LH surge in some people. It's okay to simplify your schedule. \"I have some things I need to prioritize this week\" is always enough.",
    ],
    tww: [
      "The TWW is not the time for stress, major decisions, or emotional depletion if you can avoid it. Progesterone already has your nervous system more reactive. Protecting your peace is not indulgent — it's supportive of implantation and your emotional health either way. A gentle script for stepping back: \"I need some quiet time this week. I'll be more available soon.\"",
    ],
  },
};

function buildInsight(insightType: string, phase: string, log: any, cycleDay: number | null): string {
  const library = insightLibrary[insightType] ?? insightLibrary.daily;
  const phaseOptions = library[phase] ?? library["tww"] ?? Object.values(library)[0];
  const base = phaseOptions[Math.floor(Math.random() * phaseOptions.length)];

  const extras: string[] = [];
  if (log) {
    if (log.energyLevel !== null && log.energyLevel <= 3) {
      extras.push("Your logged energy today is low — that tracks with what your cycle phase predicts. Please don't push through it.");
    }
    if (log.stressLevel !== null && log.stressLevel >= 7) {
      extras.push("High stress can affect hormonal balance, particularly around ovulation. Even 10 minutes of slow breathing or a short walk outside can lower cortisol meaningfully.");
    }
    if (log.sleepHours !== null && log.sleepHours < 6) {
      extras.push("Sleep deprivation directly impacts LH, FSH, and progesterone. If possible, prioritize an early night tonight.");
    }
    if (log.mood !== null && ["sad", "anxious", "irritable", "low"].some(m => String(log.mood).toLowerCase().includes(m))) {
      extras.push("Your logged mood today is difficult — that's valid. Emotional weight on this journey is real and it's okay to feel it without trying to fix it.");
    }
  }

  return [base, ...extras].join("\n\n");
}

router.post("/insights/generate", async (req, res) => {
  const parsed = GenerateInsightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { logId, insightType } = parsed.data;

  let log = null;
  let cycleDay: number | null = null;
  let phase = "tww";

  if (logId) {
    const logs = await db.select().from(dailyLogsTable).where(eq(dailyLogsTable.id, logId));
    log = logs[0] ?? null;
  } else {
    const todayLogs = await db.select().from(dailyLogsTable).orderBy(desc(dailyLogsTable.date)).limit(1);
    log = todayLogs[0] ?? null;
  }

  const cycles = await db.select().from(cyclesTable).orderBy(desc(cyclesTable.startDate)).limit(1);
  if (cycles.length > 0) {
    cycleDay = differenceInDays(new Date(), parseISO(cycles[0].startDate)) + 1;
    phase = detectPhase(cycleDay);
  }

  const insightText = buildInsight(insightType, phase, log, cycleDay);
  const lines = insightText.split("\n\n").filter(Boolean);
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
