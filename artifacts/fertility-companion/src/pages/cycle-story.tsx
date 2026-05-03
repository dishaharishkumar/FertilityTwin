import { useState } from "react";
import { useGetCycleStory, getGetCycleStoryQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

const PHASE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  menstrual:      { label: "Menstrual Phase",  emoji: "🌑", color: "text-red-700" },
  follicular:     { label: "Follicular Phase", emoji: "🌱", color: "text-amber-700" },
  ovulation:      { label: "Ovulation",         emoji: "🌸", color: "text-pink-700" },
  "two-week wait":{ label: "Two-Week Wait",     emoji: "🕊️", color: "text-rose-700" },
};

export default function CycleStoryPage() {
  const queryClient = useQueryClient();
  const [fetched, setFetched] = useState(false);

  const { data, isLoading, error, refetch } = useGetCycleStory({
    query: {
      queryKey: getGetCycleStoryQueryKey(),
      enabled: fetched,
    },
  });

  const phaseInfo = data ? (PHASE_LABELS[data.phase] ?? { label: data.phase, emoji: "✨", color: "text-primary" }) : null;

  const handleGenerate = () => {
    queryClient.removeQueries({ queryKey: getGetCycleStoryQueryKey() });
    setFetched(true);
    if (fetched) refetch();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={12} />
          Back to Dashboard
        </Link>
        <h1
          className="text-[1.85rem] text-foreground leading-tight"
          style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
        >
          Your Cycle Story
        </h1>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          A warm, personal narrative of your current cycle — written by Fertility Companion from your data.
        </p>
      </div>

      {/* Prompt card */}
      {!fetched && !isLoading && (
        <div
          className="rounded-3xl border border-primary/20 px-8 py-12 text-center"
          style={{
            background: "linear-gradient(145deg, #fffaf9 0%, #fff0f5 50%, #f5f0ff 100%)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg, hsl(345,48%,90%) 0%, hsl(280,30%,88%) 100%)" }}
          >
            <BookOpen size={26} className="text-primary" />
          </div>
          <p
            className="text-xl text-foreground mb-2"
            style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
          >
            Ready to read your story?
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">
            Fertility Companion will weave your cycle data into a personal narrative — not charts, but a chapter of your journey.
          </p>
          <Button
            onClick={handleGenerate}
            className="gap-2 rounded-xl px-6"
          >
            <Sparkles size={14} />
            Write my cycle story
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div
          className="rounded-3xl border border-primary/15 px-8 py-12 text-center"
          style={{
            background: "linear-gradient(145deg, #fffaf9 0%, #fff0f5 100%)",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={20} className="text-primary animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">Fertility Companion is reading your cycle and writing your story…</p>
            <div className="space-y-2 w-full max-w-sm">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/6" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-border bg-card px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {(error as { status?: number }).status === 404
              ? "No active cycle found. Start tracking your cycle first."
              : "Something went wrong. Please try again."}
          </p>
          <Link href="/cycle" className="text-xs text-primary font-semibold mt-3 inline-block hover:underline">
            Go to Cycle Tracker →
          </Link>
        </div>
      )}

      {/* Story */}
      {data && !isLoading && (
        <div className="space-y-4">
          {/* Cycle meta */}
          <div className="flex items-center gap-3 flex-wrap">
            {phaseInfo && (
              <span className={`text-sm font-semibold ${phaseInfo.color}`} style={{ fontFamily: "var(--app-font-serif)" }}>
                {phaseInfo.emoji} {phaseInfo.label}
              </span>
            )}
            <span className="label-caps">Day {data.cycleDay}</span>
            {data.startDate && (
              <span className="label-caps">Started {format(parseISO(data.startDate), "MMM d")}</span>
            )}
            <span className="label-caps">{data.logCount} days logged</span>
          </div>

          {/* Story card */}
          <div
            className="rounded-3xl border border-primary/15 px-8 py-8 relative overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #fffaf9 0%, #fff0f5 50%, #f5f0ff 100%)",
              boxShadow: "var(--shadow)",
            }}
          >
            <div className="absolute top-4 right-5 text-6xl opacity-[0.06] select-none" aria-hidden>✦</div>
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={13} className="text-primary/70" />
              <span className="label-caps" style={{ color: "hsl(345,30%,55%)" }}>Written by Fertility Companion</span>
            </div>
            <div
              className="text-sm text-foreground/80 leading-[1.85] whitespace-pre-wrap"
              style={{ fontFamily: "var(--app-font-serif)" }}
            >
              {data.story}
            </div>
            <div className="mt-6 pt-5 border-t border-primary/10 flex items-center justify-between">
              <p className="text-sm text-primary/70" style={{ fontFamily: "var(--app-font-serif)", fontStyle: "italic" }}>
                — Fertility Companion
              </p>
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw size={11} />
                Refresh
              </button>
            </div>
          </div>

          {/* Save to journal nudge */}
          <div
            className="rounded-2xl border border-border bg-card px-5 py-4 flex items-center justify-between"
            style={{ boxShadow: "var(--shadow-xs)" }}
          >
            <p className="text-sm text-muted-foreground">Want to reflect on this story?</p>
            <Link
              href="/journal"
              className="text-xs text-primary font-semibold hover:underline underline-offset-2"
            >
              Open Journal →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
