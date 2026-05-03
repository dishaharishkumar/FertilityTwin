import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { differenceInDays, parseISO } from "date-fns";
import { Salad, AlertCircle, Pill, Flame } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Cycle { id: number; startDate: string }

const PHASES = [
  {
    key: "menstrual",
    label: "Menstrual",
    days: "Days 1–5",
    color: "#f43f5e",
    bg: "bg-rose-50",
    border: "border-rose-200",
    emoji: "🌑",
    tagline: "Replenish & restore",
    why: "Estrogen and progesterone drop. Iron, Omega-3s and magnesium help manage cramps, fatigue, and mood.",
    eat: [
      { food: "Spinach & lentils", reason: "Replace iron lost during bleeding" },
      { food: "Salmon & walnuts", reason: "Omega-3s reduce prostaglandins that cause cramps" },
      { food: "Ginger tea", reason: "Natural anti-inflammatory, eases nausea" },
      { food: "Dark chocolate (70%+)", reason: "Magnesium for cramps + mood boost" },
      { food: "Raspberries & blueberries", reason: "Antioxidants fight inflammation" },
      { food: "Pumpkin seeds", reason: "Zinc and magnesium, supports hormone reset" },
    ],
    avoid: ["Alcohol (worsens cramps & dehydration)", "Salty foods (bloating)", "Caffeine (increases cramp severity)", "Refined sugar (spikes then crashes)"],
    nutrients: [
      { name: "Iron", why: "Replenishes what's lost" },
      { name: "Omega-3", why: "Reduces prostaglandins" },
      { name: "Magnesium", why: "Eases muscle cramps" },
      { name: "Vitamin C", why: "Boosts iron absorption" },
    ],
    supplements: ["Iron (with Vitamin C)", "Magnesium glycinate 300mg", "Fish oil 1–2g", "Vitamin D"],
  },
  {
    key: "follicular",
    label: "Follicular",
    days: "Days 6–13",
    color: "#f59e0b",
    bg: "bg-amber-50",
    border: "border-amber-200",
    emoji: "🌒",
    tagline: "Build & energise",
    why: "Estrogen rises, energy increases, gut bacteria shift. Fermented foods and fresh vegetables support the follicular surge.",
    eat: [
      { food: "Kimchi, kefir & yogurt", reason: "Probiotic bacteria support estrogen metabolism" },
      { food: "Flaxseed & pumpkin seeds", reason: "Phytoestrogens gently support rising estrogen" },
      { food: "Eggs & lean chicken", reason: "Protein for follicle development" },
      { food: "Broccoli sprouts", reason: "Sulforaphane detoxifies excess estrogen" },
      { food: "Avocado", reason: "Healthy fats support hormone production" },
      { food: "Quinoa & oats", reason: "B vitamins for energy and follicle growth" },
    ],
    avoid: ["Excessive alcohol (disrupts estrogen metabolism)", "Ultra-processed foods", "High-glycaemic carbs in isolation"],
    nutrients: [
      { name: "B vitamins", why: "Energy metabolism and follicle health" },
      { name: "Zinc", why: "Supports follicle growth" },
      { name: "Probiotics", why: "Oestrobolome (gut–estrogen axis)" },
      { name: "Vitamin E", why: "Antioxidant for developing eggs" },
    ],
    supplements: ["B-complex", "Zinc 15–25mg", "Probiotic", "Vitamin E 400IU"],
  },
  {
    key: "ovulation",
    label: "Ovulation",
    days: "Days 14–16",
    color: "#10b981",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    emoji: "🌕",
    tagline: "Peak & protect",
    why: "LH surges, testosterone peaks. Antioxidants protect the egg; fibre supports the estrogen peak; zinc fuels the LH surge.",
    eat: [
      { food: "Oysters & pumpkin seeds", reason: "Highest zinc sources — directly supports LH surge" },
      { food: "Tomatoes & red peppers", reason: "Lycopene is a powerful egg-protective antioxidant" },
      { food: "Asparagus", reason: "Folate supports DNA integrity of the egg" },
      { food: "Wild salmon", reason: "DHA supports egg membrane quality" },
      { food: "Berries of all kinds", reason: "Antioxidants neutralise free radicals near ovulation" },
      { food: "Leafy greens", reason: "Folate and fibre to process the estrogen peak" },
    ],
    avoid: ["Trans fats (impair ovulation)", "Alcohol", "Excessive soy during the surge window"],
    nutrients: [
      { name: "Zinc", why: "LH surge and egg release" },
      { name: "Antioxidants", why: "Protect egg quality" },
      { name: "Folate", why: "DNA health of the egg" },
      { name: "DHA", why: "Egg membrane integrity" },
    ],
    supplements: ["CoQ10 200–600mg", "Folate 400mcg", "Vitamin C 500mg", "Zinc 25mg"],
  },
  {
    key: "luteal",
    label: "Luteal",
    days: "Days 17–28",
    color: "#8b5cf6",
    bg: "bg-violet-50",
    border: "border-violet-200",
    emoji: "🌘",
    tagline: "Soothe & stabilise",
    why: "Progesterone rises, metabolism increases by 100–300 kcal/day. Magnesium, B6 and fibre combat PMS symptoms and support the corpus luteum.",
    eat: [
      { food: "Sweet potato & oats", reason: "Complex carbs stabilise serotonin and reduce cravings" },
      { food: "Broccoli, kale & Brussels sprouts", reason: "Cruciferous veg clear excess estrogen via the liver" },
      { food: "Almonds & dark chocolate", reason: "Magnesium to ease PMS, cramps, and sleep disruption" },
      { food: "Turkey & chickpeas", reason: "Tryptophan for serotonin production" },
      { food: "Bananas", reason: "B6 directly supports progesterone production" },
      { food: "Chamomile & lemon balm tea", reason: "Reduces cortisol and improves sleep quality" },
    ],
    avoid: ["Salt (worsens bloating & water retention)", "Caffeine (heightens anxiety and breast tenderness)", "Alcohol (crashes progesterone)", "Refined sugar (exacerbates mood swings)"],
    nutrients: [
      { name: "Magnesium", why: "PMS, cramps, sleep — the luteal workhorse" },
      { name: "Vitamin B6", why: "Directly supports progesterone" },
      { name: "Calcium", why: "Reduces PMS severity by 50% in studies" },
      { name: "Fibre", why: "Clears estrogen via the gut" },
    ],
    supplements: ["Magnesium glycinate 300–400mg", "Vitamin B6 50mg", "Calcium 500mg", "Evening primrose oil 1g"],
  },
];

