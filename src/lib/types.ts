export type Subject = "english" | "quant" | "analytical";
export type Difficulty = 1 | 2 | 3 | 4 | 5 | 6;

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: "Foundation",
  2: "Intermediate",
  3: "Admission standard",
  4: "Difficult",
  5: "Very difficult",
  6: "Expert challenge",
};

/**
 * Where a question came from. The app never labels anything as a real past-paper
 * question unless it is "verified-past" — and the bundled bank contains none,
 * because no past paper could be verified against an official source.
 */
export type SourceClass =
  | "original" // hand-written for this app, answer independently checked
  | "algorithmic" // produced by a generator whose answer is computed, so always correct
  | "ai-reviewed" // AI-generated, passed automatic checks and was approved by the student
  | "adapted" // modelled on a style from GMAT/GRE/CAT-type public material
  | "verified-past"; // reserved: only for questions verified from an official/legitimate past paper

export const SOURCE_LABEL: Record<SourceClass, string> = {
  original: "Original practice question",
  algorithmic: "Generated (answer computed)",
  "ai-reviewed": "AI-generated, reviewed",
  adapted: "Adapted practice (GMAT/GRE/CAT style)",
  "verified-past": "Verified past question",
};

export interface ChartSpec {
  kind: "bar" | "line" | "pie" | "table";
  title: string;
  unit?: string;
  /** for bar/line: categories along x; series name -> values */
  categories?: string[];
  series?: { name: string; values: number[] }[];
  /** for pie: label + value */
  slices?: { label: string; value: number }[];
  /** for table */
  columns?: string[];
  rows?: (string | number)[][];
}

export interface Shortcut {
  trick: string;
  why: string;
  whenNot: string;
}

export interface Question {
  id: string;
  subject: Subject;
  topic: string; // taxonomy topic id
  difficulty: Difficulty;
  stem: string;
  options: string[];
  answer: number; // index into options
  explanation: string; // detailed / traditional explanation
  fastest?: string; // fastest reliable method
  mental?: string; // mental-calculation approach
  shortcut?: Shortcut;
  traps?: string[];
  timeSec: number; // target solving time
  source: SourceClass;
  objective: string; // learning objective
  passageId?: string;
  chart?: ChartSpec;
  /** Highlight for grammar items: the exact wrong fragment */
  errorSpan?: string;
}

export interface Passage {
  id: string;
  title: string;
  domain: string;
  difficulty: Difficulty;
  text: string;
}

export type MistakeCause =
  | "conceptual"
  | "calculation"
  | "grammar"
  | "vocabulary"
  | "misreading"
  | "logic"
  | "time"
  | "careless"
  | "shortcut"
  | "guess";

export const MISTAKE_CAUSES: { id: MistakeCause; label: string }[] = [
  { id: "conceptual", label: "Conceptual misunderstanding" },
  { id: "calculation", label: "Calculation error" },
  { id: "grammar", label: "Grammar error" },
  { id: "vocabulary", label: "Vocabulary weakness" },
  { id: "misreading", label: "Misreading" },
  { id: "logic", label: "Logical reasoning failure" },
  { id: "time", label: "Poor time management" },
  { id: "careless", label: "Careless mistake" },
  { id: "shortcut", label: "Incorrect shortcut" },
  { id: "guess", label: "Guessing" },
];

export interface VocabWord {
  word: string;
  ipa: string;
  pos: string;
  definition: string;
  bengali: string;
  synonyms: string[];
  antonyms: string[];
  collocations: string[];
  family: string[];
  root?: string;
  visual: string; // visual association
  emoji: string; // tiny visual anchor for the card
  examples: string[];
  mistakes: string;
  memory: string;
  level: 1 | 2 | 3; // 1 common-advanced, 2 hard, 3 very hard
  theme: string; // semantic cluster used for maps
}
