"use client";
import { db, todayKey, withTimeout, type Attempt, type AttemptMode, type Mistake, type SkillRating } from "./db";
import type { MistakeCause, Question, Subject } from "./types";
import { DAY, nextMistakeInterval } from "./srs";
import { allQuestions, generatedFor, getQuestion } from "./bank";
import { TOPICS, TOPIC_BY_ID } from "@/data/taxonomy";
import { shuffle, mulberry32 } from "./rng";

/**
 * Adaptive model: every topic has a rating on the 1–6 difficulty scale.
 * Expected success on a question = logistic(rating − difficulty + 0.5).
 * Rating moves toward harder questions when you succeed and back when you fail,
 * so practice is always pitched slightly ABOVE comfort (target ≈ 60–65 % success).
 */
const K = 0.35;
export const expected = (rating: number, d: number) => 1 / (1 + Math.exp(-(rating - d + 0.5) * 1.4));

export function guessCause(q: Question, chosen: number | null, timeMs: number): MistakeCause {
  if (chosen === null) return "time";
  if (timeMs < q.timeSec * 1000 * 0.25) return "careless";
  if (q.subject === "quant") return "calculation";
  if (q.subject === "analytical") return "logic";
  if (["synonym", "antonym", "analogy", "vocab-context", "sentence-completion", "idioms"].includes(q.topic)) return "vocabulary";
  if (q.topic === "rc") return "misreading";
  return "grammar";
}

/** Save a whole timed set in one quick transaction (so it lands before the student navigates away). */
export async function recordAnswers(items: { q: Question; chosen: number | null; timeMs: number }[], mode: AttemptMode) {
  await db.transaction("rw", [db.attempts, db.skills, db.mistakes, db.days], async () => {
    for (const it of items) await recordAnswer(it.q, it.chosen, it.timeMs, mode);
  });
}

export async function recordAnswer(q: Question, chosen: number | null, timeMs: number, mode: AttemptMode) {
  const correct = chosen === q.answer;
  const now = Date.now();
  const attempt: Attempt = {
    qid: q.id,
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty,
    correct,
    skipped: chosen === null,
    chosen,
    timeMs,
    at: now,
    mode,
  };
  const slow = timeMs > q.timeSec * 1000 * 1.6;

  await db.transaction("rw", [db.attempts, db.skills, db.mistakes, db.days], async () => {
    await db.attempts.add(attempt);

    // adaptive rating (skips count as wrong for rating only in mocks)
    if (chosen !== null || mode === "mock") {
      const s: SkillRating = (await db.skills.get(q.topic)) ?? {
        topic: q.topic,
        subject: q.subject,
        rating: 2.5,
        attempts: 0,
        correct: 0,
        avgMs: 0,
      };
      const exp = expected(s.rating, q.difficulty);
      s.rating = Math.min(6.5, Math.max(1, s.rating + K * ((correct ? 1 : 0) - exp) * (1 + (q.difficulty - 3) * 0.1)));
      s.avgMs = s.attempts ? (s.avgMs * s.attempts + timeMs) / (s.attempts + 1) : timeMs;
      s.attempts += 1;
      s.correct += correct ? 1 : 0;
      await db.skills.put(s);
    }

    // mistake notebook
    const existing = await db.mistakes.get(q.id);
    if (!correct || slow) {
      const m: Mistake = existing ?? {
        qid: q.id,
        subject: q.subject,
        topic: q.topic,
        chosen,
        cause: correct ? "time" : guessCause(q, chosen, timeMs),
        note: "",
        slow,
        wrongCount: 0,
        rightStreak: 0,
        interval: 1,
        due: now + DAY,
        firstAt: now,
        lastAt: now,
        resolved: false,
      };
      if (!correct) {
        m.wrongCount += 1;
        m.rightStreak = 0;
        m.chosen = chosen;
        m.interval = 1;
        m.due = now + DAY;
        m.resolved = false;
      } else {
        m.slow = true;
      }
      m.lastAt = now;
      await db.mistakes.put(m);
    } else if (existing) {
      existing.rightStreak += 1;
      existing.interval = nextMistakeInterval(existing.rightStreak);
      existing.due = now + existing.interval * DAY;
      existing.lastAt = now;
      if (existing.rightStreak >= 3) existing.resolved = true;
      await db.mistakes.put(existing);
    }

    // daily log
    const key = todayKey();
    const d = (await db.days.get(key)) ?? { date: key, answered: 0, correct: 0, ms: 0, tasksDone: [] };
    if (chosen !== null) {
      d.answered += 1;
      d.correct += correct ? 1 : 0;
      d.ms += timeMs;
    }
    await db.days.put(d);
  });
  return { correct, slow };
}

export async function markTask(task: string) {
  const key = todayKey();
  const d = (await db.days.get(key)) ?? { date: key, answered: 0, correct: 0, ms: 0, tasksDone: [] };
  if (!d.tasksDone.includes(task)) d.tasksDone.push(task);
  await db.days.put(d);
}

export async function getRatings(): Promise<Record<string, SkillRating>> {
  const rows = await db.skills.toArray();
  return Object.fromEntries(rows.map((r) => [r.topic, r]));
}

