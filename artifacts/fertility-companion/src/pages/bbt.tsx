import { useMemo } from "react";
import { useGetLogs, useGetCurrentCycle } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, Thermometer, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { parseISO, format, differenceInDays } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Dot,
} from "recharts";

export default function BbtPage() {
  const { data: logsData, isLoading: logsLoading } = useGetLogs({ limit: 90 });
  const { data: cycleData, isLoading: cycleLoading } = useGetCurrentCycle();
  const isLoading = logsLoading || cycleLoading;

  const { chartData, coverline, ovulationDay, hasData } = useMemo(() => {
    const logs = ((logsData ?? []) as any[])
      .filter((l: any) => l.bbt !== null && l.bbt !== undefined)
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    if (logs.length === 0) return { chartData: [], coverline: null, ovulationDay: null, hasData: false };

    const startDate = cycleData?.cycle?.startDate
      ? parseISO((cycleData.cycle as any).startDate)
      : parseISO(logs[0].date);

    const chartData = logs.map((l: any) => ({
      day: differenceInDays(parseISO(l.date), startDate) + 1,
      date: format(parseISO(l.date), "MMM d"),
      bbt: parseFloat(String(l.bbt)),
    })).filter(d => d.day >= 1 && d.day <= 40);

    // Coverline: highest BBT in the first 10 days of cycle
    const preBbt = chartData.filter(d => d.day <= 10).map(d => d.bbt);
    const coverline = preBbt.length
      ? +(Math.max(...preBbt) + 0.05).toFixed(2)
      : null;

    // Detect ovulation: first day BBT is >= coverline after day 10
    const ovulationPoint = chartData.find(d => d.day > 10 && coverline && d.bbt >= coverline);
    const ovulationDay = ovulationPoint?.day ?? cycleData?.cycle
      ? (cycleData as any)?.cycle?.ovulationDay
      : null;

    return { chartData, coverline, ovulationDay, hasData: chartData.length > 0 };
  }, [logsData, cycleData]);

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!coverline) return <Dot cx={cx} cy={cy} r={3} fill="hsl(345,48%,56%)" />;
    const isAbove = payload.bbt >= coverline;
    return <Dot cx={cx} cy={cy} r={3.5} fill={isAbove ? "hsl(345,48%,40%)" : "hsl(345,48%,70%)"} stroke="white" strokeWidth={1} />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={12} /> Back
        </Link>
        <h1 className="text-[1.85rem] text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          BBT Chart
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Basal body temperature across your current cycle.</p>
      </div>

      {/* How to read */}
      <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 flex gap-3">
        <Info size={14} className="text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          BBT dips slightly just before ovulation, then rises 0.2°C+ and stays elevated. The dashed line is your
          <strong> coverline</strong> — calculated from your highest pre-ovulation temp. Darker dots = above coverline (post-ovulation).
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-3xl" />
      ) : hasData ? (
        <div className="rounded-3xl border border-primary/15 bg-card px-6 py-6" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
              This Cycle — {chartData.length} readings
            </p>
            {coverline && (
              <span className="label-caps text-primary">Coverline: {coverline}°C</span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(345 20% 94%)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(345 10% 55%)" }} tickLine={false} label={{ value: "Cycle Day", position: "insideBottom", offset: -2, fontSize: 10, fill: "hsl(345 10% 55%)" }} />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 10, fill: "hsl(345 10% 55%)" }}
                tickLine={false}
                tickFormatter={(v) => `${v}°`}
              />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid hsl(345 20% 90%)", fontSize: 12 }}
                formatter={(v: any) => [`${v}°C`, "BBT"]}
                labelFormatter={(l) => `Day ${l}`}
              />
              {coverline && (
                <ReferenceLine
                  y={coverline}
                  stroke="hsl(345 48% 56%)"
                  strokeDasharray="5 3"
                  strokeWidth={1.5}
                  label={{ value: "Coverline", position: "right", fontSize: 9, fill: "hsl(345 48% 56%)" }}
                />
              )}
              {ovulationDay && (
                <ReferenceLine
                  x={ovulationDay}
                  stroke="hsl(280 30% 60%)"
                  strokeDasharray="4 2"
                  label={{ value: "OV", position: "top", fontSize: 9, fill: "hsl(280 30% 50%)" }}
                />
              )}
              <Line
                type="monotone"
                dataKey="bbt"
                stroke="hsl(345,48%,56%)"
                strokeWidth={2}
                dot={<CustomDot />}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-border/60">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-full bg-primary/40 inline-block border border-white" /> Pre-ovulation
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-full inline-block border border-white" style={{ background: "hsl(345,48%,40%)" }} /> Post-ovulation
            </span>
            {ovulationDay && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-0.5 h-3 inline-block rounded" style={{ background: "hsl(280,30%,60%)" }} /> Ovulation
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Thermometer size={22} className="text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)" }}>No BBT readings yet</p>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
            Log your basal body temperature each morning before getting up. After at least 3 readings, your chart will appear here.
          </p>
          <Link href="/log" className="text-xs text-primary font-semibold hover:underline">Log today's BBT →</Link>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-2xl border border-border bg-card px-5 py-5 space-y-3" style={{ boxShadow: "var(--shadow-xs)" }}>
        <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>Tips for accurate BBT</p>
        {[
          "Take your temperature at the same time every morning, before getting out of bed.",
          "You need at least 3 hours of uninterrupted sleep before taking your temperature.",
          "Illness, alcohol the night before, or a restless night can all shift your temp — note it but don't panic.",
          "Use a basal thermometer (reads to 2 decimal places) for the most reliable results.",
        ].map((tip, i) => (
          <div key={i} className="flex gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 font-semibold mt-0.5">{i + 1}</span>
            <p className="text-sm text-muted-foreground">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
