import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useGetCycles } from "@workspace/api-client-react";
import { differenceInDays, parseISO } from "date-fns";
import { X, Plus, Flag } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Marker {
  id: number;
  cycleDay: number;
  markerType: string;
  label: string | null;
  notes: string | null;
}

const MARKER_TYPES = [
  { value: "positive_opk", label: "Positive OPK", emoji: "⚡", color: "#f59e0b" },
  { value: "ovulation_confirmed", label: "Ovulation Confirmed", emoji: "🥚", color: "#10b981" },
  { value: "implantation_window", label: "Implantation Window", emoji: "🌱", color: "#8b5cf6" },
  { value: "test_day", label: "Test Day Planned", emoji: "🧪", color: "#3b82f6" },
  { value: "symptom_onset", label: "Symptom Onset", emoji: "💫", color: "#ec4899" },
  { value: "custom", label: "Custom Note", emoji: "📌", color: "#64748b" },
];

function getPhaseForDay(day: number, cycleLength: number) {
  const ov = Math.round(cycleLength * 0.5);
  if (day <= 5) return { name: "Menstrual", color: "#f43f5e", bg: "#fff1f2" };
  if (day <= ov - 2) return { name: "Follicular", color: "#f59e0b", bg: "#fffbeb" };
  if (day <= ov + 1) return { name: "Ovulation", color: "#10b981", bg: "#ecfdf5" };
  return { name: "Luteal", color: "#8b5cf6", bg: "#f5f3ff" };
}

function getMarkerInfo(type: string) {
  return MARKER_TYPES.find((m) => m.value === type) ?? MARKER_TYPES[5];
}

export default function CyclePhaseTrackerPage() {
  const { data: cycles } = useGetCycles();
  const { toast } = useToast();
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState("positive_opk");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const cycle = cycles?.[0] ?? null;
  const cycleLength = 28;
  const today = cycle
    ? Math.min(differenceInDays(new Date(), parseISO(cycle.startDate)) + 1, cycleLength)
    : null;

  useEffect(() => {
    fetch(`${BASE}/api/cycle-markers`)
      .then((r) => r.json())
      .then(setMarkers)
      .catch(() => {});
  }, []);

  async function addMarker() {
    if (!selectedDay) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/cycle-markers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleDay: selectedDay, markerType: selectedType, notes: notes || null }),
      });
      const created = await res.json();
      setMarkers((prev) => [...prev, created].sort((a, b) => a.cycleDay - b.cycleDay));
      setSelectedDay(null);
      setNotes("");
      toast({ title: "Marker saved", description: `Day ${selectedDay} flagged.` });
    } catch {
      toast({ title: "Error", description: "Could not save marker.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function removeMarker(id: number) {
    await fetch(`${BASE}/api/cycle-markers/${id}`, { method: "DELETE" });
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }

  const days = Array.from({ length: cycleLength }, (_, i) => i + 1);
  const markersByDay = new Map<number, Marker[]>();
  for (const m of markers) {
    if (!markersByDay.has(m.cycleDay)) markersByDay.set(m.cycleDay, []);
    markersByDay.get(m.cycleDay)!.push(m);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Phase Tracker
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Mark key moments on your cycle timeline — ovulation, OPK peak, test day, and more.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap text-xs">
        {[
          { name: "Menstrual", color: "#f43f5e", days: "1–5" },
          { name: "Follicular", color: "#f59e0b", days: "6–13" },
          { name: "Ovulation", color: "#10b981", days: "14–15" },
          { name: "Luteal", color: "#8b5cf6", days: "16–28" },
        ].map((p) => (
          <span key={p.name} className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/60">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            {p.name} <span className="text-muted-foreground">({p.days})</span>
          </span>
        ))}
      </div>

      <Card className="p-4 overflow-x-auto">
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(7, minmax(52px, 1fr))" }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-[10px] label-caps text-muted-foreground pb-1">{d}</div>
          ))}
          {days.map((day) => {
            const phase = getPhaseForDay(day, cycleLength);
            const isToday = day === today;
            const isPast = today !== null && day < today;
            const dayMarkers = markersByDay.get(day) ?? [];
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className="relative rounded-xl p-1.5 flex flex-col items-center gap-0.5 transition-all border-2"
                style={{
                  background: isSelected ? phase.color + "22" : isPast || isToday ? phase.bg : "#f8fafc",
                  borderColor: isSelected ? phase.color : isToday ? phase.color : "transparent",
                  opacity: !isPast && !isToday && today !== null ? 0.5 : 1,
                }}
              >
                <span className="text-[11px] font-medium" style={{ color: isToday ? phase.color : "#64748b" }}>
                  {day}
                </span>
                {isToday && (
                  <span className="text-[8px] font-bold" style={{ color: phase.color }}>TODAY</span>
                )}
                <div className="flex flex-wrap justify-center gap-0.5 min-h-[14px]">
                  {dayMarkers.map((m) => {
                    const info = getMarkerInfo(m.markerType);
                    return (
                      <span key={m.id} className="text-[10px]" title={info.label}>{info.emoji}</span>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {selectedDay !== null && (
        <Card className="p-4 space-y-4 border-primary/30">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">
              Day {selectedDay} — {getPhaseForDay(selectedDay, cycleLength).name}
            </h2>
            <button onClick={() => setSelectedDay(null)} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          {(markersByDay.get(selectedDay) ?? []).length > 0 && (
            <div className="space-y-1">
              <p className="text-xs label-caps text-muted-foreground">Existing markers</p>
              {(markersByDay.get(selectedDay) ?? []).map((m) => {
                const info = getMarkerInfo(m.markerType);
                return (
                  <div key={m.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="text-sm">{info.emoji} {info.label}</span>
                    <button onClick={() => removeMarker(m.id)} className="text-muted-foreground hover:text-destructive">
                      <X size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs label-caps text-muted-foreground">Add a marker</p>
            <div className="grid grid-cols-2 gap-2">
              {MARKER_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setSelectedType(t.value)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm border-2 transition-all text-left"
                  style={{
                    borderColor: selectedType === t.value ? t.color : "transparent",
                    background: selectedType === t.value ? t.color + "15" : "var(--muted)",
                  }}
                >
                  <span>{t.emoji}</span>
                  <span className="text-xs leading-tight">{t.label}</span>
                </button>
              ))}
            </div>

            <textarea
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              rows={2}
              placeholder="Optional note…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <Button onClick={addMarker} disabled={saving} className="w-full gap-2">
              <Plus size={15} />
              {saving ? "Saving…" : "Add marker to Day " + selectedDay}
            </Button>
          </div>
        </Card>
      )}

      {markers.length > 0 && (
        <Card className="p-4 space-y-3">
          <p className="text-xs label-caps text-muted-foreground">All markers this cycle</p>
          <div className="space-y-2">
            {markers.map((m) => {
              const info = getMarkerInfo(m.markerType);
              const phase = getPhaseForDay(m.cycleDay, cycleLength);
              return (
                <div key={m.id} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: phase.bg }}>
                  <div className="flex items-center gap-3">
                    <span className="text-base">{info.emoji}</span>
                    <div>
                      <p className="text-sm font-medium">{info.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Day {m.cycleDay} · {phase.name}
                        {m.notes && ` · ${m.notes}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => removeMarker(m.id)} className="text-muted-foreground hover:text-destructive">
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {markers.length === 0 && selectedDay === null && (
        <Card className="p-10 text-center">
          <Flag size={32} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No markers yet</p>
          <p className="text-xs text-muted-foreground mt-1">Tap any day on the calendar to flag a key moment.</p>
        </Card>
      )}
    </div>
  );
}
