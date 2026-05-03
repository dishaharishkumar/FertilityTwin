import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { differenceInDays, parseISO } from "date-fns";
import { Zap, Activity, Timer, TrendingUp } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Cycle { id: number; startDate: string }

const PHASES = [
  {
    key: "menstrual",
    label: "Menstrual",
    days: "Days 1–5",
    emoji: "🌑",
    color: "#f43f5e",
    bg: "bg-rose-50",
    border: "border-rose-200",
    intensity: "Low",
    intensityColor: "text-emerald-600",
    intensityBg: "bg-emerald-50",
    tagline: "Rest is productive",
    why: "Estrogen and progesterone are at their lowest. Your body is working hard already — overtraining now increases cortisol and worsens cramps. Gentle movement boosts endorphins without taxing your system.",
    best: [
      { name: "Yin or restorative yoga", duration: "20–40 min", benefit: "Targets pelvic floor, eases cramps through stretching" },
      { name: "Gentle walking", duration: "15–30 min", benefit: "Improves circulation and reduces bloating without stress" },
      { name: "Pilates (low impact)", duration: "20–30 min", benefit: "Core stability without raising cortisol" },
      { name: "Foam rolling", duration: "10–20 min", benefit: "Releases fascia tension in hips and lower back" },
      { name: "Swimming (easy pace)", duration: "20–30 min", benefit: "Warm water relaxes cramping muscles" },
    ],
    avoid: ["HIIT or intense cardio", "Heavy strength training", "High-impact classes", "Competitive sport"],
    tip: "If cramps are severe on days 1–2, rest is a valid choice. A 10-minute walk is enough.",
    energyForecast: [2, 2, 3, 3, 4],
  },
  {
    key: "follicular",
    label: "Follicular",
    days: "Days 6–13",
    emoji: "🌒",
    color: "#f59e0b",
    bg: "bg-amber-50",
    border: "border-amber-200",
    intensity: "High",
    intensityColor: "text-rose-600",
    intensityBg: "bg-rose-50",
    tagline: "Your strongest week",
    why: "Rising estrogen increases muscle strength, pain tolerance, and aerobic capacity. Neuromuscular coordination peaks. This is your best window for learning new skills, setting personal records, and high-output training.",
    best: [
      { name: "HIIT intervals", duration: "30–45 min", benefit: "Estrogen-driven endurance lets you push harder and recover faster" },
      { name: "Heavy strength training", duration: "45–60 min", benefit: "Muscle-protein synthesis is highest — gains are maximised here" },
      { name: "Running or cycling (tempo)", duration: "30–50 min", benefit: "Aerobic capacity is elevated, lactate threshold is higher" },
      { name: "Dance or group classes", duration: "45–60 min", benefit: "Coordination improves with rising estrogen — great for skill work" },
      { name: "Rock climbing or sport", duration: "60+ min", benefit: "Grip strength and reflex speed are measurably better" },
    ],
    avoid: ["Avoiding the gym — this is your prime window", "Doing only steady-state if goals include strength"],
    tip: "Try a new workout format or push a personal record in days 10–13. Your body is primed for it.",
    energyForecast: [5, 6, 7, 8, 8, 9, 9, 9],
  },
  {
    key: "ovulation",
    label: "Ovulation",
    days: "Days 14–16",
    emoji: "🌕",
    color: "#10b981",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    intensity: "Peak",
    intensityColor: "text-violet-600",
    intensityBg: "bg-violet-50",
    tagline: "Peak power — use it",
    why: "Testosterone surges alongside estrogen peak. Strength, power output, and competitive drive are all at their biological maximum. Ligaments are slightly looser from estrogen — warm up well to avoid injury.",
    best: [
      { name: "Power lifting or Olympic lifts", duration: "45–60 min", benefit: "Testosterone peak = maximum strength output and muscle recruitment" },
      { name: "Sprint intervals", duration: "20–30 min", benefit: "Fast-twitch fibre activation is highest now" },
      { name: "Competitive sport", duration: "60+ min", benefit: "Drive and confidence are hormonally elevated — compete" },
      { name: "CrossFit or group intensity", duration: "45–60 min", benefit: "Social drive peaks — great for team-based hard workouts" },
      { name: "Plyometrics (box jumps, etc.)", duration: "30–45 min", benefit: "Power output is maximal — use it for explosive work" },
    ],
    avoid: ["Skipping warm-up (ligaments are looser)", "Excessive volume without deload plan"],
    tip: "Warm up for 10 minutes before heavy lifting. Estrogen-loosened ligaments increase ACL injury risk if cold.",
    energyForecast: [10, 10, 9],
  },
  {
    key: "luteal",
    label: "Luteal",
    days: "Days 17–28",
    emoji: "🌘",
    color: "#8b5cf6",
    bg: "bg-violet-50",
    border: "border-violet-200",
    intensity: "Moderate",
    intensityColor: "text-amber-600",
    intensityBg: "bg-amber-50",
    tagline: "Work smarter, not harder",
    why: "Progesterone rises and body temperature is 0.3–0.5°C higher. Aerobic performance decreases, recovery is slower, and fatigue arrives sooner. Moderate training keeps cortisol low, which protects progesterone.",
    best: [
      { name: "Moderate strength (60–70% 1RM)", duration: "30–45 min", benefit: "Maintains muscle without taxing recovery systems" },
      { name: "Hiking or brisk walking", duration: "40–60 min", benefit: "Steady-state cardio works with elevated progesterone" },
      { name: "Vinyasa or power yoga", duration: "30–45 min", benefit: "Builds strength and calm simultaneously — helps PMS anxiety" },
      { name: "Swimming (moderate)", duration: "30–45 min", benefit: "Water cools the higher body temperature, improving comfort" },
      { name: "Cycling (easy–moderate)", duration: "30–50 min", benefit: "Low impact, low cortisol — sustainable across the luteal phase" },
    ],
    avoid: ["HIIT (raises cortisol, suppresses progesterone)", "Overtraining (recovery is 20% slower)", "High-volume leg days on pre-menstrual days"],
    tip: "If PMS is hitting hard on days 25–28, swap planned workouts for yoga. The cortisol reduction from gentle movement outweighs any fitness loss.",
    energyForecast: [8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 3],
  },
];

