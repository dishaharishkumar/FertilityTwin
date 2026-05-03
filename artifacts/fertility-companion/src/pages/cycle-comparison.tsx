import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { GitCompare } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface CycleMeta {
  id: number;
  startDate: string;
  label: string;
  isCurrent: boolean;
  length: number;
  loggedDays: number;
}

interface Data {
  cycles: CycleMeta[];
  days: Record<string, number | null | string>[];
}

const CYCLE_COLORS = ["#ec4899", "#8b5cf6", "#06b6d4"];
const CYCLE_DASH = ["", "5 5", "2 4"];

const METRICS = [
  { key: "bbt", label: "BBT (°C)", domain: [36.0, 37.2] as [number, number], unit: "°C", color: "#f43f5e" },
  { key: "energy", label: "Energy", domain: [0, 10] as [number, number], unit: "/10", color: "#10b981" },
  { key: "stress", label: "Stress", domain: [0, 10] as [number, number], unit: "/10", color: "#f59e0b" },
  { key: "symptoms", label: "Symptom count", domain: [0, 6] as [number, number], unit: "", color: "#8b5cf6" },
];

interface TipProps {
  active?: boolean;
  payload?: { color: string; name: string; value: number; strokeDasharray?: string }[];
  label?: number;
}

function ChartTip({ active, payload, label }: TipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const valid = payload.filter((p) => p.value != null);
  if (valid.length === 0) return null;
  return (
    <div className="rounded-xl bg-white shadow-lg border border-border p-3 text-xs space-y-1.5 max-w-[200px]">
      <p className="font-semibold text-foreground">Day {label}</p>
      {valid.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground truncate">{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function MetricChart({
  metric, cycles, days,
}: { metric: (typeof METRICS)[0]; cycles: CycleMeta[]; days: Record<string, number | null | string>[] }) {
  const hasData = days.some((d) =>
    cycles.some((c) => d[`${metric.key}_${c.label}`] != null)
  );

  if (!hasData) return null;

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold">{metric.label}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={days}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            label={{ value: "Cycle day", position: "insideBottom", offset: -2, fontSize: 10, fill: "#94a3b8" }}
            height={28}
          />
          <YAxis
            domain={metric.domain}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            width={30}
            tickFormatter={(v) => `${v}${metric.unit}`}
          />
          <Tooltip content={<ChartTip />} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          {cycles.map((c, i) => (
            <Line
              key={c.label}
              dataKey={`${metric.key}_${c.label}`}
              name={c.label + (c.isCurrent ? " (current)" : "")}
              stroke={CYCLE_COLORS[i]}
              strokeWidth={c.isCurrent ? 2.5 : 1.8}
              strokeDasharray={CYCLE_DASH[i]}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default function CycleComparisonPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/cycles/comparison`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-48 rounded-2xl bg-muted/50 animate-pulse" />)}
      </div>
    );
  }

  if (!data || data.cycles.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
            Cycle Comparison
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your last 3 cycles lined up side-by-side — BBT, energy, stress, and symptoms.
          </p>
        </div>
        <Card className="p-10 text-center">
          <GitCompare size={32} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No cycles to compare yet</p>
          <p className="text-xs text-muted-foreground mt-1">Log at least one cycle start date to see your data here.</p>
        </Card>
      </div>
    );
  }

  const { cycles, days } = data;

  // per-cycle stats
  const statsKeys: { key: keyof typeof cycles[0]; label: string }[] = [
    { key: "length", label: "Length" },
    { key: "loggedDays", label: "Days logged" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Cycle Comparison
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your last {cycles.length} cycle{cycles.length > 1 ? "s" : ""} lined up side-by-side — BBT, energy, stress, and symptom patterns.
        </p>
      </div>

      {/* Cycle summary row */}
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${cycles.length}, 1fr)` }}>
        {cycles.map((c, i) => (
          <Card key={c.id} className="p-3 space-y-1" style={{ borderTop: `3px solid ${CYCLE_COLORS[i]}` }}>
            <div className="flex items-center justify-between gap-1">
              <span className="text-sm font-semibold" style={{ color: CYCLE_COLORS[i] }}>{c.label}</span>
              {c.isCurrent && (
                <span className="text-[9px] label-caps px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">current</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{c.length} days · {c.loggedDays} logged</p>
          </Card>
        ))}
      </div>

      {/* Colour legend */}
      <div className="flex gap-3 flex-wrap text-xs">
        {cycles.map((c, i) => (
          <span key={c.label} className="flex items-center gap-1.5">
            <span
              className="inline-block w-6 h-0.5"
              style={{
                background: CYCLE_COLORS[i],
                borderTop: `2px ${i === 0 ? "solid" : i === 1 ? "dashed" : "dotted"} ${CYCLE_COLORS[i]}`,
              }}
            />
            <span className="text-muted-foreground">{c.label}{c.isCurrent ? " (current)" : ""}</span>
          </span>
        ))}
      </div>

      {METRICS.map((m) => (
        <MetricChart key={m.key} metric={m} cycles={cycles} days={days} />
      ))}

      {data.cycles.length === 1 && (
        <Card className="p-5 text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            Only 1 cycle logged so far — comparison charts will appear once you have 2+ cycles recorded.
          </p>
        </Card>
      )}

      <p className="text-[11px] text-muted-foreground text-center pb-2">
        Only days you logged are plotted — gaps mean no entry that day. Solid line = current cycle.
      </p>
    </div>
  );
}
