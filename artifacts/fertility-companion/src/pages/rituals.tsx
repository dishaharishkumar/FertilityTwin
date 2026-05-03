import { useState, useEffect } from "react";
import { useGetCurrentCycle } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";

const RITUALS: Record<string, { category: string; items: string[] }[]> = {
  menstrual: [
    {
      category: "Body Care",
      items: [
        "Apply a warm compress or heating pad to your lower belly",
        "Take a magnesium supplement or eat magnesium-rich food (almonds, dark chocolate)",
        "Eat iron-rich food today (lentils, spinach, red meat)",
        "Drink 2–3 cups of herbal tea (raspberry leaf or ginger)",
        "Take a warm bath or shower",
      ],
    },
    {
      category: "Movement",
      items: [
        "Gentle yoga or stretching (avoid inversions if uncomfortable)",
        "A slow 20-minute walk, or rest completely — both are valid",
      ],
    },
    {
      category: "Mind & Soul",
      items: [
        "Journal for 5 minutes about what you're ready to release this cycle",
        "Say no to one thing that feels like too much today",
        "Spend 10 minutes in quiet — no phone, no task",
      ],
    },
  ],
  follicular: [
    {
      category: "Body Care",
      items: [
        "Take your prenatal vitamin or folate supplement",
        "Eat a protein-rich breakfast to support follicular development",
        "Add leafy greens (spinach, kale) to a meal today",
        "Hydrate well — aim for 2L of water",
      ],
    },
    {
      category: "Movement",
      items: [
        "Try something energizing — a run, dance class, or strength session",
        "Go outside for at least 20 minutes of natural light",
      ],
    },
    {
      category: "Mind & Soul",
      items: [
        "Write down one intention for this cycle — what do you want to tend?",
        "Reach out to one person who nourishes you",
        "Learn something new or start a project you've been putting off",
      ],
    },
  ],
  ovulation: [
    {
      category: "Body Care",
      items: [
        "Check and record your cervical mucus",
        "Log your BBT (if tracking)",
        "Stay well hydrated — cervical mucus production needs fluids",
        "Eat antioxidant-rich foods (berries, walnuts, colourful vegetables)",
      ],
    },
    {
      category: "Movement",
      items: [
        "Do your favourite form of movement — energy is at its peak",
        "Spend time outside — sunlight supports hormonal balance",
      ],
    },
    {
      category: "Mind & Soul",
      items: [
        "Connect with your partner or someone you love today",
        "Notice and write down one thing you feel genuinely confident about",
        "Protect your sleep tonight — 7–9 hours supports luteal transition",
      ],
    },
  ],
  tww: [
    {
      category: "Body Care",
      items: [
        "Take your prenatal vitamin or folate supplement",
        "Eat warming, nourishing foods (soups, roasted vegetables, eggs)",
        "Avoid intense exercise — swap for yoga, walking, or swimming",
        "Log your BBT — a sustained high temp is a positive sign",
        "Limit alcohol and caffeine (swap to herbal tea or decaf)",
      ],
    },
    {
      category: "Movement",
      items: [
        "A gentle 20–30 minute walk",
        "Yin yoga or a simple stretching routine",
      ],
    },
    {
      category: "Mind & Soul",
      items: [
        "Avoid symptom-spotting apps or excessive Googling today",
        "Do one thing that absorbs your attention completely",
        "Write about what you're feeling — without trying to interpret it",
        "Tell yourself: whatever happens, you have shown up. That matters.",
      ],
    },
  ],
  default: [
    {
      category: "Daily Care",
      items: [
        "Take your prenatal vitamin",
        "Drink 2L of water",
        "Eat at least one vegetable-rich meal",
        "Get 7–9 hours of sleep tonight",
        "Spend 5 minutes in quiet",
      ],
    },
    {
      category: "Movement",
      items: [
        "Move your body gently for at least 20 minutes",
        "Go outside at some point today",
      ],
    },
    {
      category: "Mind",
      items: [
        "Check in with yourself: how are you really feeling?",
        "Do one kind thing for yourself today",
      ],
    },
  ],
};

