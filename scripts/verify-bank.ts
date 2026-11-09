/**
 * Question-bank verification. Run with: npm run verify
 * Fails (exit 1) on any broken key, duplicate option, unsolvable or ambiguous puzzle,
 * or generator that produces an invalid question.
 */
import { STATIC_QUESTIONS, vocabQuestion, PASSAGE_BY_ID } from "../src/lib/bank";
import { QUANT_CHECKS } from "../src/data/questions/quant";
import { GENERATORS, GENERATOR_KEYS } from "../src/lib/generators";
import { PUZZLES } from "../src/data/puzzles";
import { solveAll } from "../src/lib/puzzle-engine";
import { VOCAB } from "../src/data/vocab";
import { TOPIC_BY_ID } from "../src/data/taxonomy";
import { LESSONS } from "../src/data/grammar";
import { SHORTCUTS } from "../src/data/shortcuts";
import type { Question } from "../src/lib/types";

let errors = 0;
const fail = (msg: string) => {
  errors++;
  console.error("✗", msg);
};

function checkQuestion(q: Question, where: string) {
  if (!TOPIC_BY_ID[q.topic]) fail(`${where} ${q.id}: unknown topic ${q.topic}`);
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) fail(`${where} ${q.id}: answer index ${q.answer} out of range`);
  const norm = q.options.map((o) => o.trim().toLowerCase());
  if (new Set(norm).size !== norm.length) fail(`${where} ${q.id}: duplicate options ${JSON.stringify(q.options)}`);
  if (q.options.length < 2) fail(`${where} ${q.id}: fewer than 2 options`);
  if (!q.explanation) fail(`${where} ${q.id}: missing explanation`);
  if (q.difficulty < 1 || q.difficulty > 6) fail(`${where} ${q.id}: bad difficulty`);
  if (q.passageId && !PASSAGE_BY_ID[q.passageId]) fail(`${where} ${q.id}: missing passage ${q.passageId}`);
  if (q.source === "verified-past") fail(`${where} ${q.id}: bundled bank must not claim verified past questions`);
}

const num = (s: string) => {
  const m = s.replace(/,/g, "").replace(/−/g, "-").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : NaN;
};

// 1. static questions
const ids = new Set<string>();
for (const q of STATIC_QUESTIONS) {
  if (ids.has(q.id)) fail(`duplicate id ${q.id}`);
  ids.add(q.id);
  checkQuestion(q, "static");
}

// 2. quant answer keys recomputed independently
let quantChecked = 0;
for (const [id, check] of Object.entries(QUANT_CHECKS)) {
  const q = STATIC_QUESTIONS.find((x) => x.id === id)!;
  const keyed = q.options[q.answer];
  if (typeof check === "string") {
    if (keyed !== check) fail(`quant ${id}: keyed "${keyed}" ≠ computed "${check}"`);
  } else {
    const v = num(keyed);
    if (!(Math.abs(v - check) < 0.011 || Math.abs(v - check) / Math.abs(check) < 0.001)) fail(`quant ${id}: keyed ${keyed} (${v}) ≠ computed ${check}`);
    // no OTHER option may equal the computed answer
    q.options.forEach((o, i) => {
      if (i !== q.answer && Math.abs(num(o) - check) < 1e-9 && !/[a-z]{3,}/i.test(o.replace(/Tk|cm|min|km|h|s|days?|hours?|years?|crore|L/g, ""))) fail(`quant ${id}: option ${i} "${o}" also equals the answer`);
    });
  }
  quantChecked++;
}

// 3. generators — 400 seeds each
let generated = 0;
for (const key of GENERATOR_KEYS) {
  for (let seed = 1; seed <= 400; seed++) {
    const q = GENERATORS[key].gen(seed * 7919);
    checkQuestion(q, `gen:${key}`);
    if (q.options.length !== 4) fail(`gen:${key} seed ${seed}: ${q.options.length} options`);
    if (q.options.some((o) => /NaN|Infinity|undefined/.test(o))) fail(`gen:${key} seed ${seed}: bad option ${q.options}`);
    generated++;
  }
}

// 4. puzzles — exactly one solution, matching the stored one; each question keyed exactly once
for (const p of PUZZLES) {
  const sols = solveAll(p);
  if (sols.length !== 1) fail(`puzzle ${p.id}: ${sols.length} solutions`);
  else if (JSON.stringify(sols[0]) !== JSON.stringify(p.solution)) fail(`puzzle ${p.id}: stored solution differs from solver ${JSON.stringify(sols[0])}`);
  for (const qq of p.questions) {
    const ans = qq.answer(p.solution);
    const hits = qq.options.filter((o) => o === ans).length;
    if (hits !== 1) fail(`puzzle ${p.id}: "${qq.stem}" answer "${ans}" appears ${hits} times in options`);
  }
}

// 5. vocabulary + derived questions
for (const w of VOCAB) {
  for (const f of ["word", "ipa", "pos", "definition", "bengali", "visual", "memory"] as const) if (!w[f]) fail(`vocab ${w.word}: missing ${f}`);
  if (w.synonyms.length < 2) fail(`vocab ${w.word}: needs ≥2 synonyms`);
  if (w.examples.length < 2) fail(`vocab ${w.word}: needs ≥2 examples`);
  for (const kind of ["syn", "ant", "meaning", "bn"] as const) {
    for (let seed = 1; seed <= 5; seed++) {
      const q = vocabQuestion(kind, w.word, seed);
      if (!q) continue;
      checkQuestion(q, "vocab");
      if (q.options.length !== 4) fail(`vocab ${w.word} ${kind}: only ${q.options.length} options`);
    }
  }
}
if (new Set(VOCAB.map((w) => w.word)).size !== VOCAB.length) fail("duplicate vocab words");

// 6. lessons and shortcuts reference real topics
for (const l of LESSONS) if (!TOPIC_BY_ID[l.id]) fail(`lesson ${l.id}: unknown topic`);
for (const s of SHORTCUTS) if (!TOPIC_BY_ID[s.topic]) fail(`shortcut ${s.id}: unknown topic`);

console.log(`Static questions: ${STATIC_QUESTIONS.length} (quant keys recomputed: ${quantChecked})`);
console.log(`Generated questions checked: ${generated} across ${GENERATOR_KEYS.length} generators`);
console.log(`Puzzles: ${PUZZLES.length}, vocab words: ${VOCAB.length}, lessons: ${LESSONS.length}, shortcuts: ${SHORTCUTS.length}`);
if (errors) {
  console.error(`\n${errors} problem(s) found.`);
  process.exit(1);
}
console.log("\n✓ Bank verified: every key valid, no duplicate options, puzzles uniquely solvable.");
