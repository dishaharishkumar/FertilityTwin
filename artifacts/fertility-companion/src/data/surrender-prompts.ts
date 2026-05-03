export interface JournalPrompt {
  id: number;
  category: string;
  question: string;
  starter: string;
}

export const PROMPT_CATEGORIES = [
  "Surrender",
  "Letting Go",
  "Trusting Yourself",
  "Trusting Your Body",
  "The Two-Week Wait",
  "Releasing Control",
  "Self-Compassion",
  "Fear & Anxiety",
  "Hope & Becoming",
  "Grief & Acceptance",
] as const;

export const SURRENDER_PROMPTS: JournalPrompt[] = [
  // ─── SURRENDER ───────────────────────────────────────────────────────────────
  {
    id: 1, category: "Surrender",
    question: "What does surrender mean to me today — in this exact moment?",
    starter: "Right now, surrender looks like setting down the need to...",
  },
  {
    id: 2, category: "Surrender",
    question: "What am I gripping so tightly that my hands have forgotten how to open?",
    starter: "I have been holding on to... and it has been exhausting because...",
  },
  {
    id: 3, category: "Surrender",
    question: "What is the difference between giving up and surrendering?",
    starter: "Giving up feels like a closing, but surrendering feels like...",
  },
  {
    id: 4, category: "Surrender",
    question: "What would complete surrender look like for me this week?",
    starter: "This week, surrender would look like choosing not to... and instead...",
  },
  {
    id: 5, category: "Surrender",
    question: "What am I afraid will happen if I truly surrender?",
    starter: "My deepest fear about letting go is that if I stop trying so hard...",
  },
  {
    id: 6, category: "Surrender",
    question: "When have I surrendered before — and what happened when I did?",
    starter: "I remember a time I finally let go of... and what followed surprised me because...",
  },
  {
    id: 7, category: "Surrender",
    question: "What does my body feel like when I try to surrender but resist?",
    starter: "When I try to release control but can't quite get there, my body feels...",
  },
  {
    id: 8, category: "Surrender",
    question: "What parts of this fertility journey feel impossible to surrender?",
    starter: "The hardest thing for me to release into the unknown is... because it feels like giving up on...",
  },
  {
    id: 9, category: "Surrender",
    question: "If surrender were a place, what would it look like?",
    starter: "In my mind, the place of surrender is... It feels like... and smells like...",
  },
  {
    id: 10, category: "Surrender",
    question: "What would I do with the energy I spend fighting the unknown?",
    starter: "All the energy I pour into trying to control what I can't control — if I redirected it, I would use it to...",
  },
  {
    id: 11, category: "Surrender",
    question: "What story am I telling myself about why I can't let go?",
    starter: "The story I keep replaying is... and it tells me that if I let go, I will...",
  },
  {
    id: 12, category: "Surrender",
    question: "What would a person who fully trusts the process do differently than me today?",
    starter: "Someone who truly surrendered to this journey would probably stop... and start...",
  },
  {
    id: 13, category: "Surrender",
    question: "What does surrender sound like in my inner voice?",
    starter: "When I imagine the quieter, more trusting part of me speaking, she says...",
  },
  {
    id: 14, category: "Surrender",
    question: "What am I trying to protect by not surrendering?",
    starter: "Underneath all the control, what I am really trying to protect is...",
  },
  {
    id: 15, category: "Surrender",
    question: "How would my relationship with my body change if I chose surrender right now?",
    starter: "If I stopped fighting my body and started trusting it, I think our relationship would feel like...",
  },
  {
    id: 16, category: "Surrender",
    question: "What is one small act of surrender I could practice today?",
    starter: "Today, one tiny way I could practice releasing control is by choosing to not...",
  },
  {
    id: 17, category: "Surrender",
    question: "What does the word 'enough' mean to me right now?",
    starter: "If I could truly believe I am enough exactly as I am, I would stop needing to...",
  },
  {
    id: 18, category: "Surrender",
    question: "If my anxiety about outcomes had a shape, what would it look like?",
    starter: "The anxiety that keeps me from surrendering lives in my body like a...",
  },
  {
    id: 19, category: "Surrender",
    question: "What is the wisest, most surrendered version of me like?",
    starter: "The version of me that has made peace with uncertainty is... She wakes up and...",
  },
  {
    id: 20, category: "Surrender",
    question: "What am I willing to release — just for today?",
    starter: "Today, just for today, I am willing to release my grip on... I do not need to release it forever, just for now...",
  },

  // ─── LETTING GO ──────────────────────────────────────────────────────────────
  {
    id: 21, category: "Letting Go",
    question: "What am I still carrying that no longer serves where I am going?",
    starter: "I have been carrying... for a long time now, and if I am honest, it stopped serving me when...",
  },
  {
    id: 22, category: "Letting Go",
    question: "What expectations of 'how this was supposed to go' can I release today?",
    starter: "I had imagined this journey looking like... but the reality is... and letting go of that expectation means...",
  },
  {
    id: 23, category: "Letting Go",
    question: "What would I write in a letter releasing the timeline I thought I had?",
    starter: "Dear timeline I imagined for myself — I want you to know that I grieve you, and I am ready to release you because...",
  },
  {
    id: 24, category: "Letting Go",
    question: "What comparison am I holding onto that I could finally put down?",
    starter: "I keep comparing myself to... and it makes me feel... Today I want to release that comparison because...",
  },
  {
    id: 25, category: "Letting Go",
    question: "What does letting go NOT mean for me right now?",
    starter: "I want to be clear with myself: letting go does not mean I am giving up on... It does not mean I stop caring about...",
  },
  {
    id: 26, category: "Letting Go",
    question: "What guilt am I holding about this journey that I want to release?",
    starter: "I have been carrying guilt about... and it has been weighing me down because I keep telling myself...",
  },
  {
    id: 27, category: "Letting Go",
    question: "What would I feel in my chest if I truly let go right now?",
    starter: "If I closed my eyes, took a breath, and released everything I cannot control, I think I would feel in my chest...",
  },
  {
    id: 28, category: "Letting Go",
    question: "What Google search am I ready to stop making?",
    starter: "I keep searching for... because I am hoping it will tell me... But it never does, and it leaves me feeling...",
  },
  {
    id: 29, category: "Letting Go",
    question: "What resentment am I ready to release — even just a little?",
    starter: "I have been holding resentment toward... and even though part of me still feels it, another part of me is ready to release it because...",
  },
  {
    id: 30, category: "Letting Go",
    question: "What does 'letting go' look like on a hard day, not just a good one?",
    starter: "On a day like today when everything feels heavy, letting go looks less like peace and more like...",
  },
  {
    id: 31, category: "Letting Go",
    question: "What would I write on a piece of paper and burn, bury, or release to the water?",
    starter: "If I could write everything I am ready to release on a piece of paper and let it go, I would write...",
  },
  {
    id: 32, category: "Letting Go",
    question: "What 'what ifs' have I been carrying that I could set down?",
    starter: "The 'what if' that haunts me most is... I have been giving it so much of my energy because...",
  },
  {
    id: 33, category: "Letting Go",
    question: "What is the kindest way I can release something that is hurting me?",
    starter: "I want to release... gently, without blaming myself for holding it so long. A kind way to put it down would be to say...",
  },
  {
    id: 34, category: "Letting Go",
    question: "What have other people released on their journeys that inspired me?",
    starter: "I have seen or heard of someone letting go of... and what moved me about it was...",
  },
  {
    id: 35, category: "Letting Go",
    question: "What version of 'perfect' am I finally willing to let go of?",
    starter: "I have been chasing a version of this that looks like... and holding onto it has cost me...",
  },
  {
    id: 36, category: "Letting Go",
    question: "What would I say to the grief of the path I thought I was on?",
    starter: "To the path I imagined for myself, I want to say: I see you, I honor you, and I am ready to...",
  },
  {
    id: 37, category: "Letting Go",
    question: "What does it mean to let go without forgetting?",
    starter: "Letting go does not mean erasing what happened. What I want to remember is... What I want to release is...",
  },
  {
    id: 38, category: "Letting Go",
    question: "What part of 'the plan' no longer fits where I actually am?",
    starter: "I made a plan that included... but where I actually am right now is...",
  },
  {
    id: 39, category: "Letting Go",
    question: "What relationship with my own expectations am I ready to heal?",
    starter: "I have expected a lot from myself — specifically... — and those expectations have made me feel...",
  },
  {
    id: 40, category: "Letting Go",
    question: "What does freedom feel like when I imagine truly letting go?",
    starter: "When I close my eyes and picture what freedom from this weight would feel like, it is like...",
  },

  // ─── TRUSTING YOURSELF ───────────────────────────────────────────────────────
  {
    id: 41, category: "Trusting Yourself",
    question: "What does trusting myself actually mean to me, in my own words?",
    starter: "When I think about what it means to trust myself — not as a concept but in real life — it means...",
  },
  {
    id: 42, category: "Trusting Yourself",
    question: "When have I trusted my instincts and been right?",
    starter: "A time I followed my gut during this journey (or before it) was when I... and it turned out...",
  },
  {
    id: 43, category: "Trusting Yourself",
    question: "What has eroded my trust in myself, and how can I start to rebuild it?",
    starter: "My self-trust started to erode when... and what I really need in order to rebuild it is...",
  },
  {
    id: 44, category: "Trusting Yourself",
    question: "What would I do today if I trusted my own wisdom completely?",
    starter: "If I truly believed I had access to everything I needed inside me, today I would...",
  },
  {
    id: 45, category: "Trusting Yourself",
    question: "What is the voice inside me that wants to be heard right now?",
    starter: "There is a quieter voice inside me, underneath all the worry. When I get still and listen, she says...",
  },
  {
    id: 46, category: "Trusting Yourself",
    question: "What do I know — really, deeply know — about myself and this journey?",
    starter: "If I put aside all the noise and external information and external opinions, what I deeply know to be true is...",
  },
  {
    id: 47, category: "Trusting Yourself",
    question: "What would I tell a friend who was doubting herself the way I doubt myself?",
    starter: "If my closest friend were going through exactly what I am going through and she was doubting herself this way, I would look her in the eyes and say...",
  },
  {
    id: 48, category: "Trusting Yourself",
    question: "What decisions have I made on this journey that were actually right?",
    starter: "Looking back, decisions I made that turned out to be aligned with what I needed were...",
  },
  {
    id: 49, category: "Trusting Yourself",
    question: "What does my self-doubt tell me that my self-trust would correct?",
    starter: "My self-doubt says... but if I could replace that with self-trust, it would say instead...",
  },
  {
    id: 50, category: "Trusting Yourself",
    question: "What strengths have I shown throughout this journey that I tend to overlook?",
    starter: "One thing I rarely give myself credit for is... but honestly, it has taken real strength because...",
  },
  {
    id: 51, category: "Trusting Yourself",
    question: "What would trusting my timing look like — my own timeline, not anyone else's?",
    starter: "If I gave myself permission to have my own timeline — not the one I imagined, not the one others seem to have — it would look like...",
  },
  {
    id: 52, category: "Trusting Yourself",
    question: "What have I been outsourcing to fear that actually belongs to my knowing?",
    starter: "I keep asking fear to answer the question of... but my own knowing would answer it differently. It would say...",
  },
  {
    id: 53, category: "Trusting Yourself",
    question: "How do I want to show up for myself during the hardest parts of this?",
    starter: "The version of me I want to be when things get hardest is someone who... She would say to herself...",
  },
  {
    id: 54, category: "Trusting Yourself",
    question: "What is one promise I can make to myself today?",
    starter: "Today I want to make myself one small but meaningful promise: I will...",
  },
  {
    id: 55, category: "Trusting Yourself",
    question: "What does it feel like when I am truly in alignment with myself?",
    starter: "There have been moments on this journey when I felt at peace, when I felt like I knew what I needed. Those moments felt like...",
  },
  {
    id: 56, category: "Trusting Yourself",
    question: "What part of myself have I been dismissing that deserves to be heard?",
    starter: "There is a part of me I keep pushing down or ignoring — the part that feels... — and she deserves to be heard because...",
  },
  {
    id: 57, category: "Trusting Yourself",
    question: "What would self-trust look like as a daily practice?",
    starter: "If I built a practice of trusting myself every morning, it might include things like...",
  },
  {
    id: 58, category: "Trusting Yourself",
    question: "What do I already know about my body that I keep second-guessing?",
    starter: "Deep down I already know that my body... but I keep second-guessing it because...",
  },
  {
    id: 59, category: "Trusting Yourself",
    question: "What would I regret not trusting in myself when this chapter closes?",
    starter: "Looking back from a future where this is all resolved, I think the thing I would most wish I had trusted in myself was...",
  },
  {
    id: 60, category: "Trusting Yourself",
    question: "What is the bravest act of self-trust I could take today?",
    starter: "The bravest, most trusting thing I could do today — even if it scares me — is...",
  },

  // ─── TRUSTING YOUR BODY ──────────────────────────────────────────────────────
  {
    id: 61, category: "Trusting Your Body",
    question: "What has my body done right, even when I felt it was failing me?",
    starter: "Even in the hardest moments, my body has shown up for me by... and I want to acknowledge that because...",
  },
  {
    id: 62, category: "Trusting Your Body",
    question: "What would I say to my body if I wrote it a love letter today?",
    starter: "Dear body, I want to start by saying I am sorry for... and I want you to know that I see...",
  },
  {
    id: 63, category: "Trusting Your Body",
    question: "What is my body asking for that I have been ignoring?",
    starter: "If my body had a voice right now, I think it would be asking me to stop... and start...",
  },
  {
    id: 64, category: "Trusting Your Body",
    question: "When did I start seeing my body as an obstacle rather than a partner?",
    starter: "I think the moment I started fighting against my body instead of working with it was...",
  },
  {
    id: 65, category: "Trusting Your Body",
    question: "What does my body feel like when I am at peace — really at peace?",
    starter: "I can remember or imagine a moment of deep physical peace. My body felt like... My breath was... My shoulders were...",
  },
  {
    id: 66, category: "Trusting Your Body",
    question: "How have I been speaking to my body, and what would kindness sound like instead?",
    starter: "Lately I have been saying to my body (out loud or inside)... But if I spoke to it like I would speak to someone I love, I would say...",
  },
  {
    id: 67, category: "Trusting Your Body",
    question: "What does my body know that my mind keeps overriding?",
    starter: "My body gives me signals that I often override with rational thought. The signal I override most is... and my mind tells me instead...",
  },
  {
    id: 68, category: "Trusting Your Body",
    question: "What ritual could I create to honor my body's work, regardless of outcomes?",
    starter: "A small daily or weekly ritual that would help me honor what my body is doing — not what I want it to produce — would be...",
  },
  {
    id: 69, category: "Trusting Your Body",
    question: "What do I want my relationship with my body to look like after this journey?",
    starter: "On the other side of this, I dream of a relationship with my body that feels like... I want to be able to say...",
  },
  {
    id: 70, category: "Trusting Your Body",
    question: "What lie about my body have I been believing that I want to release?",
    starter: "One lie I have absorbed — from culture, from comparison, or from fear — is that my body... I want to release that because the truth is...",
  },
  {
    id: 71, category: "Trusting Your Body",
    question: "What would it mean to be in partnership with my body, not at war with it?",
    starter: "Partnership with my body would mean that instead of... I would...",
  },
  {
    id: 72, category: "Trusting Your Body",
    question: "What is one thing my body has done this week that I can genuinely be grateful for?",
    starter: "This week, even though things feel hard, one thing my body did that I want to acknowledge is...",
  },
  {
    id: 73, category: "Trusting Your Body",
    question: "How do I want to nourish my body today — not punish it, not push it, but nourish it?",
    starter: "Today, nourishing my body — gently and without agenda — might look like...",
  },
  {
    id: 74, category: "Trusting Your Body",
    question: "What would I say to my body about the pressure I have put on it?",
    starter: "Body, I want to acknowledge that I have put enormous pressure on you to... and I am sorry because...",
  },
  {
    id: 75, category: "Trusting Your Body",
    question: "Where in my body do I carry hope, and where do I carry fear?",
    starter: "When I scan my body slowly, I notice I carry hope somewhere around my... and fear lives mostly in my...",
  },
  {
    id: 76, category: "Trusting Your Body",
    question: "What would it feel like to let my body lead for one day?",
    starter: "If I followed my body's signals completely for one whole day — rest when tired, eat what it craves, move as it wants — I imagine...",
  },
  {
    id: 77, category: "Trusting Your Body",
    question: "What healing is happening in my body right now that I cannot see?",
    starter: "Even in this moment, my body is doing invisible work. Things I cannot see but want to trust are happening include...",
  },
  {
    id: 78, category: "Trusting Your Body",
    question: "How has my body surprised me during this journey?",
    starter: "Something my body did that surprised me — a symptom, a feeling, a sign — was... and I felt...",
  },
  {
    id: 79, category: "Trusting Your Body",
    question: "What does my body need to hear from me more often?",
    starter: "If my body needed to hear something from me every single day, I think it would be...",
  },
  {
    id: 80, category: "Trusting Your Body",
    question: "What is the most compassionate thought I have ever had about my own body?",
    starter: "There was a moment I felt genuine compassion for my body — not performance, but real kindness. I remember thinking...",
  },

  // ─── THE TWO-WEEK WAIT ───────────────────────────────────────────────────────
  {
    id: 81, category: "The Two-Week Wait",
    question: "What am I feeling right now that I have been afraid to put into words?",
    starter: "Sitting in this wait, the feeling I have been most afraid to name is... because naming it feels like...",
  },
  {
    id: 82, category: "The Two-Week Wait",
    question: "What does hope feel like in my body during the TWW?",
    starter: "Hope during the two-week wait lives in my body like a... It shows up when...",
  },
  {
    id: 83, category: "The Two-Week Wait",
    question: "What do I do when the waiting feels unbearable?",
    starter: "When the waiting becomes too loud inside my head, the things I reach for are... Some of those help and some of them...",
  },
  {
    id: 84, category: "The Two-Week Wait",
    question: "What would I want to remember about this specific TWW, no matter the outcome?",
    starter: "This two-week wait has its own texture. What I want to remember about right now — regardless of what comes — is...",
  },
  {
    id: 85, category: "The Two-Week Wait",
    question: "What am I doing to survive this wait that I could replace with something gentler?",
    starter: "To get through the waiting, I have been... and if I am honest, some of that is helping me survive but it is also making me feel...",
  },
  {
    id: 86, category: "The Two-Week Wait",
    question: "What is my relationship with hope like right now — am I guarding it or holding it?",
    starter: "My relationship with hope right now feels like... I am holding it at a distance because...",
  },
  {
    id: 87, category: "The Two-Week Wait",
    question: "What does this waiting teach me about my relationship with uncertainty?",
    starter: "The TWW is essentially a masterclass in not knowing. What this waiting is revealing to me about myself is...",
  },
  {
    id: 88, category: "The Two-Week Wait",
    question: "What do I want to say to myself if the result is not what I hoped for?",
    starter: "If the answer at the end of this wait breaks my heart, I want to have already written this: You are...",
  },
  {
    id: 89, category: "The Two-Week Wait",
    question: "What do I want to say to myself if the result is exactly what I hoped for?",
    starter: "If the answer at the end of this wait is a joyful one, I want to have already written this: You did it, and what got you here was...",
  },
  {
    id: 90, category: "The Two-Week Wait",
    question: "What would make this two-week wait feel less like a prison and more like a pause?",
    starter: "The difference between the TWW feeling like imprisonment and feeling like a sacred pause is... I could shift toward the pause by...",
  },
  {
    id: 91, category: "The Two-Week Wait",
    question: "What signs have I been reading — and what would it feel like to stop reading them?",
    starter: "The signs I keep looking for and analyzing are... and the relief it might feel like to just let myself not know would be...",
  },
  {
    id: 92, category: "The Two-Week Wait",
    question: "What does the silence of the waiting feel like right now?",
    starter: "The silence of not knowing yet feels like... In my chest it is... In my mind it sounds like...",
  },
  {
    id: 93, category: "The Two-Week Wait",
    question: "What small joy can I claim for myself in the middle of the wait?",
    starter: "Even in the middle of this uncertainty, one small thing that belongs to me — that no result can take away — is...",
  },
  {
    id: 94, category: "The Two-Week Wait",
    question: "Who has sat in this wait before me and made it through?",
    starter: "I am not the first woman to sit in this strange, hopeful, terrifying space. I think about other women who have been here, and I want to say to them and to myself...",
  },
  {
    id: 95, category: "The Two-Week Wait",
    question: "What is this wait asking of me that I have not given yet?",
    starter: "If this waiting period had a message for me — something it needed me to learn or offer — I think it would be asking me to...",
  },
  {
    id: 96, category: "The Two-Week Wait",
    question: "What does patience feel like right now — is it natural or is it a practice?",
    starter: "Patience during this time is not something that comes naturally to me. It feels like... and I am practicing it by...",
  },
  {
    id: 97, category: "The Two-Week Wait",
    question: "What am I most proud of for making it through another day of waiting?",
    starter: "Just getting through another day of not knowing is its own accomplishment. Today what I am proud of is...",
  },
  {
    id: 98, category: "The Two-Week Wait",
    question: "What is the kindest thing I can do for myself for the rest of today?",
    starter: "The most loving, kind, non-productive, agenda-free thing I could do for myself before this day ends is...",
  },
  {
    id: 99, category: "The Two-Week Wait",
    question: "What am I learning about what I truly want?",
    starter: "This waiting is clarifying something in me. What I am learning — or remembering — about what I truly want is...",
  },
  {
    id: 100, category: "The Two-Week Wait",
    question: "What would I tell a friend sitting in the two-week wait right now?",
    starter: "If a woman I love deeply were sitting exactly where I am right now, I would put my hand on her shoulder and say...",
  },

  // ─── RELEASING CONTROL ───────────────────────────────────────────────────────
  {
    id: 101, category: "Releasing Control",
    question: "What is the illusion of control costing me right now?",
    starter: "The energy I spend trying to control what I cannot control costs me... and it takes away from...",
  },
  {
    id: 102, category: "Releasing Control",
    question: "What would my life feel like if I stopped trying to manage every outcome?",
    starter: "If I could actually stop white-knuckling the outcome, I imagine my days would feel more like... and less like...",
  },
  {
    id: 103, category: "Releasing Control",
    question: "What is actually within my control right now — just a short list?",
    starter: "When I get honest with myself, the things truly within my control right now are small but meaningful. They include...",
  },
  {
    id: 104, category: "Releasing Control",
    question: "What is absolutely outside my control that I keep pretending I can fix?",
    starter: "I keep believing that if I just try harder, research more, do something differently... I can control... but the truth is...",
  },
  {
    id: 105, category: "Releasing Control",
    question: "Where did I learn that control equals safety?",
    starter: "My relationship with control started long before this fertility journey. I think I learned that control meant safety when...",
  },
  {
    id: 106, category: "Releasing Control",
    question: "What does my body do when it is in control mode versus release mode?",
    starter: "When I am in control mode, my body feels... My breathing is... But when I manage to release, even briefly, my body...",
  },
  {
    id: 107, category: "Releasing Control",
    question: "What has life ever delivered that I never could have planned or controlled?",
    starter: "Some of the best things that ever happened to me arrived without my planning them. One that comes to mind is...",
  },
  {
    id: 108, category: "Releasing Control",
    question: "What would releasing control of the outcome free me to do or feel?",
    starter: "If I truly released the outcome and stopped treating it as something I could engineer, I think I would finally be able to...",
  },
  {
    id: 109, category: "Releasing Control",
    question: "What is the smallest thing I could stop controlling today?",
    starter: "Just one small thing — not everything at once — that I could choose not to manage or monitor today is...",
  },
  {
    id: 110, category: "Releasing Control",
    question: "What does a controlled life keep me from experiencing?",
    starter: "When I am in control mode, the things that slip past me — the moments I miss, the joy I am too anxious to feel — are...",
  },
  {
    id: 111, category: "Releasing Control",
    question: "What would I do if I stopped researching and just rested in not knowing?",
    starter: "If I closed every tab, put down my phone, and stopped researching for one full day, I imagine I would feel... and then...",
  },
  {
    id: 112, category: "Releasing Control",
    question: "How does control show up in my relationship with food, movement, or supplements?",
    starter: "I notice that control extends beyond just my cycle tracking — it also shows up in how I approach... and the way I feel when I think about easing up is...",
  },
  {
    id: 113, category: "Releasing Control",
    question: "What would I say to the part of me that believes control is keeping me safe?",
    starter: "To the part of me that grips tightly because it believes that is how to stay safe: I see you, and I want to gently say...",
  },
  {
    id: 114, category: "Releasing Control",
    question: "What kind of rest am I avoiding because it feels like losing control?",
    starter: "Rest feels dangerous to me sometimes because if I stop managing everything, I am afraid that... So instead I...",
  },
  {
    id: 115, category: "Releasing Control",
    question: "What permission can I give myself to not have all the answers right now?",
    starter: "I want to give myself explicit permission to not know... to not have figured out... and to still be okay because...",
  },
  {
    id: 116, category: "Releasing Control",
    question: "What would releasing one hour of control each day actually look like?",
    starter: "One single hour each day where I release the monitoring and the managing and just exist might look like...",
  },
  {
    id: 117, category: "Releasing Control",
    question: "What does life feel like when I am not in control mode?",
    starter: "The rare moments when I slip out of control mode — even briefly — life feels like... I feel...",
  },
  {
    id: 118, category: "Releasing Control",
    question: "What would it mean to trust something larger than my own planning?",
    starter: "Whether it is the universe, my body's intelligence, or simply the nature of time — trusting something beyond my own plans would mean...",
  },
  {
    id: 119, category: "Releasing Control",
    question: "How has excessive control ever backfired on me during this journey?",
    starter: "A time when the harder I gripped, the worse things got — or the worse I felt — was...",
  },
  {
    id: 120, category: "Releasing Control",
    question: "What would I do with the energy freed from letting one worry go?",
    starter: "If I took one worry I have been managing obsessively and just... let it be... the energy that would free up might go toward...",
  },

  // ─── SELF-COMPASSION ─────────────────────────────────────────────────────────
  {
    id: 121, category: "Self-Compassion",
    question: "What harsh thing have I said to myself today that I would never say to a friend?",
    starter: "Today, the harshest thought I had about myself was... and if a friend said that to me, I would feel... so why do I allow myself to say it?",
  },
  {
    id: 122, category: "Self-Compassion",
    question: "What does compassion toward myself look like on a day when I am really struggling?",
    starter: "On the hardest days, compassion for myself does not come naturally. Today it might look like choosing to...",
  },
  {
    id: 123, category: "Self-Compassion",
    question: "What have I been blaming myself for that was never in my control?",
    starter: "I have been carrying blame for... and if I hold it up to the light and look honestly at it, the truth is...",
  },
  {
    id: 124, category: "Self-Compassion",
    question: "What would I give myself permission to feel without judging it?",
    starter: "I want to give myself permission today to feel... fully, without calling it dramatic or weak or ungrateful because...",
  },
  {
    id: 125, category: "Self-Compassion",
    question: "How do I speak to myself when no one is watching or listening?",
    starter: "When it is just me and my thoughts, the tone I use with myself is usually... and honestly, that has felt like...",
  },
  {
    id: 126, category: "Self-Compassion",
    question: "What has this journey revealed about my resilience that I keep overlooking?",
    starter: "I do not give myself credit for this often, but the truth is I have been incredibly resilient in the way I have...",
  },
  {
    id: 127, category: "Self-Compassion",
    question: "What would radical self-acceptance feel like — not just tolerating, but truly accepting?",
    starter: "Radical acceptance of myself — exactly as I am, in this moment, with this body, on this timeline — would feel like...",
  },
  {
    id: 128, category: "Self-Compassion",
    question: "What am I ashamed of about this journey that deserves compassion, not shame?",
    starter: "Something I have felt shame around — that I am rarely willing to admit — is... but if I replace the shame with compassion, I would say...",
  },
  {
    id: 129, category: "Self-Compassion",
    question: "What would a compassionate witness say about the effort I am putting in?",
    starter: "If someone who loved me deeply watched everything I have been through and everything I am doing, they would probably say...",
  },
  {
    id: 130, category: "Self-Compassion",
    question: "What do I need to hear right now that I have been waiting for someone else to say?",
    starter: "The words I have been waiting for — from my partner, my doctor, my mother, the universe — are... I want to practice saying them to myself: ...",
  },
  {
    id: 131, category: "Self-Compassion",
    question: "How has perfectionism made this harder than it needed to be?",
    starter: "Perfectionism has shown up in my fertility journey by making me feel like I had to... and when I could not, I...",
  },
  {
    id: 132, category: "Self-Compassion",
    question: "What would it mean to be enough — not someday, but right now?",
    starter: "If I was enough right now — not when I achieve the outcome, not when the result comes back positive, but right now — what would change is...",
  },
  {
    id: 133, category: "Self-Compassion",
    question: "What part of me is doing the very best she can and deserves to be seen?",
    starter: "There is a part of me who is trying so hard, who is exhausted but still showing up. I want to look at her and say...",
  },
  {
    id: 134, category: "Self-Compassion",
    question: "What would I do differently if I genuinely believed I was worthy of love right now?",
    starter: "If I held in my bones the belief that I am already worthy — completely, without condition — I would probably stop... and start...",
  },
  {
    id: 135, category: "Self-Compassion",
    question: "What small act of self-kindness can I commit to before the day ends?",
    starter: "Before this day ends, one small, genuine act of kindness I want to offer myself is...",
  },
  {
    id: 136, category: "Self-Compassion",
    question: "What am I grieving that I have not allowed myself to fully grieve?",
    starter: "There is a loss in this journey — not always a clinical one — that I have not fully let myself grieve. It is the loss of...",
  },
  {
    id: 137, category: "Self-Compassion",
    question: "What would compassion for my journey look like in how I talk about it?",
    starter: "When I explain my fertility journey to others or to myself, I often use words like... But compassion would describe it as...",
  },
  {
    id: 138, category: "Self-Compassion",
    question: "What mistake have I made on this journey that I am finally ready to forgive?",
    starter: "Something I did or chose or said during this journey that I have not forgiven myself for is... I am ready to forgive it because...",
  },
  {
    id: 139, category: "Self-Compassion",
    question: "What would it look like to befriend, rather than battle, my body?",
    starter: "Befriending my body instead of fighting it would change my daily experience by... It might mean I start to...",
  },
  {
    id: 140, category: "Self-Compassion",
    question: "What does my inner child need from me during this hard time?",
    starter: "When I think of the younger me — the girl who just wanted to be loved and to be okay — she needs me to...",
  },

  // ─── FEAR & ANXIETY ──────────────────────────────────────────────────────────
  {
    id: 141, category: "Fear & Anxiety",
    question: "What is my anxiety trying to protect me from right now?",
    starter: "If I could ask my anxiety: what are you trying to keep me safe from? I think it would say...",
  },
  {
    id: 142, category: "Fear & Anxiety",
    question: "What is the worst thing I am afraid of, and what would I do if it happened?",
    starter: "My deepest fear about this journey is... and as terrifying as it is to write down, if it happened, I think I would...",
  },
  {
    id: 143, category: "Fear & Anxiety",
    question: "What does anxiety feel like in my body, and what soothes it?",
    starter: "Anxiety lives in my body at... When it is loud, it feels like... The things that genuinely calm it — not just distract from it — are...",
  },
  {
    id: 144, category: "Fear & Anxiety",
    question: "What is the difference between healthy concern and unhelpful fear?",
    starter: "Healthy concern on this journey looks like... Fear that is spiraling and unhelpful looks like... Right now I am in the territory of...",
  },
  {
    id: 145, category: "Fear & Anxiety",
    question: "What triggers my anxiety the most during this phase of my cycle?",
    starter: "The moments that reliably send my anxiety spiking are... and what that spike feels like is...",
  },
  {
    id: 146, category: "Fear & Anxiety",
    question: "What would I say to fear if it were sitting across from me right now?",
    starter: "Fear, I see you. You have been very loud lately. I want to say to you...",
  },
  {
    id: 147, category: "Fear & Anxiety",
    question: "What story is fear telling me right now that is not necessarily true?",
    starter: "The story my fear keeps narrating is... and when I examine it with a little distance, I notice that the parts that might not be true are...",
  },
  {
    id: 148, category: "Fear & Anxiety",
    question: "What is still true and good in my life, even inside this fear?",
    starter: "Even in the middle of fear and uncertainty, the things that are still true and still good in my life are...",
  },
  {
    id: 149, category: "Fear & Anxiety",
    question: "What does my anxiety make me want to do — and is that actually helpful?",
    starter: "When anxiety peaks, my instinct is to... and while that feels urgent, if I am honest about whether it actually helps, I notice...",
  },
  {
    id: 150, category: "Fear & Anxiety",
    question: "What would I do in this moment if I was not afraid?",
    starter: "If fear were not driving right now, I would probably... I would feel more like... and I would stop...",
  },
  {
    id: 151, category: "Fear & Anxiety",
    question: "What has fear stolen from me during this journey, and what can I reclaim?",
    starter: "Fear has quietly taken... from my life lately. The thing I most want to reclaim is...",
  },
  {
    id: 152, category: "Fear & Anxiety",
    question: "What would breathing through fear look like, literally, right now?",
    starter: "If I placed a hand on my heart right now and took three slow breaths, what I notice in my body is...",
  },
  {
    id: 153, category: "Fear & Anxiety",
    question: "What brave thing can I do in the presence of my fear, not instead of it?",
    starter: "I am beginning to understand that bravery is not the absence of fear but movement in spite of it. The brave thing I can do today, even while afraid, is...",
  },
  {
    id: 154, category: "Fear & Anxiety",
    question: "Who would I be without this particular fear?",
    starter: "If I had never developed the fear of... I imagine I would be someone who...",
  },
  {
    id: 155, category: "Fear & Anxiety",
    question: "What is the kindest thing I can do for my nervous system today?",
    starter: "My nervous system has been working very hard. The kindest, most restorative thing I could offer it today is...",
  },
  {
    id: 156, category: "Fear & Anxiety",
    question: "What am I afraid to hope for, and why?",
    starter: "I am afraid to fully hope for... because if I let myself hope and then it does not come, I am afraid I will feel...",
  },
  {
    id: 157, category: "Fear & Anxiety",
    question: "What is worry costing me this week?",
    starter: "The real cost of worry this week — not just time, but joy, presence, connection — is...",
  },
  {
    id: 158, category: "Fear & Anxiety",
    question: "What is one thing I can say to myself when the anxiety gets loudest?",
    starter: "When the anxiety is at its peak, I want to have something ready to say to myself. Something true and grounding, like...",
  },
  {
    id: 159, category: "Fear & Anxiety",
    question: "What evidence do I have that I am capable of handling uncertainty?",
    starter: "I have survived uncertainty before. Evidence of my ability to handle not knowing is...",
  },
  {
    id: 160, category: "Fear & Anxiety",
    question: "What would I want to feel instead of fear — and is that available to me right now?",
    starter: "The feeling I am reaching for on the other side of this fear is... and when I think about whether it is available to me right now, even a little, I notice...",
  },

  // ─── HOPE & BECOMING ─────────────────────────────────────────────────────────
  {
    id: 161, category: "Hope & Becoming",
    question: "What does hope look like for me today — small, large, or somewhere in between?",
    starter: "Hope today is not a grand sweeping feeling. It is small and quiet and it looks like...",
  },
  {
    id: 162, category: "Hope & Becoming",
    question: "What am I becoming through this journey that I could not have become any other way?",
    starter: "This journey is forging something in me that I could not have built through an easier path. I am becoming someone who...",
  },
  {
    id: 163, category: "Hope & Becoming",
    question: "What do I dream of that this journey has not taken away?",
    starter: "Even on the hardest days, there is still a dream alive in me. It is the dream of...",
  },
  {
    id: 164, category: "Hope & Becoming",
    question: "Who do I want to be on the other side of this?",
    starter: "When I imagine myself through this — whole, healed, and at peace — she is a woman who...",
  },
  {
    id: 165, category: "Hope & Becoming",
    question: "What beauty have I found unexpectedly during this difficult time?",
    starter: "Something beautiful I did not expect to find during this journey is...",
  },
  {
    id: 166, category: "Hope & Becoming",
    question: "What are the small moments of joy I refuse to let this journey take from me?",
    starter: "Even in the middle of this uncertainty, the small joys I protect and hold onto are...",
  },
  {
    id: 167, category: "Hope & Becoming",
    question: "What do I know about my own strength that I could not have known before this?",
    starter: "This journey has shown me a capacity in myself that I did not know I had. It is the ability to...",
  },
  {
    id: 168, category: "Hope & Becoming",
    question: "What seeds am I planting now — in myself, in my relationships, in my life — that will grow?",
    starter: "Even in the waiting and the uncertainty, I am planting seeds. The ones I am most aware of are...",
  },
  {
    id: 169, category: "Hope & Becoming",
    question: "What would I want to tell the woman I am becoming?",
    starter: "To the version of me on the other side of all this, I want her to know...",
  },
  {
    id: 170, category: "Hope & Becoming",
    question: "What has this journey taught me about what actually matters?",
    starter: "Before this journey, I thought what mattered most was... but now I understand that what actually matters is...",
  },
  {
    id: 171, category: "Hope & Becoming",
    question: "What would I do first if I received the news I am hoping for?",
    starter: "If I received the news I am hoping for, the very first person I would call or tell is... and the first thing I would feel is...",
  },
  {
    id: 172, category: "Hope & Becoming",
    question: "How has this experience expanded my capacity for compassion — toward myself and others?",
    starter: "Before this journey, I did not fully understand what it meant to struggle with... Now I understand it in my body and bones, and it has made me more...",
  },
  {
    id: 173, category: "Hope & Becoming",
    question: "What vision of the future still makes you smile?",
    starter: "When I let myself imagine a future that feels good — that feels like coming home — I see...",
  },
  {
    id: 174, category: "Hope & Becoming",
    question: "What is this journey asking me to grow into?",
    starter: "If this journey has a purpose beyond the outcome, I think it is asking me to grow into someone who...",
  },
  {
    id: 175, category: "Hope & Becoming",
    question: "What story do I want to be able to tell about this time someday?",
    starter: "Someday, when I talk about this period of my life, I want to be able to say...",
  },
  {
    id: 176, category: "Hope & Becoming",
    question: "What am I grateful for today, even if it is something tiny?",
    starter: "I want to practice gratitude today — not as a way to bypass the hard feelings, but alongside them. Something I am genuinely grateful for is...",
  },
  {
    id: 177, category: "Hope & Becoming",
    question: "What does becoming mean to you right now, separate from any outcome?",
    starter: "Becoming — not arriving, not succeeding, but becoming — means to me right now...",
  },
  {
    id: 178, category: "Hope & Becoming",
    question: "What evidence of growth can you find in yourself from one year ago?",
    starter: "Compared to who I was one year ago, I have grown in the way I... I can now...",
  },
  {
    id: 179, category: "Hope & Becoming",
    question: "What light do you see, even if it is just a flicker?",
    starter: "Even in the hardest season, there is something that flickers — some warmth, some knowing, some small light. Today, that flicker is...",
  },
  {
    id: 180, category: "Hope & Becoming",
    question: "What are you building toward that no one can take away?",
    starter: "Beyond any result or outcome, what I am building in myself — in my character, my wisdom, my heart — is...",
  },

  // ─── GRIEF & ACCEPTANCE ──────────────────────────────────────────────────────
  {
    id: 181, category: "Grief & Acceptance",
    question: "What loss am I holding that has no name or ceremony?",
    starter: "There is a loss in this journey that the world does not always recognize. It is the loss of...",
  },
  {
    id: 182, category: "Grief & Acceptance",
    question: "What does grief feel like in my body right now?",
    starter: "When I tune into grief — not push it away, but actually feel it — it lives in my body at... and it feels like...",
  },
  {
    id: 183, category: "Grief & Acceptance",
    question: "What am I grieving that is not a loss of a pregnancy, but a loss of how I thought this would be?",
    starter: "I am grieving the version of this journey I imagined — the one where... and letting go of that image means...",
  },
  {
    id: 184, category: "Grief & Acceptance",
    question: "What would a grief ritual for this journey look like?",
    starter: "I want to create something to honor what has been hard — not to dwell, but to genuinely witness. My ritual might look like...",
  },
  {
    id: 185, category: "Grief & Acceptance",
    question: "What does acceptance mean to me — is it resignation, or something braver?",
    starter: "Acceptance is not the same as giving up. What I think acceptance actually means for me in this season is...",
  },
  {
    id: 186, category: "Grief & Acceptance",
    question: "What do I need to grieve before I can move forward?",
    starter: "In order to take my next step with a lighter heart, I think I need to first grieve...",
  },
  {
    id: 187, category: "Grief & Acceptance",
    question: "What parts of this journey have I been rushing through in order to avoid feeling?",
    starter: "I notice I have been moving quickly past... because if I slowed down and felt it, I might...",
  },
  {
    id: 188, category: "Grief & Acceptance",
    question: "What would it look like to grieve and still have hope at the same time?",
    starter: "I used to think grief and hope couldn't coexist — that one cancels the other. But I am beginning to understand they can both be true, and it looks like...",
  },
  {
    id: 189, category: "Grief & Acceptance",
    question: "Who or what do you turn to when the grief gets too heavy to carry alone?",
    starter: "When grief becomes too heavy to bear alone, the people or places or things I turn to are... and what they offer me is...",
  },
  {
    id: 190, category: "Grief & Acceptance",
    question: "What would you want the people in your life to understand about your grief?",
    starter: "If the people who love me could fully understand what this grief is like, I would want them to know...",
  },
  {
    id: 191, category: "Grief & Acceptance",
    question: "What has grief taught you about what you love?",
    starter: "The fact that I grieve this so deeply tells me something important about what I love. What grief is showing me I truly love is...",
  },
  {
    id: 192, category: "Grief & Acceptance",
    question: "What does it mean to accept something without liking it?",
    starter: "Acceptance is not approval. I can accept... without liking it, and what that distinction makes possible is...",
  },
  {
    id: 193, category: "Grief & Acceptance",
    question: "What has been the hardest moment of this journey to make peace with?",
    starter: "Of everything that has happened, the moment or experience that has been hardest to come to terms with is...",
  },
  {
    id: 194, category: "Grief & Acceptance",
    question: "What do you wish you could go back and say to yourself at the beginning of this?",
    starter: "If I could go back to the very beginning of this journey and whisper something in my own ear, it would be...",
  },
  {
    id: 195, category: "Grief & Acceptance",
    question: "What is grief asking you to release that you have been holding too tightly?",
    starter: "I think grief is trying to move something through me. What it seems to be asking me to finally release is...",
  },
  {
    id: 196, category: "Grief & Acceptance",
    question: "What would healing look like — not a destination, but a direction?",
    starter: "Healing is not a place I arrive at. It is a direction I move in. For me, moving toward healing means...",
  },
  {
    id: 197, category: "Grief & Acceptance",
    question: "What have you survived that you never thought you would?",
    starter: "Looking back at what I have already lived through on this journey, I am still here after...",
  },
  {
    id: 198, category: "Grief & Acceptance",
    question: "What is the most loving thing you can do for your grief today?",
    starter: "Instead of fighting or numbing or rushing through my grief, the most loving thing I can offer it today is...",
  },
  {
    id: 199, category: "Grief & Acceptance",
    question: "What would you say to the version of you from the hardest moment, from right now?",
    starter: "To me, in the darkest part of this journey, I want to reach back and say...",
  },
  {
    id: 200, category: "Grief & Acceptance",
    question: "What is still possible — even now, even here?",
    starter: "Even with everything that has been hard and uncertain and grieved, what is still possible for me is...",
  },
];
