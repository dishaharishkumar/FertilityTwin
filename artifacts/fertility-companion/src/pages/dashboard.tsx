import { useState } from "react";
import { Link } from "wouter";
import {
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetReadinessScore, getGetReadinessScoreQueryKey,
  useGetCurrentCycle, getGetCurrentCycleQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BookOpen, Heart, Flame, MessageCircle, Feather, Moon, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, getDayOfYear, differenceInDays, parseISO, addDays, subDays } from "date-fns";

// ─── PHASE CONFIG ──────────────────────────────────────────────────────────────
const phaseConfig: Record<string, { label: string; description: string; gradient: string; border: string; text: string; badge: string }> = {
  menstrual: {
    label: "Menstrual Phase", description: "Rest & renewal",
    gradient: "linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)",
    border: "#fca5a5", text: "#991b1b", badge: "bg-red-100 text-red-700 border-red-200",
  },
  follicular: {
    label: "Follicular Phase", description: "Rising energy & clarity",
    gradient: "linear-gradient(135deg, #fffbeb 0%, #fef9c3 100%)",
    border: "#fcd34d", text: "#92400e", badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  ovulation: {
    label: "Ovulation Window", description: "Peak fertility",
    gradient: "linear-gradient(135deg, #fff0f5 0%, #fce7f3 100%)",
    border: "hsl(345,48%,72%)", text: "hsl(345,48%,35%)", badge: "bg-pink-100 text-pink-700 border-pink-200",
  },
  luteal: {
    label: "Luteal Phase", description: "Nesting & slowing down",
    gradient: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    border: "#c4b5fd", text: "#5b21b6", badge: "bg-purple-100 text-purple-700 border-purple-200",
  },
  tww: {
    label: "Two-Week Wait", description: "Quiet, hopeful waiting",
    gradient: "linear-gradient(135deg, #fff1f2 0%, #fce7f3 100%)",
    border: "#fb7185", text: "#9f1239", badge: "bg-rose-100 text-rose-700 border-rose-200",
  },
};

// ─── MOON PHASE ───────────────────────────────────────────────────────────────
function getMoonPhase(date: Date): { name: string; symbol: string; message: string } {
  const knownNewMoon = new Date("2024-01-11T00:00:00Z");
  const lunarCycle = 29.53059;
  const diffDays = (date.getTime() - knownNewMoon.getTime()) / 86400000;
  const day = ((diffDays % lunarCycle) + lunarCycle) % lunarCycle;

  if (day < 1.85)  return { name: "New Moon",        symbol: "●", message: "A new chapter begins. Set an intention." };
  if (day < 7.38)  return { name: "Waxing Crescent", symbol: "◐", message: "Something tender is growing. Nurture it." };
  if (day < 9.22)  return { name: "First Quarter",   symbol: "◑", message: "Take action. Commit to what you are building." };
  if (day < 14.77) return { name: "Waxing Gibbous",  symbol: "◕", message: "Refine and trust. You are nearly there." };
  if (day < 16.61) return { name: "Full Moon",        symbol: "○", message: "You are fully illuminated. Feel everything." };
  if (day < 22.15) return { name: "Waning Gibbous",  symbol: "◔", message: "Release what no longer serves. Exhale." };
  if (day < 23.99) return { name: "Last Quarter",    symbol: "◑", message: "Rest and reflect. Integration is its own work." };
  return             { name: "Waning Crescent",       symbol: "◐", message: "Surrender. The dark before the new." };
}

// ─── ORACLE CARDS ─────────────────────────────────────────────────────────────
const ORACLE: Record<string, string[]> = {
  menstrual: [
    "The blood knows. Your body does not make mistakes. Rest in the shedding, and trust what is completing itself.",
    "You are in the oldest rhythm known to women. Before medicine, before tracking — women bled, rested, and returned. You belong to that lineage.",
    "Release is not failure. What is leaving your body needed to leave. Something new is already beginning beneath.",
    "Rest is not laziness. In this phase, stillness is medicine. Your body asks for quiet so it can begin again.",
    "You do not have to be productive today. Warmth, gentleness, and presence are the only things asked of you.",
    "What are you releasing beyond the physical? This phase invites you to let go of what this cycle held — the hopes, the fears, the effort.",
    "Endings are not losses. They are the punctuation that makes the next sentence possible.",
    "Honor the shedding. Something beautiful is being made ready.",
  ],
  follicular: [
    "Dawn is inside you. Estrogen is rising gently, like light before sunrise. You do not have to force the morning.",
    "This is the season of beginning — when ideas feel possible and energy returns. Treat it like a seedling: water it, do not yank it.",
    "Clarity is coming. The fog of the last phase is lifting. Trust what feels newly possible today.",
    "Your body is building toward something. Every follicle being nurtured right now is a quiet act of faith.",
    "Fresh energy does not need to be performed. Let it rise naturally, without agenda or urgency.",
    "This is the season of hope before certainty. Live fully in the not-yet.",
    "You are the garden preparing for spring. The work is invisible but it is happening.",
    "Something in you is getting ready — not by trying harder, but by becoming.",
  ],
  ovulation: [
    "You are at your most magnetic. Not because of what your body might do, but because of who you are right now.",
    "Your body has been preparing for this window for weeks. Trust the preparation. Trust yourself.",
    "Connection is your medicine today — with your partner, with yourself, with whatever you believe in.",
    "LH is surging and your body knows exactly what it is doing. You do not have to help it — you only have to be present.",
    "This window is sacred, whether or not it results in what you hope. Show up for it with your whole heart.",
    "Your biology is extraordinary in its precision. An egg waits, patient and ready. So can you.",
    "At your peak, you do not have to grasp. You only have to open.",
    "The moon is full inside you. Let yourself be seen.",
  ],
  luteal: [
    "The inward turn is not a punishment. Your body is creating a warm home. Honor that invisible work.",
    "Progesterone rises now — the hormone of warmth and nesting. Let yourself slow down. Let yourself nest.",
    "Your emotions may be closer to the surface today. That is not weakness. It is sensitivity, and it is a gift.",
    "The luteal phase asks for slowness. The world will still be there when you return. You are allowed to withdraw.",
    "This is the season of completion — of gathering, preparing, waiting. You have prepared well.",
    "What your body is asking for beneath the symptoms is care. Rest, warmth, gentleness. Give it freely.",
    "The nesting instinct is ancient wisdom, not an inconvenience. Honor what your body is trying to do.",
    "Turn toward yourself today. The answers you are looking for are closer than you think.",
  ],
  tww: [
    "The two-week wait has ended for millions of women before you — in joy and in sorrow. You are held by all of them.",
    "You cannot speed up a sunrise. This is a sunrise. Rest a little longer in the dark.",
    "What you cannot control right now is in hands wiser than yours. Practice returning to that trust each time you drift.",
    "The signs you are reading may mean everything, or nothing. Your body is not a puzzle to solve — it is a mystery to witness.",
    "Today, just for today, you do not have to know. Breathe. Eat something warm. Let yourself be cared for.",
    "Hope is not naivete. It is the bravest thing you can do in uncertainty.",
    "Something is always happening, even in the silence. Even now.",
    "You are not waiting. You are becoming. This pause is part of the path.",
  ],
};

const DEFAULT_ORACLE = [
  "You are doing something extraordinary — tracking, hoping, showing up. That deserves recognition.",
  "Your body is not broken. It is learning. It is trying. It is yours.",
  "Every day you carry this journey is an act of love.",
  "There is no right way to feel. Whatever you feel today is valid.",
  "You are not behind. You are exactly where your story needs you to be.",
  "Rest is not giving up. It is how you carry yourself forward.",
];

function OracleCard({ phase }: { phase: string | null }) {
  const pool = phase && ORACLE[phase] ? ORACLE[phase] : DEFAULT_ORACLE;
  const idx = getDayOfYear(new Date()) % pool.length;
  const card = pool[idx];

  return (
    <div
      className="rounded-2xl px-5 py-4 border border-primary/20 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(345,40%,96%) 0%, hsl(280,30%,96%) 100%)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="absolute top-3 right-3 opacity-10 text-5xl select-none" aria-hidden>✦</div>
      <div className="flex items-center gap-2 mb-2.5">
        <Sparkles size={11} className="text-primary/70" />
        <span className="label-caps" style={{ color: "hsl(345,30%,55%)" }}>Daily Oracle</span>
      </div>
      <p
        className="text-sm text-foreground/80 leading-relaxed"
        style={{ fontFamily: "var(--app-font-serif)", fontStyle: "italic" }}
      >
        "{card}"
      </p>
    </div>
  );
}

// ─── DAILY AFFIRMATION ────────────────────────────────────────────────────────
const SURRENDER_AFFIRMATIONS = [
  "I release what I cannot control and trust my body's deep wisdom.",
  "Surrender is not giving up. It is making space for something greater.",
  "I trust the timing of my life. My body knows what it is doing.",
  "I let go of the need to know, and open to the miracle of becoming.",
  "I do not need to force what is meant to flow.",
  "I am not behind. I am exactly where I am meant to be.",
  "What I cannot carry, I release with love.",
  "My worthiness is not tied to any result.",
  "I breathe in trust. I breathe out fear.",
  "Letting go does not mean I do not care. It means I trust something wiser than my worry.",
  "My journey is not a race. It is a becoming.",
  "I honor my body, my feelings, and this sacred, uncertain road.",
  "I am held. I am guided. I am not alone.",
  "I release the story that something is wrong with me.",
  "Peace is available to me, right now, even in uncertainty.",
  "I choose to trust the process, even when I cannot see the path.",
  "My heart is strong enough to hold both hope and uncertainty.",
  "I am more than my results. I am whole, right now.",
  "Surrendering control is how I reclaim my peace.",
  "I trust my body. I trust the process. I trust myself.",
  "Today I give myself permission to rest in not knowing.",
  "I am doing the best I can, and that is more than enough.",
  "My story is still being written. I will not rush the ending.",
  "My body is not broken. It is learning, growing, and trying every day.",
  "I release the anxiety of the outcome and return to the peace of now.",
  "Trust is not passive. It is the bravest thing I can do today.",
  "I do not need answers today. I only need presence.",
  "The waiting is not wasted time. Something is always growing.",
];

function DailyAffirmation() {
  const idx = getDayOfYear(new Date()) % SURRENDER_AFFIRMATIONS.length;
  return (
    <div
      className="rounded-2xl px-5 py-4 border border-primary/15"
      style={{
        background: "linear-gradient(135deg, hsl(345,40%,97%) 0%, hsl(130,18%,96%) 100%)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Feather size={12} className="text-primary/70" />
        <span className="label-caps" style={{ color: "hsl(345,30%,55%)" }}>Today's reminder</span>
      </div>
      <p
        className="text-sm text-foreground/80 leading-relaxed"
        style={{ fontFamily: "var(--app-font-serif)", fontStyle: "italic" }}
      >
        {SURRENDER_AFFIRMATIONS[idx]}
      </p>
    </div>
  );
}

// ─── BODY BIOLOGY ─────────────────────────────────────────────────────────────
const BIOLOGY: Record<string, { title: string; body: string }> = {
  menstrual: {
    title: "What your body is doing right now",
    body: "Your uterus is releasing the lining it spent two weeks building — a process driven by a drop in estrogen and progesterone. FSH (follicle-stimulating hormone) is quietly rising in the background, already preparing your ovaries to grow new follicles for next cycle. Prostaglandins cause the cramping — your uterus working, not broken. This is one of the most ancient biological processes on earth. You are part of it.",
  },
  follicular: {
    title: "What your body is doing right now",
    body: "FSH is rising and signaling your ovaries to develop several follicles — fluid-filled sacs, each containing an egg. Usually 5–20 respond, but one will become dominant. As they grow, they produce estrogen, which is why you may feel clearer, more energetic, and more like yourself. Your uterine lining is thickening and softening, becoming a warmer, richer home. Everything is building.",
  },
  ovulation: {
    title: "What your body is doing right now",
    body: "A surge of LH (luteinizing hormone) has triggered your dominant follicle to release its egg. That egg is now in your fallopian tube, alive and waiting for 12–24 hours. Estrogen has peaked and is now dropping. Cervical mucus is at its most welcoming — thin, stretchy, hospitable. Some women feel a faint twinge on one side (mittelschmerz) — your body quietly announcing the moment. This is extraordinary biology.",
  },
  luteal: {
    title: "What your body is doing right now",
    body: "The follicle that released your egg has transformed into the corpus luteum — a temporary gland that pumps out progesterone. Progesterone is the nesting hormone: it warms your uterine lining, raises your basal body temperature slightly, and creates the urge to slow down and turn inward. Your body is preparing a home, just in case. This is not imagination. This is biology asking you to rest and receive.",
  },
  tww: {
    title: "What your body is doing right now",
    body: "If fertilization occurred, a single cell is now dividing quietly inside you — becoming 2, then 4, then 8 cells, then a blastocyst — over the next several days. Around day 6–10 after ovulation, it may implant into your uterine lining. Progesterone stays high regardless, holding the lining in place. Early pregnancy and PMS symptoms overlap almost completely — this is why the wait is so hard. Your body keeps its secrets until hCG has time to rise. Something is always happening, even in silence.",
  },
};

function BodyBiologyCard({ phase }: { phase: string | null }) {
  const [open, setOpen] = useState(false);
  const bio = phase ? BIOLOGY[phase] : null;
  if (!bio) return null;

  return (
    <div
      className="rounded-2xl border border-border bg-card overflow-hidden"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">🫀</span>
          <span className="text-sm font-semibold text-foreground">{bio.title}</span>
        </div>
        {open
          ? <ChevronUp size={14} className="text-muted-foreground shrink-0" />
          : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div
          className="px-5 pb-5 animate-in fade-in slide-in-from-top-1 duration-200"
          style={{ borderTop: "1px solid hsl(var(--border))" }}
        >
          <p className="text-sm text-foreground/75 leading-relaxed pt-4">
            {bio.body}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── REST PERMISSION SLIP ─────────────────────────────────────────────────────
const PERMISSION: Record<string, string> = {
  menstrual: "Your body has completed a full cycle — a quiet miracle. Today you have full permission to bleed, to rest, to grieve if you need to, and to release everything this cycle held. You are not behind. You are not broken. You are in the most ancient rhythm known to women. The world can wait. Your only task today is to be held by yourself.",
  follicular: "New energy is rising in you — gently, like light before sunrise. You have full permission to let it come at its own pace. You do not have to leap into action, optimize your fertility, or prove your readiness to anyone. Something is building that cannot be rushed. Trust the rising. Rest in the becoming.",
  ovulation: "You are open, luminous, and full of longing today. You have full permission to feel all of it — the hope, the tenderness, the love, the wanting. You do not have to perform optimism or contain your heart. Whatever you are feeling is exactly right. Let yourself be open today, without agenda, without conditions.",
  luteal: "Your body is turning inward, and that is not a retreat — it is a deepening. You have full permission to be slower today. Quieter. More selective about where your energy goes. You do not have to match the pace of the world around you. The nesting instinct is wisdom, not weakness. Go home to yourself.",
  tww: "You are in the sacred pause — the in-between that no one can rush. Today you have full permission to stop searching for signs, to step away from every forum and thread, and to simply exist inside the not-yet. Whatever is happening is happening beyond the reach of your worry. Rest in the unknown. You are doing everything right by simply being here.",
  default: "Today, in this exact moment of your journey, you have full permission to rest. You do not have to try harder, track more, research further, or perform hope for anyone. Your worth is not measured by your effort or your outcome. Rest is not giving up. Rest is how you carry yourself forward.",
};

function RestPermissionSlip({ phase, onClose }: { phase: string | null; onClose: () => void }) {
  const text = phase && PERMISSION[phase] ? PERMISSION[phase] : PERMISSION.default;
  const today = format(new Date(), "MMMM d, yyyy");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl px-8 py-10 animate-in fade-in zoom-in-95 duration-300"
        style={{
          background: "linear-gradient(160deg, #fffaf9 0%, #fff0f5 40%, #f5f0ff 100%)",
          boxShadow: "0 32px 80px rgba(180,60,100,0.18), 0 0 0 1px rgba(200,100,140,0.12)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <X size={16} />
        </button>

        <div className="text-center mb-6">
          <p className="label-caps mb-1" style={{ color: "hsl(345,30%,55%)" }}>{today}</p>
          <h2
            className="text-2xl text-foreground leading-tight"
            style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
          >
            Permission Slip
          </h2>
          <div className="w-12 h-0.5 mx-auto mt-3 rounded-full" style={{ background: "hsl(345,48%,76%)" }} />
        </div>

        <p
          className="text-sm text-foreground/80 leading-relaxed text-center mb-8"
          style={{ fontFamily: "var(--app-font-serif)", fontStyle: "italic" }}
        >
          {text}
        </p>

        <div className="text-center border-t border-primary/10 pt-5">
          <p
            className="text-base text-primary"
            style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
          >
            — Bloom
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Your fertility companion</p>
        </div>
      </div>
    </div>
  );
}

// ─── READINESS RING ────────────────────────────────────────────────────────────
function ScoreRing({ score, sleep, stress, energy, message }: {
  score: number;
  sleep?: number | null;
  stress?: number | null;
  energy?: number | null;
  message?: string;
}) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? "#5d9e6a" : score >= 50 ? "hsl(345,48%,56%)" : "#c8963e";

  return (
    <div className="flex items-center gap-8">
      <div className="relative inline-flex items-center justify-center shrink-0" data-testid="readiness-ring">
        <svg width="112" height="112" viewBox="0 0 112 112" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="56" cy="56" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="9" />
          <circle
            cx="56" cy="56" r={r} fill="none"
            stroke={color} strokeWidth="9"
            strokeDasharray={`${fill} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            data-testid="readiness-score-value"
            className="text-3xl font-bold text-foreground leading-none"
            style={{ fontFamily: "var(--app-font-serif)" }}
          >
            {score}
          </span>
          <span className="label-caps mt-0.5">score</span>
        </div>
      </div>
      <div className="flex-1 space-y-2.5">
        {message && <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>}
        <div className="flex gap-4">
          {sleep != null && (
            <div>
              <div className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{sleep}</div>
              <div className="label-caps">Sleep</div>
            </div>
          )}
          {stress != null && (
            <div>
              <div className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{stress}</div>
              <div className="label-caps">Calm</div>
            </div>
          )}
          {energy != null && (
            <div>
              <div className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>{energy}</div>
              <div className="label-caps">Energy</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: readiness, isLoading: readinessLoading } = useGetReadinessScore({ query: { queryKey: getGetReadinessScoreQueryKey() } });
  const { data: currentCycle } = useGetCurrentCycle({ query: { queryKey: getGetCurrentCycleQueryKey() } });
  const [showSlip, setShowSlip] = useState(false);

  const today = format(new Date(), "EEEE, MMMM d");
  const phase = summary?.currentPhase ?? currentCycle?.phase ?? null;
  const cfg = phase ? phaseConfig[phase] : null;
  const moon = getMoonPhase(new Date());

  return (
    <div className="space-y-5 animate-in fade-in duration-300">

      {showSlip && <RestPermissionSlip phase={phase} onClose={() => setShowSlip(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="label-caps">{today}</p>
          <h1
            className="text-[1.85rem] text-foreground mt-1 leading-tight"
            style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}
          >
            Good morning
          </h1>
        </div>
        {summary && summary.streakDays > 0 && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-200 bg-amber-50"
            data-testid="streak-badge"
          >
            <Flame size={13} className="text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">{summary.streakDays} day streak</span>
          </div>
        )}
      </div>

      {/* Oracle Card */}
      <OracleCard phase={phase} />

      {/* Daily Affirmation */}
      <DailyAffirmation />

      {/* TWW Banner */}
      {(summary?.isInTww || currentCycle?.isInTww) && (
        <div
          className="rounded-2xl border border-rose-200 px-5 py-4"
          data-testid="tww-banner"
          style={{
            background: "linear-gradient(135deg, #fff1f2 0%, #fce7f3 100%)",
            borderLeft: "4px solid #fb7185",
            boxShadow: "0 2px 8px rgba(200,60,90,0.08)",
          }}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mt-0.5">
              <Heart size={15} className="text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-800" style={{ fontFamily: "var(--app-font-serif)" }}>
                Two-Week Wait
              </p>
              <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                Be gentle with yourself — your body is working quietly and beautifully. This is a sacred pause.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Phase Hero + Moon Phase */}
      {summaryLoading ? (
        <Skeleton className="h-36 w-full rounded-3xl" />
      ) : summary?.currentPhase && cfg ? (
        <div
          data-testid="phase-card"
          className="rounded-3xl border px-7 py-6"
          style={{
            background: cfg.gradient,
            borderColor: cfg.border,
            borderWidth: "1.5px",
            boxShadow: "var(--shadow)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="label-caps" style={{ color: cfg.text, opacity: 0.8 }}>{cfg.description}</p>
              <div className="flex items-baseline gap-3 mt-2">
                <span
                  className="text-6xl font-bold leading-none"
                  style={{ fontFamily: "var(--app-font-serif)", color: cfg.text }}
                >
                  {summary.cycleDay ?? "—"}
                </span>
                <span className="text-base font-medium" style={{ color: cfg.text, opacity: 0.6 }}>day</span>
              </div>
              <Badge
                data-testid="phase-badge"
                variant="outline"
                className={cn("mt-3 text-xs font-semibold px-2.5 py-0.5 border", cfg.badge)}
              >
                {cfg.label}
              </Badge>
            </div>

            {/* Moon Phase */}
            <div className="text-right">
              <div
                className="inline-flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border"
                style={{ background: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.6)" }}
              >
                <Moon size={13} style={{ color: cfg.text, opacity: 0.7 }} />
                <span
                  className="text-xl leading-none"
                  style={{ color: cfg.text, opacity: 0.8, fontFamily: "var(--app-font-serif)" }}
                  title={moon.name}
                >
                  {moon.symbol}
                </span>
                <span className="label-caps text-[9px]" style={{ color: cfg.text, opacity: 0.6 }}>{moon.name}</span>
              </div>
            </div>
          </div>

          {/* Moon message */}
          <p className="text-xs mt-3 leading-relaxed" style={{ color: cfg.text, opacity: 0.55, fontStyle: "italic" }}>
            🌙 {moon.message}
          </p>
        </div>
      ) : (
        <div
          className="rounded-3xl border-2 border-dashed border-primary/25 bg-primary/5 px-7 py-8 text-center"
          data-testid="phase-card"
        >
          <p className="text-sm text-muted-foreground">No active cycle tracked yet</p>
          <Link href="/cycle" data-testid="link-start-cycle" className="text-sm text-primary font-semibold mt-2 inline-block hover:underline underline-offset-2">
            Start tracking
          </Link>
        </div>
      )}

      {/* Fertile Window Countdown */}
      {currentCycle?.estimatedOvulationDate && (
        (() => {
          const ovDate = parseISO(currentCycle.estimatedOvulationDate);
          const fertileStart = subDays(ovDate, 5);
          const fertileEnd = addDays(ovDate, 1);
          const today2 = new Date();
          const daysToStart = differenceInDays(fertileStart, today2);
          const daysToOv = differenceInDays(ovDate, today2);
          const inWindow = today2 >= fertileStart && today2 <= fertileEnd;
          const passed = today2 > fertileEnd;

          if (passed) return null;

          return (
            <div
              className="rounded-2xl border border-primary/20 px-5 py-4 flex items-center gap-4"
              style={{ background: "linear-gradient(135deg, hsl(345 48% 97%) 0%, hsl(280 20% 97%) 100%)", boxShadow: "var(--shadow-xs)" }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                <span className="text-lg">🌸</span>
              </div>
              <div className="flex-1">
                {inWindow ? (
                  <>
                    <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
                      You're in your fertile window
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {daysToOv === 0 ? "Estimated ovulation today" : daysToOv > 0 ? `Estimated ovulation in ${daysToOv} day${daysToOv !== 1 ? "s" : ""}` : "Ovulation likely just occurred"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>
                      Fertile window in {daysToStart === 1 ? "1 day" : `${daysToStart} days`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Starts {format(fertileStart, "MMM d")} · Ovulation ~{format(ovDate, "MMM d")}
                    </p>
                  </>
                )}
              </div>
              <Link href="/bbt" className="text-xs text-primary font-semibold hover:underline shrink-0">
                BBT →
              </Link>
            </div>
          );
        })()
      )}

      {/* Body Biology */}
      <BodyBiologyCard phase={phase} />

      {/* Readiness Score */}
      <div
        className="rounded-2xl bg-card border border-border px-6 py-5"
        data-testid="readiness-card"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <p className="label-caps mb-4">Readiness Score</p>
        {readinessLoading ? (
          <div className="flex items-center gap-8">
            <Skeleton className="w-28 h-28 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ) : readiness ? (
          <ScoreRing
            score={readiness.overall}
            sleep={readiness.sleepScore}
            stress={readiness.stressScore}
            energy={readiness.energyScore}
            message={readiness.message}
          />
        ) : (
          <p className="text-sm text-muted-foreground py-2">Log today to see your readiness score</p>
        )}
      </div>

      {/* Latest Insight */}
      {summary?.latestInsight && (
        <div
          className="rounded-2xl border border-primary/20 px-5 py-4"
          data-testid="latest-insight-card"
          style={{
            background: "linear-gradient(135deg, #fff8fa 0%, #fdf2f8 100%)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={13} className="text-primary" />
            <span className="label-caps" style={{ color: "hsl(var(--primary))" }}>Latest Insight</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3" data-testid="text-latest-insight">
            {summary.latestInsight}
          </p>
          <Link href="/insights" data-testid="link-all-insights" className="text-xs text-primary font-semibold mt-3 inline-block hover:underline underline-offset-2">
            View all insights →
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <p className="label-caps">Quick Actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/cycle/story"
            className="flex items-center gap-3.5 rounded-2xl border border-primary/20 bg-card hover:bg-primary/5 hover:border-primary/30 transition-all px-4 py-4 group sm:col-span-2"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0 group-hover:bg-primary/18 transition-colors">
              <Sparkles size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Read my cycle story</p>
              <p className="text-xs text-muted-foreground mt-0.5">Bloom narrates this cycle as a personal chapter</p>
            </div>
          </Link>
          {!summary?.lastLogDate || summary.lastLogDate !== format(new Date(), "yyyy-MM-dd") ? (
            <Link
              href="/log"
              data-testid="link-log-today"
              className="flex items-center gap-3.5 rounded-2xl border border-primary/20 bg-card hover:bg-primary/5 hover:border-primary/30 transition-all px-4 py-4 group"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0 group-hover:bg-primary/18 transition-colors">
                <BookOpen size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Log today</p>
                <p className="text-xs text-muted-foreground mt-0.5">Track symptoms & vitals</p>
              </div>
            </Link>
          ) : (
            <div
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-muted/20 px-4 py-4"
              data-testid="logged-today-card"
            >
              <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                <BookOpen size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Logged today</p>
                <Link href="/log" className="text-xs text-primary font-medium hover:underline underline-offset-2">Update your log</Link>
              </div>
            </div>
          )}

          <Link
            href="/chat"
            data-testid="link-generate-insight"
            className="flex items-center gap-3.5 rounded-2xl border border-primary/20 bg-card hover:bg-primary/5 hover:border-primary/30 transition-all px-4 py-4 group"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0 group-hover:bg-primary/18 transition-colors">
              <MessageCircle size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Talk to Bloom</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ask about your body or feelings</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Signals */}
      {summary?.recentSymptoms && summary.recentSymptoms.length > 0 && (
        <div data-testid="recent-symptoms-section">
          <p className="label-caps mb-3">Recent Signals</p>
          <div className="flex flex-wrap gap-2">
            {summary.recentSymptoms.map((s) => (
              <span
                key={s}
                data-testid={`symptom-badge-${s}`}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted/60 text-muted-foreground border border-border capitalize"
              >
                {s.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rest Permission Slip */}
      <div className="pt-2 pb-4 text-center">
        <button
          onClick={() => setShowSlip(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-all text-sm text-primary/80 font-medium"
          style={{ boxShadow: "var(--shadow-xs)" }}
        >
          <Heart size={13} className="text-primary/60" />
          Need rest today?
        </button>
      </div>
    </div>
  );
}
