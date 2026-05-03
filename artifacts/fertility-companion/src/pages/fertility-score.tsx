import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Target, BookOpen, TrendingUp } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Component { score: number | null; label: string; weight: number }
interface ScoreData {
  score: number;
  currentDay: number;
  cycleLength: number;
  ovulationDay: number;
  phase: string;
  inFertileWindow: boolean;
  interpretation: string;
  components: { cycleDay: Component; sleep: Component; stress: Component; energy: Component };
  hasLog: boolean;
  bbt: number | null;
}

function scoreColor(s: number) {
  if (s >= 75) return "#10b981";
  if (s >= 55) return "#f59e0b";
  if (s >= 35) return "#ec4899";
  return "#94a3b8";
}

function scoreLabel(s: number) {
  if (s >= 80) return "High";
  if (s >= 60) return "Moderate–High";
  if (s >= 40) return "Moderate";
  if (s >= 20) return "Low";
  return "Very Low";
}

function Ring({ score, size = 160 }: { score: number; size?: number }) {
  const r = size * 0.38;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f1f5f9" strokeWidth={size * 0.09} />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.09}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x={cx} y={cx - 6} textAnchor="middle" fontSize={size * 0.22} fontWeight="700" fill={color} fontFamily="var(--app-font-serif)">
        {score}
      </text>
      <text x={cx} y={cx + size * 0.13} textAnchor="middle" fontSize={size * 0.085} fill="#94a3b8" fontFamily="var(--app-font-sans)">
        out of 100
      </text>
    </svg>
  );
}

function ComponentBar({ label, score, weight }: { label: string; score: number | null; weight: number }) {
  const color = score != null ? scoreColor(score) : "#e2e8f0";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/60">{weight}% weight</span>
          <span className="font-semibold" style={{ color: score != null ? color : "#94a3b8" }}>
            {score != null ? `${score}/100` : "—"}
          </span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: score != null ? `${score}%` : "0%", background: color }}
        />
      </div>
    </div>
  );
}

function CycleBar({ currentDay, cycleLength, ovulationDay }: { currentDay: number; cycleLength: number; ovulationDay: number }) {
  const fertiStart = ovulationDay - 4;
  const pct = (d: number) => Math.round((d / cycleLength) * 100);

  return (
    <div className="space-y-2">
      <div className="relative h-5 rounded-full overflow-hidden bg-muted/40">
        {/* Fertile window highlight */}
        <div
          className="absolute top-0 bottom-0 bg-emerald-100 border-x border-emerald-200"
          style={{ left: `${pct(fertiStart - 1)}%`, width: `${pct(6)}%` }}
        />
        {/* Current day marker */}
        <div
          className="absolute top-0 bottom-0 w-1 rounded-full"
          style={{ left: `${Math.min(pct(currentDay - 1), 97)}%`, background: "var(--primary)" }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Day 1</span>
        <span className="text-emerald-600">Fertile window (days {fertiStart}–{ovulationDay + 1})</span>
        <span>Day {cycleLength}</span>
      </div>
      <p className="text-xs text-center text-muted-foreground">
        You are on <strong className="text-foreground">cycle day {currentDay}</strong>
        {currentDay <= ovulationDay + 1 && currentDay >= fertiStart
          ? " — inside your fertile window"
          : currentDay < fertiStart
          ? ` — ${fertiStart - currentDay} day${fertiStart - currentDay !== 1 ? "s" : ""} until fertile window`
          : " — past this cycle's ovulation window"}
      </p>
    </div>
  );
}

export default function FertilityScorePage() {
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/fertility-score`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl bg-muted/50 animate-pulse" />)}
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-10 text-center">
        <Target size={28} className="mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Could not load fertility score. Please try again.</p>
      </Card>
    );
  }

  const color = scoreColor(data.score);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Fertility Score
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A single daily number combining cycle timing, sleep, stress, and energy — so you always know where you stand.
        </p>
      </div>

      {/* Main score card */}
      <Card className="p-6" style={{ borderTop: `3px solid ${color}` }}>
        <div className="flex flex-col items-center gap-4">
          <Ring score={data.score} size={180} />
          <div className="text-center space-y-1">
            <p className="text-xl font-bold" style={{ fontFamily: "var(--app-font-serif)", color }}>
              {scoreLabel(data.score)}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{data.interpretation}</p>
          </div>
          {data.inFertileWindow && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Fertile window is open
            </div>
          )}
        </div>
      </Card>

      {/* Cycle position */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-primary" />
          <h2 className="text-sm font-semibold">Where you are in your cycle</h2>
        </div>
        <CycleBar currentDay={data.currentDay} cycleLength={data.cycleLength} ovulationDay={data.ovulationDay} />
      </Card>

      {/* Score breakdown */}
      <Card className="p-4 space-y-4">
        <h2 className="text-sm font-semibold">Score breakdown</h2>
        <ComponentBar label={data.components.cycleDay.label} score={data.components.cycleDay.score} weight={data.components.cycleDay.weight} />
        <ComponentBar label={data.components.sleep.label} score={data.components.sleep.score} weight={data.components.sleep.weight} />
        <ComponentBar label={data.components.stress.label} score={data.components.stress.score} weight={data.components.stress.weight} />
        <ComponentBar label={data.components.energy.label} score={data.components.energy.score} weight={data.components.energy.weight} />

        {!data.hasLog && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2 text-xs text-amber-800">
            <BookOpen size={13} className="flex-shrink-0 mt-0.5" />
            <span>
              Sleep, stress & energy components need today's daily log. Score is currently cycle-timing only.{" "}
              <Link href="/log" className="font-semibold underline underline-offset-2">Log now →</Link>
            </span>
          </div>
        )}
      </Card>

      {/* How it's calculated */}
      <Card className="p-4 space-y-2">
        <h2 className="text-sm font-semibold">How it's calculated</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cycle timing carries <strong>45%</strong> of the score — it peaks during your fertile window (days {data.ovulationDay - 4}–{data.ovulationDay + 1} of your {data.cycleLength}-day cycle) and drops through menstruation and the luteal phase.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Sleep quality (<strong>20%</strong>), stress level (<strong>20%</strong>), and energy (<strong>15%</strong>) are drawn from today's daily log. Optimal sleep is 7–9 h; low stress and high energy both boost the score.
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          No external AI is used. Every number comes entirely from your own logged data and cycle history.
        </p>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center pb-2">
        This is a personal wellness indicator, not a medical fertility test or guarantee.
      </p>
    </div>
  );
}
