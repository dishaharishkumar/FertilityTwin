import { useMemo } from "react";
import { useGetLogs, useGetCycles } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, Calendar, Activity, Droplets } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { differenceInDays, parseISO } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
} from "recharts";

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4 flex items-start gap-4" style={{ boxShadow: "var(--shadow-xs)" }}>
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={17} className="text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground label-caps">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5" style={{ fontFamily: "var(--app-font-serif)" }}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const MOOD_MAP: Record<string, number> = {
  "amazing": 5, "happy": 4, "good": 4, "okay": 3, "neutral": 3,
  "tired": 2, "sad": 2, "low": 2, "anxious": 2, "irritable": 1, "awful": 1,
};

const PHASE_COLORS: Record<string, string> = {
  menstrual: "#e57373", follicular: "#81c784", ovulation: "#f06292", tww: "#ba68c8",
};

function getPhase(day: number) {
  if (day <= 5) return "menstrual";
  if (day <= 13) return "follicular";
  if (day <= 16) return "ovulation";
  return "tww";
}

export default function StatsPage() {
  const { data: logsData, isLoading: logsLoading } = useGetLogs({ limit: 365 });
  const { data: cyclesData, isLoading: cyclesLoading } = useGetCycles();

  const isLoading = logsLoading || cyclesLoading;

  const stats = useMemo(() => {
    const logs = logsData ?? [];
    const cycles = (cyclesData ?? []) as any[];

    // Avg cycle length
    const cycleLengths = cycles
      .filter((c) => c.cycleLength)
      .map((c) => c.cycleLength as number);
    const avgCycleLength = cycleLengths.length
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : null;

    // Log count
    const logCount = logs.length;

    // BBT logs
    const bbtLogs = logs.filter((l: any) => l.bbt !== null && l.bbt !== undefined);

    // Avg energy
    const energyLogs = logs.filter((l: any) => l.energyLevel !== null);
    const avgEnergy = energyLogs.length
      ? (energyLogs.reduce((a: number, l: any) => a + l.energyLevel, 0) / energyLogs.length).toFixed(1)
      : null;

    // Mood/Energy wave by cycle day (average across all cycles)
    const dayMap: Record<number, { energy: number[]; mood: number[] }> = {};
    for (const log of logs as any[]) {
      const logDate = parseISO(log.date);
      // Find which cycle this log belongs to
      const owningCycle = cycles
        .slice()
        .sort((a: any, b: any) => b.startDate.localeCompare(a.startDate))
        .find((c: any) => parseISO(c.startDate) <= logDate);
      if (!owningCycle) continue;
      const cycleDay = differenceInDays(logDate, parseISO(owningCycle.startDate)) + 1;
      if (cycleDay < 1 || cycleDay > 35) continue;
      if (!dayMap[cycleDay]) dayMap[cycleDay] = { energy: [], mood: [] };
      if (log.energyLevel !== null) dayMap[cycleDay].energy.push(log.energyLevel);
      if (log.mood && MOOD_MAP[log.mood.toLowerCase()]) {
        dayMap[cycleDay].mood.push(MOOD_MAP[log.mood.toLowerCase()]);
      }
    }
    const waveData = Array.from({ length: 28 }, (_, i) => {
      const day = i + 1;
      const entry = dayMap[day];
      return {
        day,
        phase: getPhase(day),
        energy: entry?.energy.length ? +(entry.energy.reduce((a, b) => a + b, 0) / entry.energy.length).toFixed(1) : null,
        mood: entry?.mood.length ? +(entry.mood.reduce((a, b) => a + b, 0) / entry.mood.length).toFixed(1) : null,
      };
    });

    // Symptom frequency
    const symptomCount: Record<string, number> = {};
    for (const log of logs as any[]) {
      for (const s of (log.symptoms as string[]) ?? []) {
        symptomCount[s] = (symptomCount[s] ?? 0) + 1;
      }
    }
    const topSymptoms = Object.entries(symptomCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    return { avgCycleLength, logCount, bbtLogs: bbtLogs.length, avgEnergy, waveData, topSymptoms };
  }, [logsData, cyclesData]);

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={12} /> Back
        </Link>
        <h1 className="text-[1.85rem] text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          My Cycle Stats
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Your personal patterns, built from your data.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Days Logged" value={String(stats.logCount)} sub="total entries" icon={Calendar} />
            <StatCard label="Avg Cycle" value={stats.avgCycleLength ? `${stats.avgCycleLength}d` : "—"} sub="cycle length" icon={Activity} />
            <StatCard label="BBT Readings" value={String(stats.bbtLogs)} sub="temperature logs" icon={TrendingUp} />
            <StatCard label="Avg Energy" value={stats.avgEnergy ? `${stats.avgEnergy}/10` : "—"} sub="across all days" icon={Droplets} />
          </div>

          {/* Mood & Energy Wave */}
          <div className="rounded-3xl border border-primary/15 bg-card px-6 py-6" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>Mood & Energy Wave</p>
            <p className="text-xs text-muted-foreground mb-5">Your average energy and mood across your cycle days</p>
            {stats.waveData.some(d => d.energy !== null || d.mood !== null) ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={stats.waveData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(345 20% 94%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(345 10% 55%)" }} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "hsl(345 10% 55%)" }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(345 20% 90%)", fontSize: 12 }}
                    formatter={(value: any, name: string) => [value, name === "energy" ? "Energy" : "Mood"]}
                    labelFormatter={(l) => `Day ${l}`}
                  />
                  <ReferenceLine x={14} stroke="hsl(345 48% 70%)" strokeDasharray="4 2" label={{ value: "Ovulation", position: "top", fontSize: 9, fill: "hsl(345 48% 56%)" }} />
                  <Line type="monotone" dataKey="energy" stroke="hsl(345 48% 56%)" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="mood" stroke="hsl(280 30% 60%)" strokeWidth={2} dot={false} strokeDasharray="5 3" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Log more days to see your personal wave.</p>
            )}
            <div className="flex items-center gap-5 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-4 h-0.5 bg-primary inline-block rounded" /> Energy</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-4 h-0.5 bg-purple-400 inline-block rounded" style={{ backgroundImage: "repeating-linear-gradient(to right, hsl(280,30%,60%) 0, hsl(280,30%,60%) 5px, transparent 5px, transparent 8px)" }} /> Mood</span>
            </div>
          </div>

          {/* Symptom Frequency */}
          {stats.topSymptoms.length > 0 && (
            <div className="rounded-3xl border border-primary/15 bg-card px-6 py-6" style={{ boxShadow: "var(--shadow-sm)" }}>
              <p className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>Most Common Symptoms</p>
              <p className="text-xs text-muted-foreground mb-5">Ranked by how often they appear in your logs</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.topSymptoms} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(345 10% 55%)" }} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(345 10% 45%)" }} tickLine={false} width={60} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(345 20% 90%)", fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {stats.topSymptoms.map((_, i) => (
                      <Cell key={i} fill={`hsl(345, 48%, ${72 - i * 6}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {stats.logCount === 0 && (
            <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">Start logging daily to see your personal patterns here.</p>
              <Link href="/log" className="text-xs text-primary font-semibold mt-3 inline-block hover:underline">Log today →</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
