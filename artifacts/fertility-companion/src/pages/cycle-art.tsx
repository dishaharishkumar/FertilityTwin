import { useRef, useEffect, useState, useCallback } from "react";
import { useGetLogs } from "@workspace/api-client-react";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { useGetCycles } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, RefreshCw, Sparkles, Info } from "lucide-react";

interface MandalaParams {
  petals: number;
  primaryHue: number;
  saturation: number;
  brightness: number;
  rings: number;
  rotOffset: number;
  logCount: number;
  phase: string;
  avgMood: number;
  avgEnergy: number;
  symptomCount: number;
  cycleName: string;
}

const MOOD_SCORES: Record<string, number> = {
  terrible: 1, bad: 2, okay: 3, good: 4, great: 5,
};

const PHASE_LABELS: Record<string, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulation: "Ovulation",
  tww: "Luteal / TWW",
};

function computeParams(logs: any[], dashboard: any): MandalaParams {
  const logCount = logs.length;

  const phase = dashboard?.currentPhase ?? "follicular";
  const phaseHues: Record<string, number> = {
    menstrual: 5,
    follicular: 330,
    ovulation: 42,
    tww: 270,
    luteal: 270,
  };
  const primaryHue = phaseHues[phase] ?? 345;

  const moodScores = logs.map((l) => MOOD_SCORES[l.mood] ?? 3);
  const avgMood =
    moodScores.length > 0
      ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
      : 3;
  const saturation = Math.round(25 + (avgMood / 5) * 50);

  const energies = logs.map((l) => l.energyLevel).filter(Boolean);
  const avgEnergy =
    energies.length > 0
      ? energies.reduce((a: number, b: number) => a + b, 0) / energies.length
      : 5;
  const brightness = Math.round(42 + (avgEnergy / 10) * 18);

  const allSymptoms = new Set(logs.flatMap((l) => l.symptoms ?? []));
  const symptomCount = allSymptoms.size;
  const rings = Math.min(4, Math.max(1, Math.floor(symptomCount / 2) + 1));

  const petals = Math.max(5, Math.min(18, 5 + Math.floor(logCount / 3)));

  const cycleDay = dashboard?.cycleDay ?? 14;
  const rotOffset = ((cycleDay % 28) / 28) * Math.PI * 2;

  const cycleName = `Cycle Day ${cycleDay ?? "?"}`;

  return {
    petals,
    primaryHue,
    saturation,
    brightness,
    rings,
    rotOffset,
    logCount,
    phase,
    avgMood,
    avgEnergy,
    symptomCount,
    cycleName,
  };
}

