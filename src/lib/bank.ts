import type { Difficulty, Question, Subject } from "./types";
import { ENGLISH_QUESTIONS } from "@/data/questions/english";
import { RC_QUESTIONS, PASSAGES } from "@/data/questions/reading";
import { QUANT_QUESTIONS } from "@/data/questions/quant";
import { ANALYTICAL_QUESTIONS } from "@/data/questions/analytical";
import { VOCAB, VOCAB_BY_WORD } from "@/data/vocab";
import { GENERATORS, GENERATOR_KEYS, rebuildGenerated } from "./generators";
import { hashStr, mulberry32, pick, shuffle } from "./rng";
import { CUSTOM, registerCustom } from "./custom-registry";

export const STATIC_QUESTIONS: Question[] = [...ENGLISH_QUESTIONS, ...RC_QUESTIONS, ...QUANT_QUESTIONS, ...ANALYTICAL_QUESTIONS];
const BY_ID = new Map(STATIC_QUESTIONS.map((q) => [q.id, q]));
export const PASSAGE_BY_ID = Object.fromEntries(PASSAGES.map((p) => [p.id, p]));

/** Custom (AI-generated, approved) questions are registered at runtime from the DB. */
export { registerCustom };
export function customQuestions() {
  return [...CUSTOM.values()];
}

/** Vocabulary-derived questions: "voc:<kind>:<word>:<seed>" — answers come straight from the word data. */
export function vocabQuestion(kind: "syn" | "ant" | "meaning" | "bn", word: string, seed: number): Question | undefined {
  const w = VOCAB_BY_WORD[word];
  if (!w) return undefined;
  const r = mulberry32(seed ^ hashStr(word));
  // Distractors come only from other semantic themes and from entries not linked to the
  // target word, so a distractor can't accidentally be a second correct answer.
  const linked = new Set([w.word, ...w.synonyms, ...w.antonyms].map((s) => s.toLowerCase()));
  const others = VOCAB.filter(
    (x) =>
      x.word !== word &&
      x.theme !== w.theme &&
      ![x.word, ...x.synonyms, ...x.antonyms].some((s) => linked.has(s.toLowerCase())),
  );
  let stem = "";
  let correct = "";
  let pool: string[] = [];
  const exclude = new Set([...w.synonyms, ...w.antonyms, w.word].map((s) => s.toLowerCase()));
  if (kind === "syn") {
    stem = `Choose the word closest in meaning to **${w.word.toUpperCase()}**.`;
    correct = pick(r, w.synonyms);
    pool = others.flatMap((o) => o.synonyms.concat(o.word));
  } else if (kind === "ant") {
    if (!w.antonyms.length) return undefined;
    stem = `Choose the word most nearly OPPOSITE in meaning to **${w.word.toUpperCase()}**.`;
    correct = pick(r, w.antonyms);
    pool = others.flatMap((o) => o.synonyms.concat(o.word));
  } else if (kind === "meaning") {
    stem = `What does **${w.word}** (${w.pos}) mean?`;
    correct = w.definition;
    pool = others.map((o) => o.definition);
  } else {
    stem = `Which English word matches the Bengali meaning: **${w.bengali}**?`;
    correct = w.word;
    pool = others.map((o) => o.word);
  }
  // distractors must not be synonyms/antonyms of the target (prevents two right answers)
  const candidates = shuffle(r, [...new Set(pool)].filter((p) => !exclude.has(p.toLowerCase()) && p !== correct));
  const distractors = candidates.slice(0, 3);
  const options = shuffle(r, [correct, ...distractors]);
  return {
    id: `voc:${kind}:${word}:${seed}`,
    subject: "english",
    topic: kind === "ant" ? "antonym" : "synonym",
    difficulty: (w.level + 1) as Difficulty,
    stem,
    options,
    answer: options.indexOf(correct),
    explanation: `${w.word} (${w.pos}): ${w.definition}. বাংলা: ${w.bengali}. Synonyms: ${w.synonyms.join(", ")}. Antonyms: ${w.antonyms.join(", ") || "—"}.`,
    fastest: `Memory hook: ${w.memory}`,
    traps: [w.mistakes],
    timeSec: 15,
    source: "algorithmic",
    objective: `Know '${w.word}' cold.`,
  };
}

export function getQuestion(id: string): Question | undefined {
  if (id.startsWith("gen:")) return rebuildGenerated(id);
  if (id.startsWith("voc:")) {
    const [, kind, word, seed] = id.split(":");
    return vocabQuestion(kind as "syn", word, Number(seed));
  }
  return BY_ID.get(id) ?? CUSTOM.get(id);
}

export function allQuestions(): Question[] {
  return [...STATIC_QUESTIONS, ...CUSTOM.values()];
}

export function questionsFor(filter: { subject?: Subject; topic?: string; minD?: number; maxD?: number }) {
  return allQuestions().filter(
    (q) =>
      (!filter.subject || q.subject === filter.subject) &&
      (!filter.topic || q.topic === filter.topic) &&
      (filter.minD === undefined || q.difficulty >= filter.minD) &&
      (filter.maxD === undefined || q.difficulty <= filter.maxD),
  );
}

/** Fresh generated questions for a topic (if a generator exists). */
export function generatedFor(topic: string, count: number, seedBase = Date.now()): Question[] {
  const keys = GENERATOR_KEYS.filter((k) => GENERATORS[k].topic === topic);
  if (!keys.length) return [];
  return Array.from({ length: count }, (_, i) => GENERATORS[keys[i % keys.length]].gen((seedBase + i * 7919) >>> 0));
}

export function bankStats() {
  const qs = allQuestions();
  const by = (s: Subject) => qs.filter((q) => q.subject === s).length;
  return {
    total: qs.length,
    english: by("english"),
    quant: by("quant"),
    analytical: by("analytical"),
    generators: GENERATOR_KEYS.length,
    vocab: VOCAB.length,
  };
}
