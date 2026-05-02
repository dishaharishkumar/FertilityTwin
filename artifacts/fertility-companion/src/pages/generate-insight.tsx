import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGenerateInsight, getGetInsightsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
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
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    activeRing: "border-blue-400",
    iconActive: "bg-blue-100 text-blue-600",
    iconDefault: "bg-muted text-muted-foreground",
  },
  {
    id: "tww_support",
    label: "TWW Support",
    description: "Gentle, science-based support for the two-week wait",
    icon: Heart,
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    activeRing: "border-rose-400",
    iconActive: "bg-rose-100 text-rose-600",
    iconDefault: "bg-muted text-muted-foreground",
  },
  {
    id: "body_signal",
    label: "Body Signal",
    description: "Help interpreting your symptoms and physical sensations",
    icon: Zap,
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    activeRing: "border-amber-400",
    iconActive: "bg-amber-100 text-amber-600",
    iconDefault: "bg-muted text-muted-foreground",
  },
  {
    id: "energy",
    label: "Energy & Readiness",
    description: "Understand your fertility readiness and how to improve it",
    icon: Leaf,
    badge: "bg-green-50 text-green-700 border-green-200",
    activeRing: "border-green-400",
    iconActive: "bg-green-100 text-green-600",
    iconDefault: "bg-muted text-muted-foreground",
  },
  {
    id: "boundary",
    label: "Boundary Protection",
    description: "Scripts and strategies for protecting your energy",
    icon: Shield,
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    activeRing: "border-purple-400",
    iconActive: "bg-purple-100 text-purple-600",
    iconDefault: "bg-muted text-muted-foreground",
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
        <Link
          href="/insights"
          data-testid="link-back-insights"
          className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          style={{ boxShadow: "var(--shadow-xs)" }}
        >
          <ArrowLeft size={17} />
        </Link>
        <div>
          <h1
            className="text-[1.85rem] text-foreground leading-tight"
            style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
          >
            Get an Insight
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Choose what kind of guidance you need</p>
        </div>
      </div>

      {!generated ? (
        <div className="space-y-5">
          {/* Type selector */}
          <div className="space-y-2.5">
            {insightTypes.map((type) => {
              const Icon = type.icon;
              const active = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  data-testid={`button-insight-type-${type.id}`}
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "w-full text-left rounded-2xl border-2 px-5 py-4 transition-all",
                    active ? cn(type.activeRing, "bg-card") : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/20"
                  )}
                  style={{ boxShadow: active ? "var(--shadow)" : "var(--shadow-xs)" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        active ? type.iconActive : type.iconDefault
                      )}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{type.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{type.description}</p>
                    </div>
                    <div
                      className={cn(
                        "shrink-0 w-4.5 h-4.5 rounded-full border-2 transition-all flex items-center justify-center",
                        active ? "border-primary bg-primary" : "border-border"
                      )}
                    >
                      {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Context input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Any additional context?{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              data-testid="textarea-context"
              placeholder="e.g. I have right-side cramping, I'm on day 7 post-ovulation, feeling anxious..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="resize-none rounded-xl"
              rows={3}
            />
          </div>

          <Button
            className="w-full gap-2 rounded-xl h-11"
            onClick={handleGenerate}
            disabled={generateInsight.isPending}
            data-testid="button-generate-insight"
          >
            <Sparkles size={15} />
            {generateInsight.isPending ? "Generating your insight..." : "Generate Insight"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div
            className="rounded-3xl border border-primary/25 overflow-hidden"
            data-testid="generated-insight-card"
            style={{
              background: "linear-gradient(145deg, #ffffff 0%, #fff8fa 100%)",
              borderLeft: "4px solid hsl(345,48%,72%)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div className="px-6 pt-6 pb-6">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, hsl(345,48%,88%) 0%, hsl(345,48%,78%) 100%)" }}
                >
                  <Sparkles size={13} className="text-primary" />
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-semibold border", insightTypes.find((t) => t.id === selectedType)?.badge)}
                >
                  {insightTypes.find((t) => t.id === selectedType)?.label}
                </Badge>
              </div>

              <p
                className="text-sm text-foreground leading-7 whitespace-pre-wrap"
                data-testid="text-generated-insight"
              >
                {generated.insight}
              </p>

              {generated.recommendation && (
                <div
                  className="mt-5 rounded-2xl px-4 py-3.5"
                  style={{ background: "linear-gradient(135deg, hsl(345,40%,95%) 0%, hsl(345,40%,91%) 100%)" }}
                >
                  <p className="label-caps mb-1.5" style={{ color: "hsl(var(--primary))" }}>Key Takeaway</p>
                  <p className="text-xs text-foreground/80 leading-relaxed" data-testid="text-generated-recommendation">
                    {generated.recommendation}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setGenerated(null)}
              data-testid="button-generate-another"
            >
              Generate Another
            </Button>
            <Link href="/insights" className="flex-1">
              <Button variant="default" className="w-full rounded-xl" data-testid="button-view-all-insights">
                View All Insights
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