function drawMandala(canvas: HTMLCanvasElement, p: MandalaParams) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) * 0.43;

  ctx.clearRect(0, 0, W, H);

  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.6);
  bg.addColorStop(0, `hsl(${p.primaryHue}, 35%, 97%)`);
  bg.addColorStop(0.6, `hsl(${p.primaryHue}, 25%, 94%)`);
  bg.addColorStop(1, `hsl(${p.primaryHue}, 18%, 90%)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  for (let r = p.rings; r >= 1; r--) {
    const frac = r / p.rings;
    const ringR = R * (0.25 + frac * 0.75);
    const petalLen = ringR * 0.88;
    const petalW = ((2 * Math.PI * ringR) / p.petals) * 0.38;
    const hue = (p.primaryHue + (p.rings - r) * 28) % 360;
    const sat = Math.min(88, p.saturation + (p.rings - r) * 8);
    const bri = p.brightness + (p.rings - r) * 4;
    const alpha = 0.48 + frac * 0.38;
    const extraRot = r % 2 === 0 ? Math.PI / p.petals : 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(p.rotOffset + extraRot);

    for (let i = 0; i < p.petals; i++) {
      const angle = (i * 2 * Math.PI) / p.petals;
      ctx.save();
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(0, -ringR * 0.04);
      ctx.bezierCurveTo(
        petalW * 0.65,
        -ringR * 0.18,
        petalW * 0.55,
        -petalLen * 0.78,
        0,
        -petalLen
      );
      ctx.bezierCurveTo(
        -petalW * 0.55,
        -petalLen * 0.78,
        -petalW * 0.65,
        -ringR * 0.18,
        0,
        -ringR * 0.04
      );
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, -ringR * 0.04, 0, -petalLen);
      grad.addColorStop(
        0,
        `hsla(${hue}, ${sat}%, ${bri + 12}%, ${alpha})`
      );
      grad.addColorStop(
        0.45,
        `hsla(${hue}, ${sat}%, ${bri}%, ${alpha})`
      );
      grad.addColorStop(
        1,
        `hsla(${(hue + 18) % 360}, ${sat - 5}%, ${bri + 22}%, ${
          alpha * 0.55
        })`
      );
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = `hsla(${hue}, ${sat - 10}%, ${bri - 12}%, ${
        alpha * 0.28
      })`;
      ctx.lineWidth = 0.6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -petalLen + 4, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, ${sat}%, ${bri + 28}%, ${alpha * 0.85})`;
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  const dotCount = p.petals * 2;
  const dotR = R * 0.26;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(p.rotOffset + Math.PI / p.petals);
  for (let i = 0; i < dotCount; i++) {
    const angle = (i * 2 * Math.PI) / dotCount;
    const x = Math.sin(angle) * dotR;
    const y = -Math.cos(angle) * dotR;
    const size = i % 2 === 0 ? 3 : 1.8;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.primaryHue}, ${p.saturation}%, ${
      p.brightness + 20
    }%, 0.55)`;
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowBlur = 28;
  ctx.shadowColor = `hsla(${p.primaryHue}, ${p.saturation + 10}%, ${
    p.brightness + 20
  }%, 0.85)`;
  const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.16);
  cg.addColorStop(0, `hsl(${p.primaryHue}, ${p.saturation + 15}%, ${p.brightness + 32}%)`);
  cg.addColorStop(0.55, `hsl(${p.primaryHue}, ${p.saturation + 5}%, ${p.brightness + 14}%)`);
  cg.addColorStop(1, `hsl(${p.primaryHue}, ${p.saturation}%, ${p.brightness}%)`);
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = cg;
  ctx.fill();
  ctx.restore();

  const starR = R * 0.085;
  const starPoints = 6;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(p.rotOffset);
  ctx.beginPath();
  for (let i = 0; i < starPoints * 2; i++) {
    const angle = (i * Math.PI) / starPoints;
    const rad = i % 2 === 0 ? starR : starR * 0.45;
    ctx.lineTo(Math.sin(angle) * rad, -Math.cos(angle) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = `hsla(${p.primaryHue}, ${p.saturation + 5}%, ${
    p.brightness + 38
  }%, 0.9)`;
  ctx.fill();
  ctx.restore();
}

export default function CycleArtPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [params, setParams] = useState<MandalaParams | null>(null);
  const [generated, setGenerated] = useState(false);

  const { data: logsData } = useGetLogs({ limit: 90 });
  const { data: dashboard } = useGetDashboardSummary();
  const { data: cycles } = useGetCycles();

  const logs = logsData ?? [];

  const generate = useCallback(() => {
    const p = computeParams(logs, dashboard);
    setParams(p);
    setGenerated(true);
  }, [logs, dashboard, cycles]);

  useEffect(() => {
    if (canvasRef.current && params) {
      drawMandala(canvasRef.current, params);
    }
  }, [params]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = "bloom-cycle-portrait.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const phaseLabel = params ? (PHASE_LABELS[params.phase] ?? params.phase) : "";

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl text-foreground mb-1"
          style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
        >
          Cycle Portrait
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A one-of-a-kind artwork generated entirely from your logged cycle data.
          No two portraits are the same.
        </p>
      </div>

      {!generated ? (
        <Card className="p-10 flex flex-col items-center gap-5 text-center border-dashed">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "hsl(345, 48%, 92%)" }}
          >
            <Sparkles size={32} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">
              Ready to see your portrait?
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your BBT readings, mood, energy, and symptoms are woven into
              a unique mandala only you can create.
            </p>
          </div>
          <Button onClick={generate} className="gap-2">
            <Sparkles size={15} />
            Generate My Portrait
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-4 flex flex-col items-center gap-4">
            <canvas
              ref={canvasRef}
              width={480}
              height={480}
              className="rounded-xl max-w-full"
              style={{ boxShadow: "0 4px 24px 0 rgba(190,75,112,0.13)" }}
            />
            <div className="flex gap-3 flex-wrap justify-center">
              <Button onClick={handleDownload} variant="outline" className="gap-2">
                <Download size={15} />
                Download PNG
              </Button>
              <Button onClick={generate} variant="ghost" className="gap-2">
                <RefreshCw size={15} />
                Regenerate
              </Button>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Info size={14} className="text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">What shaped your portrait</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Phase" value={phaseLabel} />
              <Stat label="Days Logged" value={String(params!.logCount)} />
              <Stat label="Petals" value={String(params!.petals)} note="from log count" />
              <Stat label="Rings" value={String(params!.rings)} note="from symptom variety" />
              <Stat
                label="Avg Mood"
                value={params!.avgMood.toFixed(1) + " / 5"}
                note="drives color saturation"
              />
              <Stat
                label="Avg Energy"
                value={params!.avgEnergy.toFixed(1) + " / 10"}
                note="drives brightness"
              />
              <Stat
                label="Symptoms tracked"
                value={String(params!.symptomCount)}
                note="types logged"
              />
              <Stat label="Rotation" value={params!.cycleName} note="from cycle day" />
            </div>
            <p className="text-xs text-muted-foreground pt-1 italic" style={{ fontFamily: "var(--app-font-serif)" }}>
              Log more each day to add complexity, depth, and colour to your portrait.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="bg-muted/40 rounded-xl px-4 py-3">
      <p className="label-caps mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
      {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
    </div>
  );
}
