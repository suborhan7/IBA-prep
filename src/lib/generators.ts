import type { Difficulty, Question, Shortcut } from "./types";
import { fmt, gcd, lcm, mulberry32, pick, randInt, shuffle, type RNG } from "./rng";

/**
 * Algorithmic quant question generators. Every answer is computed from the
 * parameters, so a generated question can never carry a wrong key.
 * Each question id is "gen:<template>:<seed>" so the same question can be rebuilt
 * later (for the mistake notebook) without storing it.
 */

interface Spec {
  topic: string;
  difficulty: Difficulty;
  stem: string;
  correct: number;
  distractors: number[];
  unit?: (n: number) => string;
  explanation: string;
  fastest: string;
  mental?: string;
  shortcut?: Shortcut;
  traps: string[];
  timeSec: number;
  objective: string;
}

function build(id: string, r: RNG, s: Spec): Question {
  const show = s.unit ?? ((n: number) => fmt(n));
  const seen = new Set<string>();
  const vals: number[] = [];
  const add = (n: number) => {
    if (!Number.isFinite(n)) return;
    const k = show(n);
    if (seen.has(k)) return;
    seen.add(k);
    vals.push(n);
  };
  add(s.correct);
  for (const d of s.distractors) if (vals.length < 4) add(d);
  let step = 1;
  while (vals.length < 4) {
    const base = Math.abs(s.correct) || 1;
    const delta = Number.isInteger(s.correct) ? Math.max(1, Math.round(base * 0.1)) * step : base * 0.1 * step;
    add(s.correct + (r() < 0.5 ? delta : -delta));
    step++;
    if (step > 40) break;
  }
  const order = shuffle(r, vals);
  return {
    id,
    subject: "quant",
    topic: s.topic,
    difficulty: s.difficulty,
    stem: s.stem,
    options: order.map(show),
    answer: order.indexOf(s.correct),
    explanation: s.explanation,
    fastest: s.fastest,
    mental: s.mental,
    shortcut: s.shortcut,
    traps: s.traps,
    timeSec: s.timeSec,
    source: "algorithmic",
    objective: s.objective,
  };
}

const pct = (n: number) => `${fmt(n)}%`;
const tk = (n: number) => `Tk ${fmt(n)}`;

type Gen = (seed: number) => Question;

