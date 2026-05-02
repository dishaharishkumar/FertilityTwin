import { Link } from "wouter";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetReadinessScore, getGetReadinessScoreQueryKey, useGetCurrentCycle, getGetCurrentCycleQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Heart, AlertCircle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const phaseColors: Record<string, string> = {
  menstrual: "bg-red-100 text-red-700 border-red-200",
  follicular: "bg-amber-100 text-amber-700 border-amber-200",
  ovulation: "bg-primary/15 text-primary border-primary/30",
  luteal: "bg-purple-100 text-purple-700 border-purple-200",
  tww: "bg-rose-100 text-rose-700 border-rose-200",
};

const phaseLabels: Record<string, string> = {
  menstrual: "Menstrual Phase",
  follicular: "Follicular Phase",
  ovulation: "Ovulation Window",
  luteal: "Luteal Phase",
  tww: "Two-Week Wait",
};

function ReadinessRing({ score, label }: { score: number; label: string }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 75 ? "#6da87a" : score >= 50 ? "hsl(345 45% 65%)" : "#c8a063";

  return (
    <div className="flex flex-col items-center gap-2" data-testid="readiness-ring">
      <svg width="96" height="96" viewBox="0 0 96 96" className="rotate-[-90deg]">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="currentColor" strokeWidth="7" className="text-muted/40" />
        <circle
          cx="48" cy="48" r={radius} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-foreground" style={{ lineHeight: 1 }}>{score}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">score</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: readiness, isLoading: readinessLoading } = useGetReadinessScore({ query: { queryKey: getGetReadinessScoreQueryKey() } });
  const { data: currentCycle } = useGetCurrentCycle({ query: { queryKey: getGetCurrentCycleQueryKey() } });

  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{today}</p>
          <h1 className="text-2xl font-serif text-foreground mt-0.5">Good morning</h1>
        </div>
        {summary && summary.streakDays > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200" data-testid="streak-badge">
            <Flame size={14} className="text-amber-500" />
            <span className="text-xs font-medium text-amber-700">{summary.streakDays} day streak</span>
          </div>
        )}
      </div>

      {/* TWW Banner */}
      {(summary?.isInTww || currentCycle?.isInTww) && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-5 py-4" data-testid="tww-banner">
          <div className="flex items-start gap-3">
            <Heart size={18} className="text-rose-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-rose-800">Two-Week Wait</p>
              <p className="text-xs text-rose-600 mt-0.5 leading-relaxed">
                You are in the two-week wait. Be gentle with yourself. Your body is working quietly and beautifully.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Phase card */}
        <Card data-testid="phase-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Phase</CardTitle>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : summary?.currentPhase ? (
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className={cn("text-sm px-3 py-1 font-medium", phaseColors[summary.currentPhase] ?? "")}
                  data-testid="phase-badge"
                >
                  {phaseLabels[summary.currentPhase] ?? summary.currentPhase}
                </Badge>
                {summary.cycleDay && (
                  <p className="text-xs text-muted-foreground">Day {summary.cycleDay} of your cycle</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">No cycle started</p>
                <Link href="/cycle" data-testid="link-start-cycle" className="text-xs text-primary underline underline-offset-2">Start tracking</Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Readiness score card */}
        <Card data-testid="readiness-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Readiness Score</CardTitle>
          </CardHeader>
          <CardContent>
            {readinessLoading ? (
              <Skeleton className="h-12 w-20" />
            ) : readiness ? (
              <div className="space-y-1">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-foreground" data-testid="readiness-score-value">{readiness.overall}</span>
                  <span className="text-sm text-muted-foreground mb-1">/100</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{readiness.message}</p>
                <div className="flex gap-3 pt-1">
                  {readiness.sleepScore != null && (
                    <div className="text-center">
                      <div className="text-xs font-semibold text-foreground">{readiness.sleepScore}</div>
                      <div className="text-[10px] text-muted-foreground">Sleep</div>
                    </div>
                  )}
                  {readiness.stressScore != null && (
                    <div className="text-center">
                      <div className="text-xs font-semibold text-foreground">{readiness.stressScore}</div>
                      <div className="text-[10px] text-muted-foreground">Calm</div>
                    </div>
                  )}
                  {readiness.energyScore != null && (
                    <div className="text-center">
                      <div className="text-xs font-semibold text-foreground">{readiness.energyScore}</div>
                      <div className="text-[10px] text-muted-foreground">Energy</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Log today to see your score</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest insight */}
      {summary?.latestInsight && (
        <Card className="border-primary/20 bg-primary/5" data-testid="latest-insight-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              <CardTitle className="text-sm font-medium text-primary">Latest Insight</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3" data-testid="text-latest-insight">
              {summary.latestInsight}
            </p>
            <Link href="/insights" data-testid="link-all-insights" className="text-xs text-primary mt-2 inline-block underline underline-offset-2">See all insights</Link>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!summary?.lastLogDate || summary.lastLogDate !== format(new Date(), "yyyy-MM-dd") ? (
            <Link href="/log" data-testid="link-log-today" className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors px-5 py-4 block">
              <div className="flex items-center gap-3">
                <BookOpen size={18} className="text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Log today</p>
                  <p className="text-xs text-muted-foreground">Track your symptoms and vitals</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4" data-testid="logged-today-card">
              <div className="flex items-center gap-3">
                <BookOpen size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Logged today</p>
                  <Link href="/log" className="text-xs text-primary underline underline-offset-2">Update your log</Link>
                </div>
              </div>
            </div>
          )}

          <Link href="/insights/generate" data-testid="link-generate-insight" className="rounded-2xl border border-primary/20 bg-card hover:bg-primary/5 transition-colors px-5 py-4 block">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">Get an insight</p>
                <p className="text-xs text-muted-foreground">AI-powered fertility guidance</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent symptoms */}
      {summary?.recentSymptoms && summary.recentSymptoms.length > 0 && (
        <div data-testid="recent-symptoms-section">
          <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3">Recent Signals</h2>
          <div className="flex flex-wrap gap-2">
            {summary.recentSymptoms.map((s) => (
              <Badge key={s} variant="secondary" className="capitalize text-xs" data-testid={`symptom-badge-${s}`}>
                {s.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
