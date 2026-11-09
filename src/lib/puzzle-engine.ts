/**
 * Arrangement-puzzle engine. Constraints are declarative so they can be
 * displayed, checked live against the student's board, and brute-forced to
 * prove the puzzle has exactly one solution.
 *
 * Linear layouts: positions 0..n-1 run left → right (or bottom → top for floors).
 *   "immediately right of" = position + 1 (people face the reader/north).
 * Circular layouts: seats 0..n-1 run clockwise seen from above, everyone faces
 *   the centre, so a person's immediate RIGHT is seat (i − 1) and LEFT is (i + 1).
 */

export type Constraint =
  | { t: "at"; a: string; pos: number }
  | { t: "notAt"; a: string; pos: number }
  | { t: "end"; a: string }
  | { t: "notEnd"; a: string }
  | { t: "before"; a: string; b: string } // linear: a anywhere left of / below b
  | { t: "immBefore"; a: string; b: string } // linear: a immediately left of / below b
  | { t: "adjacent"; a: string; b: string }
  | { t: "notAdjacent"; a: string; b: string }
  | { t: "gap"; a: string; b: string; n: number } // exactly n people between (linear: |pa−pb|−1; circular: shorter arc)
  | { t: "immRight"; a: string; b: string } // circular: a is immediately to the right of b
  | { t: "immLeft"; a: string; b: string } // circular
  | { t: "opposite"; a: string; b: string } // circular, even n
  | { t: "between"; a: string; b: string; c: string }; // linear: a somewhere between b and c

export interface Puzzle {
  id: string;
  title: string;
  kind: "linear" | "circular" | "floors" | "schedule";
  difficulty: number;
  setup: string;
  entities: string[];
  slotLabels: string[];
  constraints: { c: Constraint; text: string }[];
  solution: string[]; // entity in each slot (for circular: canonical rotation with entities[0] at seat 0)
  questions: { stem: string; options: string[]; answer: (sol: string[]) => string; why: string }[];
  walkthrough: string[];
}

export function check(c: Constraint, board: (string | null)[], circular: boolean): boolean | null {
  const n = board.length;
  const pos = (x: string) => board.indexOf(x);
  const need = (...xs: string[]) => xs.every((x) => pos(x) >= 0);
  const cd = (i: number, j: number) => {
    const d = Math.abs(i - j);
    return Math.min(d, n - d);
  };
  switch (c.t) {
    case "at":
      return need(c.a) ? pos(c.a) === c.pos : null;
    case "notAt":
      return need(c.a) ? pos(c.a) !== c.pos : null;
    case "end":
      return need(c.a) ? pos(c.a) === 0 || pos(c.a) === n - 1 : null;
    case "notEnd":
      return need(c.a) ? pos(c.a) !== 0 && pos(c.a) !== n - 1 : null;
    case "before":
      return need(c.a, c.b) ? pos(c.a) < pos(c.b) : null;
    case "immBefore":
      return need(c.a, c.b) ? pos(c.a) + 1 === pos(c.b) : null;
    case "adjacent":
      return need(c.a, c.b) ? (circular ? cd(pos(c.a), pos(c.b)) === 1 : Math.abs(pos(c.a) - pos(c.b)) === 1) : null;
    case "notAdjacent":
      return need(c.a, c.b) ? (circular ? cd(pos(c.a), pos(c.b)) !== 1 : Math.abs(pos(c.a) - pos(c.b)) !== 1) : null;
    case "gap":
      return need(c.a, c.b) ? (circular ? cd(pos(c.a), pos(c.b)) - 1 === c.n : Math.abs(pos(c.a) - pos(c.b)) - 1 === c.n) : null;
    case "immRight":
      return need(c.a, c.b) ? pos(c.a) === (pos(c.b) - 1 + n) % n : null;
    case "immLeft":
      return need(c.a, c.b) ? pos(c.a) === (pos(c.b) + 1) % n : null;
    case "opposite":
      return need(c.a, c.b) ? cd(pos(c.a), pos(c.b)) === n / 2 : null;
    case "between":
      return need(c.a, c.b, c.c) ? (pos(c.a) - pos(c.b)) * (pos(c.a) - pos(c.c)) < 0 : null;
  }
}

export function isCircular(p: Puzzle) {
  return p.kind === "circular";
}

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const out: T[][] = [];
  arr.forEach((x, i) => {
    for (const rest of permutations([...arr.slice(0, i), ...arr.slice(i + 1)])) out.push([x, ...rest]);
  });
  return out;
}

/** All boards satisfying every constraint (circular boards normalised so entities[0] sits at seat 0). */
export function solveAll(p: Puzzle): string[][] {
  const circ = isCircular(p);
  const sols: string[][] = [];
  if (circ) {
    const [first, ...rest] = p.entities;
    for (const perm of permutations(rest)) {
      const b = [first, ...perm];
      if (p.constraints.every(({ c }) => check(c, b, true) === true)) sols.push(b);
    }
  } else {
    for (const b of permutations(p.entities)) if (p.constraints.every(({ c }) => check(c, b, false) === true)) sols.push(b);
  }
  return sols;
}

/** Rotate a circular board so entities[0] is at seat 0 (for comparing to the stored solution). */
export function normalise(p: Puzzle, board: string[]): string[] {
  if (!isCircular(p)) return board;
  const i = board.indexOf(p.entities[0]);
  return [...board.slice(i), ...board.slice(0, i)];
}

export const neighbours = (sol: string[], x: string) => {
  const n = sol.length;
  const i = sol.indexOf(x);
  return { right: sol[(i - 1 + n) % n], left: sol[(i + 1) % n] };
};
