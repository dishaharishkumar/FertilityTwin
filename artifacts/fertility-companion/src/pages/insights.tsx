import { Link } from "wouter";
import { useGetInsights, getGetInsightsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  daily: "bg-blue-50 text-blue-700 border-blue-200",
  tww_support: "bg-rose-50 text-rose-700 border-rose-200",
  body_signal: "bg-amber-50 text-amber-700 border-amber-200",
  energy: "bg-green-50 text-green-700 border-green-200",
  boundary: "bg-purple-50 text-purple-700 border-purple-200",
};

const typeLabels: Record<string, string> = {
  daily: "Daily Insight",
  tww_support: "TWW Support",
  body_signal: "Body Signal",
  energy: "Energy & Readiness",
  boundary: "Boundary Protection",
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
          <h1 className="text-2xl font-serif text-foreground">Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">Your personalized AI-powered fertility guidance</p>
        </div>
        <Link href="/insights/generate" data-testid="link-new-insight">
          <Button size="sm" className="gap-1.5">
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
          {insights.map((insight) => (
            <Card key={insight.id} className="overflow-hidden" data-testid={`insight-card-${insight.id}`}>
              <CardHeader className="pb-2 pt-4 px-5">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={cn("text-xs", typeColors[insight.insightType] ?? "")}
                    data-testid={`insight-type-badge-${insight.id}`}
                  >
                    {typeLabels[insight.insightType] ?? insight.insightType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(insight.createdAt as unknown as string), "MMM d, yyyy")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className="text-sm text-foreground leading-relaxed" data-testid={`insight-text-${insight.id}`}>
                  {insight.insight}
                </p>
                {insight.recommendation && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Recommendation</p>
                    <p className="text-xs text-foreground/80 leading-relaxed" data-testid={`insight-recommendation-${insight.id}`}>
                      {insight.recommendation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles size={40} className="text-muted-foreground/50 mb-4" />
          <p className="text-base font-medium text-foreground">No insights yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Generate your first AI insight to get personalized guidance</p>
          <Link href="/insights/generate" data-testid="link-first-insight">
            <Button className="gap-2">
              <Sparkles size={16} />
              Get Your First Insight
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
