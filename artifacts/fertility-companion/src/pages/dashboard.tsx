import { Link } from "wouter";
import {
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetReadinessScore, getGetReadinessScoreQueryKey,
  useGetCurrentCycle, getGetCurrentCycleQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BookOpen, Heart, Flame, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const phaseConfig: Record<string, { label: string; description: string; gradient: string; border: string; text: string; badge: string }> = {
  menstrual: {
    label: "Menstrual Phase", description: "Rest & renewal",
    gradient: "linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)",
    border: "#fca5a5", text: "#991b1b", badge: "bg-red-100 text-red-700 border-red-200",
  },
  follicular: {
    label: "Follicular Phase", description: "Rising energy & clarity",
    gradient: "linear-gradient(135deg, #fffbeb 0%, #fef9c3 100%)",
    border: "#fcd34d", text: "#92400e", badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  ovulation: {
    label: "Ovulation Window", description: "Peak fertility",
    gradient: "linear-gradient(135deg, #fff0f5 0%, #fce7f3 100%)",
    border: "hsl(345,48%,72%)", text: "hsl(345,48%,35%)", badge: "bg-pink-100 text-pink-700 border-pink-200",
  },
  luteal: {
    label: "Luteal Phase", description: "Nesting & slowing down",
    gradient: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    border: "#c4b5fd", text: "#5b21b6", badge: "bg-purple-100 text-purple-700 border-purple-200",
  },
  tww: {
    label: "Two-Week Wait", description: "Quiet, hopeful waiting",
    gradient: "linear-gradient(135deg, #fff1f2 0%, #fce7f3 100%)",
    border: "#fb7185", text: "#9f1239", badge: "bg-rose-100 text-rose-700 border-rose-200",
  },
};

function ScoreRing({ score, sleep, stress, energy, message }: {
  score: number;
  sleep?: number | null;
  stress?: number | null;
  energy?: number | null;
  message?: string;
}) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? "#5d9e6a" : score >= 50 ? "hsl(345,48%,56%)" : "#c8963e";

  return (
    <div className="flex items-center gap-8">
      <div className="relative inline-flex items-center justify-center shrink-0" data-testid="readiness-ring">
        <svg width="112" height="112" viewBox="0 0 112 112" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="56" cy="56" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="9" />
          <circle
            cx="56" cy="56" r={r} fill="none"
            stroke={color} strokeWidth="9"
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            data-testid="readiness-score-value"
            className="text-3xl font-bold text-foreground leading-none"
            style={{ fontFamily: "var(--app-font-serif)" }}
          >
            {score}
          </span>
          <span className="label-caps mt-0.5">score</span>
        </div>
      </div>
      <div className="flex-1 space-y-2.5">
        {message && <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>}
        <div className="flex gap-4">
          {sleep != null && (
            <div>
              <div className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{sleep}</div>
              <div className="label-caps">Sleep</div>
            </div>
          )}
          {stress != null && (
            <div>
              <div className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{stress}</div>
              <div className="label-caps">Calm</div>
            </div>
          )}
          {energy != null && (
            <div>
              <div className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{energy}</div>
              <div className="label-caps">Energy</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: readiness, isLoading: readinessLoading } = useGetReadinessScore({ query: { queryKey: getGetReadinessScoreQueryKey() } });
  const { data: currentCycle } = useGetCurrentCycle({ query: { queryKey: getGetCurrentCycleQueryKey() } });

  const today = format(new Date(), "EEEE, MMMM d");
  const phase = summary?.currentPhase ?? currentCycle?.phase ?? null;
  const cfg = phase ? phaseConfig[phase] : null;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="label-caps">{today}</p>
          <h1
            className="text-[1.85rem] text-foreground mt-1 leading-tight"
            style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
          >
            Good morning
          </h1>
        </div>
        {summary && summary.streakDays > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50"
            data-testid="streak-badge"
          >
            <Flame size={13} className="text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">{summary.streakDays} day streak</span>
          </div>
        )}
      </div>

      {/* TWW Banner */}
      {(summary?.isInTww || currentCycle?.isInTww) && (
        <div
          className="rounded-2xl border border-rose-200 px-5 py-4"
          data-testid="tww-banner"
          style={{
            background: "linear-gradient(135deg, #fff1f2 0%, #fce7f3 100%)",
            borderLeft: "4px solid #fb7185",
            boxShadow: "0 2px 8px rgba(200,60,90,0.08)",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mt-0.5">
              <Heart size={15} className="text-rose-500" />
            </div>
            <div>
              <p
                className="text-sm font-semibold text-rose-800"
                style={{ fontFamily: "var(--app-font-serif)" }}
              >
                Two-Week Wait
              </p>
              <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                Be gentle with yourself — your body is working quietly and beautifully. This is a sacred pause.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Phase Hero */}
      {summaryLoading ? (
        <Skeleton className="h-36 w-full rounded-3xl" />
      ) : summary?.currentPhase && cfg ? (
        <div
          data-testid="phase-card"
          className="rounded-3xl border px-7 py-6"
          style={{
            background: cfg.gradient,
            borderColor: cfg.border,
            borderWidth: "1.5px",
            boxShadow: "var(--shadow)",
          }}
        >
          <p className="label-caps" style={{ color: cfg.text, opacity: 0.8 }}>{cfg.description}</p>
          <div className="flex items-baseline gap-3 mt-2">
            <span
              className="text-6xl font-bold leading-none"
              style={{ fontFamily: "var(--app-font-serif)", color: cfg.text }}
            >
              {summary.cycleDay ?? "—"}
            </span>
            <span className="text-base font-medium" style={{ color: cfg.text, opacity: 0.6 }}>day</span>
          </div>
          <Badge
            data-testid="phase-badge"
            variant="outline"
            className={cn("mt-3 text-xs font-semibold px-2.5 py-0.5 border", cfg.badge)}
          >
            {cfg.label}
          </Badge>
        </div>
      ) : (
        <div
          className="rounded-3xl border-2 border-dashed border-primary/25 bg-primary/5 px-7 py-8 text-center"
          data-testid="phase-card"
        >
          <p className="text-sm text-muted-foreground">No active cycle tracked yet</p>
          <Link href="/cycle" data-testid="link-start-cycle" className="text-sm text-primary font-semibold mt-2 inline-block hover:underline underline-offset-2">
            Start tracking
          </Link>
        </div>
      )}

      {/* Readiness Score */}
      <div
        className="rounded-2xl bg-card border border-border px-6 py-5"
        data-testid="readiness-card"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <p className="label-caps mb-4">Readiness Score</p>
        {readinessLoading ? (
          <div className="flex items-center gap-8">
            <Skeleton className="w-28 h-28 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ) : readiness ? (
          <ScoreRing
            score={readiness.overall}
            sleep={readiness.sleepScore}
            stress={readiness.stressScore}
            energy={readiness.energyScore}
            message={readiness.message}
          />
        ) : (
          <p className="text-sm text-muted-foreground py-2">Log today to see your readiness score</p>
        )}
      </div>

      {/* Latest Insight */}
      {summary?.latestInsight && (
        <div
          className="rounded-2xl border border-primary/20 px-5 py-4"
          data-testid="latest-insight-card"
          style={{
            background: "linear-gradient(135deg, #fff8fa 0%, #fdf2f8 100%)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={13} className="text-primary" />
            <span className="label-caps" style={{ color: "hsl(var(--primary))" }}>Latest Insight</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3" data-testid="text-latest-insight">
            {summary.latestInsight}
          </p>
          <Link href="/insights" data-testid="link-all-insights" className="text-xs text-primary font-semibold mt-3 inline-block hover:underline underline-offset-2">
            View all insights →
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <p className="label-caps">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!summary?.lastLogDate || summary.lastLogDate !== format(new Date(), "yyyy-MM-dd") ? (
            <Link
              href="/log"
              data-testid="link-log-today"
              className="flex items-center gap-3.5 rounded-2xl border border-primary/20 bg-card hover:bg-primary/5 hover:border-primary/30 transition-all px-4 py-4 group"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0 group-hover:bg-primary/18 transition-colors">
                <BookOpen size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Log today</p>
                <p className="text-xs text-muted-foreground mt-0.5">Track symptoms & vitals</p>
              </div>
            </Link>
          ) : (
            <div
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-muted/20 px-4 py-4"
              data-testid="logged-today-card"
            >
              <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                <BookOpen size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Logged today</p>
                <Link href="/log" className="text-xs text-primary font-medium hover:underline underline-offset-2">Update your log</Link>
              </div>
            </div>
          )}

          <Link
            href="/chat"
            data-testid="link-generate-insight"
            className="flex items-center gap-3.5 rounded-2xl border border-primary/20 bg-card hover:bg-primary/5 hover:border-primary/30 transition-all px-4 py-4 group"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0 group-hover:bg-primary/18 transition-colors">
              <MessageCircle size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Talk to Bloom</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ask about your body or feelings</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Signals */}
      {summary?.recentSymptoms && summary.recentSymptoms.length > 0 && (
        <div data-testid="recent-symptoms-section">
          <p className="label-caps mb-3">Recent Signals</p>
          <div className="flex flex-wrap gap-2">
            {summary.recentSymptoms.map((s) => (
              <span
                key={s}
                data-testid={`symptom-badge-${s}`}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground border border-border capitalize"
              >
                {s.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
