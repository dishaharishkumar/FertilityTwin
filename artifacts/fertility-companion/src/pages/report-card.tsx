import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Award, Moon, Zap, Brain, Thermometer, ClipboardList, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Grade = "A" | "B" | "C" | "D" | "F";

interface ReportCard {
  cycleId: number;
  startDate: string;
  cycleLength: number;
  logCount: number;
  isComplete: boolean;
  overall: Grade;
  grades: {
    sleep: Grade;
    stress: Grade;
    energy: Grade;
    bbtStability: Grade;
    symptoms: Grade;
    consistency: Grade;
  };
  scores: {
    sleep: number;
    stress: number;
    energy: number;
    bbtStability: number;
    symptoms: number;
    consistency: number;
  };
  highlights: {
    avgSleep: number | null;
    avgStress: number | null;
    avgEnergy: number | null;
    bbtReadings: number;
  };
}

const GRADE_COLORS: Record<Grade, string> = {
  A: "hsl(345, 55%, 48%)",
  B: "hsl(345, 42%, 62%)",
  C: "hsl(38, 65%, 58%)",
  D: "hsl(28, 72%, 56%)",
  F: "hsl(0, 55%, 56%)",
};

const GRADE_BG: Record<Grade, string> = {
  A: "hsl(345, 55%, 96%)",
  B: "hsl(345, 40%, 94%)",
  C: "hsl(38, 60%, 94%)",
  D: "hsl(28, 65%, 93%)",
  F: "hsl(0, 50%, 94%)",
};

const GRADE_LABEL: Record<Grade, string> = {
  A: "Excellent",
  B: "Good",
  C: "Fair",
  D: "Needs care",
  F: "Rough cycle",
};

const CATEGORY_META = [
  { key: "sleep", label: "Sleep", icon: Moon, tip: "Based on average hours slept" },
  { key: "stress", label: "Stress", icon: Brain, tip: "Lower stress = higher grade" },
  { key: "energy", label: "Energy", icon: Zap, tip: "Based on average energy level" },
  { key: "bbtStability", label: "BBT Stability", icon: Thermometer, tip: "Less temperature variance = more stable" },
  { key: "symptoms", label: "Symptoms", icon: Activity, tip: "Fewer symptoms = higher grade" },
  { key: "consistency", label: "Logging", icon: ClipboardList, tip: "Days logged vs cycle length" },
] as const;

function GradeBadge({ grade, size = "md" }: { grade: Grade; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-xl",
    lg: "w-20 h-20 text-4xl",
  };
  return (
    <div
      className={cn(
        "rounded-2xl flex items-center justify-center font-bold flex-shrink-0",
        sizes[size]
      )}
      style={{
        background: GRADE_BG[grade],
        color: GRADE_COLORS[grade],
        fontFamily: "var(--app-font-serif)",
        boxShadow: `0 2px 12px 0 ${GRADE_COLORS[grade]}28`,
      }}
    >
      {grade}
    </div>
  );
}

function ScoreBar({ score, grade }: { score: number; grade: Grade }) {
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden flex-1">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${score}%`,
          background: GRADE_COLORS[grade],
        }}
      />
    </div>
  );
}

