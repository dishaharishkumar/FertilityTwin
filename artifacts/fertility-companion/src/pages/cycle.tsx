import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCycles, getGetCyclesQueryKey,
  useCreateCycle,
  useGetCurrentCycle, getGetCurrentCycleQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { Plus, CalendarDays, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const phaseLabels: Record<string, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulation: "Ovulation",
  luteal: "Luteal",
  tww: "Two-Week Wait",
};

const phaseBadge: Record<string, string> = {
  menstrual: "bg-red-100 text-red-700 border-red-200",
  follicular: "bg-amber-100 text-amber-700 border-amber-200",
  ovulation: "bg-pink-100 text-pink-700 border-pink-200",
  luteal: "bg-purple-100 text-purple-700 border-purple-200",
  tww: "bg-rose-100 text-rose-700 border-rose-200",
};

function PhaseTimeline({ phase, cycleDay }: { phase: string; cycleDay: number }) {
  const totalDays = 28;
  const progressPct = Math.min(Math.max((cycleDay / totalDays) * 100, 2), 98);

  const segments = [
    { key: "menstrual", label: "Menstrual", flex: 18 },
    { key: "follicular", label: "Follicular", flex: 29 },
    { key: "ovulation", label: "Ovulation", flex: 11 },
    { key: "tww", label: "TWW", flex: 42 },
  ];

  return (
    <div className="space-y-3" data-testid="phase-timeline">
      <div className="relative h-4">
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background: "linear-gradient(to right, #fca5a5 0%, #fcd34d 18%, #f9a8d4 46%, #c4b5fd 57%, #f9a8d4 100%)",
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(to right, transparent 0%, transparent calc(var(--p) - 0.5%), rgba(255,255,255,0.25) calc(var(--p) - 0.5%), rgba(255,255,255,0.25) 100%)",
            // @ts-expect-error css var
            "--p": `${progressPct}%`,
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-white"
          style={{
            left: `${progressPct}%`,
            boxShadow: "0 0 0 3px rgba(180,60,100,0.25), 0 2px 6px rgba(0,0,0,0.15)",
          }}
        />
      </div>
      <div className="flex text-[10px] font-medium text-muted-foreground">
        {segments.map((s) => (
          <div
            key={s.key}
            className={cn("text-center", s.key === phase ? "text-foreground font-semibold" : "")}
            style={{ flex: s.flex }}
          >
            {s.label}
          </div>
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
          <h1
            className="text-[1.85rem] text-foreground leading-tight"
            style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
          >
            Cycle Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Understand your rhythm, month by month</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 rounded-xl" data-testid="button-start-cycle">
              <Plus size={15} />
              New Cycle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "var(--app-font-serif)" }}>Start New Cycle</DialogTitle>
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
                <Button type="submit" className="w-full rounded-xl" disabled={createCycle.isPending} data-testid="button-confirm-cycle">
                  {createCycle.isPending ? "Saving..." : "Start Cycle"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current cycle */}
      {currentLoading ? (
        <Skeleton className="h-52 w-full rounded-3xl" />
      ) : currentCycle ? (
        <div
          className="rounded-3xl border border-primary/20 bg-card overflow-hidden"
          data-testid="current-cycle-card"
          style={{ boxShadow: "var(--shadow)" }}
        >
          {/* Top section with cycle day */}
          <div
            className="px-7 py-6"
            style={{ background: "linear-gradient(135deg, #fff0f5 0%, #fce7f3 100%)" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="label-caps">Current cycle</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span
                    data-testid="text-cycle-day"
                    className="text-6xl font-bold leading-none text-foreground/90"
                    style={{ fontFamily: "var(--app-font-serif)" }}
                  >
                    {currentCycle.cycleDay}
                  </span>
                  <span className="text-base text-muted-foreground font-medium">day</span>
                </div>
              </div>
              <Badge
                className={cn("text-xs font-semibold mt-1 border", phaseBadge[currentCycle.phase] ?? "")}
                data-testid="current-phase-badge"
              >
                {phaseLabels[currentCycle.phase] ?? currentCycle.phase}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{currentCycle.phaseDescription}</p>
          </div>

          {/* Bottom section */}
          <div className="px-7 py-5 space-y-4">
            <PhaseTimeline phase={currentCycle.phase} cycleDay={currentCycle.cycleDay} />

            <div className="grid grid-cols-2 gap-3">
              {currentCycle.estimatedOvulationDate && (
                <div className="rounded-xl bg-muted/40 px-4 py-3" data-testid="ovulation-date-card">
                  <p className="label-caps">Est. Ovulation</p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {format(parseISO(currentCycle.estimatedOvulationDate), "MMM d")}
                  </p>
                </div>
              )}
              {currentCycle.daysUntilNextPhase != null && (
                <div className="rounded-xl bg-muted/40 px-4 py-3" data-testid="next-phase-card">
                  <p className="label-caps">Next Phase In</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{currentCycle.daysUntilNextPhase} days</p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Started {format(parseISO(currentCycle.cycle.startDate), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
      ) : (
        <div
          className="rounded-3xl border-2 border-dashed border-primary/25 bg-primary/5 py-12 text-center"
          data-testid="no-cycle-card"
        >
          <CalendarDays size={36} className="text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">No cycle started yet</p>
          <p className="text-xs text-muted-foreground mt-1">Tap New Cycle to begin tracking</p>
        </div>
      )}

      {/* History */}
      <div>
        <p className="label-caps mb-3">Cycle History</p>
        {cyclesLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : cycles && cycles.length > 0 ? (
          <div className="space-y-2">
            {cycles.map((cycle, i) => (
              <div
                key={cycle.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-3.5"
                data-testid={`cycle-row-${cycle.id}`}
                style={{ boxShadow: "var(--shadow-xs)" }}
              >
                <div className="flex items-center gap-3">
                  <Circle
                    size={7}
                    className={cn("fill-current shrink-0", i === 0 ? "text-primary" : "text-muted-foreground/40")}
                  />
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
                  <Badge variant="secondary" className="text-xs rounded-full">Current</Badge>
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
