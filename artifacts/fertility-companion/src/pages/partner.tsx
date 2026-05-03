import { useGetCurrentCycle } from "@workspace/api-client-react";
import { Link } from "wouter";
import { ArrowLeft, Heart, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const PHASE_DATA: Record<string, {
  emoji: string;
  label: string;
  feeling: string;
  whatsHappening: string;
  howToHelp: string[];
  avoid: string[];
  affirmation: string;
}> = {
  menstrual: {
    emoji: "🌑",
    label: "Menstrual Phase",
    feeling: "She may be feeling tired, inward, emotionally tender, and physically uncomfortable. This is a time of genuine hormonal lows — not a bad mood, but a biological state.",
    whatsHappening: "Her body is shedding its uterine lining. Estrogen and progesterone are at their lowest. Prostaglandins are causing uterine contractions (cramping). She is losing iron-rich blood and her energy reserves are genuinely depleted.",
    howToHelp: [
      "Ask what she needs — and then do it without making it a big deal",
      "Offer warmth: a hot water bottle, a warm drink, a blanket",
      "Take something off her plate without being asked (cooking, errands)",
      "Sit with her comfortably without needing her to perform okayness",
      "A simple \"you don't have to be okay right now\" goes a long way",
    ],
    avoid: [
      "Suggesting she push through or \"cheer up\"",
      "Taking her quietness or withdrawal personally",
      "Minimising her pain (\"it's just cramps\")",
    ],
    affirmation: "She is not \"emotional\" — she is hormonal. There's a difference, and she can feel when people understand that.",
  },
  follicular: {
    emoji: "🌱",
    label: "Follicular Phase",
    feeling: "She may be feeling more energetic, optimistic, and like herself again. Estrogen is rising and her mood is genuinely lifting.",
    whatsHappening: "Follicles are maturing in her ovaries. Estrogen is building toward ovulation. This is a time of renewal — energy, clarity, and connection feel more accessible.",
    howToHelp: [
      "Make plans together — she has more capacity to enjoy them",
      "Be curious and present — she's at her most communicative",
      "Celebrate small wins with her",
      "Support her in starting something new she's been wanting to do",
    ],
    avoid: [
      "Overloading her with too many expectations just because she seems \"better\"",
    ],
    affirmation: "Her rising energy is real — enjoy this phase together.",
  },
  ovulation: {
    emoji: "🌸",
    label: "Ovulation",
    feeling: "She is at her most vibrant, confident, and connected. This is often the most outwardly energetic phase of the cycle.",
    whatsHappening: "An egg has been released. Estrogen and testosterone are both elevated. This is her most fertile window. If you are trying to conceive, this is the key time to be intimate.",
    howToHelp: [
      "Be present and connected — she is at her most open",
      "This is a good time for meaningful conversation or plans",
      "If you're trying to conceive: be warm, loving, and low-pressure",
      "Prioritise her sleep tonight — the luteal phase transition is coming",
    ],
    avoid: [
      "Making intercourse feel clinical or pressure-filled if you're TTC",
    ],
    affirmation: "Her confidence right now is real. Meet her there.",
  },
  tww: {
    emoji: "🕊️",
    label: "Two-Week Wait",
    feeling: "She may be anxious, hopeful, exhausted, or all three at once. The TWW is emotionally one of the hardest phases to live through — she is holding uncertainty that is deeply personal.",
    whatsHappening: "After ovulation, her body is either moving toward menstruation or early pregnancy — and she cannot know which yet. Progesterone is rising, which causes many early pregnancy symptoms (fatigue, breast tenderness, bloating) regardless of the outcome. She may be watching her body for signs that cannot be reliably interpreted.",
    howToHelp: [
      "Don't ask \"do you think it worked?\" — she's asking herself that every hour",
      "Offer distraction: a film, a walk, something that absorbs both of you",
      "If she wants to talk about it, listen without giving advice unless asked",
      "Remind her that you're in this together, whatever happens",
      "Reduce stressors where you can — even small ones",
    ],
    avoid: [
      "Telling her not to symptom-spot (she can't help it — just be kind)",
      "Dismissing her anxiety with \"I'm sure it's fine\"",
      "Bringing it up constantly — let her set the pace",
    ],
    affirmation: "This phase asks both of you to hold hope and uncertainty at the same time. That's genuinely hard. Doing it together is what matters.",
  },
};

function getPhaseData(phase: string) {
  if (phase === "menstrual") return PHASE_DATA.menstrual;
  if (phase === "follicular") return PHASE_DATA.follicular;
  if (phase === "ovulation") return PHASE_DATA.ovulation;
  return PHASE_DATA.tww;
}

export default function PartnerPage() {
  const { data: cycleData, isLoading } = useGetCurrentCycle();

  const phase = cycleData ? getPhaseData(cycleData.phase) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={12} /> Back
        </Link>
        <h1 className="text-[1.85rem] text-foreground leading-tight" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Partner Mode
        </h1>
        <p className="text-sm text-muted-foreground mt-1">A guide to understanding and supporting her right now.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div>
      ) : !cycleData ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">No active cycle. Once she starts tracking, her current phase info will appear here.</p>
        </div>
      ) : phase ? (
        <>
          {/* Phase header */}
          <div
            className="rounded-3xl border border-primary/20 px-6 py-7"
            style={{ background: "linear-gradient(145deg, #fffaf9 0%, #fff0f5 60%, #f5f0ff 100%)", boxShadow: "var(--shadow)" }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{phase.emoji}</span>
              <div>
                <span className="label-caps">Right now</span>
                <p className="text-xl text-foreground" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>{phase.label}</p>
              </div>
              <span className="ml-auto label-caps">Day {cycleData.cycleDay}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-3">{phase.feeling}</p>
          </div>

          {/* What's happening */}
          <div className="rounded-2xl border border-border bg-card px-5 py-5" style={{ boxShadow: "var(--shadow-xs)" }}>
            <p className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>What's happening in her body</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{phase.whatsHappening}</p>
          </div>

          {/* How to help */}
          <div className="rounded-2xl border border-primary/15 bg-card px-5 py-5" style={{ boxShadow: "var(--shadow-xs)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Heart size={14} className="text-primary" />
              <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "var(--app-font-serif)" }}>How to support her</p>
            </div>
            <div className="space-y-2">
              {phase.howToHelp.map((tip, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="text-primary text-sm mt-0.5">✦</span>
                  <p className="text-sm text-muted-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What to avoid */}
          <div className="rounded-2xl border border-border bg-card px-5 py-5" style={{ boxShadow: "var(--shadow-xs)" }}>
            <p className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "var(--app-font-serif)" }}>Worth avoiding</p>
            <div className="space-y-2">
              {phase.avoid.map((tip, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className="text-muted-foreground text-sm mt-0.5">—</span>
                  <p className="text-sm text-muted-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Affirmation */}
          <div
            className="rounded-2xl border border-primary/20 px-5 py-5"
            style={{ background: "linear-gradient(135deg, hsl(345 48% 97%) 0%, hsl(280 20% 97%) 100%)" }}
          >
            <p className="text-sm text-foreground leading-relaxed italic" style={{ fontFamily: "var(--app-font-serif)" }}>
              "{phase.affirmation}"
            </p>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Updated in real time as her cycle progresses. Check back anytime.
          </p>
        </>
      ) : null}
    </div>
  );
}