function CycleCard({ card, index }: { card: ReportCard; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const dateLabel = format(parseISO(card.startDate), "MMMM d, yyyy");

  return (
    <Card className="overflow-hidden">
      <button
        className="w-full text-left p-5 flex items-center gap-4 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <GradeBadge grade={card.overall} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p
              className="text-base font-semibold text-foreground"
              style={{ fontFamily: "var(--app-font-serif)" }}
            >
              Cycle starting {dateLabel}
            </p>
            {!card.isComplete && (
              <Badge variant="secondary" className="text-xs">Current</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {GRADE_LABEL[card.overall]} ·{" "}
            {card.cycleLength > 0 ? `${card.cycleLength} days` : "ongoing"} ·{" "}
            {card.logCount} days logged
          </p>
          <div className="flex gap-1.5 mt-2">
            {(Object.entries(card.grades) as [string, Grade][]).map(([k, g]) => (
              <div
                key={k}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: GRADE_BG[g], color: GRADE_COLORS[g] }}
                title={k}
              >
                {g}
              </div>
            ))}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/50 pt-4">
          <div className="grid grid-cols-1 gap-3">
            {CATEGORY_META.map(({ key, label, icon: Icon, tip }) => {
              const grade = card.grades[key as keyof typeof card.grades];
              const score = card.scores[key as keyof typeof card.scores];
              return (
                <div key={key} className="flex items-center gap-3">
                  <GradeBadge grade={grade} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Icon size={13} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{GRADE_LABEL[grade]}</span>
                    </div>
                    <ScoreBar score={score} grade={grade} />
                    <p className="text-xs text-muted-foreground mt-0.5">{tip}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {card.highlights.avgSleep != null && (
              <Highlight label="Avg sleep" value={`${card.highlights.avgSleep.toFixed(1)}h`} />
            )}
            {card.highlights.avgStress != null && (
              <Highlight label="Avg stress" value={`${card.highlights.avgStress.toFixed(1)} / 10`} />
            )}
            {card.highlights.avgEnergy != null && (
              <Highlight label="Avg energy" value={`${card.highlights.avgEnergy.toFixed(1)} / 10`} />
            )}
            {card.highlights.bbtReadings > 0 && (
              <Highlight label="BBT readings" value={String(card.highlights.bbtReadings)} />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function Highlight({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-xl px-4 py-3">
      <p className="label-caps mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function OverallSummary({ cards }: { cards: ReportCard[] }) {
  const complete = cards.filter((c) => c.isComplete);
  if (complete.length === 0) return null;

  const gradeCounts: Partial<Record<Grade, number>> = {};
  for (const c of complete) {
    gradeCounts[c.overall] = (gradeCounts[c.overall] ?? 0) + 1;
  }

  const best = complete.reduce((a, b) => {
    const order: Grade[] = ["A", "B", "C", "D", "F"];
    return order.indexOf(a.overall) < order.indexOf(b.overall) ? a : b;
  });

  return (
    <Card className="p-5 flex items-center gap-4" style={{ background: GRADE_BG[best.overall] }}>
      <Award size={28} style={{ color: GRADE_COLORS[best.overall] }} />
      <div>
        <p className="text-sm font-semibold text-foreground">
          Best cycle: {format(parseISO(best.startDate), "MMMM yyyy")}
        </p>
        <p className="text-xs text-muted-foreground">
          Overall grade <strong style={{ color: GRADE_COLORS[best.overall] }}>{best.overall}</strong>
          {" · "}tracked across {complete.length} completed cycle{complete.length !== 1 ? "s" : ""}
        </p>
      </div>
    </Card>
  );
}

export default function ReportCardPage() {
  const [cards, setCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/cycles/report-cards`)
      .then((r) => r.json())
      .then((data) => {
        setCards(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl text-foreground mb-1"
          style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
        >
          Cycle Report Cards
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each cycle graded across sleep, stress, energy, BBT stability, symptoms, and logging
          consistency. The more you log, the more accurate your grades.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground text-sm">
            No cycles recorded yet. Start a cycle and log a few days to get your first report card.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <OverallSummary cards={cards} />
          {cards.map((card, i) => (
            <CycleCard key={card.cycleId} card={card} index={i} />
          ))}
        </div>
      )}

      <Card className="p-4 flex gap-3">
        <div className="space-y-1.5 flex-1">
          <p className="label-caps">How grades work</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {(["A", "B", "C", "D", "F"] as Grade[]).map((g) => (
              <div key={g} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-bold" style={{ color: GRADE_COLORS[g] }}>{g}</span>
                <span>{GRADE_LABEL[g]}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            Grades are computed from your logged data only — never estimated.
          </p>
        </div>
      </Card>
    </div>
  );
}
