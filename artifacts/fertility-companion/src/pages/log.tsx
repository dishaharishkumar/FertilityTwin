import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateLog,
  useGetTodayLog,
  getGetTodayLogQueryKey,
  getGetLogsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetReadinessScoreQueryKey,
} from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const SYMPTOMS = [
  { id: "cramps", label: "Cramps" },
  { id: "bloating", label: "Bloating" },
  { id: "spotting", label: "Spotting" },
  { id: "tender_breasts", label: "Tender Breasts" },
  { id: "nausea", label: "Nausea" },
  { id: "fatigue", label: "Fatigue" },
  { id: "right_cramps", label: "Right-Side Cramps" },
  { id: "left_cramps", label: "Left-Side Cramps" },
  { id: "pulling_sensation", label: "Pulling Sensation" },
  { id: "cold_flu", label: "Cold / Flu-Like" },
];

const SUPPLEMENTS = [
  { id: "folic_acid", label: "Folic Acid" },
  { id: "vitamin_d", label: "Vitamin D" },
  { id: "CoQ10", label: "CoQ10" },
  { id: "magnesium", label: "Magnesium" },
  { id: "omega3", label: "Omega-3" },
  { id: "lecithin", label: "Lecithin" },
  { id: "probiotics", label: "Probiotics" },
];

const formSchema = z.object({
  date: z.string(),
  bbt: z.string().optional(),
  cervicalMucus: z.string().optional(),
  mood: z.string().optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  sleepHours: z.string().optional(),
  stressLevel: z.number().min(1).max(10).optional(),
  symptoms: z.array(z.string()),
  supplements: z.array(z.string()),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function DailyLogPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: todayLog, isLoading } = useGetTodayLog({
    query: { queryKey: getGetTodayLogQueryKey() },
  });
  const createLog = useCreateLog();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      bbt: todayLog?.bbt?.toString() ?? "",
      cervicalMucus: todayLog?.cervicalMucus ?? undefined,
      mood: todayLog?.mood ?? undefined,
      energyLevel: todayLog?.energyLevel ?? 5,
      sleepHours: todayLog?.sleepHours?.toString() ?? "",
      stressLevel: todayLog?.stressLevel ?? 5,
      symptoms: (todayLog?.symptoms as string[]) ?? [],
      supplements: (todayLog?.supplements as string[]) ?? [],
      notes: todayLog?.notes ?? "",
    },
  });

  const onSubmit = (values: FormValues) => {
    createLog.mutate(
      {
        data: {
          date: values.date,
          bbt: values.bbt ? parseFloat(values.bbt) : undefined,
          cervicalMucus: values.cervicalMucus as any ?? null,
          mood: values.mood as any ?? null,
          energyLevel: values.energyLevel ?? null,
          sleepHours: values.sleepHours ? parseFloat(values.sleepHours) : undefined,
          stressLevel: values.stressLevel ?? null,
          symptoms: values.symptoms,
          supplements: values.supplements,
          notes: values.notes ?? null,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Logged", description: "Your day has been recorded." });
          queryClient.invalidateQueries({ queryKey: getGetTodayLogQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetLogsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetReadinessScoreQueryKey() });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not save your log. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-serif text-foreground">Daily Log</h1>
        <p className="text-sm text-muted-foreground mt-1">{format(new Date(), "EEEE, MMMM d")}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
          {/* BBT */}
          <FormField
            control={form.control}
            name="bbt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Basal Body Temperature (°C)</FormLabel>
                <FormControl>
                  <Input
                    data-testid="input-bbt"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 36.4"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cervical Mucus */}
          <FormField
            control={form.control}
            name="cervicalMucus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cervical Mucus</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-cervical-mucus">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="dry">Dry</SelectItem>
                    <SelectItem value="sticky">Sticky</SelectItem>
                    <SelectItem value="creamy">Creamy</SelectItem>
                    <SelectItem value="watery">Watery</SelectItem>
                    <SelectItem value="egg_white">Egg White (most fertile)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mood */}
          <FormField
            control={form.control}
            name="mood"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mood</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-mood">
                      <SelectValue placeholder="How are you feeling?" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="great">Great</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Energy level */}
          <FormField
            control={form.control}
            name="energyLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Energy Level <span className="text-muted-foreground font-normal">({field.value}/10)</span></FormLabel>
                <FormControl>
                  <Slider
                    data-testid="slider-energy"
                    min={1}
                    max={10}
                    step={1}
                    value={[field.value ?? 5]}
                    onValueChange={(v) => field.onChange(v[0])}
                    className="mt-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sleep */}
          <FormField
            control={form.control}
            name="sleepHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sleep (hours)</FormLabel>
                <FormControl>
                  <Input
                    data-testid="input-sleep"
                    type="number"
                    step="0.5"
                    placeholder="e.g. 7.5"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Stress */}
          <FormField
            control={form.control}
            name="stressLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stress Level <span className="text-muted-foreground font-normal">({field.value}/10)</span></FormLabel>
                <FormControl>
                  <Slider
                    data-testid="slider-stress"
                    min={1}
                    max={10}
                    step={1}
                    value={[field.value ?? 5]}
                    onValueChange={(v) => field.onChange(v[0])}
                    className="mt-2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Symptoms */}
          <FormField
            control={form.control}
            name="symptoms"
            render={() => (
              <FormItem>
                <FormLabel>Symptoms</FormLabel>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {SYMPTOMS.map((symptom) => (
                    <FormField
                      key={symptom.id}
                      control={form.control}
                      name="symptoms"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              data-testid={`checkbox-symptom-${symptom.id}`}
                              checked={field.value?.includes(symptom.id)}
                              onCheckedChange={(checked) => {
                                const current = field.value ?? [];
                                if (checked) {
                                  field.onChange([...current, symptom.id]);
                                } else {
                                  field.onChange(current.filter((s) => s !== symptom.id));
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm cursor-pointer">{symptom.label}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </FormItem>
            )}
          />

          {/* Supplements */}
          <FormField
            control={form.control}
            name="supplements"
            render={() => (
              <FormItem>
                <FormLabel>Supplements Taken</FormLabel>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {SUPPLEMENTS.map((sup) => (
                    <FormField
                      key={sup.id}
                      control={form.control}
                      name="supplements"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              data-testid={`checkbox-supplement-${sup.id}`}
                              checked={field.value?.includes(sup.id)}
                              onCheckedChange={(checked) => {
                                const current = field.value ?? [];
                                if (checked) {
                                  field.onChange([...current, sup.id]);
                                } else {
                                  field.onChange(current.filter((s) => s !== sup.id));
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-sm cursor-pointer">{sup.label}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    data-testid="textarea-notes"
                    placeholder="How are you feeling? Any observations about your body today?"
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={createLog.isPending}
            data-testid="button-submit-log"
          >
            {createLog.isPending ? "Saving..." : todayLog ? "Update Log" : "Save Log"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
