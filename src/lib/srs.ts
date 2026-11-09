import type { VocabCard } from "./db";

export const DAY = 86_400_000;

/**
 * SM-2 scheduling (Wozniak, 1987) with two practical changes:
 *  - a lapse resets the interval to 10 minutes-ish (due "now + 0.007 days") so a forgotten
 *    word returns in the same session, then 1 day;
 *  - status labels the student can understand.
 * quality: 0-5 (0-2 = forgot, 3 = hard, 4 = good, 5 = easy)
 */
export function sm2(card: VocabCard, quality: number, now = Date.now()): VocabCard {
  const c = { ...card };
  c.seen += 1;
  c.lastAt = now;
  if (quality >= 3) c.correct += 1;

  if (quality < 3) {
    c.reps = 0;
    c.lapses += 1;
    c.interval = 0;
    c.due = now + 10 * 60_000; // back in ~10 minutes
  } else {
    c.reps += 1;
    if (c.reps === 1) c.interval = 1;
    else if (c.reps === 2) c.interval = c.lapses > 2 ? 3 : 6;
    else c.interval = Math.round(c.interval * c.ease);
    c.due = now + c.interval * DAY;
  }
  c.ease = Math.max(1.3, c.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  c.status = vocabStatus(c);
  return c;
}

export function vocabStatus(c: VocabCard): VocabCard["status"] {
  if (c.seen === 0) return "new";
  if (c.lapses >= 3 && c.reps < 3) return "revise";
  if (c.interval >= 21) return "mastered";
  if (c.interval >= 6) return "familiar";
  return "learning";
}

export function newCard(word: string): VocabCard {
  return { word, status: "new", ease: 2.5, interval: 0, reps: 0, lapses: 0, due: 0, lastAt: 0, seen: 0, correct: 0 };
}

/** Mistake revision intervals in days: wrong again -> 1 day; right -> grow. */
export function nextMistakeInterval(rightStreak: number) {
  const ladder = [1, 3, 7, 14, 30];
  return ladder[Math.min(rightStreak, ladder.length - 1)];
}
