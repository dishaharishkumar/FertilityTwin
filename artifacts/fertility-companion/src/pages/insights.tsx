import { Link } from "wouter";
import { useGetInsights, getGetInsightsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const typeConfig: Record<string, { label: string; badge: string; border: string }> = {
  daily: {
    label: "Daily Insight",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    border: "#93c5fd",
  },
  tww_support: {
    label: "TWW Support",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    border: "#fb7185",
  },
  body_signal: {
    label: "Body Signal",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    border: "#fcd34d",
  },
  energy: {
    label: "Energy & Readiness",
    badge: "bg-green-50 text-green-700 border-green-200",
    border: "#86efac",
  },
  boundary: {
    label: "Boundary Protection",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    border: "#c4b5fd",
  },
};

export default function Insights() {
  const { data: insights, isLoading } = useGetInsights(
    { limit: 20 },
    { query: { queryKey: getGetInsightsQueryKey({ limit: 20 }) } }
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-[1.85rem] text-foreground leading-tight"
            style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
          >
            Insights
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your personalized AI-powered fertility guidance</p>
        </div>
        <Link href="/insights/generate" data-testid="link-new-insight">
          <Button size="sm" className="gap-1.5 rounded-xl">
            <Plus size={15} />
            New Insight
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
        </div>
      ) : insights && insights.length > 0 ? (
        <div className="space-y-4">
          {insights.map((insight) => {
            const cfg = typeConfig[insight.insightType];
            return (
              <div
                key={insight.id}
                className="rounded-2xl border border-border bg-card overflow-hidden"
                data-testid={`insight-card-${insight.id}`}
                style={{
                  boxShadow: "var(--shadow)",
                  borderLeft: `3px solid ${cfg?.border ?? "#ccc"}`,
                }}
              >
                <div className="px-5 pt-4 pb-2">
                  <div className="flex items-center justify-between mb-3">
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-semibold border", cfg?.badge ?? "")}
                      data-testid={`insight-type-badge-${insight.id}`}
                    >
                      {cfg?.label ?? insight.insightType}
                    </Badge>
                    <span className="label-caps">
                      {format(parseISO(insight.createdAt as unknown as string), "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-7" data-testid={`insight-text-${insight.id}`}>
                    {insight.insight}
                  </p>
                </div>
                {insight.recommendation && (
                  <div className="mx-5 mb-4 mt-2 rounded-xl bg-muted/40 px-4 py-3">
                    <p className="label-caps mb-1">Recommendation</p>
                    <p className="text-xs text-foreground/80 leading-relaxed" data-testid={`insight-recommendation-${insight.id}`}>
                      {insight.recommendation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, hsl(345,48%,92%) 0%, hsl(345,48%,84%) 100%)", boxShadow: "var(--shadow)" }}
          >
            <Sparkles size={26} className="text-primary" />
          </div>
          <p
            className="text-lg text-foreground"
            style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
          >
            No insights yet
          </p>
          <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-xs leading-relaxed">
            Generate your first AI insight to get personalized, data-grounded guidance
          </p>
          <Link href="/insights/generate" data-testid="link-first-insight">
            <Button className="gap-2 rounded-xl">
              <Sparkles size={15} />
              Get Your First Insight
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
