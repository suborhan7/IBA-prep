"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { CheckCircle2, Circle, RotateCcw, XCircle } from "lucide-react";
import { check, isCircular, normalise, type Puzzle } from "@/lib/puzzle-engine";
import { db, getSetting, setSetting } from "@/lib/db";
import { markTask } from "@/lib/engine";
import { Badge, Button, Card, CardTitle, fmtTime } from "./ui";

/**
 * Drag-and-drop arrangement board. Works with a mouse (drag chips onto seats)
 * and on touch screens (tap a name, then tap a seat). Every condition is checked
 * live against the board: ✓ satisfied, ✗ broken, ○ not decidable yet.
 */
export default function PuzzleBoard({ p }: { p: Puzzle }) {
  const n = p.entities.length;
  const circ = isCircular(p);
  const [board, setBoard] = useState<(string | null)[]>(() => Array(n).fill(null));
  const [sel, setSel] = useState<{ name: string; from: number | null } | null>(null);
  const [status, setStatus] = useState<"playing" | "wrong" | "solved" | "gaveup">("playing");
  const [attempted, setAttempted] = useState(false);
  const [showWalk, setShowWalk] = useState(false);
  const [notes, setNotes] = useState("");
  const [answers, setAnswers] = useState<(string | null)[]>(() => p.questions.map(() => null));
  const start = useRef(Date.now());
  const [solvedMs, setSolvedMs] = useState(0);

  useEffect(() => { getSetting<string>(`scratch:${p.id}`, "").then(setNotes); }, [p.id]);

  const pool = p.entities.filter((e) => !board.includes(e));
  const results = useMemo(() => p.constraints.map(({ c }) => check(c, board, circ)), [board, p, circ]);
  const full = board.every(Boolean);

  function place(slot: number, name: string, from: number | null) {
    setBoard((b) => {
      const nb = [...b];
      const occupant = nb[slot];
      if (from !== null) nb[from] = occupant; // swap when moving between seats
      nb[slot] = name;
      return nb;
    });
    setSel(null);
    if (status === "wrong") setStatus("playing");
  }
  function unplace(from: number) {
    setBoard((b) => { const nb = [...b]; nb[from] = null; return nb; });
    setSel(null);
  }

  function submit() {
    setAttempted(true);
    const ok = normalise(p, board as string[]).every((x, i) => x === p.solution[i]);
    if (ok) {
      const ms = Date.now() - start.current;
      setSolvedMs(ms);
      setStatus("solved");
      db.puzzles.add({ puzzleId: p.id, solved: true, ms, at: Date.now() }).then(() => markTask("puzzle")).catch(() => {});
    } else {
      setStatus("wrong");
      db.puzzles.add({ puzzleId: p.id, solved: false, ms: Date.now() - start.current, at: Date.now() }).catch(() => {});
    }
  }

  function giveUp() {
    setAttempted(true);
    setStatus("gaveup");
    setShowWalk(true);
    setBoard([...p.solution]);
  }

  const chip = (name: string, from: number | null) => (
    <button
      key={name}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("text/plain", JSON.stringify({ name, from })); setSel({ name, from }); }}
      onClick={(e) => {
        e.stopPropagation();
        if (sel && sel.name !== name && from !== null) return place(from, sel.name, sel.from); // tap-to-swap onto an occupied seat
        setSel(sel?.name === name ? null : { name, from });
      }}
      className={clsx(
        "cursor-grab select-none rounded-full border px-3 py-1 text-[13px] font-medium shadow-sm transition-all active:cursor-grabbing",
        sel?.name === name ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface hover:border-accent/60",
      )}
    >
      {name}
    </button>
  );

  const slot = (i: number, extra?: string, style?: React.CSSProperties) => (
    <div
      key={i}
      style={style}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); const d = JSON.parse(e.dataTransfer.getData("text/plain")); place(i, d.name, d.from); }}
      onClick={() => sel && place(i, sel.name, sel.from)}
      className={clsx(
        "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-1.5 text-center transition-colors",
        board[i] ? "border-accent/40 bg-accent-soft/40" : sel ? "border-accent/60 bg-accent-soft/20" : "border-line",
        extra,
      )}
    >
      <span className="text-[10.5px] uppercase tracking-wider text-muted">{p.slotLabels[i]}</span>
      {board[i] ? chip(board[i]!, i) : <span className="text-[12px] text-muted">{sel ? "tap to place" : "empty"}</span>}
    </div>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
      <Card>
        <CardTitle right={<Badge>Level {p.difficulty}</Badge>}>{p.title}</CardTitle>
        <p className="mb-4 text-[14px]">{p.setup}</p>

        <div
          className="mb-4 flex min-h-[44px] flex-wrap gap-2 rounded-xl bg-surface-2 p-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const d = JSON.parse(e.dataTransfer.getData("text/plain")); if (d.from !== null) unplace(d.from); }}
          onClick={() => sel && sel.from !== null && unplace(sel.from)}
        >
          {pool.length ? pool.map((x) => chip(x, null)) : <span className="px-1 text-[12.5px] text-muted">Everyone is seated. Drag a name here (or tap it, then tap here) to remove it.</span>}
        </div>

        {circ ? (
          <div className="relative mx-auto aspect-square w-full max-w-[380px]">
            <div className="absolute inset-[24%] grid place-items-center rounded-full border border-line bg-surface-2 text-center text-[11.5px] text-muted">Table<br />(all face the centre)</div>
            {board.map((_, i) => {
              const a = (-90 + (i * 360) / n) * (Math.PI / 180);
              return slot(i, "absolute w-[25%] -translate-x-1/2 -translate-y-1/2 bg-surface", { left: `${50 + 40 * Math.cos(a)}%`, top: `${50 + 40 * Math.sin(a)}%` });
            })}
          </div>
        ) : p.kind === "floors" ? (
          <div className="mx-auto flex max-w-[260px] flex-col-reverse gap-2">{board.map((_, i) => slot(i))}</div>
        ) : (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>{board.map((_, i) => slot(i))}</div>
        )}
        {circ && <p className="mt-3 text-[12px] text-muted">Seats run clockwise from Seat 1 at the top. Facing the centre, a person's <b>right</b> is the seat anticlockwise from them.</p>}
        {p.kind === "linear" && <p className="mt-3 text-[12px] text-muted">Everyone faces north (towards you reading), so "right of X" means further towards the right end.</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={submit} disabled={!full || status === "solved" || status === "gaveup"}>Check my arrangement</Button>
          <Button variant="secondary" onClick={() => { setBoard(Array(n).fill(null)); setStatus("playing"); }}><RotateCcw size={14} /> Clear</Button>
          {status !== "solved" && status !== "gaveup" && <Button variant="ghost" onClick={giveUp}>I'm stuck — show solution</Button>}
        </div>
        {status === "wrong" && <p className="mt-3 text-[14px] text-bad">Not yet. Look for a condition marked ✗ — or, if all show ✓, there is a reading of a condition you've missed.</p>}
        {status === "solved" && <p className="mt-3 text-[14px] text-good">Solved in {fmtTime(solvedMs)}. Answer the questions below.</p>}

        {(status === "solved" || status === "gaveup") && (
          <div className="mt-5 space-y-4 border-t border-line pt-4">
            {p.questions.map((q, qi) => {
              const right = q.answer(p.solution);
              const chosen = answers[qi];
              return (
                <div key={qi}>
                  <div className="mb-1.5 text-[14px] font-medium">{qi + 1}. {q.stem}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {q.options.map((o) => (
                      <button
                        key={o}
                        disabled={chosen !== null}
                        onClick={() => setAnswers((a) => a.map((x, j) => (j === qi ? o : x)))}
                        className={clsx("rounded-lg border px-3 py-1 text-[13px]", chosen === null ? "border-line hover:border-accent" : o === right ? "border-good bg-good/10 text-good" : o === chosen ? "border-bad bg-bad/10 text-bad" : "border-line opacity-60")}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                  {chosen !== null && <p className="mt-1 text-[13px] text-muted">{q.why}</p>}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="space-y-5">
        <Card>
          <CardTitle>Conditions</CardTitle>
          <ul className="space-y-2">
            {p.constraints.map(({ text }, i) => (
              <li key={i} className="flex items-start gap-2 text-[14px]">
                {results[i] === true ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-good" /> : results[i] === false ? <XCircle size={17} className="mt-0.5 shrink-0 text-bad" /> : <Circle size={17} className="mt-0.5 shrink-0 text-muted" />}
                <span className={clsx(results[i] === false && "text-bad")}>{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-muted">✓ satisfied · ✗ broken · ○ not everyone involved is placed yet</p>
        </Card>
        <Card>
          <CardTitle>Scratchpad</CardTitle>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setSetting(`scratch:${p.id}`, e.target.value); }}
            rows={5}
            placeholder={"e.g.  C = 3 → B = 4\nA: end, not left → 5"}
            className="w-full rounded-xl border border-line bg-surface p-3 font-mono text-[13px] outline-none focus:border-accent"
          />
        </Card>
        <Card>
          <CardTitle>Walkthrough</CardTitle>
          {attempted ? (
            showWalk ? (
              <ol className="list-decimal space-y-1.5 pl-5 text-[14px]">{p.walkthrough.map((s, i) => <li key={i}>{s}</li>)}</ol>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setShowWalk(true)}>Show the step-by-step solution</Button>
            )
          ) : (
            <p className="text-[13px] text-muted">Available after your first attempt — struggling first is what makes the method stick.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
