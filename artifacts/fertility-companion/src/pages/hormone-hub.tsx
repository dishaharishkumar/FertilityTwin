import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, Legend,
} from "recharts";

const HORMONES = [
  { key: "estrogen", label: "Estrogen (E2)", color: "#ec4899", description: "Drives energy, confidence, and libido. Peaks just before ovulation." },
  { key: "lh", label: "LH Surge", color: "#f59e0b", description: "The luteinising hormone surge triggers ovulation within 24–36 hours." },
  { key: "progesterone", label: "Progesterone", color: "#8b5cf6", description: "Rises after ovulation. Warming, sedating — supports implantation." },
  { key: "fsh", label: "FSH", color: "#06b6d4", description: "Follicle-stimulating hormone. Recruits follicles at the start of each cycle." },
];

function buildCurve() {
  const data = [];
  for (let day = 1; day <= 28; day++) {
    const t = day - 1;
    const estrogen =
      day <= 13 ? 20 + 60 * Math.pow(t / 12, 2) :
      day === 14 ? 100 :
      day <= 16 ? 100 - (day - 14) * 20 :
      day <= 22 ? 40 + (day - 16) * 8 :
      day <= 26 ? 88 - (day - 22) * 15 :
      28 - (day - 26) * 10;

    const lh =
      day < 13 ? 5 :
      day === 13 ? 30 :
      day === 14 ? 100 :
      day === 15 ? 50 :
      day === 16 ? 15 :
      5;

    const progesterone =
      day <= 14 ? 5 :
      day <= 21 ? 5 + 75 * Math.pow((day - 14) / 7, 1.5) :
      day <= 24 ? 80 - (day - 21) * 5 :
      65 - (day - 24) * 18;

    const fsh =
      day <= 3 ? 20 + (3 - day) * 5 :
      day <= 7 ? 20 - (day - 3) * 3 :
      day <= 12 ? 8 + (day - 7) * 2 :
      day === 13 ? 25 :
      day === 14 ? 30 :
      day <= 16 ? 20 - (day - 14) * 5 :
      8;

    data.push({
      day,
      estrogen: Math.max(5, Math.round(estrogen)),
      lh: Math.max(5, Math.round(lh)),
      progesterone: Math.max(3, Math.round(progesterone)),
      fsh: Math.max(5, Math.round(fsh)),
    });
  }
  return data;
}

const curveData = buildCurve();

const PHASE_BANDS = [
  { x1: 1, x2: 5, label: "Menstrual", color: "#f43f5e" },
  { x1: 6, x2: 13, label: "Follicular", color: "#f59e0b" },
  { x1: 14, x2: 16, label: "Ovulation", color: "#10b981" },
  { x1: 17, x2: 28, label: "Luteal", color: "#8b5cf6" },
];

const DAY_EVENTS: Record<number, { title: string; body: string; hormone: string }> = {
  1: { title: "Day 1 — Period starts", hormone: "estrogen", body: "Estrogen and progesterone hit their lowest point, triggering the uterine lining to shed. FSH begins to rise, starting the recruitment of next cycle's follicles." },
  5: { title: "Day 5 — Follicular phase picks up", hormone: "fsh", body: "FSH is now driving follicle development. One dominant follicle will emerge and begin producing estrogen, lifting your mood and energy." },
  10: { title: "Day 10 — Estrogen is rising", hormone: "estrogen", body: "Estrogen is climbing — this often brings sharper focus, higher social energy, and improved mood. You may feel more like yourself now than at any other point in your cycle." },
  13: { title: "Day 13 — LH surge begins", hormone: "lh", body: "The pituitary gland releases a surge of LH. This is what OPK tests detect. The egg is being prepared for release within 24–36 hours." },
  14: { title: "Day 14 — Ovulation", hormone: "lh", body: "The LH peak triggers the follicle to rupture, releasing a mature egg. Estrogen peaks too, then drops sharply. The 'fertile window' for conception closes after today unless sperm are already present." },
  16: { title: "Day 16 — Corpus luteum forms", hormone: "progesterone", body: "The ruptured follicle transforms into the corpus luteum and starts producing progesterone. Body temperature rises 0.2–0.5°C — this is the BBT shift." },
  21: { title: "Day 21 — Progesterone peak", hormone: "progesterone", body: "Progesterone hits its highest point. This is when the uterine lining is thickest and most prepared for a potential implantation. Fatigue and tender breasts are progesterone effects — not necessarily pregnancy signs." },
  25: { title: "Day 25 — Progesterone drops (if no pregnancy)", hormone: "progesterone", body: "If implantation hasn't occurred, the corpus luteum begins to break down. Progesterone and estrogen fall, and the next period begins its approach. PMS symptoms often appear here." },
  28: { title: "Day 28 — Cycle ends", hormone: "estrogen", body: "Both estrogen and progesterone are at their lowest. The uterine lining begins to break down. Day 1 of the next cycle is imminent." },
};

