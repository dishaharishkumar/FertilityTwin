import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { CalendarClock, TrendingUp, Info } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Prediction {
  cycleNumber: number;
  predictedDate: string;
  earlyDate: string;
  lateDate: string;
  daysAway: number;
  windowDays: number;
}

interface PredictorData {
  predictions: Prediction[];
  avgCycleLength: number | null;
  currentCycleDay: number | null;
  daysUntilNext: number | null;
  confidence: "high" | "medium" | "low" | "none";
  cycleLengths: number[];
  stdDev: number;
  margin: number;
}

const CONFIDENCE_META = {
  high:   { label: "High confidence", color: "#10b981", desc: "Your cycles are very regular (±2 days)." },
  medium: { label: "Medium confidence", color: "#f59e0b", desc: "Some variation in your cycles (±3–4 days)." },
  low:    { label: "Low confidence", color: "#f43f5e", desc: "Wider window — log more cycles to narrow it." },
  none:   { label: "Estimated (default)", color: "#94a3b8", desc: "Using a 28-day default — log cycles to personalise." },
};

function CountdownRing({ days, total }: { days: number; total: number }) {
  const pct = Math.max(0, Math.min(1, 1 - days / total));
  const r = 48;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <svg width="120" height="120" className="rotate-[-90deg]">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={r} fill="none"
        stroke="var(--primary)" strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

function PredictionCard({ p, index, avgLength }: { p: Prediction; index: number; avgLength: number }) {
  const isNext = index === 0;
  const label = isNext ? "Next period" : index === 1 ? "2 cycles away" : "3 cycles away";
  const dateStr = format(parseISO(p.predictedDate), "MMMM d, yyyy");
  const earlyStr = format(parseISO(p.earlyDate), "MMM d");
  const lateStr = format(parseISO(p.lateDate), "MMM d");
  const daysAway = p.daysAway;
  const past = daysAway < 0;

  return (
    <Card className={`p-5 space-y-3 ${isNext ? "border-primary/40 shadow-sm" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs label-caps text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold mt-0.5" style={{ fontFamily: "var(--app-font-serif)" }}>{dateStr}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Window: <strong>{earlyStr} – {lateStr}</strong> ({p.windowDays}-day range)
          </p>
        </div>
        {isNext && (
          <div className="relative flex-shrink-0">
            <CountdownRing days={Math.max(0, daysAway)} total={avgLength} />
            <div className="absolute inset-0 flex flex-col items-center justify-center rotate-90">
              <span className="text-2xl font-bold leading-none" style={{ color: "var(--primary)" }}>
                {past ? "–" : Math.abs(daysAway)}
              </span>
              <span className="text-[10px] text-muted-foreground">{past ? "overdue" : "days"}</span>
            </div>
          </div>
        )}
      </div>

      {!isNext && (
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 rounded-full flex-1 bg-muted/60 relative overflow-hidden"
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{
                width: `${Math.max(5, Math.min(95, ((avgLength - p.windowDays / 2) / avgLength) * 100))}%`,
                background: "var(--primary)",
                opacity: 0.4,
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {daysAway > 0 ? `in ${daysAway} days` : `${Math.abs(daysAway)}d ago`}
          </span>
        </div>
      )}
    </Card>
  );
}

export default function PeriodPredictorPage() {
  const [data, setData] = useState<PredictorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/period-predictor`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const conf = data ? CONFIDENCE_META[data.confidence] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Period Predictor
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your next 3 predicted periods with confidence windows — built from your actual cycle history.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />)}
        </div>
      ) : !data ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">Could not load predictions. Please try again.</p>
        </Card>
      ) : (
        <>
          {conf && (
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
              style={{ background: conf.color + "15", borderLeft: `3px solid ${conf.color}` }}
            >
              <Info size={15} className="mt-0.5 flex-shrink-0" style={{ color: conf.color }} />
              <div>
                <span className="font-medium" style={{ color: conf.color }}>{conf.label}</span>
                <span className="text-muted-foreground"> — {conf.desc}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {data.predictions.map((p, i) => (
              <PredictionCard
                key={p.cycleNumber}
                p={p}
                index={i}
                avgLength={data.avgCycleLength ?? 28}
              />
            ))}
          </div>

          <Card className="p-4 space-y-4">
            <p className="text-xs label-caps text-muted-foreground flex items-center gap-1.5">
              <TrendingUp size={12} /> Cycle stats
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--app-font-serif)", color: "var(--primary)" }}>
                  {data.avgCycleLength ?? 28}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">avg days</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--app-font-serif)", color: "var(--primary)" }}>
                  ±{data.margin}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">day window</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--app-font-serif)", color: "var(--primary)" }}>
                  {data.cycleLengths.length + 1}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">cycles logged</p>
              </div>
            </div>

            {data.cycleLengths.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Past cycle lengths</p>
                <div className="flex gap-1.5 flex-wrap">
                  {data.cycleLengths.map((l, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                      {l}d
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div className="flex items-start gap-2 text-xs text-muted-foreground rounded-xl bg-muted/40 px-4 py-3">
            <CalendarClock size={13} className="mt-0.5 flex-shrink-0" />
            <p>
              Predictions are based on your logged cycle start dates. The more cycles you track, the narrower
              and more accurate your prediction window becomes. This is not a medical tool.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
