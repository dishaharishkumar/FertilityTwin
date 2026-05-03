import { useMemo, useState } from "react";
import { useGetLogs, useGetDashboardSummary } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, parseISO, subMonths, addMonths, isSameMonth, isToday,
  isFuture, differenceInDays,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Weather types ────────────────────────────────────────────────────────────

type WeatherType = "sunny" | "partly-cloudy" | "cloudy" | "rainy" | "stormy" | "rainbow" | "none";

const WEATHER_META: Record<WeatherType, { emoji: string; label: string; bg: string; border: string; text: string }> = {
  sunny:          { emoji: "☀️",  label: "Sunny",          bg: "hsl(45,90%,92%)",  border: "hsl(45,80%,78%)",  text: "hsl(38,70%,30%)"  },
  rainbow:        { emoji: "🌈",  label: "Rainbow",        bg: "hsl(45,90%,92%)",  border: "hsl(280,60%,78%)", text: "hsl(280,50%,35%)" },
  "partly-cloudy":{ emoji: "⛅",  label: "Partly Cloudy", bg: "hsl(200,40%,93%)", border: "hsl(200,35%,78%)", text: "hsl(200,40%,30%)" },
  cloudy:         { emoji: "☁️",  label: "Cloudy",         bg: "hsl(220,15%,91%)", border: "hsl(220,12%,78%)", text: "hsl(220,15%,35%)" },
  rainy:          { emoji: "🌧️", label: "Rainy",          bg: "hsl(210,50%,90%)", border: "hsl(210,40%,76%)", text: "hsl(210,45%,28%)" },
  stormy:         { emoji: "⛈️", label: "Stormy",         bg: "hsl(260,25%,88%)", border: "hsl(260,22%,72%)", text: "hsl(260,28%,28%)" },
  none:           { emoji: "·",   label: "No data",        bg: "hsl(0,0%,96%)",    border: "hsl(0,0%,88%)",    text: "hsl(0,0%,68%)"   },
};

function moodScore(mood: string | null | undefined): number {
  if (!mood) return 3;
  const m = mood.toLowerCase();
  if (["happy", "great", "excellent", "wonderful", "joyful", "amazing", "fantastic"].some(k => m.includes(k))) return 5;
  if (["good", "positive", "calm", "content", "hopeful", "excited"].some(k => m.includes(k))) return 4;
  if (["neutral", "fine", "normal", "okay", "ok", "meh"].some(k => m.includes(k))) return 3;
  if (["sad", "anxious", "irritable", "stressed", "low", "upset", "tired"].some(k => m.includes(k))) return 2;
  if (["terrible", "awful", "depressed", "horrible", "miserable", "angry"].some(k => m.includes(k))) return 1;
  return 3;
}

function classifyWeather(
  energyLevel: number | null | undefined,
  mood: string | null | undefined,
  symptoms: string[],
  hasBBTShift: boolean
): WeatherType {
  if (energyLevel == null && !mood) return "none";

  const energy = energyLevel ?? 3;
  const ms = moodScore(mood);
  const score = (energy + ms) / 2;

  const heavySymptoms = symptoms.some(s =>
    ["cramp", "nausea", "migraine", "headache", "vomit", "pain"].some(k => s.toLowerCase().includes(k))
  );

  if (score >= 4.5 && hasBBTShift) return "rainbow";
  if (score >= 4.5) return "sunny";
  if (score >= 3.5) return "partly-cloudy";
  if (score >= 2.5 && !heavySymptoms) return "cloudy";
  if (score >= 2.5 && heavySymptoms) return "rainy";
  if (score < 2.5 && heavySymptoms) return "stormy";
  return "rainy";
}

// ── Phase-based forecast for future days ────────────────────────────────────

