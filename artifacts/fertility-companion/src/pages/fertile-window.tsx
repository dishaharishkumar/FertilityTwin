import { useMemo } from "react";
import { useGetCycles, useGetDashboardSummary } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  addDays,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";
import { Flower2, CalendarDays, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

type Phase =
  | "menstrual"
  | "follicular"
  | "fertile"
  | "ovulation"
  | "luteal"
  | "unknown";

const PHASE_STYLES: Record<Phase, { bg: string; text: string; label: string }> = {
  menstrual:  { bg: "hsl(345,60%,90%)",  text: "hsl(345,55%,42%)", label: "Menstrual"  },
  follicular: { bg: "hsl(160,38%,88%)",  text: "hsl(160,45%,35%)", label: "Follicular" },
  fertile:    { bg: "hsl(42,85%,84%)",   text: "hsl(38,72%,32%)",  label: "Fertile"    },
  ovulation:  { bg: "hsl(38,90%,62%)",   text: "hsl(32,80%,22%)",  label: "Ovulation"  },
  luteal:     { bg: "hsl(270,38%,88%)",  text: "hsl(270,40%,38%)", label: "Luteal"     },
  unknown:    { bg: "transparent",        text: "inherit",           label: ""           },
};

function getPhase(cycleDay: number, cycleLength: number): Phase {
  const ovDay = cycleLength - 14;
  const fertileStart = ovDay - 4;
  const fertileEnd = ovDay + 1;
  if (cycleDay <= 0) return "unknown";
  if (cycleDay <= 5) return "menstrual";
  if (cycleDay === ovDay) return "ovulation";
  if (cycleDay >= fertileStart && cycleDay <= fertileEnd) return "fertile";
  if (cycleDay > fertileEnd) return "luteal";
  return "follicular";
}

function getDayInfo(
  date: Date,
  lastStart: Date,
  cycleLength: number
): { phase: Phase; cycleDay: number } {
  const diff = differenceInDays(date, lastStart);
  const cycleDay = (((diff % cycleLength) + cycleLength) % cycleLength) + 1;
  return { phase: getPhase(cycleDay, cycleLength), cycleDay };
}

function findNextFertileWindow(
  lastStart: Date,
  cycleLength: number
): { start: Date; ovulation: Date; end: Date } {
  const today = new Date();
  const ovDay = cycleLength - 14;
  const fertileStart = ovDay - 4;
  const fertileEnd = ovDay + 1;

  // find current cycle day
  const diff = differenceInDays(today, lastStart);
  let offset = ((diff % cycleLength) + cycleLength) % cycleLength;

  // how many days until fertile start in this or next cycle
  let daysUntilFertile = fertileStart - 1 - offset;
  if (daysUntilFertile < 0) daysUntilFertile += cycleLength;

  const windowStart = addDays(today, daysUntilFertile);
  const ovDate = addDays(windowStart, ovDay - fertileStart);
  const windowEnd = addDays(windowStart, fertileEnd - fertileStart);
  return { start: windowStart, ovulation: ovDate, end: windowEnd };
}

interface MonthCalendarProps {
  year: number;
  month: number;
  lastStart: Date;
  cycleLength: number;
}

function MonthCalendar({ year, month, lastStart, cycleLength }: MonthCalendarProps) {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const today = new Date();

  return (
    <div>
      <p
        className="text-sm font-semibold text-foreground mb-2 px-0.5"
        style={{ fontFamily: "var(--app-font-serif)" }}
      >
        {format(monthStart, "MMMM yyyy")}
      </p>
      <div className="grid grid-cols-7 gap-px">
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground font-medium pb-1">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const inMonth = day.getMonth() === month;
          const { phase } = getDayInfo(day, lastStart, cycleLength);
          const style = PHASE_STYLES[inMonth ? phase : "unknown"];
          const todayMark = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "aspect-square flex items-center justify-center rounded-lg text-[11px] font-medium transition-all relative",
                !inMonth && "opacity-0 pointer-events-none",
                todayMark && "ring-2 ring-offset-1 ring-primary"
              )}
              style={{
                background: inMonth ? style.bg : "transparent",
                color: inMonth ? style.text : "inherit",
              }}
              title={inMonth ? `${format(day, "MMM d")} — ${style.label || "Regular"}` : ""}
            >
              {format(day, "d")}
              {phase === "ovulation" && inMonth && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 border border-white" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FertileWindowPage() {
  const { data: cycles } = useGetCycles();
  const { data: dashboard } = useGetDashboardSummary();

  const { lastStart, cycleLength, hasData } = useMemo(() => {
    const c = (cycles ?? []) as any[];
    if (c.length === 0) return { lastStart: new Date(), cycleLength: 28, hasData: false };

    const sorted = [...c].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const lastStart = parseISO(sorted[0].startDate);

    const avgLen = (dashboard as any)?.avgCycleLength;
    let cycleLength = 28;
    if (avgLen && avgLen > 18 && avgLen < 50) {
      cycleLength = Math.round(avgLen);
    } else if (sorted.length >= 2) {
      const lengths: number[] = [];
      for (let i = 0; i < Math.min(sorted.length - 1, 5); i++) {
        const len = differenceInDays(
          parseISO(sorted[i].startDate),
          parseISO(sorted[i + 1].startDate)
        );
        if (len > 18 && len < 50) lengths.push(len);
      }
      if (lengths.length > 0) {
        cycleLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
      }
    }

    return { lastStart, cycleLength, hasData: true };
  }, [cycles, dashboard]);

  const nextWindow = useMemo(
    () => (hasData ? findNextFertileWindow(lastStart, cycleLength) : null),
    [lastStart, cycleLength, hasData]
  );

  const today = new Date();
  const months = [
    { year: today.getFullYear(), month: today.getMonth() },
    { year: today.getFullYear(), month: today.getMonth() + 1 > 11 ? 0 : today.getMonth() + 1 },
    { year: today.getMonth() + 1 > 11 ? today.getFullYear() + 1 : today.getFullYear(), month: today.getMonth() + 2 > 11 ? (today.getMonth() + 2) % 12 : today.getMonth() + 2 },
  ].map((m) => {
    if (m.month > 11) { m.month = m.month % 12; m.year += 1; }
    return m;
  });

  const daysUntilFertile = nextWindow
    ? Math.max(0, differenceInDays(nextWindow.start, today))
    : null;

  const currentPhaseInfo = useMemo(() => {
    if (!hasData) return null;
    const { phase, cycleDay } = getDayInfo(today, lastStart, cycleLength);
    const ovDay = cycleLength - 14;
    const fertileStart = ovDay - 4;
    let daysLabel = "";
    if (phase === "menstrual") daysLabel = `${5 - cycleDay + 1} days left`;
    else if (phase === "follicular") daysLabel = `${fertileStart - cycleDay} days to fertile window`;
    else if (phase === "fertile") daysLabel = `${ovDay - cycleDay} days to ovulation`;
    else if (phase === "ovulation") daysLabel = "Peak day";
    else if (phase === "luteal") daysLabel = `Day ${cycleDay} of ${cycleLength}`;
    return { phase, cycleDay, daysLabel };
  }, [hasData, lastStart, cycleLength]);

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl text-foreground mb-1"
          style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
        >
          Fertile Window
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your predicted fertile days, ovulation peak, and cycle phases — mapped across the next 3 months.
          Based on your actual cycle history.
        </p>
      </div>

      {!hasData ? (
        <Card className="p-8 text-center">
          <Flower2 size={32} className="text-primary mx-auto mb-3 opacity-60" />
          <p className="text-sm text-muted-foreground">
            Record at least one cycle to see your fertile window predictions.
          </p>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Timer size={14} className="text-amber-500" />
                <p className="label-caps">Next fertile window</p>
              </div>
              {nextWindow && (
                <>
                  <p
                    className="text-2xl font-bold text-foreground"
                    style={{ fontFamily: "var(--app-font-serif)" }}
                  >
                    {daysUntilFertile === 0
                      ? "Now"
                      : `In ${daysUntilFertile} day${daysUntilFertile !== 1 ? "s" : ""}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(nextWindow.start, "MMM d")} – {format(nextWindow.end, "MMM d")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Peak: {format(nextWindow.ovulation, "MMM d")}
                  </p>
                </>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays size={14} className="text-primary" />
                <p className="label-caps">Today</p>
              </div>
              {currentPhaseInfo && (
                <>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      fontFamily: "var(--app-font-serif)",
                      color: PHASE_STYLES[currentPhaseInfo.phase].text,
                    }}
                  >
                    Day {currentPhaseInfo.cycleDay}
                  </p>
                  <Badge
                    className="mt-1 text-xs"
                    style={{
                      background: PHASE_STYLES[currentPhaseInfo.phase].bg,
                      color: PHASE_STYLES[currentPhaseInfo.phase].text,
                      border: "none",
                    }}
                  >
                    {PHASE_STYLES[currentPhaseInfo.phase].label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentPhaseInfo.daysLabel}
                  </p>
                </>
              )}
            </Card>
          </div>

          {/* Cycle length info */}
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <p className="text-xs text-muted-foreground">
              Predictions based on <strong className="text-foreground">{cycleLength}-day</strong> average cycle
              {(dashboard as any)?.totalCycles > 1
                ? ` across ${(dashboard as any).totalCycles} cycles`
                : ""}
            </p>
          </div>

          {/* 3-month calendars */}
          <div className="space-y-5">
            {months.map((m) => (
              <Card key={`${m.year}-${m.month}`} className="p-4">
                <MonthCalendar
                  year={m.year}
                  month={m.month}
                  lastStart={lastStart}
                  cycleLength={cycleLength}
                />
              </Card>
            ))}
          </div>

          {/* Legend */}
          <Card className="p-4">
            <p className="label-caps mb-3">Phase key</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(PHASE_STYLES) as [Phase, typeof PHASE_STYLES[Phase]][])
                .filter(([k]) => k !== "unknown")
                .map(([key, style]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md flex-shrink-0"
                      style={{ background: style.bg, border: `1.5px solid ${style.text}30` }}
                    />
                    <span className="text-sm text-foreground">{style.label}</span>
                  </div>
                ))}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md flex-shrink-0 relative" style={{ background: PHASE_STYLES.ovulation.bg }}>
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 border border-white" />
                </div>
                <span className="text-sm text-foreground">Ovulation peak dot</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Predictions are based on your logged cycle history and average length.
              Actual ovulation can vary — use with BBT and cervical mucus tracking for best accuracy.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