const PHASE_NAMES: Record<string, string> = {
  menstrual: "Menstrual Phase",
  follicular: "Follicular Phase",
  ovulation: "Ovulation",
  tww: "Two-Week Wait",
};

const PHASE_INTROS: Record<string, string> = {
  menstrual: "Rest and renewal are the work today. These rituals are invitations, not obligations.",
  follicular: "Your energy is rising. These rituals support the building phase your body is entering.",
  ovulation: "Peak vitality. Tend your body with care during your most fertile window.",
  tww: "Gentle, nourishing, and grounding. This is the time to tend, not push.",
  default: "Start your cycle tracking to see phase-specific rituals here.",
};

function getPhaseKey(phase: string): string {
  if (phase === "menstrual") return "menstrual";
  if (phase === "follicular") return "follicular";
  if (phase === "ovulation") return "ovulation";
  if (phase === "tww") return "tww";
  return "default";
}

export default function RitualsPage() {
  const { data: cycleData } = useGetCurrentCycle();
  const today = format(new Date(), "yyyy-MM-dd");
  const storageKey = `bloom-rituals-${today}`;

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(checked));
  }, [checked, storageKey]);

  const phaseKey = cycleData ? getPhaseKey(cycleData.phase) : "default";
  const rituals = RITUALS[phaseKey] ?? RITUALS.default;
  const allItems = rituals.flatMap(r => r.items);
  const completedCount = allItems.filter(item => checked[item]).length;
  const progress = Math.round((completedCount / allItems.length) * 100);

  const toggle = (item: string) => {
    setChecked(prev => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={12} /> Back
        </Link>
        <h1 className="text-[1.85rem] text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Daily Rituals
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cycleData ? `${PHASE_NAMES[phaseKey] ?? phaseKey} · Day ${cycleData.cycleDay}` : "Your phase-specific care list"}
        </p>
      </div>

      {/* Phase intro */}
      <div
        className="rounded-2xl border border-primary/20 px-5 py-4"
        style={{ background: "linear-gradient(135deg, hsl(345 48% 97%) 0%, hsl(280 20% 97%) 100%)" }}
      >
        <p className="text-sm text-muted-foreground leading-relaxed italic" style={{ fontFamily: "var(--app-font-serif)" }}>
          "{PHASE_INTROS[phaseKey]}"
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "hsl(345,48%,56%)" }}
          />
        </div>
        <span className="label-caps whitespace-nowrap">{completedCount}/{allItems.length} done</span>
      </div>

      {/* Categories */}
      <div className="space-y-5">
        {rituals.map((category) => (
          <div key={category.category}>
            <p className="label-caps mb-2">{category.category}</p>
            <div className="space-y-2">
              {category.items.map((item) => (
                <button
                  key={item}
                  onClick={() => toggle(item)}
                  className="w-full flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left hover:bg-muted/30 transition-all group"
                  style={{ boxShadow: "var(--shadow-xs)" }}
                >
                  {checked[item] ? (
                    <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={18} className="text-muted-foreground group-hover:text-primary/50 shrink-0 mt-0.5 transition-colors" />
                  )}
                  <span
                    className={`text-sm leading-relaxed transition-colors ${checked[item] ? "text-muted-foreground line-through" : "text-foreground"}`}
                  >
                    {item}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {completedCount === allItems.length && allItems.length > 0 && (
        <div
          className="rounded-2xl border border-primary/20 px-5 py-5 text-center"
          style={{ background: "linear-gradient(135deg, hsl(345 48% 97%) 0%, hsl(280 20% 97%) 100%)" }}
        >
          <p className="text-base text-foreground" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
            ✦ All done today.
          </p>
          <p className="text-sm text-muted-foreground mt-1">Every act of care is a gift to your future self.</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">Your checklist resets each day. These are invitations, not rules.</p>
    </div>
  );
}