function forecastWeather(phase: string | undefined, daysFromNow: number): WeatherType {
  const p = phase ?? "unknown";
  if (p === "menstrual") return daysFromNow <= 2 ? "stormy" : "rainy";
  if (p === "follicular") return daysFromNow <= 3 ? "cloudy" : "partly-cloudy";
  if (p === "ovulation") return "sunny";
  if (p === "tww" || p === "luteal") return daysFromNow <= 4 ? "partly-cloudy" : "rainy";
  return "cloudy";
}

// ── Stats ────────────────────────────────────────────────────────────────────

function computeStats(days: Array<{ weather: WeatherType; date: Date }>) {
  const logged = days.filter(d => d.weather !== "none" && !isFuture(d.date));
  if (logged.length === 0) return null;

  const counts: Partial<Record<WeatherType, number>> = {};
  for (const d of logged) counts[d.weather] = (counts[d.weather] ?? 0) + 1;

  const sorted = Object.entries(counts).sort((a, b) => (b[1] as number) - (a[1] as number));
  const mostCommon = sorted[0]?.[0] as WeatherType | undefined;

  const sunnyDays = (counts["sunny"] ?? 0) + (counts["rainbow"] ?? 0) + (counts["partly-cloudy"] ?? 0);
  const sunshineScore = Math.round((sunnyDays / logged.length) * 100);

  return { mostCommon, sunshineScore, total: logged.length, counts };
}

// ── Day cell ─────────────────────────────────────────────────────────────────

