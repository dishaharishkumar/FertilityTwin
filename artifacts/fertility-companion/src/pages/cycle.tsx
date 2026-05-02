import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCycles,
  getGetCyclesQueryKey,
  useCreateCycle,
  useGetCurrentCycle,
  getGetCurrentCycleQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";
import { Plus, CalendarDays, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const phaseColors: Record<string, string> = {
  menstrual: "bg-red-100 text-red-700",
  follicular: "bg-amber-100 text-amber-700",
  ovulation: "bg-primary/15 text-primary",
  luteal: "bg-purple-100 text-purple-700",
  tww: "bg-rose-100 text-rose-700",
};

const phaseLabels: Record<string, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulation: "Ovulation",
  luteal: "Luteal",
  tww: "Two-Week Wait",
};

function PhaseTimeline({ phase, cycleDay }: { phase: string; cycleDay: number }) {
  const phases = [
    { key: "menstrual", label: "Menstrual", days: "1-5" },
    { key: "follicular", label: "Follicular", days: "6-13" },
    { key: "ovulation", label: "Ovulation", days: "14-16" },
    { key: "tww", label: "TWW", days: "17-28" },
  ];

  return (
    <div className="space-y-2" data-testid="phase-timeline">
      <div className="flex rounded-xl overflow-hidden h-3">
        {phases.map((p) => (
          <div
            key={p.key}
            className={cn(
              "flex-1 transition-all",
              p.key === phase ? "opacity-100" : "opacity-30",
              phaseColors[p.key]?.split(" ")[0] ?? "bg-muted"
            )}
          />
        ))}
      </div>
      <div className="flex text-[10px] text-muted-foreground">
        {phases.map((p) => (
          <div key={p.key} className="flex-1 text-center">{p.label}</div>
        ))}
      </div>
    </div>
  );
}

const newCycleSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  notes: z.string().optional(),
});

export default function CycleTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: cycles, isLoading: cyclesLoading } = useGetCycles({ query: { queryKey: getGetCyclesQueryKey() } });
  const { data: currentCycle, isLoading: currentLoading } = useGetCurrentCycle({ query: { queryKey: getGetCurrentCycleQueryKey() } });
  const createCycle = useCreateCycle();

  const form = useForm<z.infer<typeof newCycleSchema>>({
    resolver: zodResolver(newCycleSchema),
    defaultValues: { startDate: format(new Date(), "yyyy-MM-dd"), notes: "" },
  });

  const onSubmit = (values: z.infer<typeof newCycleSchema>) => {
    createCycle.mutate(
      { data: { startDate: values.startDate as any, notes: values.notes ?? null } },
      {
        onSuccess: () => {
          toast({ title: "Cycle started", description: "Your new cycle has been recorded." });
          queryClient.invalidateQueries({ queryKey: getGetCyclesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCurrentCycleQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ title: "Error", description: "Could not start cycle.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif text-foreground">Cycle Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your cycles and understand your rhythm</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" data-testid="button-start-cycle">
              <Plus size={15} />
              New Cycle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-serif">Start New Cycle</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid="input-cycle-start-date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createCycle.isPending} data-testid="button-confirm-cycle">
                  {createCycle.isPending ? "Saving..." : "Start Cycle"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current cycle */}
      {currentLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : currentCycle ? (
        <Card className="border-primary/20 bg-primary/5" data-testid="current-cycle-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">Current Cycle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary" data-testid="text-cycle-day">{currentCycle.cycleDay}</div>
                <div className="text-xs text-muted-foreground">Day</div>
              </div>
              <div className="flex-1 space-y-1">
                <Badge className={cn("text-xs", phaseColors[currentCycle.phase] ?? "")} data-testid="current-phase-badge">
                  {phaseLabels[currentCycle.phase] ?? currentCycle.phase}
                </Badge>
                <p className="text-xs text-muted-foreground leading-relaxed">{currentCycle.phaseDescription}</p>
              </div>
            </div>

            <PhaseTimeline phase={currentCycle.phase} cycleDay={currentCycle.cycleDay} />

            <div className="grid grid-cols-2 gap-3 pt-1">
              {currentCycle.estimatedOvulationDate && (
                <div className="bg-background rounded-xl px-3 py-2" data-testid="ovulation-date-card">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Est. Ovulation</p>
                  <p className="text-sm font-medium text-foreground">
                    {format(parseISO(currentCycle.estimatedOvulationDate), "MMM d")}
                  </p>
                </div>
              )}
              {currentCycle.daysUntilNextPhase != null && (
                <div className="bg-background rounded-xl px-3 py-2" data-testid="next-phase-card">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Next Phase In</p>
                  <p className="text-sm font-medium text-foreground">{currentCycle.daysUntilNextPhase} days</p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Started {format(parseISO(currentCycle.cycle.startDate), "MMMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed" data-testid="no-cycle-card">
          <CardContent className="py-10 text-center">
            <CalendarDays size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No cycle started yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start your first cycle to begin tracking</p>
          </CardContent>
        </Card>
      )}

      {/* Past cycles */}
      <div>
        <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3">Cycle History</h2>
        {cyclesLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : cycles && cycles.length > 0 ? (
          <div className="space-y-3">
            {cycles.map((cycle, i) => (
              <div
                key={cycle.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                data-testid={`cycle-row-${cycle.id}`}
              >
                <div className="flex items-center gap-3">
                  <Circle size={8} className={cn("fill-current", i === 0 ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {format(parseISO(cycle.startDate), "MMMM d, yyyy")}
                    </p>
                    {cycle.cycleLength && (
                      <p className="text-xs text-muted-foreground">{cycle.cycleLength} day cycle</p>
                    )}
                  </div>
                </div>
                {i === 0 && (
                  <Badge variant="secondary" className="text-xs">Current</Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No past cycles yet.</p>
        )}
      </div>
    </div>
  );
}
