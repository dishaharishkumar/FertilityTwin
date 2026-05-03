import { useMemo, useState } from "react";
import { useGetLogs } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { Search, Activity, CalendarDays, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PHASE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  menstrual:  { bg: "hsl(345,55%,92%)", text: "hsl(345,55%,40%)", label: "Menstrual"  },
  follicular: { bg: "hsl(160,40%,88%)", text: "hsl(160,50%,33%)", label: "Follicular" },
  ovulation:  { bg: "hsl(42,85%,86%)",  text: "hsl(38,75%,30%)",  label: "Ovulation"  },
  tww:        { bg: "hsl(270,40%,90%)", text: "hsl(270,42%,37%)", label: "Luteal"     },
  luteal:     { bg: "hsl(270,40%,90%)", text: "hsl(270,42%,37%)", label: "Luteal"     },
};

const PHASE_TABS = [
  { id: "all", label: "All phases" },
  { id: "menstrual", label: "Menstrual" },
  { id: "follicular", label: "Follicular" },
  { id: "ovulation", label: "Ovulation" },
  { id: "tww", label: "Luteal" },
];

interface LogEntry {
  id: number;
  date: string;
  symptoms: string[];
  phase?: string | null;
  cycleDay?: number | null;
  mood?: string | null;
}

export default function SymptomDiaryPage() {
  const { data: logsData, isLoading } = useGetLogs({ limit: 500 });
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [pinnedSymptom, setPinnedSymptom] = useState<string | null>(null);

  const logs: LogEntry[] = useMemo(
    () =>
      ((logsData ?? []) as any[])
        .filter((l: any) => (l.symptoms as string[]).length > 0)
        .sort((a: any, b: any) => b.date.localeCompare(a.date)),
    [logsData]
  );

  // Symptom frequency map
  const { freqMap, topSymptoms, totalEntries } = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;
    for (const log of logs) {
      for (const s of log.symptoms) {
        map[s] = (map[s] ?? 0) + 1;
      }
      total++;
    }
    const top = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
    return { freqMap: map, topSymptoms: top, totalEntries: total };
  }, [logs]);

  const maxFreq = topSymptoms[0]?.[1] ?? 1;

  // Phase-symptom breakdown
  const phaseSymptoms = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const log of logs) {
      const p = log.phase ?? "unknown";
      if (!map[p]) map[p] = {};
      for (const s of log.symptoms) {
        map[p][s] = (map[p][s] ?? 0) + 1;
      }
    }
    return map;
  }, [logs]);

  // Filtered timeline
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return logs.filter((log) => {
      const phaseOk =
        phaseFilter === "all" ||
        log.phase === phaseFilter ||
        (phaseFilter === "tww" && (log.phase === "tww" || log.phase === "luteal"));
      const symptomOk =
        pinnedSymptom
          ? log.symptoms.includes(pinnedSymptom)
          : q
          ? log.symptoms.some((s) => s.toLowerCase().includes(q))
          : true;
      return phaseOk && symptomOk;
    });
  }, [logs, search, phaseFilter, pinnedSymptom]);

  const handlePinSymptom = (s: string) => {
    setPinnedSymptom((prev) => (prev === s ? null : s));
    setSearch("");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 bg-muted/60 rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-72 bg-muted/40 rounded-xl animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  const allLogsCount = ((logsData ?? []) as any[]).length;

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl text-foreground mb-1"
          style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
        >
          Symptom Diary
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Every symptom you've logged — searchable, filterable, and ranked by frequency.
          Tap a symptom to filter the timeline.
        </p>
      </div>

      {allLogsCount === 0 ? (
        <Card className="p-10 text-center">
          <Activity size={32} className="text-primary mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            No symptoms logged yet. Start by logging your daily symptoms.
          </p>
        </Card>
      ) : totalEntries === 0 ? (
        <Card className="p-10 text-center">
          <Activity size={32} className="text-primary mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            You have {allLogsCount} log entries but none with symptoms recorded yet.
          </p>
        </Card>
      ) : (
        <>
          {/* Frequency chart */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-primary" />
              <p className="label-caps">Most frequent symptoms</p>
            </div>
            <div className="space-y-2.5">
              {topSymptoms.map(([symptom, count]) => {
                const pct = Math.round((count / maxFreq) * 100);
                const isPinned = pinnedSymptom === symptom;
                return (
                  <button
                    key={symptom}
                    onClick={() => handlePinSymptom(symptom)}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-sm font-medium transition-colors",
                          isPinned ? "text-primary" : "text-foreground group-hover:text-primary"
                        )}
                      >
                        {symptom}
                        {isPinned && (
                          <span className="ml-2 text-xs text-primary/70">(filtering)</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {count}×
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: isPinned
                            ? "hsl(345, 55%, 50%)"
                            : "hsl(345, 45%, 72%)",
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Across {totalEntries} log entries with symptoms · {Object.keys(freqMap).length} unique symptoms tracked
            </p>
          </Card>

          {/* Phase breakdown (if enough data) */}
          {Object.keys(phaseSymptoms).length > 1 && (
            <Card className="p-5">
              <p className="label-caps mb-3">Top symptom by phase</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(phaseSymptoms)
                  .filter(([p]) => p !== "unknown" && PHASE_STYLES[p])
                  .map(([phase, sMap]) => {
                    const top = Object.entries(sMap).sort((a, b) => b[1] - a[1])[0];
                    if (!top) return null;
                    const style = PHASE_STYLES[phase];
                    return (
                      <div
                        key={phase}
                        className="rounded-xl px-3 py-2.5"
                        style={{ background: style.bg }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: style.text }}>
                          {style.label}
                        </p>
                        <p className="text-sm font-semibold text-foreground leading-tight">{top[0]}</p>
                        <p className="text-xs" style={{ color: style.text }}>{top[1]}×</p>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          {/* Search + phase filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search symptoms…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPinnedSymptom(null); }}
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Active filter indicator */}
            {pinnedSymptom && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="gap-1.5 cursor-pointer text-primary border-primary/30"
                  onClick={() => setPinnedSymptom(null)}
                >
                  {pinnedSymptom}
                  <X size={11} />
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Showing {filtered.length} entries
                </span>
              </div>
            )}

            {/* Phase tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {PHASE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPhaseFilter(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    phaseFilter === tab.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No entries match your search.
                </p>
              </Card>
            ) : (
              <>
                <p className="text-xs text-muted-foreground px-1">
                  {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}
                </p>
                {filtered.map((log) => {
                  const phase = log.phase ?? null;
                  const phaseStyle = phase && PHASE_STYLES[phase] ? PHASE_STYLES[phase] : null;
                  return (
                    <Card key={log.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <CalendarDays size={14} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="text-sm font-semibold text-foreground">
                              {format(parseISO(log.date), "EEEE, MMM d yyyy")}
                            </span>
                            {log.cycleDay && (
                              <span className="text-xs text-muted-foreground">
                                Day {log.cycleDay}
                              </span>
                            )}
                            {phaseStyle && (
                              <Badge
                                className="text-[10px] px-2 py-0.5 h-auto"
                                style={{
                                  background: phaseStyle.bg,
                                  color: phaseStyle.text,
                                  border: "none",
                                }}
                              >
                                {phaseStyle.label}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {log.symptoms.map((s) => {
                              const isActive =
                                pinnedSymptom === s ||
                                (search && s.toLowerCase().includes(search.toLowerCase()));
                              return (
                                <button
                                  key={s}
                                  onClick={() => handlePinSymptom(s)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                                    isActive
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                  )}
                                >
                                  {s}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