/** Pick questions pitched just above the student's level, weighted toward weak topics. */
export async function adaptiveSet(opts: { subject?: Subject; topic?: string; count: number; seed?: number; avoidRecent?: boolean }): Promise<Question[]> {
  // If the browser database is slow or blocked, fall back to an unadapted set rather than hang.
  const ratings = await withTimeout(getRatings(), 3000, {} as Record<string, SkillRating>);
  const recent = new Set(
    opts.avoidRecent === false ? [] : (await withTimeout(db.attempts.where("at").above(Date.now() - 2 * DAY).toArray(), 3000, [] as Attempt[])).map((a) => a.qid),
  );
  const r = mulberry32(opts.seed ?? Date.now());
  const topics = TOPICS.filter((t) => (!opts.subject || t.subject === opts.subject) && (!opts.topic || t.id === opts.topic));

  const pool: Question[] = allQuestions().filter((q) => topics.some((t) => t.id === q.topic) && q.topic !== "rc");
  // Add generated questions to topics that have generators (gives unlimited fresh practice)
  for (const t of topics) pool.push(...generatedFor(t.id, 3, Math.floor(r() * 1e9)));

  const scored = pool
    .filter((q) => !recent.has(q.id))
    .map((q) => {
      const rating = ratings[q.topic]?.rating ?? 2.5;
      const target = rating + 0.6; // stretch zone
      const fit = Math.exp(-((q.difficulty - target) ** 2) / 1.2);
      const weakness = 1 + Math.max(0, 3.5 - rating) * 0.5;
      const relevance = TOPIC_BY_ID[q.topic]?.weight ?? 1;
      return { q, s: fit * weakness * (0.6 + relevance * 0.2) * (0.6 + r() * 0.8) };
    })
    .sort((a, b) => b.s - a.s);

  // ensure variety: at most ceil(count/3) from the same topic
  const out: Question[] = [];
  const perTopic: Record<string, number> = {};
  const cap = opts.topic ? opts.count : Math.max(2, Math.ceil(opts.count / 3));
  for (const { q } of scored) {
    if (out.length >= opts.count) break;
    if ((perTopic[q.topic] ?? 0) >= cap) continue;
    perTopic[q.topic] = (perTopic[q.topic] ?? 0) + 1;
    out.push(q);
  }
  // fall back to recent questions if the bank is exhausted
  if (out.length < opts.count) {
    for (const q of shuffle(r, pool)) {
      if (out.length >= opts.count) break;
      if (!out.includes(q)) out.push(q);
    }
  }
  return out;
}

/** Diagnostic: spread across subjects and difficulties 2–5. */
export function diagnosticSet(): Question[] {
  const r = mulberry32(42);
  const qs = allQuestions().filter((q) => q.source === "original" && q.topic !== "rc");
  const pickBy = (subject: Subject, n: number) => {
    const subset = shuffle(r, qs.filter((q) => q.subject === subject && q.difficulty >= 2 && q.difficulty <= 5));
    const seen = new Set<string>();
    const out: Question[] = [];
    for (const q of subset) {
      if (out.length >= n) break;
      if (seen.has(q.topic)) continue;
      seen.add(q.topic);
      out.push(q);
    }
    return out;
  };
  return [...pickBy("english", 10), ...pickBy("quant", 10), ...pickBy("analytical", 8)];
}

export async function dueMistakes(limit = 30) {
  const now = Date.now();
  const rows = await db.mistakes.where("due").belowOrEqual(now).toArray();
  return rows.filter((m) => !m.resolved).sort((a, b) => a.due - b.due).slice(0, limit);
}

export async function mistakeQuestions(limit = 20): Promise<Question[]> {
  const due = await dueMistakes(limit);
  return due.map((m) => getQuestion(m.qid)).filter(Boolean) as Question[];
}

export interface Readiness {
  score: number; // 0..100
  bySubject: Record<Subject, { accuracy: number; rating: number; answered: number }>;
  weakest: { topic: string; rating: number }[];
  strongest: { topic: string; rating: number }[];
}

export async function readiness(): Promise<Readiness> {
  const ratings = await getRatings();
  const attempts = await db.attempts.toArray();
  const subjects: Subject[] = ["english", "quant", "analytical"];
  const bySubject = {} as Readiness["bySubject"];
  for (const s of subjects) {
    const a = attempts.filter((x) => x.subject === s && !x.skipped);
    const topicRatings = TOPICS.filter((t) => t.subject === s).map((t) => ratings[t.id]?.rating ?? 1.5);
    bySubject[s] = {
      accuracy: a.length ? a.filter((x) => x.correct).length / a.length : 0,
      rating: topicRatings.reduce((x, y) => x + y, 0) / topicRatings.length,
      answered: a.length,
    };
  }
  // Readiness: weighted topic ratings scaled so rating 4 (difficult) across the board ≈ 85.
  const weighted = TOPICS.map((t) => ({ w: t.weight, r: ratings[t.id]?.rating ?? 1.5 }));
  const avg = weighted.reduce((s, x) => s + x.w * x.r, 0) / weighted.reduce((s, x) => s + x.w, 0);
  const coverage = Math.min(1, attempts.length / 400);
  const score = Math.round(Math.max(0, Math.min(100, ((avg - 1) / 3.5) * 100 * (0.5 + 0.5 * coverage))));
  const rated = Object.values(ratings).filter((r) => r.attempts >= 3).sort((a, b) => a.rating - b.rating);
  return {
    score,
    bySubject,
    weakest: rated.slice(0, 5).map((r) => ({ topic: r.topic, rating: r.rating })),
    strongest: rated.slice(-5).reverse().map((r) => ({ topic: r.topic, rating: r.rating })),
  };
}
