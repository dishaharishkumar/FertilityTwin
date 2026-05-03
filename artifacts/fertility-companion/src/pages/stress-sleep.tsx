import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
} from "recharts";
import { Brain, Moon, Lightbulb, TrendingDown } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface StressBucket { label: string; days: number; avgSymptoms: number; avgMood: number; avgBbt: number | null }
interface SleepBucket { label: string; days: number; avgSymptoms: number; avgEnergy: number; avgBbt: number | null }
interface TimelineEntry { date: string; stress: number; sleep: number; energy: number; symptoms: number; bbt: number | null; mood: string }
interface Data {
  stressBuckets: StressBucket[];
  sleepBuckets: SleepBucket[];
  timeline: TimelineEntry[];
  totalDays: number;
  insight: string;
}

const STRESS_COLORS = ["#10b981", "#f59e0b", "#f43f5e"];
const SLEEP_COLORS = ["#f43f5e", "#f59e0b", "#10b981", "#06b6d4"];

function EmptyCard({ icon: Icon, msg }: { icon: React.ElementType; msg: string }) {
  return (
    <Card className="p-10 text-center">
      <Icon size={28} className="mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{msg}</p>
    </Card>
  );
}

interface TooltipProps { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }

function BarTip({ active, payload, label }: TooltipProps) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-xl bg-white shadow-lg border border-border p-3 text-xs space-y-1.5">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function StressSleepPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/stress-sleep-impact`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-2xl bg-muted/50 animate-pulse" />)}
      </div>
    );
  }

  if (!data) return <EmptyCard icon={Brain} msg="Could not load data. Please try again." />;

  const noData = data.totalDays === 0;
  const hasTimeline = data.timeline.length >= 5;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Stress & Sleep Impact
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          How your logged stress and sleep affect symptoms, energy, and BBT — built entirely from your data.
        </p>
      </div>

      {noData ? (
        <EmptyCard icon={Brain} msg="No logs yet. Start logging daily to unlock your personal stress and sleep patterns." />
      ) : (
        <>
          {data.insight && (
            <div className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm bg-primary/5 border border-primary/20">
              <Lightbulb size={15} className="mt-0.5 flex-shrink-0 text-primary" />
              <p className="text-muted-foreground leading-relaxed">{data.insight}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Days logged", value: data.totalDays },
              { label: "Avg stress", value: data.timeline.length ? (data.timeline.reduce((a, b) => a + b.stress, 0) / data.timeline.length).toFixed(1) + "/10" : "—" },
              { label: "Avg sleep", value: data.timeline.length ? (data.timeline.reduce((a, b) => a + b.sleep, 0) / data.timeline.length).toFixed(1) + "h" : "—" },
            ].map((s) => (
              <Card key={s.label} className="p-3">
                <p className="text-xl font-bold" style={{ fontFamily: "var(--app-font-serif)", color: "var(--primary)" }}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
              </Card>
            ))}
          </div>

          {data.stressBuckets.length > 0 && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Brain size={15} className="text-primary" />
                <h2 className="text-sm font-semibold">Stress level vs. symptoms</h2>
              </div>
              <p className="text-xs text-muted-foreground">Average number of symptoms logged per stress level group.</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.stressBuckets} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={24} />
                  <Tooltip content={<BarTip />} />
                  <Bar dataKey="avgSymptoms" name="Avg symptoms" radius={[6, 6, 0, 0]}>
                    {data.stressBuckets.map((_, i) => (
                      <Cell key={i} fill={STRESS_COLORS[i % STRESS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground text-center">
                {data.stressBuckets.find((b) => b.label.startsWith("High"))?.days ?? 0} high-stress days · {data.stressBuckets.find((b) => b.label.startsWith("Low"))?.days ?? 0} low-stress days logged
              </p>
            </Card>
          )}

          {data.sleepBuckets.length > 0 && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Moon size={15} className="text-primary" />
                <h2 className="text-sm font-semibold">Sleep hours vs. energy</h2>
              </div>
              <p className="text-xs text-muted-foreground">Average energy score (out of 10) by how many hours you slept.</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.sleepBuckets} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[0, 10]} width={24} />
                  <Tooltip content={<BarTip />} />
                  <Bar dataKey="avgEnergy" name="Avg energy" radius={[6, 6, 0, 0]}>
                    {data.sleepBuckets.map((_, i) => (
                      <Cell key={i} fill={SLEEP_COLORS[i % SLEEP_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {data.sleepBuckets.length > 0 && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown size={15} className="text-primary" />
                <h2 className="text-sm font-semibold">Sleep hours vs. symptom load</h2>
              </div>
              <p className="text-xs text-muted-foreground">Less sleep → more symptoms? Your data tells the story.</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.sleepBuckets} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={24} />
                  <Tooltip content={<BarTip />} />
                  <Bar dataKey="avgSymptoms" name="Avg symptoms" radius={[6, 6, 0, 0]}>
                    {data.sleepBuckets.map((_, i) => (
                      <Cell key={i} fill={SLEEP_COLORS[i % SLEEP_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {hasTimeline && (
            <Card className="p-4 space-y-3">
              <h2 className="text-sm font-semibold">Stress & sleep over time</h2>
              <p className="text-xs text-muted-foreground">Your daily stress and sleep scores across all logged days.</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "#94a3b8" }} width={24} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #e2e8f0" }}
                    labelFormatter={(l) => `Date: ${l}`}
                  />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="stress" name="Stress" stroke="#f43f5e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line dataKey="sleep" name="Sleep (h)" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line dataKey="energy" name="Energy" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {!hasTimeline && data.totalDays > 0 && (
            <Card className="p-5 text-center border-dashed">
              <p className="text-sm text-muted-foreground">
                Log <strong>{5 - data.timeline.length} more days</strong> to unlock the full timeline view.
              </p>
            </Card>
          )}

          <p className="text-[11px] text-muted-foreground text-center pb-2">
            All analysis is built from your own logged data. No inferences are made from external sources.
          </p>
        </>
      )}
    </div>
  );
}
