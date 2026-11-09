import { mulberry32, pick, randInt, gcd, lcm, type RNG } from "./rng";

/** Speed Gym drills: short typed-answer arithmetic. Every answer is computed. */
export interface DrillItem {
  prompt: string;
  answer: number;
  /** absolute tolerance accepted (approximation drills use a relative one) */
  tol: number;
  hint: string;
}

export interface DrillKind {
  id: string;
  label: string;
  desc: string;
  targetSec: number; // per question
  count: number;
  make: (r: RNG, level: number) => DrillItem;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

const FRACTIONS: [number, number][] = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [1, 6], [5, 6], [1, 8], [3, 8], [5, 8], [7, 8], [1, 9], [1, 11], [1, 12], [1, 16], [3, 16], [1, 7], [2, 7]];

export const DRILLS: DrillKind[] = [
  {
    id: "percent",
    label: "Percentages",
    desc: "x% of y, the way the exam asks it.",
    targetSec: 20,
    count: 10,
    make: (r, L) => {
      const pcts = L <= 1 ? [10, 20, 25, 50] : L === 2 ? [5, 15, 30, 40, 75] : L === 3 ? [12.5, 35, 45, 60, 37.5] : [17.5, 62.5, 87.5, 22.5, 135, 7.5];
      const p = pick(r, pcts);
      const base = L <= 2 ? 20 : 40;
      const y = base * randInt(r, 2, L <= 2 ? 30 : 60);
      return { prompt: `${p}% of ${y}`, answer: r2((p * y) / 100), tol: 0.01, hint: `${p}% = ${p}/100. Split it: e.g. 17.5% = 10% + 5% + 2.5%.` };
    },
  },
  {
    id: "multiply",
    label: "Multiplication",
    desc: "Two-digit products, squares, ×11, ×25.",
    targetSec: 30,
    count: 10,
    make: (r, L) => {
      if (L <= 1) { const a = randInt(r, 12, 99), b = randInt(r, 3, 9); return { prompt: `${a} × ${b}`, answer: a * b, tol: 0, hint: `Split ${a} into tens and units: ${Math.floor(a / 10) * 10}×${b} + ${a % 10}×${b}.` }; }
      if (L === 2) { const a = randInt(r, 11, 29), b = randInt(r, 11, 29); return { prompt: `${a} × ${b}`, answer: a * b, tol: 0, hint: "Teens: (a + units of b) × 10 + units × units works for two teens; otherwise split one factor." }; }
      if (L === 3) {
        const k = randInt(r, 0, 2);
        if (k === 0) { const a = randInt(r, 21, 99); return { prompt: `${a}²`, answer: a * a, tol: 0, hint: `(a+b)² = a² + 2ab + b² with a = ${Math.floor(a / 10) * 10}.` }; }
        if (k === 1) { const a = randInt(r, 12, 98); return { prompt: `${a} × 11`, answer: a * 11, tol: 0, hint: "Write the digits apart and put their sum in the middle (carry if ≥ 10)." }; }
        const a = randInt(r, 12, 98); return { prompt: `${a} × 25`, answer: a * 25, tol: 0, hint: "×25 = ×100 ÷ 4." };
      }
      const a = randInt(r, L >= 5 ? 101 : 31, L >= 5 ? 499 : 99), b = randInt(r, 13, 99);
      return { prompt: `${a} × ${b}`, answer: a * b, tol: 0, hint: "Round one factor to a friendly number and correct: e.g. 48 × 37 = 50 × 37 − 2 × 37." };
    },
  },
  {
    id: "fractions",
    label: "Fractions ↔ percent",
    desc: "The fraction table, both directions, and fraction-of.",
    targetSec: 15,
    count: 10,
    make: (r, L) => {
      const [n, d] = pick(r, L <= 1 ? FRACTIONS.slice(0, 9) : FRACTIONS);
      const k = randInt(r, 0, L <= 2 ? 1 : 2);
      if (k === 0) return { prompt: `${n}/${d} as a percent (2 dp)`, answer: r2((n / d) * 100), tol: 0.011, hint: `Learn the table: 1/8 = 12.5%, 1/7 ≈ 14.29%, 1/9 ≈ 11.11%, 1/11 ≈ 9.09%.` };
      if (k === 1) { const m = d * randInt(r, 3, L <= 2 ? 20 : 60); return { prompt: `${n}/${d} of ${m}`, answer: (n * m) / d, tol: 0, hint: `Divide by ${d} first, then multiply by ${n}.` }; }
      const [a, b] = pick(r, FRACTIONS), [c, e] = pick(r, FRACTIONS);
      return { prompt: `${a}/${b} + ${c}/${e} as a decimal (2 dp)`, answer: r2(a / b + c / e), tol: 0.011, hint: `Common denominator ${lcm(b, e)}.` };
    },
  },
  {
    id: "mental",
    label: "Mental arithmetic",
    desc: "Add, subtract and divide without paper.",
    targetSec: 15,
    count: 12,
    make: (r, L) => {
      const k = randInt(r, 0, 2);
      if (k === 0) { const a = randInt(r, 10 ** L, 10 ** (L + 1) - 1), b = randInt(r, 10 ** L, 10 ** (L + 1) - 1); return { prompt: `${a} + ${b}`, answer: a + b, tol: 0, hint: "Add from the left: big parts first, then adjust." }; }
      if (k === 1) { const a = randInt(r, 100 * L, 1000 * L), b = randInt(r, 10 * L, a - 1); return { prompt: `${a} − ${b}`, answer: a - b, tol: 0, hint: "Count up from the smaller number to the larger." }; }
      const b = randInt(r, 3, 6 + L * 3), q = randInt(r, 6, 10 + L * 15);
      return { prompt: `${b * q} ÷ ${b}`, answer: q, tol: 0, hint: "Split the dividend into easy multiples of the divisor." };
    },
  },
  {
    id: "approx",
    label: "Approximation",
    desc: "Estimate within 5% — the skill that eliminates options.",
    targetSec: 20,
    count: 10,
    make: (r, L) => {
      const a = randInt(r, 100, 999) + (L >= 3 ? randInt(r, 1, 99) / 100 : 0), b = randInt(r, 11, L >= 3 ? 99 : 40) + (L >= 4 ? randInt(r, 1, 9) / 10 : 0);
      const k = randInt(r, 0, 1);
      const exact = k === 0 ? a * b : a / b;
      return { prompt: `≈ ${a} ${k === 0 ? "×" : "÷"} ${b}  (within 5%)`, answer: exact, tol: Math.abs(exact) * 0.05, hint: "Round both to one or two significant figures, compute, then nudge in the direction of the rounding." };
    },
  },
  {
    id: "numprops",
    label: "Number properties",
    desc: "Remainders, unit digits, LCM / HCF.",
    targetSec: 25,
    count: 10,
    make: (r, L) => {
      const k = randInt(r, 0, 3);
      if (k === 0) { const n = randInt(r, 1000, 10 ** (3 + L)), d = pick(r, [3, 9, 11, 4, 8, 5]); return { prompt: `Remainder of ${n} ÷ ${d}`, answer: n % d, tol: 0, hint: d === 3 || d === 9 ? "Digit sum." : d === 11 ? "Alternating digit sum." : d === 4 ? "Last two digits." : d === 8 ? "Last three digits." : "Last digit." }; }
      if (k === 1) { const b = randInt(r, 2, 9), e = randInt(r, 10, 99 * L); const cyc = [1, 2, 3, 4].map((k) => (b ** k) % 10); const ud = cyc[(e - 1) % 4]; return { prompt: `Unit digit of ${b}^${e}`, answer: ud, tol: 0, hint: "Unit digits cycle with period 1, 2 or 4: use the exponent mod 4 (0 → 4)." }; }
      const a = randInt(r, 2, 12) * randInt(r, 2, 6 + L), b = randInt(r, 2, 12) * randInt(r, 2, 6 + L);
      if (k === 2) return { prompt: `HCF of ${a} and ${b}`, answer: gcd(a, b), tol: 0, hint: "Euclid: HCF(a, b) = HCF(b, a mod b)." };
      return { prompt: `LCM of ${a} and ${b}`, answer: lcm(a, b), tol: 0, hint: "LCM = a × b ÷ HCF." };
    },
  },
];

export const DRILL_BY_ID = Object.fromEntries(DRILLS.map((d) => [d.id, d]));

/** Mixed sprint: one question from each kind in rotation. */
export const SPRINT: DrillKind = {
  id: "sprint",
  label: "Mixed sprint",
  desc: "All drill types mixed, 15 questions.",
  targetSec: 20,
  count: 15,
  make: (r, L) => pick(r, DRILLS).make(r, L),
};

export function buildDrill(kind: DrillKind, level: number, seed = Date.now()): DrillItem[] {
  const r = mulberry32(seed);
  return Array.from({ length: kind.count }, () => kind.make(r, level));
}

export function isRight(item: DrillItem, input: string): boolean {
  const v = Number(input.replace(/,/g, "").trim());
  if (!input.trim() || !Number.isFinite(v)) return false;
  return Math.abs(v - item.answer) <= item.tol + 1e-9;
}

/** Level rule: ≥ 80% correct at or under target pace → up; < 50% → down. */
export function nextLevel(level: number, accuracy: number, avgMs: number, targetSec: number) {
  if (accuracy >= 0.8 && avgMs <= targetSec * 1000) return Math.min(5, level + 1);
  if (accuracy < 0.5) return Math.max(1, level - 1);
  return level;
}
