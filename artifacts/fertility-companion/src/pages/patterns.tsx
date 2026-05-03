import { useMemo } from "react";
import { useGetLogs, useGetCycles } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, Grid3x3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { parseISO, differenceInDays } from "date-fns";

const COMMON_SYMPTOMS = [
  "cramping", "bloating", "headache", "fatigue", "breast tenderness",
  "nausea", "spotting", "backache", "mood swings", "acne", "insomnia",
  "hot flashes", "cramps", "discharge", "pelvic pain",
];

function getPhaseLabel(day: number) {
  if (day <= 5) return { label: "MEN", color: "hsl(0,60%,60%)" };
  if (day <= 13) return { label: "FOL", color: "hsl(140,40%,50%)" };
  if (day <= 16) return { label: "OVU", color: "hsl(345,48%,56%)" };
  return { label: "TWW", color: "hsl(280,30%,55%)" };
}

export default function PatternsPage() {
  const { data: logsData, isLoading: logsLoading } = useGetLogs({ limit: 365 });
  const { data: cyclesData, isLoading: cyclesLoading } = useGetCycles();
  const isLoading = logsLoading || cyclesLoading;

  const { heatmap, allSymptoms, cycleDays } = useMemo(() => {
    const logs = (logsData ?? []) as any[];
    const cycles = ((cyclesData ?? []) as any[])
      .slice()
      .sort((a: any, b: any) => b.startDate.localeCompare(a.startDate));

    if (logs.length === 0 || cycles.length === 0) {
      return { heatmap: {}, allSymptoms: [], cycleDays: 28 };
    }

    // symptom → cycleDay → count
    const map: Record<string, Record<number, number>> = {};
    let totalCount: Record<number, number> = {};

    for (const log of logs) {
      const logDate = parseISO(log.date);
      const owningCycle = cycles.find((c: any) => parseISO(c.startDate) <= logDate);
      if (!owningCycle) continue;
      const day = differenceInDays(logDate, parseISO(owningCycle.startDate)) + 1;
      if (day < 1 || day > 35) continue;

      totalCount[day] = (totalCount[day] ?? 0) + 1;

      for (const s of (log.symptoms as string[]) ?? []) {
        const sym = s.toLowerCase().trim();
        if (!map[sym]) map[sym] = {};
        map[sym][day] = (map[sym][day] ?? 0) + 1;
      }
    }

    // Find all symptoms that appeared at least twice
    const allSymptoms = Object.entries(map)
      .filter(([_, days]) => Object.values(days).reduce((a, b) => a + b, 0) >= 2)
      .sort((a, b) => {
        const aTotal = Object.values(a[1]).reduce((x, y) => x + y, 0);
        const bTotal = Object.values(b[1]).reduce((x, y) => x + y, 0);
        return bTotal - aTotal;
      })
      .map(([name]) => name)
      .slice(0, 12);

    // Normalize: heatmap[symptom][day] = 0–1 frequency among logs on that day
    const heatmap: Record<string, Record<number, number>> = {};
    for (const sym of allSymptoms) {
      heatmap[sym] = {};
      for (let d = 1; d <= 28; d++) {
        const count = map[sym][d] ?? 0;
        const total = totalCount[d] ?? 1;
        heatmap[sym][d] = count / total;
      }
    }

    return { heatmap, allSymptoms, cycleDays: 28 };
  }, [logsData, cyclesData]);

  const days = Array.from({ length: cycleDays }, (_, i) => i + 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={12} /> Back
        </Link>
        <h1 className="text-[1.85rem] text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Symptom Patterns
        </h1>
        <p className="text-sm text-muted-foreground mt-1">See which symptoms appear most on which cycle days.</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-3xl" />
      ) : allSymptoms.length > 0 ? (
        <div className="rounded-3xl border border-primary/15 bg-card px-5 py-6 overflow-x-auto" style={{ boxShadow: "var(--shadow-sm)" }}>
          {/* Phase header */}
          <div className="flex mb-3" style={{ minWidth: 600 }}>
            <div className="w-36 shrink-0" />
            <div className="flex flex-1 gap-px">
              {days.map((d) => {
                const ph = getPhaseLabel(d);
                return (
                  <div key={d} className="flex-1 text-center" title={`Day ${d}: ${ph.label}`}>
                    {(d === 1 || d === 6 || d === 14 || d === 17) && (
                      <span className="text-[8px] font-semibold" style={{ color: ph.color }}>{ph.label}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day numbers */}
          <div className="flex mb-2" style={{ minWidth: 600 }}>
            <div className="w-36 shrink-0" />
            <div className="flex flex-1 gap-px">
              {days.map((d) => (
                <div key={d} className="flex-1 text-center text-[8px] text-muted-foreground">
                  {d % 7 === 1 || d === 1 ? d : ""}
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap rows */}
          <div className="space-y-1" style={{ minWidth: 600 }}>
            {allSymptoms.map((sym) => (
              <div key={sym} className="flex items-center gap-2">
                <div className="w-36 shrink-0 text-right">
                  <span className="text-xs text-muted-foreground capitalize">{sym}</span>
                </div>
                <div className="flex flex-1 gap-px">
                  {days.map((d) => {
                    const intensity = heatmap[sym]?.[d] ?? 0;
                    const alpha = intensity;
                    return (
                      <div
                        key={d}
                        className="flex-1 h-6 rounded-sm transition-all"
                        style={{ background: alpha > 0.05 ? `hsl(345 48% 56% / ${Math.min(1, alpha * 1.5)})` : "hsl(345 20% 95%)" }}
                        title={`Day ${d}: ${Math.round(intensity * 100)}% of logs`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Phase legend */}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-border/60">
            {[
              { label: "Menstrual", color: "hsl(0,60%,60%)" },
              { label: "Follicular", color: "hsl(140,40%,50%)" },
              { label: "Ovulation", color: "hsl(345,48%,56%)" },
              { label: "TWW", color: "hsl(280,30%,55%)" },
            ].map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} /> {label}
              </span>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">Darker = more frequent</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Grid3x3 size={22} className="text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>
            No patterns yet
          </p>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
            Log symptoms across several cycles and your personal heatmap will appear here.
          </p>
          <Link href="/log" className="text-xs text-primary font-semibold hover:underline">Log today →</Link>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card px-5 py-4" style={{ boxShadow: "var(--shadow-xs)" }}>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">How to read this:</strong> Each row is a symptom. Each column is a cycle day (1–28). Darker pink means that symptom appeared on that cycle day in a higher proportion of your logged cycles. Light/empty means it rarely or never appeared then.
        </p>
      </div>
    </div>
  );
}
