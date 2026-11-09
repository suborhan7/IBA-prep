import { PUZZLES } from "../src/data/puzzles";
import { solveAll } from "../src/lib/puzzle-engine";
for (const p of PUZZLES) {
  const s = solveAll(p);
  console.log(p.id, s.length, JSON.stringify(s.slice(0, 6)));
}