export const GENERATORS: Record<string, { topic: string; label: string; gen: Gen }> = {
  successive: {
    topic: "percent",
    label: "Successive percentage change",
    gen: (seed) => {
      const r = mulberry32(seed);
      const a = pick(r, [10, 15, 20, 25, 30, 40, 50]);
      const b = pick(r, [10, 12, 15, 20, 25, 30]);
      const net = a - b - (a * b) / 100;
      return build(`gen:successive:${seed}`, r, {
        topic: "percent",
        difficulty: 3,
        stem: `The price of a product is raised by ${a}% and the new price is then reduced by ${b}%. What is the net percentage change in the original price? (negative = decrease)`,
        correct: net,
        distractors: [a - b, -(a * b) / 100, a - b + (a * b) / 100],
        unit: pct,
        explanation: `Let the price be 100. After +${a}%: ${100 + a}. After −${b}%: ${100 + a} × ${(100 - b) / 100} = ${fmt((100 + a) * (1 - b / 100))}. Net change = ${fmt(net)}%.`,
        fastest: `Use the successive-change formula: x + y + xy/100 with x = ${a}, y = −${b}: ${a} − ${b} − ${a}×${b}/100 = ${fmt(net)}%.`,
        mental: `Start from 100: +${a} gives ${100 + a}; ${b}% of ${100 + a} is ${fmt(((100 + a) * b) / 100)}; subtract.`,
        shortcut: {
          trick: "Net % = x + y + xy/100 (use negative y for a decrease).",
          why: "(1 + x/100)(1 + y/100) = 1 + (x + y)/100 + xy/10000; the last term is xy/100 in percent.",
          whenNot: "Do not add percentages that apply to different bases unless you include the xy/100 term.",
        },
        traps: [`Answering ${a - b}% by simply subtracting.`, "Forgetting that the second change applies to the new, larger price."],
        timeSec: 40,
        objective: "Combine successive percentage changes in one step.",
      });
    },
  },
  markup: {
    topic: "profit-loss",
    label: "Mark-up then discount",
    gen: (seed) => {
      const r = mulberry32(seed);
      const m = pick(r, [20, 25, 30, 40, 50, 60]);
      const d = pick(r, [10, 15, 20, 25]);
      const p = ((1 + m / 100) * (1 - d / 100) - 1) * 100;
      return build(`gen:markup:${seed}`, r, {
        topic: "profit-loss",
        difficulty: 3,
        stem: `A shopkeeper marks goods ${m}% above cost price and then allows a discount of ${d}% on the marked price. What is the profit percentage?`,
        correct: p,
        distractors: [m - d, m - d - 2, p + d / 2],
        unit: pct,
        explanation: `Take CP = 100. MP = ${100 + m}. Discount ${d}% of ${100 + m} = ${fmt(((100 + m) * d) / 100)}. SP = ${fmt((100 + m) * (1 - d / 100))}. Profit = ${fmt(p)}%.`,
        fastest: `Successive change: ${m} − ${d} − ${m}×${d}/100 = ${fmt(p)}%.`,
        shortcut: {
          trick: "Mark-up m% then discount d% → profit = m − d − md/100.",
          why: "It is just two successive percentage changes applied to the cost price.",
          whenNot: "If the discount is a fixed taka amount rather than a percentage, compute SP directly.",
        },
        traps: [`Answering ${m - d}% (ignores that the discount is on a larger base).`],
        timeSec: 40,
        objective: "Treat mark-up and discount as successive percentage changes.",
      });
    },
  },
  ratio3: {
    topic: "ratio",
    label: "Combine two ratios",
    gen: (seed) => {
      const r = mulberry32(seed);
      const a = randInt(r, 2, 7), b = randInt(r, 2, 7), c = randInt(r, 2, 7), d = randInt(r, 2, 9);
      const A = a * c, B = b * c, C = b * d;
      const g = gcd(gcd(A, B), C);
      const total = (A + B + C) / g;
      const mult = pick(r, [10, 20, 30, 50, 100]);
      const sum = total * mult;
      const ansA = (A / g) * mult;
      return build(`gen:ratio3:${seed}`, r, {
        topic: "ratio",
        difficulty: 3,
        stem: `A : B = ${a} : ${b} and B : C = ${c} : ${d}. If A + B + C = ${sum}, what is A?`,
        correct: ansA,
        distractors: [(a / (a + b + d)) * sum, (B / g) * mult, (C / g) * mult],
        explanation: `Make B equal in both ratios: A:B = ${a * c}:${b * c}, B:C = ${b * c}:${b * d}. So A:B:C = ${A / g}:${B / g}:${C / g} (sum ${total} parts). One part = ${sum}/${total} = ${mult}. A = ${A / g} × ${mult} = ${ansA}.`,
        fastest: `A:B:C = a·c : b·c : b·d = ${A}:${B}:${C} → simplify to ${A / g}:${B / g}:${C / g}; A = ${A / g}/${total} of ${sum}.`,
        shortcut: {
          trick: "A:B:C = (a×c) : (b×c) : (b×d).",
          why: "Multiplying the first ratio by c and the second by b makes both B terms equal to b×c.",
          whenNot: "Only works when the shared term (B) is the second term of the first ratio and the first term of the second.",
        },
        traps: ["Adding a + b + d directly without matching B."],
        timeSec: 50,
        objective: "Chain ratios through a common term.",
      });
    },
  },
  avgremove: {
    topic: "average",
    label: "Average after removing a number",
    gen: (seed) => {
      const r = mulberry32(seed);
      const n = randInt(r, 6, 15);
      const A = randInt(r, 20, 60);
      const B = A + pick(r, [-3, -2, -1, 1, 2, 3]);
      const removed = n * A - (n - 1) * B;
      return build(`gen:avgremove:${seed}`, r, {
        topic: "average",
        difficulty: 2,
        stem: `The average of ${n} numbers is ${A}. When one number is removed, the average of the remaining numbers becomes ${B}. What number was removed?`,
        correct: removed,
        distractors: [A + (B - A), A - (B - A) * n, A + (A - B) * (n + 1)],
        explanation: `Total of ${n} numbers = ${n} × ${A} = ${n * A}. Total of ${n - 1} numbers = ${n - 1} × ${B} = ${(n - 1) * B}. Removed = ${n * A} − ${(n - 1) * B} = ${removed}.`,
        fastest: `Removed = A + (n − 1)(A − B) = ${A} + ${n - 1}×(${A - B}) = ${removed}.`,
        shortcut: {
          trick: "Removed value = old average + (remaining count) × (old avg − new avg).",
          why: "The removed number equals the old average plus whatever it took away from (or gave to) each of the others.",
          whenNot: "If more than one number is removed, work with totals instead.",
        },
        traps: ["Using n instead of n − 1 for the new total."],
        timeSec: 35,
        objective: "Work with totals, not averages, when the count changes.",
      });
    },
  },
  work2: {
    topic: "work",
    label: "Two workers together",
    gen: (seed) => {
      const r = mulberry32(seed);
      const pairs = [[10, 15], [12, 24], [20, 30], [6, 12], [8, 24], [15, 30], [18, 36], [12, 36], [10, 40], [20, 60], [21, 28], [14, 35]];
      const [a, b] = pick(r, pairs);
      const t = (a * b) / (a + b);
      return build(`gen:work2:${seed}`, r, {
        topic: "work",
        difficulty: 2,
        stem: `A can finish a job in ${a} days and B can finish it in ${b} days. Working together, how many days will they take?`,
        correct: t,
        distractors: [(a + b) / 2, Math.abs(b - a), (a * b) / (b - a)],
        unit: (n) => `${fmt(n)} days`,
        explanation: `A does 1/${a} per day, B does 1/${b}. Together: 1/${a} + 1/${b} = ${a + b}/${a * b}. Time = ${a * b}/${a + b} = ${fmt(t)} days.`,
        fastest: `Product over sum: ${a}×${b}/(${a}+${b}) = ${fmt(t)}. Or LCM method: job = ${lcm(a, b)} units, A = ${lcm(a, b) / a}/day, B = ${lcm(a, b) / b}/day → ${lcm(a, b)}/${lcm(a, b) / a + lcm(a, b) / b}.`,
        shortcut: {
          trick: "Two workers: T = ab/(a + b). For more workers use the LCM-units method.",
          why: "Rates add: 1/T = 1/a + 1/b.",
          whenNot: "Product/sum only applies to exactly two workers working the whole time.",
        },
        traps: ["Averaging the two times.", "Adding the times instead of the rates."],
        timeSec: 30,
        objective: "Add rates, not times.",
      });
    },
  },
  pipes: {
    topic: "work",
    label: "Fill pipe and leak",
    gen: (seed) => {
      const r = mulberry32(seed);
      const pairs = [[6, 12], [10, 15], [12, 20], [8, 24], [9, 18], [15, 20], [20, 30], [4, 12]];
      const [f, e] = pick(r, pairs);
      const t = (f * e) / (e - f);
      return build(`gen:pipes:${seed}`, r, {
        topic: "work",
        difficulty: 3,
        stem: `Pipe A fills a tank in ${f} hours. A leak at the bottom can empty the full tank in ${e} hours. If both are open, how long does it take to fill the empty tank?`,
        correct: t,
        distractors: [(f * e) / (f + e), e - f, (f + e) / 2],
        unit: (n) => `${fmt(n)} hours`,
        explanation: `Net rate = 1/${f} − 1/${e} = ${e - f}/${f * e}. Time = ${f * e}/${e - f} = ${fmt(t)} hours.`,
        fastest: `Product over difference: ${f}×${e}/(${e}−${f}) = ${fmt(t)}.`,
        shortcut: {
          trick: "Fill + leak: T = fe/(e − f).",
          why: "The leak's rate is subtracted: 1/T = 1/f − 1/e.",
          whenNot: "If the leak empties faster than the pipe fills (e < f), the tank never fills.",
        },
        traps: ["Using product over sum (treats the leak as a second filler)."],
        timeSec: 35,
        objective: "Treat emptying as negative work.",
      });
    },
  },
  avgspeed: {
    topic: "tsd",
    label: "Average speed for equal distances",
    gen: (seed) => {
      const r = mulberry32(seed);
      const pairs = [[40, 60], [30, 60], [60, 90], [20, 30], [36, 45], [40, 50], [30, 70], [45, 75]];
      const [x, y] = pick(r, pairs);
      const v = (2 * x * y) / (x + y);
      return build(`gen:avgspeed:${seed}`, r, {
        topic: "tsd",
        difficulty: 3,
        stem: `A car travels from Dhaka to Cumilla at ${x} km/h and returns along the same road at ${y} km/h. What is its average speed for the round trip?`,
        correct: v,
        distractors: [(x + y) / 2, Math.sqrt(x * y), (x + y) / 2 + 2],
        unit: (n) => `${fmt(n)} km/h`,
        explanation: `Let distance = d. Time = d/${x} + d/${y}. Average speed = 2d ÷ (d/${x} + d/${y}) = 2×${x}×${y}/(${x}+${y}) = ${fmt(v)} km/h.`,
        fastest: `Harmonic mean: 2xy/(x + y) = ${2 * x * y}/${x + y} = ${fmt(v)}.`,
        shortcut: {
          trick: "Equal distances at speeds x and y → average speed = 2xy/(x + y).",
          why: "Average speed is total distance ÷ total time; equal distances make it the harmonic mean.",
          whenNot: "If equal TIMES (not distances) are spent at each speed, the average is the simple mean (x + y)/2.",
        },
        traps: [`Answering ${fmt((x + y) / 2)} (the simple average).`],
        timeSec: 30,
        objective: "Recognise when average speed is a harmonic mean.",
      });
    },
  },
  trains: {
    topic: "boats-trains",
    label: "Trains crossing",
    gen: (seed) => {
      const r = mulberry32(seed);
      const s1 = pick(r, [36, 54, 72, 45, 90]);
      const s2 = pick(r, [18, 36, 54, 27]);
      const l1 = pick(r, [100, 120, 150, 180, 200]);
      const l2 = pick(r, [80, 100, 120, 150]);
      const opposite = r() < 0.5;
      if (!opposite && s1 === s2) return GENERATORS.trains.gen(seed + 1);
      const rel = opposite ? s1 + s2 : Math.abs(s1 - s2);
      const relMs = (rel * 5) / 18;
      const t = (l1 + l2) / relMs;
      return build(`gen:trains:${seed}`, r, {
        topic: "boats-trains",
        difficulty: 4,
        stem: `Two trains of length ${l1} m and ${l2} m run on parallel tracks at ${s1} km/h and ${s2} km/h in ${opposite ? "opposite directions" : "the same direction"}. How many seconds do they take to cross each other completely?`,
        correct: t,
        distractors: [(l1 + l2) / (((opposite ? Math.abs(s1 - s2) : s1 + s2) * 5) / 18), (l1 + l2) / rel, l1 / relMs],
        unit: (n) => `${fmt(n)} s`,
        explanation: `Relative speed = ${opposite ? `${s1} + ${s2}` : `${Math.max(s1, s2)} − ${Math.min(s1, s2)}`} = ${rel} km/h = ${rel} × 5/18 = ${fmt(relMs)} m/s. Distance = sum of lengths = ${l1 + l2} m. Time = ${l1 + l2}/${fmt(relMs)} = ${fmt(t)} s.`,
        fastest: `(L1 + L2) ÷ (relative speed × 5/18) = ${l1 + l2} × 18 / (${rel} × 5).`,
        mental: `Multiply km/h by 5/18 to get m/s: 18 km/h = 5 m/s, so 36 = 10, 54 = 15, 72 = 20, 90 = 25.`,
        shortcut: {
          trick: "Crossing each other: distance = L1 + L2; speed = sum (opposite) or difference (same direction).",
          why: "Fix one train; the other must move its own length plus the first train's length at the relative speed.",
          whenNot: "Crossing a pole or a person needs only the train's own length.",
        },
        traps: ["Forgetting to convert km/h to m/s.", "Using the wrong relative speed for the direction."],
        timeSec: 50,
        objective: "Use relative speed and total length.",
      });
    },
  },
  boats: {
    topic: "boats-trains",
    label: "Boat and stream",
    gen: (seed) => {
      const r = mulberry32(seed);
      const b = randInt(r, 8, 20);
      const s = randInt(r, 1, Math.min(6, b - 2));
      const t = pick(r, [2, 3, 4, 5]);
      const down = (b + s) * t;
      const up = (b - s) * t;
      return build(`gen:boats:${seed}`, r, {
        topic: "boats-trains",
        difficulty: 3,
        stem: `A boat goes ${down} km downstream in ${t} hours and ${up} km upstream in ${t} hours. What is the speed of the stream?`,
        correct: s,
        distractors: [b, (down - up) / t, (down + up) / (2 * t) - 1],
        unit: (n) => `${fmt(n)} km/h`,
        explanation: `Downstream speed = ${down}/${t} = ${b + s}. Upstream speed = ${up}/${t} = ${b - s}. Stream = (${b + s} − ${b - s})/2 = ${s} km/h.`,
        fastest: `Stream = (down speed − up speed)/2 = ${s}.`,
        shortcut: {
          trick: "Boat = (D + U)/2, stream = (D − U)/2 where D, U are speeds.",
          why: "D = b + s and U = b − s; add or subtract to isolate b or s.",
          whenNot: "Use speeds, not distances, unless the times are equal.",
        },
        traps: ["Forgetting to halve the difference."],
        timeSec: 35,
        objective: "Separate boat speed and stream speed.",
      });
    },
  },
  cisi: {
    topic: "interest",
    label: "CI − SI for 2 years",
    gen: (seed) => {
      const r = mulberry32(seed);
      const rate = pick(r, [5, 10, 4, 8, 12, 15, 20]);
      const P = pick(r, [5000, 8000, 10000, 12000, 20000, 25000]);
      const diff = P * (rate / 100) ** 2;
      return build(`gen:cisi:${seed}`, r, {
        topic: "interest",
        difficulty: 3,
        stem: `What is the difference between compound interest (compounded yearly) and simple interest on Tk ${fmt(P)} for 2 years at ${rate}% per annum?`,
        correct: diff,
        distractors: [diff * 2, (P * rate) / 100, diff / 2],
        unit: tk,
        explanation: `SI = ${fmt(P)} × ${rate} × 2/100 = ${fmt((P * rate * 2) / 100)}. CI = ${fmt(P)}(1.${String(rate).padStart(2, "0")})² − ${fmt(P)} = ${fmt(P * (1 + rate / 100) ** 2 - P)}. Difference = ${fmt(diff)}.`,
        fastest: `For 2 years: CI − SI = P(r/100)² = ${fmt(P)} × (${rate}/100)² = ${fmt(diff)}.`,
        shortcut: {
          trick: "2-year CI − SI = P(r/100)². 3-year: P(r/100)²(3 + r/100).",
          why: "The only difference over two years is the interest earned on the first year's interest.",
          whenNot: "Not valid when compounding is half-yearly or rates differ by year.",
        },
        traps: ["Computing CI with simple interest each year."],
        timeSec: 30,
        objective: "Know the interest-on-interest difference directly.",
      });
    },
  },
  alligation: {
    topic: "mixture",
    label: "Alligation",
    gen: (seed) => {
      const r = mulberry32(seed);
      const c = pick(r, [40, 50, 60, 30]);
      const e = c + pick(r, [20, 30, 40, 50]);
      const m = randInt(r, c + 5, e - 5);
      const g = gcd(e - m, m - c);
      const a = (e - m) / g, b = (m - c) / g;
      return build(`gen:alligation:${seed}`, r, {
        topic: "mixture",
        difficulty: 3,
        stem: `In what ratio must rice costing Tk ${c}/kg be mixed with rice costing Tk ${e}/kg so that the mixture costs Tk ${m}/kg? (Give cheaper : dearer.)`,
        correct: a / b,
        distractors: [b / a, (m - c) / (e - c), (e - c) / (m - c)],
        unit: (n) => {
          // express as ratio string a:b — map known values
          if (Math.abs(n - a / b) < 1e-9) return `${a} : ${b}`;
          if (Math.abs(n - b / a) < 1e-9) return `${b} : ${a}`;
          const g2 = 1000;
          const num = Math.round(n * g2), gg = gcd(num, g2);
          return `${num / gg} : ${g2 / gg}`;
        },
        explanation: `Alligation cross: (dearer − mean) : (mean − cheaper) = (${e} − ${m}) : (${m} − ${c}) = ${e - m} : ${m - c} = ${a} : ${b}.`,
        fastest: `Write ${c} and ${e}, mean ${m} in the middle, subtract diagonally: ${e - m} : ${m - c}.`,
        shortcut: {
          trick: "Cheaper : Dearer = (D − M) : (M − C).",
          why: "Weighted average: the mean is closer to the ingredient with more weight.",
          whenNot: "Only for mixing two ingredients by quantity at a known mean price/concentration.",
        },
        traps: ["Reversing the ratio (the cheaper quantity gets the dearer difference)."],
        timeSec: 40,
        objective: "Use the alligation cross for two-part mixtures.",
      });
    },
  },
  unitdigit: {
    topic: "remainders",
    label: "Units digit of a power",
    gen: (seed) => {
      const r = mulberry32(seed);
      const base = pick(r, [2, 3, 7, 8, 13, 17, 22, 27, 33, 38, 43, 47, 57, 63, 77, 87]);
      const exp = randInt(r, 21, 199);
      const cyc: number[] = [];
      let x = base % 10;
      do {
        cyc.push(x);
        x = (x * (base % 10)) % 10;
      } while (x !== cyc[0]);
      const k = exp % cyc.length;
      const ans = cyc[(k === 0 ? cyc.length : k) - 1];
      return build(`gen:unitdigit:${seed}`, r, {
        topic: "remainders",
        difficulty: 3,
        stem: `What is the units digit of ${base}^${exp}?`,
        correct: ans,
        distractors: cyc.filter((d) => d !== ans).concat([1, 9, 5]),
        explanation: `Units digits of powers of ${base % 10} cycle as ${cyc.join(", ")} (cycle length ${cyc.length}). ${exp} ÷ ${cyc.length} leaves remainder ${k}${k === 0 ? ` → use the last term of the cycle` : ""}. Units digit = ${ans}.`,
        fastest: `Only the last digit (${base % 10}) matters. Cycle length ${cyc.length}; ${exp} mod ${cyc.length} = ${k}.`,
        shortcut: {
          trick: "Units digits of powers repeat with period 1, 2 or 4.",
          why: "Only the last digit affects the last digit of a product, and there are only 10 possible digits.",
          whenNot: "For remainders by numbers other than 10 the cycle differs; find it separately.",
        },
        traps: ["Using the whole base instead of its last digit.", "Treating remainder 0 as the first term of the cycle."],
        timeSec: 30,
        objective: "Use cyclicity for units digits.",
      });
    },
  },
  bells: {
    topic: "lcm-hcf",
    label: "LCM word problem",
    gen: (seed) => {
      const r = mulberry32(seed);
      const sets = [[12, 18, 30], [6, 8, 12], [15, 20, 25], [10, 12, 15], [9, 12, 15], [8, 10, 12], [16, 20, 24], [14, 21, 28]];
      const [a, b, c] = pick(r, sets);
      const L = lcm(lcm(a, b), c);
      return build(`gen:bells:${seed}`, r, {
        topic: "lcm-hcf",
        difficulty: 2,
        stem: `Three bells ring at intervals of ${a}, ${b} and ${c} minutes. They ring together at 9:00 am. After how many minutes will they next ring together?`,
        correct: L,
        distractors: [a * b * c, a + b + c, L / 2],
        unit: (n) => `${fmt(n)} min`,
        explanation: `They ring together after a common multiple of ${a}, ${b}, ${c}. The first one is the LCM = ${L} minutes.`,
        fastest: `LCM by prime factors: take the highest power of each prime.`,
        traps: ["Multiplying the intervals instead of finding the LCM."],
        timeSec: 30,
        objective: "Recognise 'together again' as an LCM problem.",
      });
    },
  },
  linear2: {
    topic: "linear",
    label: "Simultaneous equations word problem",
    gen: (seed) => {
      const r = mulberry32(seed);
      const pen = randInt(r, 8, 25), book = randInt(r, 30, 90);
      const p1 = randInt(r, 2, 6), b1 = randInt(r, 1, 4);
      let p2 = randInt(r, 2, 6), b2 = randInt(r, 1, 4);
      if (p1 * b2 === p2 * b1) { p2 = p1 + 1; b2 = b1; if (p1 * b2 === p2 * b1) b2 = b1 + 1; }
      const c1 = p1 * pen + b1 * book, c2 = p2 * pen + b2 * book;
      return build(`gen:linear2:${seed}`, r, {
        topic: "linear",
        difficulty: 3,
        stem: `${p1} pens and ${b1} notebook${b1 > 1 ? "s" : ""} cost Tk ${c1}. ${p2} pens and ${b2} notebook${b2 > 1 ? "s" : ""} cost Tk ${c2}. What is the price of one notebook?`,
        correct: book,
        distractors: [pen, book + pen, Math.round(c1 / (p1 + b1))],
        unit: tk,
        explanation: `Let pen = x, notebook = y. ${p1}x + ${b1}y = ${c1}; ${p2}x + ${b2}y = ${c2}. Eliminate x: multiply the first by ${p2} and the second by ${p1}: ${b1 * p2 - b2 * p1}y = ${c1 * p2 - c2 * p1} → y = ${book}.`,
        fastest: `Eliminate the variable you don't need. Or backsolve: try each option for y and check whether x comes out the same from both equations.`,
        traps: ["Solving for the pen price and picking it."],
        timeSec: 60,
        objective: "Eliminate efficiently; solve only for what is asked.",
      });
    },
  },
  quadroots: {
    topic: "quadratic",
    label: "Roots of a quadratic",
    gen: (seed) => {
      const r = mulberry32(seed);
      const p = randInt(r, -9, 9) || 2, q = randInt(r, -9, 9) || -3;
      const b = -(p + q), c = p * q;
      const ask = pick(r, ["sum of squares", "difference"]);
      const correct = ask === "sum of squares" ? p * p + q * q : Math.abs(p - q);
      const sign = (n: number) => (n >= 0 ? `+ ${n}` : `− ${-n}`);
      return build(`gen:quadroots:${seed}`, r, {
        topic: "quadratic",
        difficulty: 4,
        stem: `If α and β are the roots of x² ${sign(b)}x ${sign(c)} = 0, what is ${ask === "sum of squares" ? "α² + β²" : "|α − β|"}?`,
        correct,
        distractors: ask === "sum of squares" ? [b * b + 2 * c, (p + q) ** 2, Math.abs(c) * 2] : [Math.abs(p + q), Math.sqrt(Math.abs(b * b + 4 * c)), Math.abs(c)],
        explanation: `α + β = ${p + q}, αβ = ${c}. ${ask === "sum of squares" ? `α² + β² = (α + β)² − 2αβ = ${(p + q) ** 2} − (${2 * c}) = ${correct}.` : `(α − β)² = (α + β)² − 4αβ = ${(p + q) ** 2} − (${4 * c}) = ${(p - q) ** 2}, so |α − β| = ${correct}.`}`,
        fastest: `Use Vieta (sum = −b, product = c) — no need to find the roots. (Here the roots are ${p} and ${q}.)`,
        shortcut: {
          trick: "α² + β² = S² − 2P; (α − β)² = S² − 4P.",
          why: "Expand (α + β)² = α² + 2αβ + β².",
          whenNot: "When the leading coefficient a ≠ 1, use S = −b/a and P = c/a.",
        },
        traps: ["Sign error: sum of roots is −b, not b."],
        timeSec: 45,
        objective: "Use symmetric functions of roots.",
      });
    },
  },
  committee: {
    topic: "pnc",
    label: "Committee selection",
    gen: (seed) => {
      const r = mulberry32(seed);
      const men = randInt(r, 5, 8), women = randInt(r, 4, 6);
      const km = randInt(r, 2, 3), kw = randInt(r, 1, 2);
      const C = (n: number, k: number) => { let x = 1; for (let i = 0; i < k; i++) x = (x * (n - i)) / (i + 1); return Math.round(x); };
      const ans = C(men, km) * C(women, kw);
      return build(`gen:committee:${seed}`, r, {
        topic: "pnc",
        difficulty: 3,
        stem: `From ${men} men and ${women} women, in how many ways can a committee of ${km} men and ${kw} wom${kw > 1 ? "en" : "an"} be formed?`,
        correct: ans,
        distractors: [C(men, km) + C(women, kw), C(men + women, km + kw), ans * 2],
        explanation: `Choose men: C(${men},${km}) = ${C(men, km)}. Choose women: C(${women},${kw}) = ${C(women, kw)}. Independent choices multiply: ${ans}.`,
        fastest: `"AND" → multiply; "OR" → add. C(n,2) = n(n−1)/2, C(n,3) = n(n−1)(n−2)/6.`,
        traps: ["Adding the two counts.", "Choosing all members from the combined group (ignores the gender split)."],
        timeSec: 40,
        objective: "Multiply independent selections.",
      });
    },
  },
  dice: {
    topic: "probability",
    label: "Two dice",
    gen: (seed) => {
      const r = mulberry32(seed);
      const target = randInt(r, 3, 11);
      const kind = pick(r, ["equal", "atleast"]);
      let fav = 0;
      for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) if (kind === "equal" ? i + j === target : i + j >= target) fav++;
      const g = gcd(fav, 36);
      const show = (n: number) => {
        const num = Math.round(n * 36);
        const gg = gcd(num, 36);
        return `${num / gg}/${36 / gg}`;
      };
      return build(`gen:dice:${seed}`, r, {
        topic: "probability",
        difficulty: kind === "equal" ? 2 : 3,
        stem: `Two fair dice are thrown. What is the probability that the sum is ${kind === "equal" ? `exactly ${target}` : `at least ${target}`}?`,
        correct: fav / 36,
        distractors: [(fav + 1) / 36, (fav - 1) / 36, (36 - fav) / 36, (fav + 2) / 36].filter((x) => x > 0),
        unit: show,
        explanation: `There are 36 equally likely outcomes. Favourable outcomes = ${fav}. P = ${fav}/36 = ${fav / g}/${36 / g}.`,
        fastest: `Number of ways to get sum s with two dice = 6 − |s − 7|. ${kind === "atleast" ? "Add these for each sum in range." : ""}`,
        shortcut: {
          trick: "Ways(sum s) = 6 − |s − 7| for s = 2..12.",
          why: "The counts rise 1,2,3,4,5,6 up to 7 then fall symmetrically.",
          whenNot: "Only for two standard six-sided dice.",
        },
        traps: ["Using 11 possible sums as equally likely outcomes."],
        timeSec: 40,
        objective: "Count outcomes in the 6×6 grid quickly.",
      });
    },
  },
  areapct: {
    topic: "circles",
    label: "Percentage change in area",
    gen: (seed) => {
      const r = mulberry32(seed);
      const x = pick(r, [10, 20, 25, 30, 50, -10, -20]);
      const ch = ((1 + x / 100) ** 2 - 1) * 100;
      return build(`gen:areapct:${seed}`, r, {
        topic: "circles",
        difficulty: 3,
        stem: `If the radius of a circle ${x > 0 ? "increases" : "decreases"} by ${Math.abs(x)}%, by what percentage does its area change? (negative = decrease)`,
        correct: ch,
        distractors: [2 * x, x, ch + 5],
        unit: pct,
        explanation: `Area ∝ r². New area factor = (${1 + x / 100})² = ${fmt((1 + x / 100) ** 2, 4)}. Change = ${fmt(ch)}%.`,
        fastest: `Successive change x + x + x²/100 = ${2 * x} + ${fmt((x * x) / 100)} = ${fmt(ch)}%.`,
        shortcut: {
          trick: "A squared quantity changes by 2x + x²/100 percent.",
          why: "It is the same percentage change applied twice.",
          whenNot: "Volume (cubed) needs three successive changes.",
        },
        traps: [`Answering ${2 * x}% (forgets the x²/100 term).`],
        timeSec: 30,
        objective: "Link scale factor and area/volume change.",
      });
    },
  },
  pythag: {
    topic: "triangles",
    label: "Right triangle",
    gen: (seed) => {
      const r = mulberry32(seed);
      const [a, b, c] = pick(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]]);
      const k = randInt(r, 1, 4);
      const ask = pick(r, ["altitude", "area"]);
      const A = a * k, B = b * k, Cc = c * k;
      const correct = ask === "area" ? (A * B) / 2 : (A * B) / Cc;
      return build(`gen:pythag:${seed}`, r, {
        topic: "triangles",
        difficulty: ask === "altitude" ? 4 : 2,
        stem: `A right triangle has hypotenuse ${Cc} cm and one leg ${A} cm. What is ${ask === "area" ? "its area" : "the length of the altitude drawn to the hypotenuse"}?`,
        correct,
        distractors: ask === "area" ? [A * B, (A * Cc) / 2, (A + B)] : [B, (A + B) / 2, (A * Cc) / B],
        unit: (n) => `${fmt(n)}${ask === "area" ? " cm²" : " cm"}`,
        explanation: `Other leg = √(${Cc}² − ${A}²) = √${Cc * Cc - A * A} = ${B}. ${ask === "area" ? `Area = ½ × ${A} × ${B} = ${fmt(correct)}.` : `Area = ½ × ${A} × ${B} = ½ × ${Cc} × h → h = ${A}×${B}/${Cc} = ${fmt(correct)}.`}`,
        fastest: `Spot the triple ${a}-${b}-${c} scaled by ${k}. ${ask === "altitude" ? "Altitude to hypotenuse = (leg × leg)/hypotenuse." : ""}`,
        shortcut: {
          trick: "Memorise triples: 3-4-5, 5-12-13, 8-15-17, 7-24-25, 20-21-29, 9-40-41 (and multiples).",
          why: "They are integer solutions of a² + b² = c², so they appear constantly in tests.",
          whenNot: "Confirm the angle is a right angle before using a triple.",
        },
        traps: ["Using the hypotenuse as a leg."],
        timeSec: 40,
        objective: "Recognise Pythagorean triples instantly.",
      });
    },
  },
  sets2: {
    topic: "sets",
    label: "Two-set Venn",
    gen: (seed) => {
      const r = mulberry32(seed);
      const N = pick(r, [100, 120, 150, 200, 80]);
      const both = randInt(r, 5, 20);
      const a = both + randInt(r, 10, 40), b = both + randInt(r, 10, 40);
      const neither = N - (a + b - both);
      if (neither < 0) return GENERATORS.sets2.gen(seed + 7);
      return build(`gen:sets2:${seed}`, r, {
        topic: "sets",
        difficulty: 2,
        stem: `In a class of ${N} students, ${a} study Finance, ${b} study Marketing and ${both} study both. How many study neither?`,
        correct: neither,
        distractors: [N - a - b, N - a - b + 2 * both, neither + both],
        explanation: `Finance ∪ Marketing = ${a} + ${b} − ${both} = ${a + b - both}. Neither = ${N} − ${a + b - both} = ${neither}.`,
        fastest: `Total = A + B − Both + Neither.`,
        traps: ["Forgetting to subtract the overlap once."],
        timeSec: 30,
        objective: "Apply inclusion–exclusion.",
      });
    },
  },
  partnership: {
    topic: "partnership",
    label: "Partnership with time",
    gen: (seed) => {
      const r = mulberry32(seed);
      const ca = pick(r, [20000, 30000, 40000, 50000]);
      const cb = pick(r, [30000, 45000, 60000, 25000]);
      const mb = pick(r, [4, 6, 8, 9]);
      const wa = ca * 12, wb = cb * mb;
      const g = gcd(wa, wb);
      const unit = pick(r, [100, 200, 500, 1000]);
      const profit = ((wa + wb) / g) * unit;
      const ansB = (wb / g) * unit;
      return build(`gen:partnership:${seed}`, r, {
        topic: "partnership",
        difficulty: 3,
        stem: `A starts a business with Tk ${fmt(ca)}. After ${12 - mb} months, B joins with Tk ${fmt(cb)}. At the end of the year the profit is Tk ${fmt(profit)}. What is B's share?`,
        correct: ansB,
        distractors: [(cb / (ca + cb)) * profit, profit - ansB, (profit * mb) / 12],
        unit: tk,
        explanation: `Profit is shared in the ratio capital × time: A = ${fmt(ca)} × 12, B = ${fmt(cb)} × ${mb}. Ratio = ${wa / g} : ${wb / g}. B's share = ${wb / g}/${(wa + wb) / g} × ${fmt(profit)} = ${fmt(ansB)}.`,
        fastest: `Cancel common zeros first: ${ca / 1000}×12 : ${cb / 1000}×${mb}.`,
        traps: [`Using ${12 - mb} months for B (that is when B joined, not how long B stayed).`],
        timeSec: 50,
        objective: "Weight capital by time.",
      });
    },
  },
  ages: {
    topic: "ages",
    label: "Ages ratio",
    gen: (seed) => {
      const r = mulberry32(seed);
      const son = randInt(r, 6, 15);
      const k = randInt(r, 3, 5);
      const father = son * k;
      const n = randInt(r, 4, 12);
      const g = gcd(father + n, son + n);
      return build(`gen:ages:${seed}`, r, {
        topic: "ages",
        difficulty: 3,
        stem: `A father is ${k} times as old as his son. After ${n} years, the ratio of their ages will be ${(father + n) / g} : ${(son + n) / g}. What is the son's present age?`,
        correct: son,
        distractors: [son + n, father, son - 2],
        unit: (x) => `${fmt(x)} years`,
        explanation: `Let son = x, father = ${k}x. (${k}x + ${n})/(x + ${n}) = ${(father + n) / g}/${(son + n) / g}. Cross-multiply and solve: x = ${son}.`,
        fastest: `Backsolve: try each option for the son's age, multiply by ${k}, add ${n} to both, and check the ratio.`,
        traps: ["Giving the age after n years."],
        timeSec: 45,
        objective: "Set up age equations or backsolve.",
      });
    },
  },
};

export const GENERATOR_KEYS = Object.keys(GENERATORS);

export function generate(key: string, seed: number): Question {
  return GENERATORS[key].gen(seed);
}

export function rebuildGenerated(id: string): Question | undefined {
  const [, key, seed] = id.split(":");
  if (!GENERATORS[key]) return undefined;
  return GENERATORS[key].gen(Number(seed));
}

export function generatorsForTopic(topic: string) {
  return GENERATOR_KEYS.filter((k) => GENERATORS[k].topic === topic);
}
