import { useState, useRef, useEffect, useMemo } from "react";
import { useGetLogs, useGetDashboardSummary, useGetCycles } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { differenceInDays, parseISO, format } from "date-fns";
import { Download, Pencil, RefreshCw } from "lucide-react";

// ─── Template engine ────────────────────────────────────────────────────────

function pickBy<T>(map: Record<string, T>, key: string, fallback: string): T {
  return map[key] ?? map[fallback];
}

function buildLetter(
  name: string,
  logs: any[],
  dashboard: any,
  cycles: any[]
): { paragraphs: string[]; date: string } {
  const displayName = name.trim() || "dear one";
  const today = format(new Date(), "MMMM d, yyyy");
  const phase = (dashboard as any)?.currentPhase ?? "unknown";
  const cycleDay = (dashboard as any)?.cycleDay ?? 0;
  const sorted = [...logs].sort((a: any, b: any) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-14);

  // ── Opening paragraph ──
  const openings: Record<string, string> = {
    menstrual: `You are in your time of release — the quiet, necessary unfolding that asks you to rest more deeply than usual. This phase asks nothing of you except to simply be. Your body is doing exactly what it was designed to do, and you are allowed to let that be enough.`,
    follicular: `Something is beginning to stir. The heaviness is lifting, and your body is quietly gathering energy for what comes next. This is your season of rising — a time when curiosity and possibility feel a little more within reach. Lean into that feeling, even gently.`,
    ovulation: `You are at your peak, and I hope you can feel even a flicker of that. Your body is doing something remarkable right now — reaching outward, open, full of its own particular power. Whether this cycle carries a specific hope or simply the rhythm of another month, you are at your most alive today.`,
    tww: `You are in the most tender part of your cycle — the waiting weeks. Your body is doing complex, quiet work beneath the surface, and it may be asking you to slow down, to soften, to hold space. Whatever you are hoping for this cycle, I want you to know that the hoping itself is a kind of courage.`,
    luteal: `You are in the most tender part of your cycle — the waiting weeks. Your body is doing complex, quiet work beneath the surface, and it may be asking you to slow down, to soften, to hold space. Whatever you are hoping for this cycle, I want you to know that the hoping itself is a kind of courage.`,
    unknown: `I don't know exactly where you are in your cycle right now, but I know this: you have been paying attention. You opened this app. You have been logging, noticing, and returning — and that quiet act of self-observation matters more than you might realize.`,
  };
  const p1 = pickBy(openings, phase, "unknown");

  // ── Symptoms paragraph ──
  const recentSymptomSet = new Set(
    recent.flatMap((l: any) => (l.symptoms ?? []).map((s: string) => s.toLowerCase()))
  );
  const has = (k: string) => [...recentSymptomSet].some((s) => s.includes(k));

  let p2 = "";
  if (has("fatigue") || has("tired") || has("exhausted")) {
    p2 = `Your body has been asking for rest this cycle. The fatigue you've been feeling is not a weakness — it is information. Your system is communicating clearly, and the most loving response is to actually listen. Rest is not laziness. For you, right now, rest is medicine.`;
  } else if (has("cramp") || has("pain") || has("discomfort")) {
    p2 = `Your body has been speaking in its most direct voice this cycle — through physical discomfort that was hard to ignore. The pain you've carried is real, and it deserves acknowledgment. I hope you gave yourself permission to be gentle with yourself on those days. You earned it.`;
  } else if (has("nausea") || has("breast") || has("tender") || has("spotting")) {
    p2 = `Your body has been speaking with particular intensity recently — the physical sensations you've been noticing are signs of your hormones doing their work, your cycle moving through its natural arc. Whatever these symptoms mean for you, they are your body's language, and you have been listening.`;
  } else if (has("bloating") || has("headache") || has("migraine")) {
    p2 = `The physical experiences of this cycle — the bloating, the pressure, the waves of discomfort — have asked something of you. They have asked you to keep showing up anyway, and you have. That is the quiet resilience that fertility awareness builds in people who practice it.`;
  } else if (recent.length > 0) {
    const avgEnergy = recent.filter((l: any) => l.energyLevel != null).map((l: any) => l.energyLevel);
    const energyMean = avgEnergy.length > 0 ? avgEnergy.reduce((a: number, b: number) => a + b, 0) / avgEnergy.length : null;
    if (energyMean && energyMean >= 3.5) {
      p2 = `Your energy has been telling a bright story this cycle. The readings you've logged point to someone who has been, on balance, moving through life with some lightness. Hold onto that. There will be cycles that feel heavier, and remembering this one will help.`;
    } else {
      p2 = `Your body this cycle has been quieter in its communication, or perhaps you've simply been too busy to hear all of it. That's alright. You have been here, logging what you could, noticing what you noticed. That is more than enough.`;
    }
  } else {
    p2 = `You haven't logged many symptoms recently, and that silence itself can be meaningful. Perhaps things have been smooth. Perhaps you've been too occupied to notice. Either way, the act of returning to this page — of wanting to understand your body — is what matters.`;
  }

  // ── BBT paragraph ──
  const bbtLogs = sorted.filter((l: any) => l.bbt != null);
  let p3 = "";
  if (bbtLogs.length >= 6) {
    const half = Math.floor(bbtLogs.length / 2);
    const preAvg = bbtLogs.slice(0, half).reduce((s: number, l: any) => s + l.bbt, 0) / half;
    const postAvg = bbtLogs.slice(half).reduce((s: number, l: any) => s + l.bbt, 0) / (bbtLogs.length - half);
    const shift = postAvg - preAvg;
    if (shift >= 0.2) {
      p3 = `Your temperature chart tells a hopeful story. The clear rise I can see in your data — that gentle but unmistakable shift — suggests your body moved through ovulation with intention. That biphasic pattern is one of the most beautiful things a fertility chart can show, and yours is showing it.`;
    } else if (shift >= 0.1) {
      p3 = `Your temperature data shows a subtle shift this cycle — not dramatic, but present. Your body is communicating through small signals, and the fact that you've been charting every morning means you haven't missed them. That dedication to daily tracking is quietly remarkable.`;
    } else {
      p3 = `Your temperature data has been steady this cycle — no dramatic shifts yet, just the patient accumulation of data points. Every morning you've taken your temperature is a morning you chose to understand yourself a little better. That consistency, repeated day after day, becomes something profound.`;
    }
  } else if (bbtLogs.length > 0) {
    p3 = `You've started tracking your basal body temperature — ${bbtLogs.length} reading${bbtLogs.length !== 1 ? "s" : ""} so far. Each one is a small act of curiosity about your own biology. Keep going. The story your temperature tells gets clearer with every data point you add.`;
  } else {
    p3 = `You haven't started temperature tracking yet, and that's completely okay. If and when you're ready, basal body temperature charting can add a whole new layer of clarity to your cycle. Until then, your symptom and mood data are already saying so much.`;
  }

  // ── Cycle regularity paragraph ──
  const sortedCycles = [...cycles].sort((a: any, b: any) => b.startDate.localeCompare(a.startDate));
  let p4 = "";
  if (sortedCycles.length >= 3) {
    const lengths: number[] = [];
    for (let i = 0; i < Math.min(sortedCycles.length - 1, 5); i++) {
      const len = differenceInDays(parseISO(sortedCycles[i].startDate), parseISO(sortedCycles[i + 1].startDate));
      if (len > 18 && len < 50) lengths.push(len);
    }
    if (lengths.length >= 2) {
      const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const stddev = Math.sqrt(lengths.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / lengths.length);
      if (stddev <= 2) {
        p4 = `Cycle after cycle, you have shown up with remarkable consistency. Your body has a rhythm — averaging around ${Math.round(mean)} days — and you have learned to trust it. That trust, built through patient observation, is one of the most underrated gifts you can give yourself.`;
      } else if (stddev <= 4) {
        p4 = `Your cycles come and go with reasonable predictability — averaging around ${Math.round(mean)} days, with a little natural variation. You are learning the language of your own rhythms, and that knowledge accumulates quietly, steadily, into something genuinely useful.`;
      } else {
        p4 = `Your cycle dances to its own rhythm, and that is not a flaw — it is simply your body's particular song. Irregular cycles are more common than most people are ever told, and they do not make you harder to know. They just require a little more patience, a little more listening. You are doing both.`;
      }
    }
  } else if (sortedCycles.length > 0) {
    p4 = `You have ${sortedCycles.length} cycle${sortedCycles.length !== 1 ? "s" : ""} recorded with Bloom. That is a beginning — and beginnings matter. Every cycle you log adds another chapter to the story your body is telling. Keep writing it.`;
  } else {
    p4 = `You haven't logged a cycle start date yet, and that's okay. When you're ready, that single entry will unlock so much more of what Bloom can tell you. Your data is waiting for you.`;
  }

  // ── Logging & closing ──
  const totalLogs = logs.length;
  let p5 = "";
  if (totalLogs >= 20) {
    p5 = `You have logged ${totalLogs} days with Bloom. That number represents ${totalLogs} mornings or evenings when you chose to check in with yourself — to notice, to record, to not let the day pass without a moment of self-awareness. That is a practice. And practices, sustained, become wisdom.`;
  } else if (totalLogs >= 8) {
    p5 = `You have ${totalLogs} days logged with Bloom — a real start. The consistency you're building matters more than you might think. Each entry is a data point and a small act of self-respect. Keep going.`;
  } else {
    p5 = `You're still in the early days of logging, and that's exactly where everyone starts. The app will grow with you. The more you share with it, the more it can reflect back to you. You've already begun — that is the hardest part.`;
  }

  const closings = [
    `You are doing something courageous by paying this much attention to your body. In a world that rarely makes space for this kind of quiet self-knowledge, you have made space. That is not small. That is, in fact, everything.`,
    `Wherever you are in this journey — hoping, waiting, learning, healing — I want you to know that your body is on your side. It is communicating with you every single day. You are learning its language, and that is a lifelong gift.`,
    `You don't have to have it all figured out. You just have to keep showing up — for your logs, for your rest, and for yourself. That is enough. That has always been enough.`,
  ];
  const p6 = closings[totalLogs % 3];

  return {
    date: today,
    paragraphs: [
      `Dear ${displayName},\n\n${p1}`,
      p2,
      p3,
      p4,
      p5,
      p6,
    ].filter(Boolean),
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CycleLetterPage() {
  const { data: logsData, isLoading: ll } = useGetLogs({ limit: 500 });
  const { data: dashboard, isLoading: dl } = useGetDashboardSummary();
  const { data: cyclesData, isLoading: cl } = useGetCycles();

  const [name, setName] = useState("");
  const [generated, setGenerated] = useState(false);
  const [key, setKey] = useState(0);
  const letterRef = useRef<HTMLDivElement>(null);
  const isLoading = ll || dl || cl;

  const letter = useMemo(() => {
    if (!generated || !logsData || !cyclesData) return null;
    return buildLetter(name, logsData as any[], dashboard, cyclesData as any[]);
  }, [generated, key, logsData, dashboard, cyclesData, name]);

  // Inject print CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "cycle-letter-print";
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #cycle-letter-printable, #cycle-letter-printable * { visibility: visible !important; }
        #cycle-letter-printable {
          position: fixed !important;
          top: 0; left: 0;
          width: 100vw !important;
          padding: 3cm 3.5cm !important;
          background: white !important;
          font-family: Georgia, 'Times New Roman', serif !important;
          font-size: 12pt !important;
          line-height: 1.9 !important;
          color: #2a1a1a !important;
        }
        #cycle-letter-printable .letter-date { text-align: right; margin-bottom: 2.5em; font-size: 11pt; color: #888; }
        #cycle-letter-printable .letter-para { margin-bottom: 1.4em; }
        #cycle-letter-printable .letter-sign { margin-top: 2.5em; font-style: italic; }
        #cycle-letter-printable .letter-logo { font-weight: bold; letter-spacing: 0.05em; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById("cycle-letter-print")?.remove(); };
  }, []);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Cycle Letter
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A personal letter written from your logged data — your body's story this cycle, in words. Download it as a PDF to keep.
        </p>
      </div>

      {!generated ? (
        <Card className="p-6 space-y-5">
          <p className="label-caps">Write my letter</p>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Your name (optional)</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya, or leave blank"
              className="max-w-xs"
              onKeyDown={(e) => { if (e.key === "Enter" && !isLoading) setGenerated(true); }}
            />
            <p className="text-xs text-muted-foreground">
              Used only for the letter greeting — never stored or sent anywhere.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Your letter will draw from:</p>
            <ul className="text-sm text-foreground space-y-1 pl-1">
              {[
                "Your current cycle phase and day",
                "Symptoms logged in the last two weeks",
                "Your BBT temperature trend",
                "Cycle length history and regularity",
                "Overall logging consistency",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <Button
            onClick={() => setGenerated(true)}
            disabled={isLoading}
            className="w-full gap-2"
          >
            {isLoading ? <><RefreshCw size={14} className="animate-spin" />Loading your data…</> : <><Pencil size={14} />Write my letter</>}
          </Button>
        </Card>
      ) : letter ? (
        <>
          {/* Action bar */}
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2 flex-1">
              <Download size={14} />
              Save as PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => { setGenerated(false); setKey((k) => k + 1); }}
              className="gap-2"
            >
              <RefreshCw size={14} />
              Rewrite
            </Button>
          </div>

          {/* Letter */}
          <div id="cycle-letter-printable">
            <Card
              ref={letterRef}
              className="p-8 md:p-12 space-y-0"
              style={{
                background: "hsl(38, 40%, 98%)",
                border: "1px solid hsl(38, 30%, 88%)",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              {/* Date */}
              <p className="letter-date text-right text-sm text-muted-foreground mb-8" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                {letter.date}
              </p>

              {/* Paragraphs */}
              <div className="space-y-5">
                {letter.paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className="letter-para text-foreground leading-loose"
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: "1.0rem",
                      whiteSpace: "pre-line",
                      color: "hsl(345, 20%, 20%)",
                    }}
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* Signature */}
              <div className="letter-sign mt-10 space-y-0.5">
                <p className="text-sm text-muted-foreground" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                  With care,
                </p>
                <p
                  className="letter-logo text-lg font-semibold text-primary"
                  style={{ fontFamily: "var(--app-font-serif)" }}
                >
                  Bloom
                </p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "Georgia, serif" }}>
                  Your fertility companion
                </p>
              </div>
            </Card>
          </div>

          <p className="text-xs text-center text-muted-foreground px-4">
            This letter is generated entirely from your logged data. It is not medical advice. It is simply your story, reflected back to you.
          </p>
        </>
      ) : null}
    </div>
  );
}
