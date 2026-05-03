import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2, XCircle, RotateCcw, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface QuizContext {
  currentPhase: string | null;
  currentDay: number | null;
  topSymptoms: string[];
  avgBbt: number | null;
  avgEnergy: number | null;
  avgStress: number | null;
  loggedDays: number;
  cycleCount: number;
  avgCycleLength: number | null;
  hasData: boolean;
}

interface Question {
  id: string;
  question: string;
  personalised?: string;
  options: { label: string; correct: boolean }[];
  explanation: string;
  learnMore: string;
}

function buildQuestions(ctx: QuizContext): Question[] {
  const phase = ctx.currentPhase ?? "follicular";
  const phaseLabel = phase === "menstrual" ? "Menstrual" : phase === "follicular" ? "Follicular" : phase === "ovulation" ? "Ovulation" : "Luteal";
  const cycleLen = ctx.avgCycleLength ?? 28;
  const bbt = ctx.avgBbt ?? 36.6;

  return [
    {
      id: "q1",
      question: "Which hormone triggers ovulation?",
      personalised: ctx.currentPhase === "ovulation" ? "You're in your ovulation phase right now — this is directly relevant to today!" : undefined,
      options: [
        { label: "Estrogen", correct: false },
        { label: "Luteinising Hormone (LH)", correct: true },
        { label: "Progesterone", correct: false },
        { label: "FSH", correct: false },
      ],
      explanation: "The LH surge — a sharp spike from the pituitary gland — is what triggers the follicle to release an egg. It typically peaks about 24–36 hours before ovulation. OPK tests detect this LH surge.",
      learnMore: "FSH (Follicle Stimulating Hormone) grows the follicle, and estrogen triggers the LH surge — but LH itself is the direct signal that causes ovulation.",
    },
    {
      id: "q2",
      question: `A typical cycle length is often quoted as 28 days. Your average is ${cycleLen} days. Is that normal?`,
      personalised: ctx.avgCycleLength ? `Based on your ${ctx.cycleCount} logged cycle${ctx.cycleCount !== 1 ? "s" : ""}, your average is ${cycleLen} days.` : undefined,
      options: [
        { label: "No — only exactly 28 days is normal", correct: false },
        { label: "Yes — 21–35 days is the healthy range", correct: true },
        { label: "Yes — but only if it's consistent every month", correct: false },
        { label: "Only if ovulation happens on day 14", correct: false },
      ],
      explanation: "Cycle length varies widely. 21–35 days is considered normal by ACOG. The 28-day myth comes from averaging large populations — very few people actually have exactly 28-day cycles.",
      learnMore: "Even within one person, cycles can vary by 2–7 days month to month and still be considered regular. Stress, illness, travel, and nutrition all affect cycle length.",
    },
    {
      id: "q3",
      question: "What does a rise in Basal Body Temperature (BBT) after ovulation tell you?",
      personalised: ctx.avgBbt ? `Your average logged BBT is ${bbt}°C — a post-ovulation rise of 0.2–0.5°C above that baseline would confirm ovulation occurred.` : undefined,
      options: [
        { label: "You are currently ovulating", correct: false },
        { label: "Ovulation has already occurred", correct: true },
        { label: "Your period is about to start", correct: false },
        { label: "You have high estrogen", correct: false },
      ],
      explanation: "BBT rises by 0.2–0.5°C after ovulation due to progesterone, which has a thermogenic effect. This rise confirms ovulation has occurred — it's retrospective evidence, not a predictor.",
      learnMore: "This is why BBT charting requires several months of data to identify patterns. You can't use today's rise to predict today's ovulation — only to confirm yesterday's.",
    },
    {
      id: "q4",
      question: "You're in your luteal phase and craving carbohydrates. Why does this happen?",
      personalised: phase === "luteal" ? "You're in your luteal phase right now — this is exactly what your body is experiencing." : undefined,
      options: [
        { label: "Low blood sugar from exercise", correct: false },
        { label: "Poor willpower", correct: false },
        { label: "Rising progesterone increases metabolic rate and drops serotonin", correct: true },
        { label: "Estrogen peak stimulates hunger hormones", correct: false },
      ],
      explanation: "Progesterone raises your resting metabolic rate by 100–300 kcal/day in the luteal phase. It also reduces serotonin, which the brain tries to compensate for by craving carbohydrates (which boost tryptophan, a serotonin precursor).",
      learnMore: "Complex carbs (oats, sweet potato) satisfy this need without the blood sugar crash that refined carbs cause, which would worsen the serotonin dip.",
    },
    {
      id: "q5",
      question: `Your current phase is ${phaseLabel}. Which workout type is most aligned with your hormones right now?`,
      personalised: ctx.currentDay ? `You're on cycle day ${ctx.currentDay}.` : undefined,
      options: phase === "menstrual"
        ? [
            { label: "Heavy barbell squats", correct: false },
            { label: "HIIT sprint intervals", correct: false },
            { label: "Gentle yoga or walking", correct: true },
            { label: "Competitive sport", correct: false },
          ]
        : phase === "follicular"
        ? [
            { label: "Gentle yoga only", correct: false },
            { label: "HIIT and heavy strength training", correct: true },
            { label: "Swimming at an easy pace", correct: false },
            { label: "Rest and recovery", correct: false },
          ]
        : phase === "ovulation"
        ? [
            { label: "Rest day", correct: false },
            { label: "Light stretching", correct: false },
            { label: "Peak power — lifting, sprints, competition", correct: true },
            { label: "Long slow distance cardio only", correct: false },
          ]
        : [
            { label: "HIIT every day to fight fatigue", correct: false },
            { label: "Moderate strength and yoga", correct: true },
            { label: "Same intensity as follicular phase", correct: false },
            { label: "No exercise at all", correct: false },
          ],
      explanation: phase === "menstrual"
        ? "During menstruation, estrogen and progesterone are at their lowest. Your body is already working hard — gentle movement boosts endorphins without spiking cortisol, which worsens cramps."
        : phase === "follicular"
        ? "Rising estrogen boosts muscle strength, pain tolerance, and aerobic capacity. Neuromuscular coordination peaks — this is your biological prime window for hard training."
        : phase === "ovulation"
        ? "Testosterone surges at ovulation alongside peak estrogen. Strength, power output, and competitive drive are at their biological maximum — the ideal window for peak performance."
        : "Progesterone raises body temperature and slows recovery. High-intensity training raises cortisol, which suppresses progesterone further — moderate training protects your hormone balance.",
      learnMore: "Training with your cycle, rather than against it, can improve performance, reduce injury risk, and support hormonal health simultaneously.",
    },
    {
      id: "q6",
      question: "What is the 'fertile window' and how long does it last?",
      options: [
        { label: "Just the day of ovulation — 24 hours", correct: false },
        { label: "The 5 days before ovulation plus ovulation day — up to 6 days", correct: true },
        { label: "The entire follicular phase", correct: false },
        { label: "Days 10–20 of every cycle", correct: false },
      ],
      explanation: "Sperm can survive in fertile cervical mucus for up to 5 days. Combined with the 12–24 hour window the egg is viable after ovulation, this creates a fertile window of up to 6 days — the 5 days before ovulation plus ovulation day itself.",
      learnMore: "The fertile window shifts cycle to cycle based on when ovulation actually occurs — not a fixed calendar date. Tracking BBT, LH, and cervical mucus together gives the most accurate picture.",
    },
    {
      id: "q7",
      question: "Which phase of the cycle is driven primarily by rising progesterone?",
      options: [
        { label: "Menstrual", correct: false },
        { label: "Follicular", correct: false },
        { label: "Ovulation", correct: false },
        { label: "Luteal", correct: true },
      ],
      explanation: "After ovulation, the follicle that released the egg becomes the corpus luteum, which produces progesterone. This hormone prepares the uterine lining for implantation, raises body temperature, and creates the PMS-associated symptoms many people experience.",
      learnMore: "If pregnancy doesn't occur, the corpus luteum breaks down after ~10–14 days, progesterone drops, and menstruation begins. The luteal phase length is generally fixed at 10–16 days per person.",
    },
    {
      id: "q8",
      question: ctx.topSymptoms.includes("cramps") || ctx.topSymptoms.includes("bloating")
        ? `You've logged cramps or bloating. What causes period cramps at a biological level?`
        : "What causes period cramps at a biological level?",
      personalised: ctx.topSymptoms.length > 0
        ? `You've frequently logged: ${ctx.topSymptoms.slice(0, 3).join(", ")}. Understanding the cause can help you manage them better.`
        : undefined,
      options: [
        { label: "The uterus running out of oxygen", correct: false },
        { label: "Prostaglandins causing uterine muscle contractions", correct: true },
        { label: "Low iron from blood loss", correct: false },
        { label: "Estrogen spike at menstruation", correct: false },
      ],
      explanation: "Prostaglandins are hormone-like compounds that trigger uterine muscle contractions to shed the lining. Higher prostaglandin levels = stronger cramps. Omega-3 fatty acids (salmon, walnuts) help because they compete with and reduce prostaglandin production.",
      learnMore: "NSAIDs (like ibuprofen) work by blocking prostaglandin synthesis — which is why they're more effective than paracetamol for period pain. Taking them before cramps start works better than waiting.",
    },
    {
      id: "q9",
      question: "You notice your energy is highest around the middle of your cycle. What's driving this?",
      personalised: ctx.avgEnergy ? `Your average logged energy is ${ctx.avgEnergy}/10 — does it feel higher around day 10–14?` : undefined,
      options: [
        { label: "Better sleep in the follicular phase", correct: false },
        { label: "Peak estrogen boosting serotonin, dopamine, and physical endurance", correct: true },
        { label: "Lower body temperature reducing fatigue", correct: false },
        { label: "The body storing more glycogen", correct: false },
      ],
      explanation: "Estrogen peaks just before ovulation and directly stimulates serotonin and dopamine pathways, lifting mood and energy. It also improves insulin sensitivity and increases muscle endurance — which is why the follicular and ovulation phases feel so much better than the luteal phase for most people.",
      learnMore: "This is why scheduling important meetings, difficult conversations, or creative work in the follicular phase often yields better results — you have a hormonal advantage.",
    },
    {
      id: "q10",
      question: "What does 'cycle syncing' mean in the context of lifestyle and health?",
      options: [
        { label: "Taking hormonal supplements to regulate your cycle", correct: false },
        { label: "Aligning food, exercise, and rest habits with each hormonal phase", correct: true },
        { label: "Tracking your cycle only on an app", correct: false },
        { label: "Syncing your cycle with a partner's schedule", correct: false },
      ],
      explanation: "Cycle syncing means intentionally adjusting nutrition, movement, social commitments, and rest to match the hormonal profile of each phase. For example: high-output work in follicular, assertive conversations in ovulation, deep rest in late luteal.",
      learnMore: "The concept is not about rigid rules but about working with your body's natural rhythms rather than applying the same routines every day and wondering why some weeks feel harder than others.",
    },
  ];
}