interface TooltipProps {
  active?: boolean;
  payload?: { color: string; name: string; value: number; dataKey: string }[];
  label?: number;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || !label) return null;
  const event = DAY_EVENTS[label];
  return (
    <div className="rounded-xl bg-white shadow-lg border border-border p-3 max-w-[220px] text-xs space-y-2">
      <p className="font-semibold text-foreground text-[11px]">Day {label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
      {event && (
        <div className="pt-1.5 border-t border-border space-y-0.5">
          <p className="font-semibold text-foreground">{event.title}</p>
          <p className="text-muted-foreground leading-relaxed">{event.body}</p>
        </div>
      )}
    </div>
  );
}

const LEARN_CARDS = [
  {
    hormone: "Estrogen",
    color: "#ec4899",
    emoji: "🌸",
    what: "Produced mainly by developing follicles in the ovaries.",
    peaks: "Days 12–14, with a smaller second peak mid-luteal phase.",
    effects: "Higher energy, sharper memory, improved mood, stronger libido. Also thickens the uterine lining.",
    low: "Low estrogen (menstrual and late-luteal phase) brings fatigue, brain fog, and emotional sensitivity.",
  },
  {
    hormone: "LH (Luteinising Hormone)",
    color: "#f59e0b",
    emoji: "⚡",
    what: "Released by the pituitary gland in the brain.",
    peaks: "A sharp surge 24–36 hours before ovulation — this is what OPK tests measure.",
    effects: "Triggers the dominant follicle to release the egg. Without this surge, ovulation does not occur.",
    low: "Low between surges — it rises and falls within a 24–48 hour window each cycle.",
  },
  {
    hormone: "Progesterone",
    color: "#8b5cf6",
    emoji: "🌙",
    what: "Produced by the corpus luteum after ovulation.",
    peaks: "Days 19–22 (about 7 days after ovulation).",
    effects: "Warms the body (BBT rise), thickens the uterine lining, has a sedating effect on the nervous system. Supports early pregnancy.",
    low: "If no pregnancy: corpus luteum breaks down, progesterone drops, period follows. Many PMS symptoms are caused by this withdrawal.",
  },
  {
    hormone: "FSH (Follicle-Stimulating Hormone)",
    color: "#06b6d4",
    emoji: "🔵",
    what: "Released by the pituitary gland to stimulate follicle growth.",
    peaks: "Days 1–7 and a smaller surge just before ovulation.",
    effects: "Recruits and grows follicles. The dominant follicle eventually suppresses FSH by producing estrogen, ensuring only one egg is released.",
    low: "Suppressed by rising estrogen mid-cycle. Low FSH does not mean no eggs — it means estrogen is doing its job.",
  },
];

