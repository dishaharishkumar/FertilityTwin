import { useMemo, useState } from "react";
import { useGetLogs, useGetDashboardSummary, useGetCycles } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { differenceInDays, parseISO } from "date-fns";
import { Info, CheckCircle2, MinusCircle, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type FactorStatus = "positive" | "neutral" | "negative";

interface Factor {
  label: string;
  points: number;
  detail: string;
  status: FactorStatus;
}

function getDialColor(score: number) {
  if (score >= 60) return "hsl(160, 50%, 44%)";
  if (score >= 38) return "hsl(38, 80%, 50%)";
  return "hsl(345, 52%, 56%)";
}

function DialGauge({ score }: { score: number }) {
  const cx = 100, cy = 108, r = 84;
  const clamped = Math.max(0, Math.min(100, score));
  const angle = Math.PI * (1 - clamped / 100);
  const sx = cx + r * Math.cos(angle);
  const sy = cy - r * Math.sin(angle);
  const color = getDialColor(clamped);

  const nx = cx + (r - 22) * Math.cos(angle);
  const ny = cy - (r - 22) * Math.sin(angle);

  return (
    <svg viewBox="0 0 200 124" className="w-full max-w-[280px] mx-auto">
      {/* Background track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`}
        fill="none"
        stroke="hsl(345, 20%, 91%)"
        strokeWidth="16"
        strokeLinecap="round"
      />

      {/* Score arc */}
      {clamped > 0.5 && (
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${sx.toFixed(2)} ${sy.toFixed(2)}`}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
        />
      )}

      {/* Tick marks */}
      {[0, 25, 50, 75, 100].map((t) => {
        const a = Math.PI * (1 - t / 100);
        const x1 = cx + (r + 4) * Math.cos(a);
        const y1 = cy - (r + 4) * Math.sin(a);
        const x2 = cx + (r - 4) * Math.cos(a);
        const y2 = cy - (r - 4) * Math.sin(a);
        return (
          <line key={t} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="hsl(345,18%,80%)" strokeWidth="1.5" />
        );
      })}

      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={nx.toFixed(2)} y2={ny.toFixed(2)}
        stroke="hsl(345, 42%, 35%)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="5.5" fill="hsl(345, 42%, 35%)" />
      <circle cx={cx} cy={cy} r="2.5" fill="white" />

      {/* Score text */}
      <text
        x={cx} y={cy - 16}
        textAnchor="middle"
        fontSize="26"
        fontWeight="700"
        fill={color}
        fontFamily="Georgia, serif"
      >
        {clamped}%
      </text>

      {/* End labels */}
      <text x={cx - r + 2} y={cy + 16} fontSize="8.5" fill="hsl(345,22%,62%)" textAnchor="middle">Low</text>
      <text x={cx} y={cy + 16} fontSize="8.5" fill="hsl(345,22%,62%)" textAnchor="middle">Mid</text>
      <text x={cx + r - 2} y={cy + 16} fontSize="8.5" fill="hsl(345,22%,62%)" textAnchor="middle">High</text>
    </svg>
  );
}

function computeScore(logs: any[], dashboard: any, cycles: any[]): {
  score: number;
  factors: Factor[];
  message: string;
} {
  let score = 18;
  const factors: Factor[] = [];

  // 1. Phase / timing
  const phase = (dashboard as any)?.currentPhase;
  const cycleDay = (dashboard as any)?.cycleDay ?? 0;

  if (phase === "tww" || phase === "luteal") {
    score += 15;
    factors.push({ label: "In the two-week wait", points: 15, detail: "You're in the right window — conception could have occurred", status: "positive" });
  } else if (phase === "ovulation") {
    score += 13;
    factors.push({ label: "Ovulation phase", points: 13, detail: "Peak conception window — your most fertile days", status: "positive" });
  } else if (phase === "follicular" && cycleDay >= 9) {
    score += 5;
    factors.push({ label: "Approaching fertile window", points: 5, detail: "Getting closer — fertile days are ahead", status: "positive" });
  } else if (phase === "menstrual") {
    factors.push({ label: "Menstrual phase", points: 0, detail: "Conception unlikely at this stage of the cycle", status: "neutral" });
  } else {
    factors.push({ label: "Phase unknown", points: 0, detail: "Log a cycle start date to track your phase", status: "neutral" });
  }

  // 2. BBT biphasic shift
  const sorted = [...logs].sort((a: any, b: any) => a.date.localeCompare(b.date));
  const bbtLogs = sorted.filter((l: any) => l.bbt != null);

  if (bbtLogs.length >= 6) {
    const half = Math.floor(bbtLogs.length / 2);
    const preAvg = bbtLogs.slice(0, half).reduce((s: number, l: any) => s + l.bbt, 0) / half;
    const postAvg = bbtLogs.slice(half).reduce((s: number, l: any) => s + l.bbt, 0) / (bbtLogs.length - half);
    const shift = postAvg - preAvg;
    if (shift >= 0.2) {
      score += 18;
      factors.push({ label: "BBT shift detected", points: 18, detail: `Temperature rose ${shift.toFixed(2)}°F — strong sign of ovulation`, status: "positive" });
    } else if (shift >= 0.1) {
      score += 8;
      factors.push({ label: "Possible BBT shift", points: 8, detail: `Slight rise of ${shift.toFixed(2)}°F — possible ovulation`, status: "positive" });
    } else {
      factors.push({ label: "No clear BBT shift", points: 0, detail: "Continue charting — a biphasic pattern may emerge", status: "neutral" });
    }
  } else if (bbtLogs.length > 0) {
    factors.push({ label: "Limited BBT data", points: 0, detail: `${bbtLogs.length} reading${bbtLogs.length !== 1 ? "s" : ""} — need 6+ for shift detection`, status: "neutral" });
  } else {
    factors.push({ label: "No BBT recorded", points: 0, detail: "Start logging basal body temperature each morning", status: "neutral" });
  }

  // 3. Recent supportive symptoms (last 10 days)
  const recent = sorted.slice(-10);
  const recentSymptomSet = new Set(
    recent.flatMap((l: any) => (l.symptoms ?? []).map((s: string) => s.toLowerCase()))
  );

  const SUPPORTIVE: Array<[string, number]> = [
    ["spotting", 10], ["implantation", 10],
    ["breast tenderness", 8], ["sore breast", 8], ["tender breast", 8],
    ["nausea", 7],
    ["mild_cramps", 5], ["cramping", 5], ["mild cramp", 5],
    ["fatigue", 3], ["bloating", 3],
  ];

  let sympPoints = 0;
  const found: string[] = [];
  for (const [key, pts] of SUPPORTIVE) {
    for (const s of recentSymptomSet) {
      if (s.includes(key) || key.includes(s)) {
        sympPoints = Math.min(sympPoints + pts, 20);
        found.push(key);
        break;
      }
    }
  }

  if (found.length > 0) {
    score += sympPoints;
    factors.push({ label: "Supportive symptoms", points: sympPoints, detail: found.slice(0, 3).join(", "), status: "positive" });
  } else {
    factors.push({ label: "No notable symptoms", points: 0, detail: "No early signs logged in the past 10 days", status: "neutral" });
  }

  // 4. Cycle regularity
  const sortedCycles = [...(cycles as any[])].sort((a, b) => b.startDate.localeCompare(a.startDate));
  if (sortedCycles.length >= 3) {
    const lengths: number[] = [];
    for (let i = 0; i < Math.min(sortedCycles.length - 1, 5); i++) {
      const len = differenceInDays(parseISO(sortedCycles[i].startDate), parseISO(sortedCycles[i + 1].startDate));
      if (len > 18 && len < 50) lengths.push(len);
    }
    if (lengths.length >= 2) {
      const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const stddev = Math.sqrt(lengths.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / lengths.length);
      if (stddev <= 2) {
        score += 12;
        factors.push({ label: "Very regular cycles", points: 12, detail: `±${stddev.toFixed(1)} day variance — highly predictable`, status: "positive" });
      } else if (stddev <= 4) {
        score += 6;
        factors.push({ label: "Fairly regular cycles", points: 6, detail: `±${stddev.toFixed(1)} day variance`, status: "positive" });
      } else {
        factors.push({ label: "Irregular cycles", points: 0, detail: `±${stddev.toFixed(1)} day variance — harder to predict`, status: "neutral" });
      }
    }
  } else {
    factors.push({ label: "Limited cycle history", points: 0, detail: `${sortedCycles.length} cycle${sortedCycles.length !== 1 ? "s" : ""} recorded`, status: "neutral" });
  }

  // 5. Logging consistency
  if (logs.length >= 20) {
    score += 6;
    factors.push({ label: "Rich logging history", points: 6, detail: `${logs.length} days logged — high data quality`, status: "positive" });
  } else if (logs.length >= 10) {
    score += 3;
    factors.push({ label: "Good logging", points: 3, detail: `${logs.length} days logged`, status: "positive" });
  } else {
    factors.push({ label: "Limited logging", points: 0, detail: `${logs.length} day${logs.length !== 1 ? "s" : ""} logged — keep going`, status: "neutral" });
  }

  const finalScore = Math.min(82, Math.round(score));

  let message = "";
  if (finalScore >= 65) {
    message = "The signs are encouraging this cycle. Your body is working hard. Rest well, stay hydrated, and be gentle with yourself while you wait.";
  } else if (finalScore >= 45) {
    message = "There are some positive indicators. Log every day this week — more data will sharpen the picture and help you understand your pattern.";
  } else if (finalScore >= 28) {
    message = "It's still early in the cycle, or your data is building. Every entry teaches you something. Consistency is the most powerful tool you have.";
  } else {
    message = "Keep going. Fertility awareness takes time and patience. Each cycle you log brings deeper understanding. You are doing something meaningful.";
  }

  return { score: finalScore, factors, message };
}

export default function ProbabilityPage() {
  const { data: logsData, isLoading: logsLoading } = useGetLogs({ limit: 500 });
  const { data: dashboard, isLoading: dashLoading } = useGetDashboardSummary();
  const { data: cyclesData, isLoading: cyclesLoading } = useGetCycles();
  const [revealed, setRevealed] = useState(false);

  const isLoading = logsLoading || dashLoading || cyclesLoading;

  const result = useMemo(() => {
    if (!logsData || !cyclesData) return null;
    return computeScore(logsData as any[], dashboard, cyclesData as any[]);
  }, [logsData, dashboard, cyclesData]);

  const color = result ? getDialColor(result.score) : "hsl(345, 52%, 56%)";

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl text-foreground mb-1"
          style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
        >
          Conception Estimate
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A supportive, rule-based score from your logged data — not a medical test.
          More logging = more accurate.
        </p>
      </div>

      {isLoading ? (
        <Card className="p-10 flex flex-col items-center gap-4">
          <div className="w-64 h-32 rounded-2xl bg-muted/50 animate-pulse" />
          <div className="w-40 h-4 bg-muted/40 rounded-xl animate-pulse" />
        </Card>
      ) : !revealed ? (
        <Card className="p-10 flex flex-col items-center gap-5 text-center border-dashed">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "hsl(345, 48%, 93%)" }}
          >
            <Sparkles size={32} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">
              See your supportive estimate
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Bloom looks at your phase, BBT pattern, recent symptoms, cycle regularity,
              and logging history to produce a supportive number.
            </p>
          </div>
          <Button onClick={() => setRevealed(true)} className="gap-2">
            <Sparkles size={15} />
            Calculate my estimate
          </Button>
        </Card>
      ) : result ? (
        <>
          {/* Dial card */}
          <Card className="p-6 flex flex-col items-center gap-3">
            <DialGauge score={result.score} />
            <div className="text-center">
              <p
                className="text-base font-semibold"
                style={{ color, fontFamily: "var(--app-font-serif)" }}
              >
                {result.score >= 65
                  ? "Encouraging signs this cycle"
                  : result.score >= 45
                  ? "Some positive indicators"
                  : result.score >= 28
                  ? "Building data — keep logging"
                  : "Early days — keep tracking"}
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm leading-relaxed">
                {result.message}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setRevealed(false)} className="gap-1.5 text-muted-foreground">
              <RefreshCw size={13} />
              Recalculate
            </Button>
          </Card>

          {/* Factor breakdown */}
          <Card className="p-5">
            <p className="label-caps mb-4">What went into this score</p>
            <div className="space-y-3">
              {result.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  {f.status === "positive" ? (
                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color }} />
                  ) : (
                    <MinusCircle size={16} className="flex-shrink-0 mt-0.5 text-muted-foreground/50" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn(
                        "text-sm font-medium",
                        f.status === "positive" ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {f.label}
                      </p>
                      {f.points > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-2 py-0 flex-shrink-0"
                          style={{ background: `${color}18`, color }}
                        >
                          +{f.points}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Disclaimer */}
          <Card className="p-4 border-amber-200/60" style={{ background: "hsl(42,80%,97%)" }}>
            <div className="flex gap-3">
              <Info size={15} className="flex-shrink-0 mt-0.5 text-amber-600" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>This is not a pregnancy test or medical assessment.</strong> Bloom's
                estimate is for emotional support and pattern awareness only. It is calculated
                entirely from the data you have logged. Please consult a healthcare provider
                for medical advice, diagnosis, or treatment.
              </p>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
