import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { format, parseISO, getDay, startOfWeek, addDays } from "date-fns";
import { Activity, Flame, CalendarDays, TrendingUp } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface DayData {
  date: string;
  count: number;
  symptoms: string[];
  mood: string | null;
  energy: number | null;
  logged: boolean;
}

interface HeatmapData {
  days: DayData[];
  loggedDays: number;
  topSymptom: { name: string; count: number } | null;
  maxCount: number;
  currentStreak: number;
  longestStreak: number;
}

interface TooltipState {
  day: DayData;
  x: number;
  y: number;
}

const MOOD_EMOJI: Record<string, string> = { positive: "😊", neutral: "😐", negative: "😔" };

function intensity(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count < 0) return 0; // not logged — shown as empty
  if (count === 0) return 1; // logged, no symptoms
  if (max <= 0) return 1;
  const ratio = count / max;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

const COLORS = [
  "bg-muted/30",           // 0: not logged
  "bg-primary/15",         // 1: logged, 0 symptoms
  "bg-primary/35",         // 2: low symptoms
  "bg-primary/60",         // 3: moderate
  "bg-primary/90",         // 4: high
];

const COLORS_HEX = ["#f1f5f9", "#fce4ec", "#f48fb1", "#e91e63", "#880e4f"];

function formatSymptom(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SymptomHeatmapPage() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${BASE}/api/symptoms/heatmap`)
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
        <Activity size={28} className="mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Could not load heatmap data.</p>
      </Card>
    );
  }

  const { days, loggedDays, topSymptom, maxCount, currentStreak, longestStreak } = data;

  // Build week columns: group days into columns of 7 (Sun→Sat)
  // First, pad to start of the week of the first day
  const firstDay = parseISO(days[0].date);
  const firstDow = getDay(firstDay); // 0 = Sun
  const padded: (DayData | null)[] = [
    ...Array(firstDow).fill(null),
    ...days,
  ];
  // Chunk into weeks (columns of 7)
  const weeks: (DayData | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  // Month labels: find which week each month starts in
  const monthLabels: { weekIdx: number; label: string }[] = [];
  let lastMonth = "";
  weeks.forEach((week, wi) => {
    const firstReal = week.find((d) => d !== null);
    if (firstReal) {
      const m = format(parseISO(firstReal.date), "MMM");
      if (m !== lastMonth) { monthLabels.push({ weekIdx: wi, label: m }); lastMonth = m; }
    }
  });

  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const CELL = 14; // px
  const GAP = 2;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Symptom Heatmap
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A full year of your cycle health at a glance — every square is one day, coloured by symptom intensity.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: CalendarDays, label: "Days logged", value: loggedDays },
          { icon: Flame, label: "Current streak", value: `${currentStreak}d` },
          { icon: TrendingUp, label: "Longest streak", value: `${longestStreak}d` },
          { icon: Activity, label: "Top symptom", value: topSymptom ? formatSymptom(topSymptom.name) : "—" },
        ].map((s) => (
          <Card key={s.label} className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon size={13} className="text-primary" />
              <span className="text-[10px] label-caps text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-lg font-bold truncate" style={{ fontFamily: "var(--app-font-serif)", color: "var(--primary)" }}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Heatmap grid */}
      <Card className="p-4 overflow-x-auto">
        {loggedDays === 0 ? (
          <div className="py-8 text-center">
            <Activity size={28} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No daily logs yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Start logging daily symptoms to see your heatmap fill in.</p>
          </div>
        ) : (
          <div className="relative" ref={gridRef}>
            {/* Month row */}
            <div className="flex mb-1" style={{ paddingLeft: 32 }}>
              <div style={{ display: "flex", gap: GAP }}>
                {weeks.map((_, wi) => {
                  const ml = monthLabels.find((m) => m.weekIdx === wi);
                  return (
                    <div key={wi} style={{ width: CELL, fontSize: 9, color: "#94a3b8", flexShrink: 0, textAlign: "left" }}>
                      {ml ? ml.label : ""}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Grid: DOW labels + week columns */}
            <div style={{ display: "flex", gap: 0 }}>
              {/* Day of week labels */}
              <div style={{ display: "flex", flexDirection: "column", gap: GAP, marginRight: 4, flexShrink: 0, width: 28 }}>
                {DOW.map((d, i) => (
                  <div key={d} style={{ height: CELL, fontSize: 9, color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 2 }}>
                    {i % 2 === 1 ? d : ""}
                  </div>
                ))}
              </div>

              {/* Week columns */}
              <div style={{ display: "flex", gap: GAP, overflowX: "auto" }}>
                {weeks.map((week, wi) => (
                  <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                    {week.map((day, di) => {
                      if (!day) {
                        return <div key={di} style={{ width: CELL, height: CELL }} />;
                      }
                      const level = intensity(day.count, maxCount);
                      const isToday = day.date === format(new Date(), "yyyy-MM-dd");
                      return (
                        <div
                          key={di}
                          style={{
                            width: CELL,
                            height: CELL,
                            borderRadius: 3,
                            backgroundColor: day.logged ? COLORS_HEX[level] : "#f1f5f9",
                            border: isToday ? "2px solid var(--primary)" : day.logged ? "none" : "1px solid #e2e8f0",
                            cursor: "pointer",
                            flexShrink: 0,
                            transition: "transform 0.1s",
                          }}
                          onMouseEnter={(e) => {
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            const gridRect = gridRef.current?.getBoundingClientRect();
                            setTooltip({
                              day,
                              x: rect.left - (gridRect?.left ?? 0) + CELL / 2,
                              y: rect.top - (gridRect?.top ?? 0) - 8,
                            });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="absolute z-10 pointer-events-none"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: "translate(-50%, -100%)",
                  minWidth: 160,
                }}
              >
                <div className="rounded-xl bg-popover border border-border shadow-xl p-3 text-xs space-y-1.5">
                  <p className="font-semibold text-foreground">{format(parseISO(tooltip.day.date), "EEE, MMM d yyyy")}</p>
                  {!tooltip.day.logged ? (
                    <p className="text-muted-foreground">Not logged</p>
                  ) : (
                    <>
                      <p className="text-muted-foreground">
                        {tooltip.day.count === 0 ? "No symptoms" : `${tooltip.day.count} symptom${tooltip.day.count !== 1 ? "s" : ""}`}
                      </p>
                      {tooltip.day.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {tooltip.day.symptoms.slice(0, 5).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px]">
                              {formatSymptom(s)}
                            </span>
                          ))}
                          {tooltip.day.symptoms.length > 5 && (
                            <span className="text-muted-foreground">+{tooltip.day.symptoms.length - 5}</span>
                          )}
                        </div>
                      )}
                      {tooltip.day.mood && (
                        <p className="text-muted-foreground">Mood: {MOOD_EMOJI[tooltip.day.mood] ?? ""} {tooltip.day.mood}</p>
                      )}
                      {tooltip.day.energy != null && (
                        <p className="text-muted-foreground">Energy: {tooltip.day.energy}/10</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 justify-end">
          <span className="text-[10px] text-muted-foreground">Less</span>
          {COLORS_HEX.slice(0).map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: c, border: i === 0 ? "1px solid #e2e8f0" : "none" }} />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </Card>

      {/* Top symptoms breakdown */}
      {topSymptom && loggedDays > 0 && (
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold">Most tracked symptoms (past year)</h2>
          <p className="text-xs text-muted-foreground">
            Your most frequently logged symptom is <strong>{formatSymptom(topSymptom.name)}</strong>, recorded {topSymptom.count} time{topSymptom.count !== 1 ? "s" : ""}.
          </p>
        </Card>
      )}

      <p className="text-[11px] text-muted-foreground text-center pb-2">
        Squares with a border = not logged that day · Today is outlined in pink · Hover any square for details
      </p>
    </div>
  );
}