const INTENSITY_ORDER = ["Low", "Moderate", "High", "Peak"];

function IntensityBar({ intensity }: { intensity: string }) {
  const idx = INTENSITY_ORDER.indexOf(intensity) + 1;
  return (
    <div className="flex items-center gap-1.5">
      {INTENSITY_ORDER.map((_, i) => (
        <div
          key={i}
          className="h-2 flex-1 rounded-full"
          style={{ background: i < idx ? "var(--primary)" : "#e2e8f0" }}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{intensity}</span>
    </div>
  );
}

function phaseFromDay(day: number) {
  if (day <= 5) return "menstrual";
  if (day <= 13) return "follicular";
  if (day <= 16) return "ovulation";
  return "luteal";
}

export default function MovementPlannerPage() {
  const [currentPhase, setCurrentPhase] = useState<string>("follicular");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/cycles`)
      .then((r) => r.json())
      .then((cycles: Cycle[]) => {
        if (cycles.length > 0) {
          const day = differenceInDays(new Date(), parseISO(cycles[0].startDate)) + 1;
          setCurrentPhase(phaseFromDay(Math.max(1, day)));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Movement Planner
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Workouts matched to your hormones — train with your cycle, not against it.
        </p>
      </div>

      {loaded && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm bg-primary/5 border border-primary/20">
          <Activity size={14} className="text-primary flex-shrink-0" />
          <span className="text-muted-foreground">
            Your current phase: <strong className="text-foreground">{PHASES.find(p => p.key === currentPhase)?.label}</strong>
            {" "}— intensity recommendation: <strong className="text-foreground">{PHASES.find(p => p.key === currentPhase)?.intensity}</strong>
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
            <div className={`rounded-xl p-4 ${phase.bg} border ${phase.border} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs label-caps" style={{ color: phase.color }}>{phase.days}</span>
                <span className="text-xs text-muted-foreground italic">{phase.tagline}</span>
              </div>
              <IntensityBar intensity={phase.intensity} />
              <p className="text-sm text-muted-foreground leading-relaxed">{phase.why}</p>
            </div>

            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap size={15} style={{ color: phase.color }} />
                <h2 className="text-sm font-semibold">Recommended workouts</h2>
              </div>
              <div className="space-y-3">
                {phase.best.map((w) => (
                  <div key={w.name} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{w.name}</p>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                          <Timer size={11} />{w.duration}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{w.benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-muted-foreground" />
                <h2 className="text-sm font-semibold">Skip or scale down</h2>
              </div>
              <ul className="space-y-1.5">
                {phase.avoid.map((a) => (
                  <li key={a} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-rose-400 flex-shrink-0">↓</span>{a}
                  </li>
                ))}
              </ul>
            </Card>

            <div className={`rounded-xl px-4 py-3 text-sm ${phase.bg} border ${phase.border}`}>
              <span className="font-medium" style={{ color: phase.color }}>Pro tip: </span>
              <span className="text-muted-foreground">{phase.tip}</span>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <p className="text-[11px] text-muted-foreground text-center pb-2">
        Adjust based on how you feel. Hormonal patterns are a guide, not a rule.
      </p>
    </div>
  );
}
