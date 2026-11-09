import type { Subject } from "@/lib/types";

export interface Topic {
  id: string;
  subject: Subject;
  group: string;
  label: string;
  /** Rough relevance to the DU IBA MBA test, from reported question types (unverified). */
  weight: 1 | 2 | 3;
}

const t = (subject: Subject, group: string, list: [string, string, 1 | 2 | 3][]): Topic[] =>
  list.map(([id, label, weight]) => ({ id, subject, group, label, weight }));

export const TOPICS: Topic[] = [
  // ENGLISH
  ...t("english", "Grammar", [
    ["sva", "Subject-verb agreement", 3],
    ["tense", "Tenses", 2],
    ["articles", "Articles", 2],
    ["prepositions", "Prepositions", 3],
    ["pronouns", "Pronouns", 2],
    ["modifiers", "Modifiers", 3],
    ["parallelism", "Parallelism", 3],
    ["conditionals", "Conditional sentences", 2],
    ["clauses", "Clauses & sentence structure", 2],
    ["gerund-inf", "Gerunds & infinitives", 2],
    ["voice", "Active & passive voice", 1],
    ["narration", "Direct & indirect speech", 1],
    ["conjunctions", "Conjunctions", 2],
    ["punctuation", "Punctuation", 1],
    ["redundancy", "Redundancy & conciseness", 2],
    ["comparison", "Comparisons", 3],
  ]),
  ...t("english", "Vocabulary & usage", [
    ["sentence-completion", "Sentence completion", 3],
    ["synonym", "Synonyms", 3],
    ["antonym", "Antonyms", 3],
    ["analogy", "Analogy", 3],
    ["idioms", "Idioms & phrases", 2],
    ["vocab-context", "Vocabulary in context", 3],
  ]),
  ...t("english", "Reading", [
    ["rc", "Reading comprehension", 3],
    ["para-jumble", "Para jumbles", 1],
  ]),
  // QUANT
  ...t("quant", "Arithmetic", [
    ["percent", "Percentages", 3],
    ["profit-loss", "Profit, loss & discount", 3],
    ["ratio", "Ratio & proportion", 3],
    ["average", "Averages", 3],
    ["mixture", "Mixtures & alligation", 2],
    ["interest", "Simple & compound interest", 2],
    ["work", "Time & work, pipes", 3],
    ["tsd", "Time, speed & distance", 3],
    ["boats-trains", "Boats, streams & trains", 2],
    ["partnership", "Partnership", 2],
    ["ages", "Ages", 2],
  ]),
  ...t("quant", "Number properties", [
    ["numbers", "Number properties & divisibility", 3],
    ["remainders", "Remainders & units digit", 2],
    ["lcm-hcf", "LCM & HCF", 2],
  ]),
  ...t("quant", "Algebra", [
    ["linear", "Linear & simultaneous equations", 3],
    ["quadratic", "Quadratics & identities", 2],
    ["inequalities", "Inequalities & absolute value", 2],
    ["exponents", "Exponents, radicals & logs", 2],
    ["sequences", "Sequences & series", 2],
    ["functions", "Functions", 1],
  ]),
  ...t("quant", "Geometry", [
    ["triangles", "Lines, angles & triangles", 3],
    ["circles", "Circles & polygons", 2],
    ["mensuration", "Area, volume & surface area", 3],
    ["coordinate", "Coordinate geometry", 1],
  ]),
  ...t("quant", "Counting & data", [
    ["pnc", "Permutations & combinations", 2],
    ["probability", "Probability", 2],
    ["sets", "Sets & Venn diagrams", 2],
    ["statistics", "Statistics", 1],
  ]),
  // ANALYTICAL
  ...t("analytical", "Logical reasoning", [
    ["series", "Number & letter series", 2],
    ["coding", "Coding & decoding", 2],
    ["blood", "Blood relations", 2],
    ["direction", "Direction & distance", 2],
    ["ranking", "Ranking & ordering", 2],
    ["calendar-clock", "Calendars & clocks", 1],
    ["syllogism", "Syllogisms & symbolic logic", 2],
  ]),
  ...t("analytical", "Puzzles", [
    ["arrangement", "Seating & arrangement puzzles", 3],
    ["grouping", "Grouping, selection & scheduling", 3],
  ]),
  ...t("analytical", "Critical reasoning", [
    ["cr-assumption", "Assumption", 3],
    ["cr-strengthen", "Strengthen", 3],
    ["cr-weaken", "Weaken", 3],
    ["cr-inference", "Inference & conclusion", 3],
    ["cr-flaw", "Flaw & evaluate", 2],
    ["cr-paradox", "Paradox resolution", 2],
  ]),
  ...t("analytical", "Data", [
    ["di", "Data interpretation", 2],
    ["ds", "Data sufficiency", 2],
  ]),
];

export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(TOPICS.map((x) => [x.id, x]));

export const SUBJECT_LABEL: Record<Subject, string> = {
  english: "English",
  quant: "Mathematics",
  analytical: "Analytical",
};

export function topicsOf(subject: Subject) {
  return TOPICS.filter((x) => x.subject === subject);
}

export function topicLabel(id: string) {
  return TOPIC_BY_ID[id]?.label ?? id;
}