function DayCell({
  date,
  weather,
  isForecast,
}: {
  date: Date;
  weather: WeatherType;
  isForecast: boolean;
}) {
  const meta = WEATHER_META[weather];
  const today = isToday(date);

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl aspect-square select-none transition-all",
        isForecast && weather !== "none" ? "opacity-60" : "",
        today ? "ring-2 ring-primary ring-offset-1" : "",
      )}
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
      }}
      title={`${format(date, "MMM d")} — ${meta.label}${isForecast ? " (forecast)" : ""}`}
    >
      <span className={cn("leading-none", weather === "none" ? "text-xs text-muted-foreground/50" : "text-lg sm:text-xl")}>
        {weather === "none" ? "·" : meta.emoji}
      </span>
      <span className="text-[10px] mt-0.5 font-semibold" style={{ color: meta.text }}>
        {format(date, "d")}
      </span>
      {isForecast && weather !== "none" && (
        <span className="absolute top-0.5 right-1 text-[8px] text-muted-foreground/60">~</span>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MoodWeatherPage() {
  const { data: logsData } = useGetLogs({ limit: 500 });
  const { data: dashboard } = useGetDashboardSummary();

  const [viewDate, setViewDate] = useState(new Date());

  const logMap = useMemo(() => {
    const map: Record<string, { weather: WeatherType }> = {};
    if (!logsData) return map;

    const logs = logsData as any[];
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));

    // Detect BBT shift in this dataset
    const bbtLogs = sorted.filter((l) => l.bbt != null);
    let hasBBTShift = false;
    if (bbtLogs.length >= 6) {
      const half = Math.floor(bbtLogs.length / 2);
      const preAvg = bbtLogs.slice(0, half).reduce((s: number, l: any) => s + l.bbt, 0) / half;
      const postAvg = bbtLogs.slice(half).reduce((s: number, l: any) => s + l.bbt, 0) / (bbtLogs.length - half);
      hasBBTShift = postAvg - preAvg >= 0.2;
    }

    for (const log of logs) {
      map[log.date] = {
        weather: classifyWeather(log.energyLevel, log.mood, log.symptoms ?? [], hasBBTShift),
      };
    }
    return map;
  }, [logsData]);

  const phase = (dashboard as any)?.currentPhase as string | undefined;

  const calendarDays = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    const days = eachDayOfInterval({ start, end });
    const startWeekday = getDay(start); // 0=Sun

    const result: Array<{ date: Date; weather: WeatherType; isForecast: boolean } | null> = [
      ...Array(startWeekday).fill(null),
    ];

    for (const day of days) {
      const key = format(day, "yyyy-MM-dd");
      const future = isFuture(day) && !isToday(day);

      let weather: WeatherType;
      if (future) {
        const diff = differenceInDays(day, new Date());
        weather = phase ? forecastWeather(phase, diff) : "none";
      } else {
        weather = logMap[key]?.weather ?? "none";
      }

      result.push({ date: day, weather, isForecast: future });
    }

    return result;
  }, [viewDate, logMap, phase]);

  const stats = useMemo(() => {
    const logged = calendarDays
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .map(d => ({ weather: d.weather, date: d.date }));
    return computeStats(logged);
  }, [calendarDays]);

  const currentMonthName = format(viewDate, "MMMM yyyy");
  const isCurrentMonth = isSameMonth(viewDate, new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Mood Weather
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your emotional forecast — sunshine, clouds, and storms mapped from your logged mood and energy. Future days show a phase-based prediction.
        </p>
      </div>

      {/* Month navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={() => setViewDate(d => subMonths(d, 1))} className="gap-1">
            <ChevronLeft size={15} />
          </Button>
          <p className="font-semibold text-foreground" style={{ fontFamily: "var(--app-font-serif)", fontSize: "1.05rem" }}>
            {currentMonthName}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setViewDate(d => addMonths(d, 1))} className="gap-1">
            <ChevronRight size={15} />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground label-caps py-0.5">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) =>
            day === null ? (
              <div key={`empty-${i}`} />
            ) : (
              <DayCell
                key={format(day.date, "yyyy-MM-dd")}
                date={day.date}
                weather={day.weather}
                isForecast={day.isForecast}
              />
            )
          )}
        </div>

        {phase && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            <span className="opacity-50">~</span> marks days are phase-based predictions
          </p>
        )}
      </Card>

      {/* Stats */}
      {stats ? (
        <Card className="p-5 space-y-4">
          <p className="label-caps">This month so far</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: "hsl(45,85%,94%)", border: "1px solid hsl(45,70%,82%)" }}>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--app-font-serif)", color: "hsl(38,65%,32%)" }}>
                {stats.sunshineScore}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Sunshine score</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: "hsl(345,20%,96%)", border: "1px solid hsl(345,18%,86%)" }}>
              <p className="text-2xl" style={{ fontFamily: "var(--app-font-serif)", color: "hsl(345,35%,35%)" }}>
                {stats.mostCommon ? WEATHER_META[stats.mostCommon].emoji : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Most common</p>
            </div>
          </div>

          {/* Weather breakdown bars */}
          <div className="space-y-2">
            {(["sunny", "rainbow", "partly-cloudy", "cloudy", "rainy", "stormy"] as WeatherType[])
              .filter(w => (stats.counts as any)[w] > 0)
              .map(w => {
                const count = (stats.counts as any)[w] as number;
                const pct = Math.round((count / stats.total) * 100);
                const meta = WEATHER_META[w];
                return (
                  <div key={w} className="flex items-center gap-2">
                    <span className="text-base w-6 text-center">{meta.emoji}</span>
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(0,0%,92%)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: meta.border }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{count}d</span>
                  </div>
                );
              })}
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            Log your mood and energy level each day to see your weather forecast build up.
          </p>
        </Card>
      )}

      {/* Legend */}
      <Card className="p-4">
        <p className="label-caps mb-3">Weather key</p>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          {(["sunny", "rainbow", "partly-cloudy", "cloudy", "rainy", "stormy"] as WeatherType[]).map(w => {
            const meta = WEATHER_META[w];
            return (
              <div key={w} className="flex items-center gap-2">
                <span className="text-base">{meta.emoji}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{meta.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {w === "sunny" && "High energy + positive mood"}
                    {w === "rainbow" && "Peak day + BBT shift detected"}
                    {w === "partly-cloudy" && "Good energy, mixed mood"}
                    {w === "cloudy" && "Moderate — a quiet day"}
                    {w === "rainy" && "Low energy or heavier symptoms"}
                    {w === "stormy" && "Very low energy + difficult symptoms"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
