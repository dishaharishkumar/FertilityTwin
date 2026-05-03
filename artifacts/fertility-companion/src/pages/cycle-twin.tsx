import { useEffect, useState, useMemo } from "react";
import { useGetLogs, useGetDashboardSummary, useGetCycles } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { differenceInDays, parseISO } from "date-fns";
import { Users, Shield, RefreshCw, Sparkles, ArrowRight } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getBucket(avg: number | null): string {
  if (!avg) return "27–29 days";
  if (avg < 24) return "Under 24 days";
  if (avg <= 26) return "24–26 days";
  if (avg <= 29) return "27–29 days";
  if (avg <= 32) return "30–32 days";
  if (avg <= 35) return "33–35 days";
  return "Over 35 days";
}

function getOrCreateAnonId(): string {
  const key = "bloom_anonymous_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

interface MatchResult {
  twinCount: number;
  commonSymptoms: { symptom: string; count: number }[];
  bucket: string;
  totalUsers: number;
}

export default function CycleTwinPage() {
  const { data: logsData } = useGetLogs({ limit: 500 });
  const { data: dashboard } = useGetDashboardSummary();
  const { data: cyclesData } = useGetCycles();

  const [registered, setRegistered] = useState(false);
  const [matches, setMatches] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [anonId] = useState(getOrCreateAnonId);

  const { bucket, topSymptoms, avgCycleLength } = useMemo(() => {
    const logs = (logsData ?? []) as any[];
    const cycles = (cyclesData ?? []) as any[];

    let avgLen: number | null = (dashboard as any)?.avgCycleLength ?? null;
    if (!avgLen && cycles.length >= 2) {
      const sorted = [...cycles].sort((a, b) => b.startDate.localeCompare(a.startDate));
      const lengths: number[] = [];
      for (let i = 0; i < Math.min(sorted.length - 1, 5); i++) {
        const len = differenceInDays(parseISO(sorted[i].startDate), parseISO(sorted[i + 1].startDate));
        if (len > 18 && len < 50) lengths.push(len);
      }
      if (lengths.length > 0) avgLen = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
    }

    const bucket = getBucket(avgLen);

    const freq: Record<string, number> = {};
    for (const log of logs) {
      for (const s of (log.symptoms ?? []) as string[]) {
        freq[s] = (freq[s] ?? 0) + 1;
      }
    }
    const topSymptoms = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s]) => s);

    return { bucket, topSymptoms, avgCycleLength: avgLen };
  }, [logsData, dashboard, cyclesData]);

  const hasEnoughData = (cyclesData as any[])?.length >= 1;

  async function registerAndFetch() {
    setLoading(true);
    try {
      await fetch(`${BASE}/api/cycle-twin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anonymousId: anonId, cycleLengthBucket: bucket, topSymptoms }),
      });
      const res = await fetch(
        `${BASE}/api/cycle-twin/matches?bucket=${encodeURIComponent(bucket)}&anonymousId=${anonId}`
      );
      const data = await res.json();
      setMatches(data);
      setRegistered(true);
    } finally {
      setLoading(false);
    }
  }

  const maxCount = matches?.commonSymptoms[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl text-foreground mb-1"
          style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
        >
          Cycle Twin
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Find anonymous users with cycles like yours. See what they commonly experience — no names, no ages, no personal data ever shared.
        </p>
      </div>

      {/* Privacy promise */}
      <Card className="p-4 flex gap-3" style={{ background: "hsl(160,40%,97%)", borderColor: "hsl(160,35%,85%)" }}>
        <Shield size={16} className="flex-shrink-0 mt-0.5 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-800 mb-0.5">Fully anonymous</p>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Fertility Companion shares only your cycle length range and top symptom categories — never your name, dates, location, or any identifying information. Your anonymous ID is randomly generated and only stored in this browser.
          </p>
        </div>
      </Card>

      {!hasEnoughData ? (
        <Card className="p-8 text-center">
          <Users size={32} className="text-primary mx-auto mb-3 opacity-50" />
          <p className="text-sm font-semibold text-foreground mb-1">Log a cycle first</p>
          <p className="text-sm text-muted-foreground">
            Record at least one cycle start date to find your twins.
          </p>
        </Card>
      ) : !registered ? (
        <>
          {/* Your profile preview */}
          <Card className="p-5 space-y-4">
            <p className="label-caps">Your anonymous profile</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cycle length group</span>
                <Badge variant="secondary" className="font-semibold">{bucket}</Badge>
              </div>
              {avgCycleLength && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your average</span>
                  <span className="text-sm font-semibold text-foreground">{Math.round(avgCycleLength)} days</span>
                </div>
              )}
              <div>
                <span className="text-sm text-muted-foreground block mb-2">Top symptoms you log</span>
                {topSymptoms.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {topSymptoms.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No symptoms logged yet — twins will still be found by cycle length</p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
              This is exactly what gets shared — nothing more.
            </p>
          </Card>

          <Button
            onClick={registerAndFetch}
            disabled={loading}
            className="w-full gap-2"
          >
            {loading ? (
              <><RefreshCw size={15} className="animate-spin" />Finding your twins…</>
            ) : (
              <><Sparkles size={15} />Find my Cycle Twins</>
            )}
          </Button>
        </>
      ) : matches ? (
        <>
          {/* Twin count hero */}
          <Card className="p-6 text-center space-y-2">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ background: "hsl(345, 45%, 92%)" }}
            >
              <Users size={34} className="text-primary" />
            </div>
            <p
              className="text-4xl font-bold text-foreground mt-2"
              style={{ fontFamily: "var(--app-font-serif)" }}
            >
              {matches.twinCount}
            </p>
            <p className="text-base text-muted-foreground">
              Cycle Twin{matches.twinCount !== 1 ? "s" : ""} found
            </p>
            <Badge variant="secondary" className="text-xs">
              {bucket}
            </Badge>
            <p className="text-xs text-muted-foreground pt-1">
              {matches.totalUsers} total users in this group · {matches.twinCount} others with similar patterns
            </p>
          </Card>

          {/* What twins experience */}
          {matches.commonSymptoms.length > 0 ? (
            <Card className="p-5">
              <p className="label-caps mb-4">What your twins most commonly experience</p>
              <div className="space-y-3">
                {matches.commonSymptoms.map(({ symptom, count }) => {
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={symptom}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{symptom}</span>
                        <span className="text-xs text-muted-foreground">{count} twin{count !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: "hsl(345, 48%, 68%)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-4 italic" style={{ fontFamily: "var(--app-font-serif)" }}>
                You are not alone in what you feel. Your twins are charting similar journeys.
              </p>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Your twins haven't logged enough symptoms yet. Check back as more users join.
              </p>
            </Card>
          )}

          {/* Your contribution */}
          <Card className="p-5 space-y-3">
            <p className="label-caps">Your contribution to the group</p>
            <div className="flex items-start gap-3">
              <ArrowRight size={14} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground">
                  Cycle group: <strong>{bucket}</strong>
                </p>
                {topSymptoms.length > 0 && (
                  <p className="text-sm text-foreground mt-1">
                    Symptoms shared: <strong>{topSymptoms.slice(0, 3).join(", ")}</strong>
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  Your data helps others in your group feel less alone — anonymously.
                </p>
              </div>
            </div>
          </Card>

          <Button
            variant="outline"
            onClick={registerAndFetch}
            disabled={loading}
            className="w-full gap-2"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh twins
          </Button>
        </>
      ) : null}
    </div>
  );
}
