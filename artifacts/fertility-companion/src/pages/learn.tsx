import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

const ARTICLES = [
  {
    title: "The Menstrual Phase",
    emoji: "🌑",
    color: "hsl(0,60%,60%)",
    summary: "Days 1–5 · Shedding and renewal",
    body: `Your menstrual phase begins on day 1 — the first day of full flow. During this time, estrogen and progesterone drop to their lowest levels, signaling the uterus to shed its lining through a series of contractions triggered by prostaglandins.

This is why cramping happens. It is not a malfunction — it is your uterus doing its job. Iron-rich blood is leaving your body, which is why fatigue, brain fog, and emotional sensitivity are all biologically expected this week.

What supports you now: warmth, iron-rich foods (red meat, lentils, spinach with vitamin C for absorption), magnesium (dark chocolate, almonds), and rest without guilt. Skipping high-intensity exercise isn't weakness — your body is working extremely hard already.

A new cohort of follicles has already begun developing in the background, even while you bleed. Your next cycle is underway before this one ends.`,
  },
  {
    title: "The Follicular Phase",
    emoji: "🌱",
    color: "hsl(140,40%,45%)",
    summary: "Days 6–13 · Rising and building",
    body: `After menstruation ends, FSH (follicle-stimulating hormone) rises and begins stimulating a group of follicles in your ovaries. One will eventually become dominant and release an egg — the others will reabsorb.

As the dominant follicle grows, it produces estrogen. Rising estrogen is responsible for the mood lift, improved energy, clearer skin, and better sleep that many people notice in this phase. This is also when the uterine lining begins to thicken in preparation for possible implantation.

Cervical mucus shifts from dry or absent to sticky/cloudy, then progressively more slippery as ovulation approaches. This progression is one of the most reliable signs of where you are in your cycle.

This phase is highly variable in length — it is the main reason cycle lengths differ from person to person. Stress, illness, travel, or hormonal shifts can all lengthen or shorten it.`,
  },
  {
    title: "Ovulation",
    emoji: "🌸",
    color: "hsl(345,48%,56%)",
    summary: "Days 14–16 · Peak fertility",
    body: `Ovulation is triggered by an LH (luteinizing hormone) surge — a sharp spike that causes the dominant follicle to rupture and release a mature egg. This typically happens 24–36 hours after the LH peak.

The egg is viable for only 12–24 hours after release. However, sperm can survive in fertile-quality cervical mucus for up to 5 days, which is why the days leading up to ovulation matter just as much as ovulation day itself.

Signs of ovulation: egg-white cervical mucus (clear, slippery, stretchy), a positive OPK (ovulation predictor kit), a slight BBT dip followed by a sustained rise of 0.2°C or more, and sometimes mild one-sided pelvic pain (mittelschmerz — the follicle rupturing).

Estrogen peaks just before ovulation. Many people notice a lift in confidence, libido, and energy. Testosterone also rises slightly, adding to this sense of vitality.`,
  },
  {
    title: "The Two-Week Wait (TWW)",
    emoji: "🕊️",
    color: "hsl(280,30%,55%)",
    summary: "Days 17–28 · Waiting and tending",
    body: `After ovulation, the ruptured follicle transforms into the corpus luteum — a temporary gland that produces progesterone. Progesterone is the dominant hormone for the rest of your cycle.

Progesterone has a sedating, warming effect. It raises your basal body temperature slightly (which is how BBT charting confirms ovulation has occurred), makes your body more sensitive to stress, and causes many of the symptoms we associate with the luteal phase: breast tenderness, bloating, fatigue, mood sensitivity, and food cravings.

If fertilization occurs, the resulting embryo travels to the uterus over 5–7 days and attempts to implant in the thickened lining around days 6–10 after ovulation. Implantation triggers the release of hCG, the hormone detected by pregnancy tests. Levels need to double every 48–72 hours to be detectable.

If implantation does not occur, the corpus luteum breaks down, progesterone drops, and menstruation begins — starting the cycle again.

This phase is emotionally among the hardest because symptoms of early pregnancy and PMS are almost identical. Symptom-spotting is genuinely unreliable.`,
  },
  {
    title: "Basal Body Temperature (BBT)",
    emoji: "🌡️",
    color: "hsl(30,70%,55%)",
    summary: "How temperature reveals your cycle",
    body: `Basal body temperature is your body's resting temperature — taken immediately upon waking, before any movement, after at least 3 hours of uninterrupted sleep.

In the follicular phase, BBT is typically lower (97.0–97.7°F / 36.1–36.5°C for most people). After ovulation, progesterone causes a sustained rise of approximately 0.2°C (0.4°F) that lasts until your period begins.

This thermal shift confirms that ovulation has occurred. It doesn't predict when ovulation will happen — only confirm it after the fact.

To track BBT: take your temperature at the same time every morning before getting up, using a basal thermometer that reads to two decimal places. One irregular reading (due to illness, alcohol, poor sleep) doesn't invalidate your chart — just note it and continue.

The "coverline" is a horizontal reference line drawn above the highest BBT in the last 6 days before the thermal shift. Three consecutive temperatures above the coverline confirm ovulation.`,
  },
  {
    title: "Cervical Mucus",
    emoji: "💧",
    color: "hsl(200,50%,50%)",
    summary: "Your body's built-in fertility signal",
    body: `Cervical mucus is produced by the cervix and changes in quantity, texture, and appearance throughout your cycle in direct response to estrogen and progesterone levels.

After menstruation: dry or very little discharge. This is the low-fertility stage.

As estrogen rises: sticky, white or creamy mucus appears — sometimes described as lotion-like. This supports some sperm survival but is not optimal.

Approaching ovulation: mucus becomes more abundant, clearer, and wetter. This is when fertility is increasing.

Peak fertility: egg-white cervical mucus (EWCM) — clear, slippery, stretchy like raw egg whites. You can stretch it between your fingers without it breaking. This mucus provides a channel for sperm to reach the egg and can keep sperm alive for up to 5 days.

After ovulation: progesterone causes mucus to quickly become dry, sticky, or absent again — the corpus luteum closes this fertile window.

Checking your mucus at the same time each day (same method — wiping with tissue, or checking at the cervix) gives the most consistent data.`,
  },
  {
    title: "Estrogen & Progesterone",
    emoji: "⚖️",
    color: "hsl(345,48%,56%)",
    summary: "The two hormones driving your cycle",
    body: `Your menstrual cycle is orchestrated primarily by two hormones: estrogen and progesterone. Understanding what they each do explains almost every symptom and mood shift you experience.

Estrogen rises in the follicular phase and peaks just before ovulation. It's responsible for: thickening the uterine lining, producing fertile cervical mucus, lifting mood and energy, improving skin clarity, sharpening cognition, and boosting libido. High estrogen feels like you're running at full capacity.

Progesterone dominates the luteal phase (after ovulation). It's responsible for: maintaining the uterine lining for potential implantation, raising body temperature, calming and sedating the nervous system (which is why you feel more tired), increasing sensitivity to stress, and causing PMS-like symptoms (bloating, tender breasts, emotional sensitivity).

When progesterone drops at the end of the cycle, the lining sheds and menstruation begins.

FSH (follicle-stimulating hormone) and LH (luteinizing hormone) are the pituitary hormones that direct this whole process — FSH triggers follicle development, LH surge triggers ovulation.`,
  },
  {
    title: "Implantation & Early Pregnancy",
    emoji: "🌿",
    color: "hsl(120,35%,45%)",
    summary: "What happens if fertilization occurs",
    body: `After fertilization (which can happen up to 5 days after intercourse, if sperm survived in fertile mucus), the fertilized egg begins dividing as it travels down the fallopian tube toward the uterus.

This journey takes approximately 5–7 days. Implantation — the embedding of the blastocyst into the uterine lining — typically occurs 6–12 days after ovulation.

Once implanted, the embryo begins producing hCG (human chorionic gonadotropin). This hormone signals the corpus luteum to keep producing progesterone, preventing menstruation from starting.

HCG levels initially double every 48–72 hours. Most home pregnancy tests can detect hCG levels of 20–25 mIU/ml. This is typically possible 10–14 days after ovulation, though some sensitive tests may detect it earlier.

Light spotting around 6–10 DPO is sometimes called implantation bleeding, though it can also be caused by hormonal fluctuations. It cannot be reliably distinguished from the start of a period without a pregnancy test.

Many early pregnancy symptoms — fatigue, breast tenderness, bloating, mild cramping — are identical to late luteal/PMS symptoms because they're caused by the same hormone: progesterone.`,
  },
];

function Article({ article, isOpen, onToggle }: { article: typeof ARTICLES[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className="rounded-2xl border border-border bg-card overflow-hidden transition-all"
      style={{ boxShadow: "var(--shadow-xs)" }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="text-2xl">{article.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
            {article.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{article.summary}</p>
        </div>
        {isOpen ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-border/60">
          <div className="mt-4 space-y-3">
            {article.body.split("\n\n").map((para, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed">{para}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LearnPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={12} /> Back
        </Link>
        <h1 className="text-[1.85rem] text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Cycle Education
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Science-backed, plain-language guides to your cycle.</p>
      </div>

      <div className="space-y-2">
        {ARTICLES.map((article, i) => (
          <Article
            key={i}
            article={article}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center pb-2">
        Fertility Companion is an educational tool. These articles are not medical advice — always talk to your doctor about your specific situation.
      </p>
    </div>
  );
}