export default function HormoneHubPage() {
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    estrogen: true, lh: true, progesterone: true, fsh: true,
  });

  function toggleLine(key: string) {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const hoverEvent = activeDay ? DAY_EVENTS[activeDay] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Hormone Hub
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Estrogen, progesterone, LH, and FSH across a 28-day cycle — hover any day to see what's happening and why it matters.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {HORMONES.map((h) => (
          <button
            key={h.key}
            onClick={() => toggleLine(h.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all"
            style={{
              borderColor: h.color,
              background: visibleLines[h.key] ? h.color + "20" : "transparent",
              color: visibleLines[h.key] ? h.color : "#94a3b8",
              opacity: visibleLines[h.key] ? 1 : 0.5,
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: h.color }} />
            {h.label}
          </button>
        ))}
      </div>

      <Card className="p-4 overflow-hidden">
        <div className="flex gap-2 mb-3 flex-wrap">
          {PHASE_BANDS.map((b) => (
            <span key={b.label} className="flex items-center gap-1 text-[10px] label-caps">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: b.color + "40", border: `1px solid ${b.color}` }} />
              <span style={{ color: b.color }}>{b.label}</span>
            </span>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={curveData}
            onMouseMove={(s) => {
              if (s.activeLabel) setActiveDay(Number(s.activeLabel));
            }}
            onMouseLeave={() => setActiveDay(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

            {PHASE_BANDS.map((b) => (
              <ReferenceLine
                key={b.label}
                x={Math.round((b.x1 + b.x2) / 2)}
                stroke="transparent"
                label={{ value: "", position: "top" }}
              />
            ))}

            {PHASE_BANDS.map((b) => (
              <ReferenceLine
                key={b.label + "-start"}
                x={b.x1}
                stroke={b.color}
                strokeOpacity={0.25}
                strokeDasharray="4 4"
              />
            ))}

            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              label={{ value: "Cycle Day", position: "insideBottom", offset: -2, fontSize: 10, fill: "#94a3b8" }}
              height={30}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />

            {visibleLines.estrogen && (
              <Line dataKey="estrogen" name="Estrogen" stroke="#ec4899" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            )}
            {visibleLines.lh && (
              <Line dataKey="lh" name="LH" stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            )}
            {visibleLines.progesterone && (
              <Line dataKey="progesterone" name="Progesterone" stroke="#8b5cf6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            )}
            {visibleLines.fsh && (
              <Line dataKey="fsh" name="FSH" stroke="#06b6d4" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            )}
          </LineChart>
        </ResponsiveContainer>

        <p className="text-[10px] text-muted-foreground text-center mt-1">
          Hover over any day for a detailed explanation · Toggle hormones using the pills above
        </p>
      </Card>

      {hoverEvent && (
        <Card className="p-4 border-primary/20 bg-primary/5 space-y-1">
          <p className="font-semibold text-sm text-foreground">{hoverEvent.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{hoverEvent.body}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LEARN_CARDS.map((c) => (
          <Card key={c.hormone} className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{c.emoji}</span>
              <h2 className="font-semibold text-sm" style={{ color: c.color }}>{c.hormone}</h2>
            </div>
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="label-caps text-muted-foreground mb-0.5">What is it</dt>
                <dd className="text-foreground/80 leading-relaxed">{c.what}</dd>
              </div>
              <div>
                <dt className="label-caps text-muted-foreground mb-0.5">When it peaks</dt>
                <dd className="text-foreground/80 leading-relaxed">{c.peaks}</dd>
              </div>
              <div>
                <dt className="label-caps text-muted-foreground mb-0.5">What it does</dt>
                <dd className="text-foreground/80 leading-relaxed">{c.effects}</dd>
              </div>
              <div>
                <dt className="label-caps text-muted-foreground mb-0.5">When it drops</dt>
                <dd className="text-foreground/80 leading-relaxed">{c.low}</dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground text-center pb-2">
        Curves are representative of an average 28-day cycle. Individual hormone patterns vary — this is educational, not diagnostic.
      </p>
    </div>
  );
}
