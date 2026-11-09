"use client";
import type { Question, Subject } from "./types";
import type { ExamConfig } from "@/data/plan";
import { EXAM_PRESETS } from "@/data/plan";
import { allQuestions, generatedFor, getQuestion } from "./bank";
import { GENERATOR_KEYS, GENERATORS } from "./generators";
import { mulberry32, shuffle } from "./rng";
import { db, getSetting, type MockRecord } from "./db";
import { getPrefs } from "./mission";
import { recordAnswer } from "./engine";
import { PASSAGES } from "@/data/questions/reading";

/** Custom exam format saved from Settings overrides the preset with the same id. */
export async function examConfigs(): Promise<ExamConfig[]> {
  const custom = await getSetting<ExamConfig | null>("examConfig:custom", null);
  return custom ? [...EXAM_PRESETS, custom] : EXAM_PRESETS;
}

/**
 * Exam-like selection: spread across topics, difficulty 2–5 weighted to the middle,
 * one reading passage in the English section, generated questions topping up Maths.
 * Mocks avoid questions used in your previous mocks where the bank allows.
 */
export async function buildMockQuestions(cfg: ExamConfig, seed = Date.now()): Promise<Question[]> {
  const r = mulberry32(seed);
  const used = new Set((await db.mocks.toArray()).flatMap((m) => m.qids));
  const bank = allQuestions();
  const out: Question[] = [];

  for (const s of cfg.sections) {
    const section: Question[] = [];
    if (s.subject === "english" && s.count >= 15) {
      const unused = PASSAGES.filter((p) => !bank.some((q) => q.passageId === p.id && used.has(q.id)));
      const passage = shuffle(r, unused.length ? unused : [...PASSAGES])[0];
      section.push(...bank.filter((q) => q.passageId === passage.id).slice(0, 5));
    }
    const pool = bank.filter((q) => q.subject === s.subject && q.topic !== "rc" && q.difficulty >= 2 && q.difficulty <= 5);
    if (s.subject === "quant") {
      const keys = shuffle(r, [...GENERATOR_KEYS]);
      keys.slice(0, Math.ceil(s.count / 2)).forEach((k) => pool.push(GENERATORS[k].gen(Math.floor(r() * 1e9))));
    }
    const fresh = shuffle(r, pool.filter((q) => !used.has(q.id)));
    const stale = shuffle(r, pool.filter((q) => used.has(q.id)));
    const perTopic: Record<string, number> = {};
    const cap = Math.max(2, Math.ceil(s.count / 8));
    for (const q of [...fresh, ...stale]) {
      if (section.length >= s.count) break;
      if (section.includes(q) || (perTopic[q.topic] ?? 0) >= cap) continue;
      perTopic[q.topic] = (perTopic[q.topic] ?? 0) + 1;
      section.push(q);
    }
    for (const q of [...fresh, ...stale]) {
      if (section.length >= s.count) break;
      if (!section.includes(q)) section.push(q);
    }
    if (section.length < s.count && s.subject === "quant") section.push(...generatedFor("percent", s.count - section.length, seed));
    // keep the passage block together at the start; order the rest easy → hard like a real paper
    const block = section.filter((q) => q.passageId);
    const rest = section.filter((q) => !q.passageId).sort((a, b) => a.difficulty - b.difficulty);
    out.push(...rest, ...block);
  }
  return out;
}

export async function startMock(cfg: ExamConfig, mode: MockRecord["mode"]): Promise<number> {
  const prefs = await getPrefs();
  const qs = await buildMockQuestions(cfg);
  const id = await db.mocks.add({
    mode,
    configName: cfg.name,
    startedAt: Date.now(),
    durationSec: cfg.totalMinutes * 60,
    qids: qs.map((q) => q.id),
    answers: qs.map(() => null),
    times: qs.map(() => 0),
    marked: qs.map(() => false),
    current: 0,
    negative: prefs.negative || cfg.negative,
    status: "active",
    elapsedSec: 0,
  });
  return id as number;
}

export function mockQuestions(m: MockRecord): Question[] {
  return m.qids.map((id) => getQuestion(id)).filter(Boolean) as Question[];
}

export async function submitMock(m: MockRecord, auto = false): Promise<MockRecord> {
  const qs = mockQuestions(m);
  const sectionScores: NonNullable<MockRecord["sectionScores"]> = {};
  let score = 0;
  for (let i = 0; i < qs.length; i++) {
    const q = qs[i];
    const c = m.answers[i];
    const { correct } = await recordAnswer(q, c, m.times[i] ?? 0, "mock");
    const s = (sectionScores[q.subject] ??= { score: 0, max: 0, correct: 0, wrong: 0, blank: 0 });
    s.max += 1;
    if (c === null) s.blank++;
    else if (correct) { s.correct++; s.score += 1; }
    else { s.wrong++; s.score -= m.negative; }
  }
  for (const s of Object.values(sectionScores)) { s.score = Math.round(s.score * 100) / 100; score += s.score; }
  const done: MockRecord = { ...m, status: "done", finishedAt: Date.now(), score: Math.round(score * 100) / 100, sectionScores, autoSubmitted: auto };
  await db.mocks.put(done);
  return done;
}

export const SUBJECT_NAME: Record<Subject, string> = { english: "English", quant: "Mathematics", analytical: "Analytical" };
