import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { MapPin, Flame, Clock } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface BodyMapLog {
  id: number;
  region: string;
  sensation: string;
  intensity: number;
  notes: string | null;
  loggedAt: string;
}

const REGIONS = [
  { id: "head", label: "Head", description: "Headaches, pressure, dizziness" },
  { id: "chest", label: "Chest / Breasts", description: "Tenderness, heaviness" },
  { id: "upper-abdomen", label: "Upper Abdomen", description: "Bloating, nausea, pressure" },
  { id: "lower-abdomen", label: "Lower Abdomen", description: "Cramps, fullness, aching" },
  { id: "left-ovary", label: "Left Ovary", description: "Pinching, mittelschmerz, pressure" },
  { id: "right-ovary", label: "Right Ovary", description: "Pinching, mittelschmerz, pressure" },
  { id: "lower-back", label: "Lower Back", description: "Aching, tension, spasms" },
  { id: "left-hip", label: "Left Hip", description: "Radiating pain, pressure" },
  { id: "right-hip", label: "Right Hip", description: "Radiating pain, pressure" },
];

const SENSATIONS = [
  "Cramping",
  "Pressure",
  "Aching",
  "Sharp / stabbing",
  "Throbbing",
  "Bloating",
  "Tenderness",
  "Burning",
  "Heaviness",
];

function heatColor(count: number): string {
  if (count === 0) return "hsl(345, 30%, 94%)";
  if (count <= 2) return "hsl(345, 45%, 85%)";
  if (count <= 5) return "hsl(345, 52%, 72%)";
  if (count <= 10) return "hsl(345, 55%, 58%)";
  return "hsl(345, 58%, 44%)";
}

function heatStroke(count: number): string {
  if (count === 0) return "hsl(345, 25%, 82%)";
  if (count <= 2) return "hsl(345, 40%, 72%)";
  if (count <= 5) return "hsl(345, 48%, 58%)";
  return "hsl(345, 52%, 40%)";
}

interface BodySvgProps {
  heatmap: Record<string, number>;
  onRegionClick: (regionId: string) => void;
}