const SCORE_LABELS = [
  { min: 0, max: 3, label: "Just getting started", color: "#f43f5e", desc: "Every expert started here — the quiz has laid the foundation. Explore Hormone Hub and Learn for more." },
  { min: 4, max: 6, label: "Cycle curious", color: "#f59e0b", desc: "You have solid foundational knowledge. A few gaps to fill — revisit the explanations for the ones you missed." },
  { min: 7, max: 9, label: "Body literate", color: "#10b981", desc: "Strong understanding of your hormonal cycle. You're well-equipped to make informed choices about your health." },
  { min: 10, max: 10, label: "Cycle expert", color: "#8b5cf6", desc: "Perfect score! You have an exceptional understanding of your hormonal health. Share what you know." },
];

export default function BodyQuizPage() {
  const [ctx, setCtx] = useState<QuizContext | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/quiz/context`)
      .then((r) => r.json())
      .then((data: QuizContext) => {
        setCtx(data);
        setQuestions(buildQuestions(data));
      })
      .catch(() => {
        const fallback: QuizContext = { currentPhase: "follicular", currentDay: 8, topSymptoms: [], avgBbt: null, avgEnergy: null, avgStress: null, loggedDays: 0, cycleCount: 0, avgCycleLength: null, hasData: false };
        setCtx(fallback);
        setQuestions(buildQuestions(fallback));
      });
  }, []);

  function restart() {
    setCurrent(0); setSelected(null); setRevealed(false); setAnswers([]); setDone(false);
  }

  function handleSelect(idx: number) {
    if (revealed) return;
    setSelected(idx);
  }

  function handleReveal() {
    if (selected === null) return;
    setRevealed(true);
  }

  function handleNext() {
    const q = questions[current];
    const correct = q.options[selected!]?.correct ?? false;
    const next = [...answers, correct];
    setAnswers(next);
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent(current + 1);
      setSelected(null);
      setRevealed(false);
    }
  }

  if (!questions.length) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-2xl bg-muted/50 animate-pulse" />)}
      </div>
    );
  }

  const score = answers.filter(Boolean).length;
  const scoreLabel = SCORE_LABELS.find((s) => score >= s.min && score <= s.max) ?? SCORE_LABELS[0];

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
            Body Literacy Quiz
          </h1>
        </div>

        <Card className="p-6 text-center space-y-4">
          <Award size={36} className="mx-auto" style={{ color: scoreLabel.color }} />
          <div>
            <p className="text-4xl font-bold" style={{ fontFamily: "var(--app-font-serif)", color: scoreLabel.color }}>
              {score}/{questions.length}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{pct}% correct</p>
          </div>
          <div>
            <p className="font-semibold text-lg" style={{ fontFamily: "var(--app-font-serif)" }}>{scoreLabel.label}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-sm mx-auto">{scoreLabel.desc}</p>
          </div>

          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, background: scoreLabel.color }} />
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold">Question breakdown</h2>
          {questions.map((q, i) => (
            <div key={q.id} className="flex items-start gap-2">
              {answers[i]
                ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                : <XCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />}
              <p className="text-xs text-muted-foreground leading-relaxed">{q.question}</p>
            </div>
          ))}
        </Card>

        <Button onClick={restart} variant="outline" className="w-full gap-2">
          <RotateCcw size={14} /> Retake quiz
        </Button>
      </div>
    );
  }

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-foreground mb-1" style={{ fontFamily: "var(--app-font-serif)", fontWeight: 600 }}>
          Body Literacy Quiz
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          10 questions about your cycle — personalised where possible from your logged data.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {current + 1} of {questions.length}</span>
          <span>{answers.filter(Boolean).length} correct so far</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div className="h-1.5 rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <Card className="p-5 space-y-4">
        {q.personalised && (
          <div className="flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary border border-primary/20">
            <BookOpen size={12} className="flex-shrink-0 mt-0.5" />
            <span>{q.personalised}</span>
          </div>
        )}

        <p className="text-base font-medium text-foreground leading-snug">{q.question}</p>

        <div className="space-y-2">
          {q.options.map((opt, idx) => {
            const isSelected = selected === idx;
            const isCorrect = opt.correct;
            let bg = "bg-muted/40 hover:bg-muted/70 border-transparent";
            if (revealed) {
              if (isCorrect) bg = "bg-emerald-50 border-emerald-300 text-emerald-800";
              else if (isSelected && !isCorrect) bg = "bg-rose-50 border-rose-300 text-rose-700";
              else bg = "bg-muted/20 border-transparent text-muted-foreground";
            } else if (isSelected) {
              bg = "bg-primary/10 border-primary";
            }
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={revealed}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                  bg,
                  !revealed && "cursor-pointer",
                  revealed && "cursor-default"
                )}
              >
                <div className="flex items-center gap-2">
                  {revealed && isCorrect && <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />}
                  {revealed && isSelected && !isCorrect && <XCircle size={15} className="text-rose-500 flex-shrink-0" />}
                  {(!revealed || (!isCorrect && !isSelected)) && (
                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] flex-shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                  )}
                  <span>{opt.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {!revealed && (
          <Button
            onClick={handleReveal}
            disabled={selected === null}
            className="w-full"
          >
            Check answer
          </Button>
        )}

        {revealed && (
          <div className="space-y-3 pt-1">
            <div className="rounded-xl bg-muted/40 p-4 space-y-2">
              <p className="text-xs label-caps text-primary">Explanation</p>
              <p className="text-sm text-foreground leading-relaxed">{q.explanation}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{q.learnMore}</p>
            </div>
            <Button onClick={handleNext} className="w-full">
              {current + 1 < questions.length ? "Next question →" : "See my results"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
