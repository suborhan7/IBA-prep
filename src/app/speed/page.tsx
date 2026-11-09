"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import clsx from "clsx";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, Gauge, X, Zap } from "lucide-react";
import { DRILLS, SPRINT, buildDrill, isRight, nextLevel, type DrillItem, type DrillKind } from "@/lib/drills";
import { db, getSetting, setSetting, todayKey } from "@/lib/db";
import { markTask } from "@/lib/engine";
import { Badge, Button, Card, CardTitle, PageHeader, Progress, Stat, fmtTime, pct } from "@/components/ui";

type Levels = Record<string, number>;
const ALL = [...DRILLS, SPRINT];

export default function SpeedGym() {
  const [levels, setLevels] = useState<Levels>({});
  const [run, setRun] = useState<{ kind: DrillKind; level: number; items: DrillItem[] } | null>(null);
  const drills = useLiveQuery(() => db.drills.orderBy("at").toArray(), []);

  useEffect(() => { getSetting<Levels>("speed:levels", {}).then(setLevels); }, []);

  const statsFor = (id: string) => {
    const rows = (drills ?? []).filter((d) => d.kind === id);
    if (!rows.length) return null;
    const last = rows.slice(-5);
    const first = rows.slice(0, Math.min(3, rows.length));
    const avg = (xs: typeof rows) => xs.reduce((s, d) => s + d.avgMs, 0) / xs.length;
    return {
      runs: rows.length,
      acc: last.reduce((s, d) => s + d.correct, 0) / Math.max(1, last.reduce((s, d) => s + d.total, 0)),
      avgMs: avg(last),
      improvement: rows.length > 3 ? 1 - avg(last) / avg(first) : null,
      qpm: 60000 / avg(last),
    };
  };

  const chart = useMemo(() => {
    const byDay: Record<string, { ms: number; n: number }> = {};
    for (const d of drills ?? []) {
      const k = todayKey(new Date(d.at)).slice(5);
      byDay[k] = byDay[k] ?? { ms: 0, n: 0 };
      byDay[k].ms += d.avgMs * d.total;
      byDay[k].n += d.total;
    }
    return Object.entries(byDay).map(([day, v]) => ({ day, sec: Math.round(v.ms / v.n / 100) / 10 }));
  }, [drills]);

  async function finish(kind: DrillKind, level: number, results: { ok: boolean; ms: number }[]) {
    const correct = results.filter((r) => r.ok).length;
    const avgMs = results.reduce((s, r) => s + r.ms, 0) / results.length;
    await db.drills.add({ kind: kind.id, level, correct, total: results.length, avgMs, at: Date.now() });
    const nl = nextLevel(level, correct / results.length, avgMs, kind.targetSec);
    const next = { ...levels, [kind.id]: nl };
    setLevels(next);
    await setSetting("speed:levels", next);
    const today = (await db.drills.where("at").above(new Date(todayKey() + "T00:00:00").getTime()).count());
    if (today >= 2) await markTask("speed");
    return nl;
  }

  if (run) return <DrillRunner key={run.kind.id + run.items[0].prompt} {...run} onExit={() => setRun(null)} onFinish={finish} />;

  const todays = (drills ?? []).filter((d) => todayKey(new Date(d.at)) === todayKey());
  const totalStats = (drills ?? []).length ? {
    acc: (drills ?? []).reduce((s, d) => s + d.correct, 0) / (drills ?? []).reduce((s, d) => s + d.total, 0),
  } : null;

  return (
    <div>
      <PageHeader eyebrow="Quantitative" title="Speed Gym" subtitle="Short typed-answer drills against the clock. Score at least 80% at target pace and the level rises; drop below 50% and it eases off." />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Drills today" value={todays.length} hint="Mission: 2–3 a day" />
        <Stat label="Total drills" value={drills?.length ?? 0} />
        <Stat label="Overall accuracy" value={totalStats ? pct(totalStats.acc) : "—"} />
        <Stat label="Avg time today" value={todays.length ? fmtTime(todays.reduce((s, d) => s + d.avgMs, 0) / todays.length) : "—"} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ALL.map((k) => {
          const L = levels[k.id] ?? 1;
          const s = statsFor(k.id);
          return (
            <Card key={k.id} className="flex flex-col p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">{k.id === "sprint" ? <Zap size={15} className="text-warn" /> : <Gauge size={15} className="text-accent" />}{k.label}</span>
                <Badge tone="accent">Level {L}/5</Badge>
              </div>
              <div className="text-[13px] text-muted">{k.desc}</div>
              <div className="mt-1 text-[12px] text-muted">{k.count} questions · target {k.targetSec}s each</div>
              {s && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                  <div><div className="text-muted">Accuracy</div><div className="font-medium tabular-nums">{pct(s.acc)}</div></div>
                  <div><div className="text-muted">Avg</div><div className="font-medium tabular-nums">{fmtTime(s.avgMs)}</div></div>
                  <div><div className="text-muted">Q / min</div><div className="font-medium tabular-nums">{s.qpm.toFixed(1)}</div></div>
                  {s.improvement !== null && <div className="col-span-3 text-muted">Speed vs your first runs: <span className={s.improvement >= 0 ? "text-good" : "text-bad"}>{s.improvement >= 0 ? "+" : ""}{Math.round(s.improvement * 100)}%</span></div>}
                </div>
              )}
              <div className="mt-auto pt-3"><Button size="sm" onClick={() => setRun({ kind: k, level: L, items: buildDrill(k, L) })}>Start drill</Button></div>
            </Card>
          );
        })}
      </div>
      {chart.length > 1 && (
        <Card className="mt-5">
          <CardTitle>Average seconds per question, by day</CardTitle>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={chart} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="sec" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}

function DrillRunner({ kind, level, items, onExit, onFinish }: { kind: DrillKind; level: number; items: DrillItem[]; onExit: () => void; onFinish: (k: DrillKind, l: number, r: { ok: boolean; ms: number }[]) => Promise<number> }) {
  const [i, setI] = useState(0);
  const [input, setInput] = useState("");
  const [results, setResults] = useState<{ ok: boolean; ms: number; given: string }[]>([]);
  const [flash, setFlash] = useState<null | boolean>(null);
  const [elapsed, setElapsed] = useState(0);
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const start = useRef(Date.now());
  const ref = useRef<HTMLInputElement>(null);
  const done = i >= items.length;

  useEffect(() => { ref.current?.focus(); start.current = Date.now(); }, [i]);
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setElapsed(Date.now() - start.current), 200);
    return () => clearInterval(t);
  }, [done, i]);

  function submit(skip = false) {
    const ms = Date.now() - start.current;
    const ok = !skip && isRight(items[i], input);
    const next = [...results, { ok, ms, given: skip ? "" : input }];
    setResults(next);
    setFlash(ok);
    setTimeout(() => setFlash(null), 350);
    setInput("");
    if (i + 1 >= items.length) onFinish(kind, level, next).then(setNewLevel);
    setI(i + 1);
  }

  if (done) {
    const correct = results.filter((r) => r.ok).length;
    const avg = results.reduce((s, r) => s + r.ms, 0) / results.length;
    return (
      <Card className="fade-in p-5 sm:p-7">
        <div className="mb-1 text-[12px] font-medium uppercase tracking-wider text-accent">Drill complete · {kind.label}</div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Score" value={`${correct}/${items.length}`} tone={correct / items.length >= 0.8 ? "good" : correct / items.length < 0.5 ? "bad" : undefined} />
          <Stat label="Avg / question" value={fmtTime(avg)} tone={avg <= kind.targetSec * 1000 ? "good" : "warn"} hint={`target ${kind.targetSec}s`} />
          <Stat label="Questions / min" value={(60000 / avg).toFixed(1)} />
          <Stat label="Next level" value={newLevel ?? "…"} hint={newLevel && newLevel > level ? "Levelled up" : newLevel && newLevel < level ? "Eased off" : "Same level"} />
        </div>
        <div className="mt-5 divide-y divide-line rounded-xl border border-line text-[14px]">
          {items.map((it, j) => (
            <div key={j} className="flex items-center gap-3 px-4 py-2">
              {results[j]?.ok ? <Check size={15} className="text-good" /> : <X size={15} className="text-bad" />}
              <span className="flex-1 font-mono">{it.prompt}</span>
              <span className="text-muted">you: {results[j]?.given || "—"}</span>
              <span className="w-24 text-right font-medium tabular-nums">{Number.isInteger(it.answer) ? it.answer : Math.round(it.answer * 100) / 100}</span>
              <span className="w-14 text-right tabular-nums text-muted">{fmtTime(results[j]?.ms ?? 0)}</span>
            </div>
          ))}
        </div>
        {results.some((r) => !r.ok) && (
          <div className="mt-4 rounded-xl bg-surface-2 p-3 text-[13px]"><span className="font-medium">Tip: </span>{items.find((_, j) => !results[j].ok)?.hint}</div>
        )}
        <div className="mt-5 flex gap-2"><Button onClick={onExit}>Back to Speed Gym</Button></div>
      </Card>
    );
  }

  const it = items[i];
  const over = elapsed > kind.targetSec * 1000;
  return (
    <Card className="p-5 sm:p-7">
      <div className="mb-4 flex items-center gap-3">
        <Progress value={(i / items.length) * 100} />
        <span className="shrink-0 text-[12.5px] tabular-nums text-muted">{i + 1}/{items.length}</span>
        <Badge tone="accent">L{level}</Badge>
      </div>
      <div className={clsx("rounded-2xl py-10 text-center transition-colors", flash === true && "bg-good/10", flash === false && "bg-bad/10")}>
        <div className="font-mono text-[34px] font-semibold tracking-tight sm:text-[44px]">{it.prompt}</div>
        <div className={clsx("mt-2 text-[13px] tabular-nums", over ? "text-bad" : "text-muted")}>{(elapsed / 1000).toFixed(1)}s / {kind.targetSec}s</div>
        <Progress value={(elapsed / (kind.targetSec * 1000)) * 100} tone={over ? "bad" : "accent"} className="mx-auto mt-2 max-w-xs" />
      </div>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <input ref={ref} value={input} onChange={(e) => setInput(e.target.value)} inputMode="decimal" autoComplete="off" placeholder="Type the answer, press Enter" aria-label="Answer" className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-[18px] tabular-nums outline-none focus:border-accent" />
        <Button type="submit">Enter</Button>
        <Button type="button" variant="ghost" onClick={() => submit(true)}>Skip</Button>
      </form>
      <div className="mt-3 flex justify-between text-[12px] text-muted"><span>Decimals: round to 2 places unless told otherwise.</span><button onClick={onExit} className="hover:text-ink">Quit</button></div>
    </Card>
  );
}