function BodySvg({ heatmap, onRegionClick }: BodySvgProps) {
  const c = (id: string) => heatColor(heatmap[id] ?? 0);
  const s = (id: string) => heatStroke(heatmap[id] ?? 0);
  const cls = "cursor-pointer transition-opacity hover:opacity-75";

  return (
    <svg
      viewBox="0 0 200 430"
      className="w-full max-w-[220px] mx-auto select-none"
      style={{ filter: "drop-shadow(0 4px 16px rgba(190,75,112,0.12))" }}
    >
      {/* Body silhouette */}
      <ellipse cx="100" cy="36" rx="29" ry="33" fill="#fdf6f9" stroke="#e8d0da" strokeWidth="1.2" />
      <rect x="89" y="67" width="22" height="16" rx="5" fill="#fdf6f9" stroke="#e8d0da" strokeWidth="1" />
      <path d="M73 80 Q65 82 60 95 L56 175 Q56 183 63 184 L68 184 Q73 184 73 176 L73 105 Q73 90 80 83 Z" fill="#fdf6f9" stroke="#e8d0da" strokeWidth="1" />
      <path d="M127 80 Q135 82 140 95 L144 175 Q144 183 137 184 L132 184 Q127 184 127 176 L127 105 Q127 90 120 83 Z" fill="#fdf6f9" stroke="#e8d0da" strokeWidth="1" />
      <path d="M73 80 Q72 78 100 76 Q128 78 127 80 L128 215 Q128 224 120 226 L80 226 Q72 224 72 215 Z" fill="#fdf6f9" stroke="#e8d0da" strokeWidth="1" />
      <rect x="75" y="225" width="21" height="88" rx="8" fill="#fdf6f9" stroke="#e8d0da" strokeWidth="1" />
      <rect x="104" y="225" width="21" height="88" rx="8" fill="#fdf6f9" stroke="#e8d0da" strokeWidth="1" />
      <rect x="77" y="311" width="17" height="72" rx="7" fill="#fdf6f9" stroke="#e8d0da" strokeWidth="1" />
      <rect x="106" y="311" width="17" height="72" rx="7" fill="#fdf6f9" stroke="#e8d0da" strokeWidth="1" />

      {/* Head */}
      <ellipse
        cx="100" cy="36" rx="26" ry="30"
        fill={c("head")} stroke={s("head")} strokeWidth="1.5"
        className={cls} onClick={() => onRegionClick("head")}
      />

      {/* Chest */}
      <rect
        x="74" y="80" width="52" height="38" rx="3"
        fill={c("chest")} stroke={s("chest")} strokeWidth="1.2"
        className={cls} onClick={() => onRegionClick("chest")}
      />

      {/* Upper abdomen */}
      <rect
        x="74" y="118" width="52" height="36"
        fill={c("upper-abdomen")} stroke={s("upper-abdomen")} strokeWidth="1.2"
        className={cls} onClick={() => onRegionClick("upper-abdomen")}
      />

      {/* Lower abdomen */}
      <rect
        x="74" y="154" width="52" height="46" rx="0"
        fill={c("lower-abdomen")} stroke={s("lower-abdomen")} strokeWidth="1.2"
        className={cls} onClick={() => onRegionClick("lower-abdomen")}
      />

      {/* Left ovary */}
      <ellipse
        cx="81" cy="187" rx="11" ry="9"
        fill={c("left-ovary")} stroke={s("left-ovary")} strokeWidth="1.5"
        className={cls} onClick={() => onRegionClick("left-ovary")}
      />
      <text x="81" y="190" textAnchor="middle" fontSize="6" fill="hsl(345,45%,40%)" style={{ pointerEvents: "none", fontWeight: 600 }}>L</text>

      {/* Right ovary */}
      <ellipse
        cx="119" cy="187" rx="11" ry="9"
        fill={c("right-ovary")} stroke={s("right-ovary")} strokeWidth="1.5"
        className={cls} onClick={() => onRegionClick("right-ovary")}
      />
      <text x="119" y="190" textAnchor="middle" fontSize="6" fill="hsl(345,45%,40%)" style={{ pointerEvents: "none", fontWeight: 600 }}>R</text>

      {/* Lower back band (shown at torso bottom as a distinct zone) */}
      <rect
        x="74" y="200" width="52" height="18" rx="0"
        fill={c("lower-back")} stroke={s("lower-back")} strokeWidth="1.2"
        className={cls} onClick={() => onRegionClick("lower-back")}
      />
      <text x="100" y="212" textAnchor="middle" fontSize="6.5" fill="hsl(345,40%,38%)" style={{ pointerEvents: "none" }}>Lower Back</text>

      {/* Left hip */}
      <ellipse
        cx="70" cy="224" rx="14" ry="12"
        fill={c("left-hip")} stroke={s("left-hip")} strokeWidth="1.2"
        className={cls} onClick={() => onRegionClick("left-hip")}
      />

      {/* Right hip */}
      <ellipse
        cx="130" cy="224" rx="14" ry="12"
        fill={c("right-hip")} stroke={s("right-hip")} strokeWidth="1.2"
        className={cls} onClick={() => onRegionClick("right-hip")}
      />

      {/* Legend indicator dots on side */}
      <circle cx="170" cy="36" r="4" fill="hsl(345,30%,94%)" stroke="hsl(345,25%,82%)" strokeWidth="1" />
      <circle cx="170" cy="52" r="4" fill="hsl(345,45%,85%)" stroke="hsl(345,40%,72%)" strokeWidth="1" />
      <circle cx="170" cy="68" r="4" fill="hsl(345,52%,72%)" stroke="hsl(345,48%,58%)" strokeWidth="1" />
      <circle cx="170" cy="84" r="4" fill="hsl(345,58%,44%)" stroke="hsl(345,52%,40%)" strokeWidth="1" />
      <text x="178" y="39" fontSize="5.5" fill="hsl(345,30%,55%)">none</text>
      <text x="178" y="55" fontSize="5.5" fill="hsl(345,40%,50%)">low</text>
      <text x="178" y="71" fontSize="5.5" fill="hsl(345,48%,42%)">mid</text>
      <text x="178" y="87" fontSize="5.5" fill="hsl(345,52%,36%)">high</text>
    </svg>
  );
}