function phasefromDay(day: number) {
  if (day <= 5) return "menstrual";
  if (day <= 13) return "follicular";
  if (day <= 16) return "ovulation";
  return "luteal";
}

export default function NutritionGuidePage() {
  const [currentPhase, setCurrentPhase] = useState<string>("menstrual");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/cycles`)
      .then((r) => r.json())
      .then((cycles: Cycle[]) => {
        if (cycles.length > 0) {
          const day = differenceInDays(new Date(), parseISO(cycles[0].startDate)) + 1;
          setCurrentPhase(phasefromDay(Math.max(1, day)));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Phase Nutrition Guide
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          What to eat — and why — at every stage of your cycle. Backed by nutritional science, not trends.
        </p>
      </div>

      {loaded && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm bg-primary/5 border border-primary/20">
          <Flame size={14} className="text-primary flex-shrink-0" />
          <span className="text-muted-foreground">
            Your current phase: <strong className="text-foreground">{PHASES.find(p => p.key === currentPhase)?.label}</strong> — the tab below is pre-selected for you.
          </span>
        </div>
      )}

      <Tabs defaultValue={currentPhase} value={currentPhase} onValueChange={setCurrentPhase}>
        <TabsList className="w-full grid grid-cols-4 h-auto p-1">
          {PHASES.map((p) => (
            <TabsTrigger key={p.key} value={p.key} className="flex flex-col gap-0.5 py-2 text-[11px] leading-tight">
              <span>{p.emoji}</span>
              <span>{p.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {PHASES.map((phase) => (
          <TabsContent key={phase.key} value={phase.key} className="space-y-4 mt-4">
            <div className={`rounded-xl p-4 ${phase.bg} border ${phase.border}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs label-caps" style={{ color: phase.color }}>{phase.days}</span>
                <span className="text-xs text-muted-foreground italic">{phase.tagline}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{phase.why}</p>
            </div>

            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Salad size={15} style={{ color: phase.color }} />
                <h2 className="text-sm font-semibold">Eat more of</h2>
              </div>
              <div className="space-y-2">
                {phase.eat.map((item) => (
                  <div key={item.food} className="flex items-start gap-3">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: phase.color, marginTop: 6 }} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.food}</p>
                      <p className="text-xs text-muted-foreground">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold">Limit or avoid</h2>
              </div>
              <ul className="space-y-1.5">
                {phase.avoid.map((a) => (
                  <li key={a} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-rose-400 flex-shrink-0">✕</span>
                    {a}
                  </li>
                ))}
              </ul>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 space-y-2">
                <h2 className="text-xs label-caps">Key nutrients</h2>
                {phase.nutrients.map((n) => (
                  <div key={n.name}>
                    <p className="text-sm font-medium" style={{ color: phase.color }}>{n.name}</p>
                    <p className="text-xs text-muted-foreground">{n.why}</p>
                  </div>
                ))}
              </Card>

              <Card className="p-4 space-y-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <Pill size={13} style={{ color: phase.color }} />
                  <h2 className="text-xs label-caps">Supplements</h2>
                </div>
                {phase.supplements.map((s) => (
                  <p key={s} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span style={{ color: phase.color }}>•</span>{s}
                  </p>
                ))}
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <p className="text-[11px] text-muted-foreground text-center pb-2">
        This is general nutritional science education. Consult a dietitian for personal medical advice.
      </p>
    </div>
  );
}
