import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGenerateInsight, getGetInsightsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowLeft, Heart, Zap, Leaf, Shield, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

const insightTypes = [
  {
    id: "daily",
    label: "Daily Insight",
    description: "What's happening in your body today and what to focus on",
    icon: BookOpen,
    color: "border-blue-200 bg-blue-50 text-blue-700",
    activeColor: "border-blue-400 bg-blue-100",
  },
  {
    id: "tww_support",
    label: "TWW Support",
    description: "Gentle, science-based support for the two-week wait",
    icon: Heart,
    color: "border-rose-200 bg-rose-50 text-rose-700",
    activeColor: "border-rose-400 bg-rose-100",
  },
  {
    id: "body_signal",
    label: "Body Signal",
    description: "Help interpreting your symptoms and physical sensations",
    icon: Zap,
    color: "border-amber-200 bg-amber-50 text-amber-700",
    activeColor: "border-amber-400 bg-amber-100",
  },
  {
    id: "energy",
    label: "Energy & Readiness",
    description: "Understand your fertility readiness score and how to improve it",
    icon: Leaf,
    color: "border-green-200 bg-green-50 text-green-700",
    activeColor: "border-green-400 bg-green-100",
  },
  {
    id: "boundary",
    label: "Boundary Protection",
    description: "Scripts and strategies for protecting your energy",
    icon: Shield,
    color: "border-purple-200 bg-purple-50 text-purple-700",
    activeColor: "border-purple-400 bg-purple-100",
  },
];

export default function GenerateInsight() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>("daily");
  const [context, setContext] = useState("");
  const [generated, setGenerated] = useState<{ insight: string; recommendation?: string | null } | null>(null);

  const generateInsight = useGenerateInsight();

  const handleGenerate = () => {
    generateInsight.mutate(
      {
        data: {
          insightType: selectedType as any,
          context: context || undefined,
        },
      },
      {
        onSuccess: (data) => {
          setGenerated(data);
          queryClient.invalidateQueries({ queryKey: getGetInsightsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not generate insight. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Link href="/insights" data-testid="link-back-insights" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif text-foreground">Get an Insight</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Choose what kind of guidance you need</p>
        </div>
      </div>

      {!generated ? (
        <div className="space-y-5">
          {/* Type selector */}
          <div className="space-y-2">
            {insightTypes.map((type) => {
              const Icon = type.icon;
              const active = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  data-testid={`button-insight-type-${type.id}`}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "w-full text-left rounded-2xl border-2 px-4 py-3.5 transition-all",
                    active ? cn(type.activeColor, "shadow-sm") : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-0.5 rounded-lg p-1.5", active ? type.color.split(" ").slice(0, 2).join(" ") : "bg-muted text-muted-foreground")}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{type.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                    </div>
                    {active && (
                      <div className="ml-auto mt-0.5">
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Context input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Any additional context? <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              data-testid="textarea-context"
              placeholder="e.g. I have right-side cramping, I'm on day 7 post-ovulation, feeling anxious..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={generateInsight.isPending}
            data-testid="button-generate-insight"
          >
            <Sparkles size={16} />
            {generateInsight.isPending ? "Generating your insight..." : "Generate Insight"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-500">
          <Card className="border-primary/20 bg-primary/5" data-testid="generated-insight-card">
            <CardContent className="pt-5 pb-5 px-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-primary" />
                <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-background">
                  {insightTypes.find((t) => t.id === selectedType)?.label}
                </Badge>
              </div>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-generated-insight">
                {generated.insight}
              </p>
              {generated.recommendation && (
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Key Takeaway</p>
                  <p className="text-xs text-foreground/80 leading-relaxed" data-testid="text-generated-recommendation">
                    {generated.recommendation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setGenerated(null)}
              data-testid="button-generate-another"
            >
              Generate Another
            </Button>
            <Link href="/insights" className="flex-1">
              <Button variant="default" className="w-full" data-testid="button-view-all-insights">
                View All Insights
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