export default function BodyMapPage() {
  const [logs, setLogs] = useState<BodyMapLog[]>([]);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [sensation, setSensation] = useState<string>("");
  const [intensity, setIntensity] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function fetchData() {
    const [logsRes, heatRes] = await Promise.all([
      fetch(`${BASE}/api/body-map`),
      fetch(`${BASE}/api/body-map/heatmap`),
    ]);
    if (logsRes.ok) setLogs(await logsRes.json());
    if (heatRes.ok) setHeatmap(await heatRes.json());
  }

  useEffect(() => { fetchData(); }, []);

  const regionLabel = REGIONS.find((r) => r.id === selectedRegion)?.label ?? "";

  async function handleSave() {
    if (!selectedRegion || !sensation) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/body-map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: selectedRegion, sensation, intensity, notes: notes || undefined }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Logged", description: `${sensation} in ${regionLabel} recorded.` });
      setSelectedRegion(null);
      setSensation("");
      setIntensity(1);
      setNotes("");
      fetchData();
    } catch {
      toast({ title: "Error", description: "Could not save log.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const intensityLabels = ["", "Mild", "Moderate", "Severe"];

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl text-foreground mb-1"
          style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
        >
          Body Map
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tap exactly where you feel sensations. Your body speaks — track it.
          Heat map shows frequency over time.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-5">
          <p className="label-caps mb-4">Tap a region to log</p>
          <BodySvg heatmap={heatmap} onRegionClick={(id) => { setSelectedRegion(id); setSensation(""); setIntensity(1); setNotes(""); }} />
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="label-caps mb-3">Region activity</p>
            <div className="space-y-2">
              {REGIONS.map((r) => {
                const count = heatmap[r.id] ?? 0;
                const pct = Math.min(100, (count / Math.max(1, Math.max(...Object.values(heatmap), 1))) * 100);
                return (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRegion(r.id); setSensation(""); setIntensity(1); setNotes(""); }}
                    className="w-full text-left group"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">{r.label}</span>
                      {count > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {count}×
                        </Badge>
                      )}
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: heatColor(count),
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {logs.length > 0 && (
            <Card className="p-5">
              <p className="label-caps mb-3">Recent logs</p>
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {logs.slice(0, 15).map((log) => (
                  <div key={log.id} className="flex gap-3 items-start">
                    <div
                      className="mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: heatColor(2) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {REGIONS.find((r) => r.id === log.region)?.label ?? log.region}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.sensation} · {intensityLabels[log.intensity]}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        {format(new Date(log.loggedAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={!!selectedRegion} onOpenChange={() => setSelectedRegion(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--app-font-serif)" }}>
              {regionLabel}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {REGIONS.find((r) => r.id === selectedRegion)?.description}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <p className="label-caps mb-2">Sensation</p>
              <div className="flex flex-wrap gap-2">
                {SENSATIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSensation(s)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      sensation === s
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label-caps mb-2">Intensity</p>
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <button
                    key={i}
                    onClick={() => setIntensity(i)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                      intensity === i
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {intensityLabels[i]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="label-caps mb-2">Notes (optional)</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details..."
                className="resize-none text-sm"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedRegion(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!sensation || saving}>
              {saving ? "Saving…" : "Log sensation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
