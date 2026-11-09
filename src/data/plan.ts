import type { Subject } from "@/lib/types";
import { topicLabel } from "./taxonomy";

export interface ExamSection {
  subject: Subject;
  count: number;
  minutes?: number; // only used when sectionTimed is true
}

export interface ExamConfig {
  id: string;
  name: string;
  note: string;
  totalMinutes: number;
  sections: ExamSection[];
  marksPerQuestion: number;
  negative: number; // marks deducted per wrong answer (0 = off)
  sectionTimed: boolean;
}

/**
 * Neither preset is official. Both come from unofficial sources (see Resource Library).
 * Negative marking defaults to OFF because it could not be verified from an official
 * source; the student can switch it on in Settings (prep sources report 0.25).
 */
export const EXAM_PRESETS: ExamConfig[] = [
  {
    id: "reported-70",
    name: "Reported recent pattern — 70 MCQs, 90 min",
    note: "Daily Star (Nov 2025) reports ~70 MCQ marks in 90 minutes plus a separate 30-minute written part. The 25/30/15 split is an assumption that matches the 70 total; unverified.",
    totalMinutes: 90,
    sections: [
      { subject: "english", count: 25, minutes: 30 },
      { subject: "quant", count: 30, minutes: 40 },
      { subject: "analytical", count: 15, minutes: 20 },
    ],
    marksPerQuestion: 1,
    negative: 0,
    sectionTimed: false,
  },
  {
    id: "reported-75",
    name: "Older reported pattern — 75 MCQs (30/30/15)",
    note: "PIE Academy and Admission Guru describe 30 English, 30 Maths and 15 Analytical questions, 1 mark each. Duration assumed 90 minutes; unverified.",
    totalMinutes: 90,
    sections: [
      { subject: "english", count: 30, minutes: 32 },
      { subject: "quant", count: 30, minutes: 38 },
      { subject: "analytical", count: 15, minutes: 20 },
    ],
    marksPerQuestion: 1,
    negative: 0,
    sectionTimed: false,
  },
  {
    id: "sectional-quant",
    name: "Sectional — Mathematics only (30 Q, 35 min)",
    note: "Training set: slightly faster than exam pace to build speed.",
    totalMinutes: 35,
    sections: [{ subject: "quant", count: 30 }],
    marksPerQuestion: 1,
    negative: 0,
    sectionTimed: false,
  },
  {
    id: "sectional-english",
    name: "Sectional — English only (25 Q, 25 min)",
    note: "Training set.",
    totalMinutes: 25,
    sections: [{ subject: "english", count: 25 }],
    marksPerQuestion: 1,
    negative: 0,
    sectionTimed: false,
  },
  {
    id: "sectional-analytical",
    name: "Sectional — Analytical only (15 Q, 20 min)",
    note: "Training set.",
    totalMinutes: 20,
    sections: [{ subject: "analytical", count: 15 }],
    marksPerQuestion: 1,
    negative: 0,
    sectionTimed: false,
  },
];

export const WRITING_PROMPTS = [
  "Should Bangladesh prioritise export diversification over expanding the garment sector? Argue one side in about 250 words.",
  "Write a short business letter to a supplier who has delivered goods late for the third time.",
  "'Remote work will become the norm for office jobs in Dhaka.' Do you agree? Give reasons and examples.",
  "Describe a time you led a team through a difficult problem. What did you learn?",
  "Summarise the main argument of any reading passage in this app in 120 words, then give your own view.",
  "Should universities in Bangladesh make internships compulsory for graduation? Discuss.",
  "Write a paragraph explaining the role of mobile financial services in rural Bangladesh.",
];

export interface PlanDay {
  day: number;
  phase: 1 | 2 | 3 | 4;
  phaseName: string;
  english: string[];
  quant: string[];
  analytical: string[];
  review: string[];
  mock?: string;
  ids: { english: string[]; quant: string[]; analytical: string[] };
}

const PHASES = {
  1: "Foundation & diagnosis",
  2: "Intensive skill building",
  3: "Advanced problem solving",
  4: "Exam readiness",
} as const;

// topic rotation (taxonomy ids) for each phase
const EN = [
  ["sva", "tense", "articles"], ["prepositions", "pronouns"], ["modifiers", "parallelism"], ["conditionals", "clauses"], ["gerund-inf", "voice", "narration"], ["conjunctions", "punctuation"], ["redundancy", "comparison"],
];
const QT = [
  ["percent", "profit-loss"], ["ratio", "average"], ["mixture", "interest"], ["work", "tsd"], ["boats-trains", "partnership", "ages"], ["numbers", "remainders", "lcm-hcf"], ["linear", "quadratic"], ["inequalities", "exponents", "sequences"], ["triangles", "circles"], ["mensuration", "coordinate"], ["pnc", "probability"], ["sets", "statistics", "functions"],
];
const AN = [
  ["series", "coding"], ["blood", "direction"], ["ranking", "calendar-clock"], ["syllogism"], ["arrangement"], ["grouping"], ["cr-assumption", "cr-strengthen"], ["cr-weaken", "cr-flaw"], ["cr-inference", "cr-paradox"], ["di"], ["ds"],
];

export const PLAN: PlanDay[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const phase = (day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : 4) as 1 | 2 | 3 | 4;
  const en = EN[i % EN.length];
  const qt = QT[i % QT.length];
  const an = AN[i % AN.length];
  const words = phase === 1 ? 10 : phase === 2 ? 15 : phase === 3 ? 15 : 10;
  const p: PlanDay = {
    day,
    phase,
    phaseName: PHASES[phase],
    ids: { english: en, quant: qt, analytical: an },
    english: [
      `Grammar: ${en.map(topicLabel).join(", ")}`,
      `Vocabulary: ${words} new words + all due reviews`,
      phase === 1 ? "Read one passage untimed; note main idea and tone" : `Reading: ${phase >= 3 ? 2 : 1} timed passage${phase >= 3 ? "s" : ""}`,
    ],
    quant: [
      `Topics: ${qt.map(topicLabel).join(", ")}`,
      phase === 1 ? "Speed Gym: 2 drills at level 1–2" : `Speed Gym: 3 drills at level ${Math.min(5, phase + 1)}+`,
      `${phase === 1 ? 15 : 20} problems, difficulty ${phase === 1 ? "2–3" : phase === 2 ? "3–4" : "4–6"}`,
    ],
    analytical: [
      `Topics: ${an.map(topicLabel).join(", ")}`,
      phase >= 2 ? "Solve 1–2 arrangement puzzles on the board" : "Learn the 8-step puzzle method",
      `${phase === 1 ? 8 : 12} critical-reasoning questions`,
    ],
    review: ["Mistake notebook: clear everything due", phase >= 3 ? "Analyse yesterday's slow questions" : "Re-read today's shortcuts"],
  };
  if (day === 1) p.mock = "Diagnostic test (sets your starting levels)";
  else if (phase === 3 && day % 2 === 1) p.mock = "Sectional mock (rotate sections)";
  else if (phase === 4 && day !== 30) p.mock = day % 2 === 0 ? "Full mock + 45 min analysis" : "Sectional mock on the weakest section";
  else if (day === 30) p.mock = "Light review only — rest, sleep, logistics for exam day";
  return p;
});
