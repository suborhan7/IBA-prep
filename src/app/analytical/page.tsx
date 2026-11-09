"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { CheckCircle2, Puzzle as PuzzleIcon, Timer } from "lucide-react";
import { topicsOf, topicLabel } from "@/data/taxonomy";
import { PUZZLES } from "@/data/puzzles";
import { questionsFor } from "@/lib/bank";
import { adaptiveSet } from "@/lib/engine";
import { db } from "@/lib/db";
import type { Question } from "@/lib/types";
import PracticeSession from "@/components/PracticeSession";
import PuzzleBoard from "@/components/PuzzleBoard";
import { Badge, Button, Card, CardTitle, Loading, PageHeader, Progress, Tabs, fmtTime } from "@/components/ui";

type Tab = "topics" | "puzzles" | "method";

const METHOD = [
  ["Read everything once", "Don't draw yet. Note who the people are and what the layout is (row, circle, floors, days)."],
  ["Draw the frame", "Sketch the empty seats or floors with their numbers. For circles, mark which way is clockwise."],
  ["Place the fixed facts", "Conditions that name an exact position (\"C sits in the middle\") go in first."],
  ["Build blocks", "\"Immediately right of\" and \"next to\" glue two people into a block — move them together."],
  ["Use negatives to eliminate", "\"Not at the end\", \"not next to\" — cross options off in a small grid."],
  ["Branch only when forced", "If two placements remain, draw both cases side by side and push each until one breaks."],
  ["Verify every condition", "Re-read each condition against the final picture. One missed word costs the whole set."],
  ["Answer from the picture", "Each question is now a lookup. Don't re-derive; read it off the diagram."],
] as const;

function Analytical() {
  const sp = useSearchParams();
  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) ?? "topics");
  const [running, setRunning] = useState<{ title: string; qs: Question[]; timed?: number } | null>(null);
  const [puzzle, setPuzzle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const skills = useLiveQuery(() => db.skills.where("subject").equals("analytical").toArray(), []);
  const runs = useLiveQuery(() => db.puzzles.toArray(), []);
  const topics = topicsOf("analytical").filter((t) => t.id !== "arrangement");
  const groups = useMemo(() => [...new Set(topics.map((t) => t.group))], [topics]);

  async function start(topic: string, timed: boolean) {
    setLoading(true);
    const qs = await adaptiveSet({ topic, count: 8 });
    setLoading(false);
    setRunning({ title: topicLabel(topic) + (timed ? " · timed" : ""), qs, timed: timed ? qs.reduce((s, q) => s + q.timeSec, 0) : undefined });
  }

  if (running) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setRunning(null)} className="mb-3">← Back to Analytical</Button>
        <PageHeader title={running.title} />
        <PracticeSession questions={running.qs} title={running.title} mode={running.timed ? "timed" : "practice"} timeLimitSec={running.timed} />
      </div>
    );
  }

  const active = PUZZLES.find((p) => p.id === puzzle);
  if (active) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setPuzzle(null)} className="mb-3">← All puzzles</Button>
        <PuzzleBoard key={active.id} p={active} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Analytical ability" title="Logic, puzzles and reasoning" subtitle="Interactive arrangement puzzles with a live condition checker, plus critical reasoning, data interpretation (with charts) and data sufficiency." />
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: "topics", label: "Topics" }, { id: "puzzles", label: `Arrangement puzzles (${PUZZLES.length})` }, { id: "method", label: "The 8-step puzzle method" }]} />
      {loading && <Loading label="Picking questions at your level…" />}

      {tab === "topics" && !loading && (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g}>
              <h2 className="mb-2 text-[13px] font-medium uppercase tracking-wider text-muted">{g}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topics.filter((t) => t.group === g).map((t) => {
                  const r = skills?.find((s) => s.topic === t.id);
                  const n = questionsFor({ topic: t.id }).length;
                  return (
                    <Card key={t.id} className="flex flex-col p-4">
                      <div className="mb-1 flex items-start justify-between gap-2"><span className="font-medium">{t.label}</span>{t.weight === 3 && <Badge tone="accent">high yield</Badge>}</div>
                      <div className="text-[12.5px] text-muted">{n} questions{r ? ` · ${Math.round((r.correct / r.attempts) * 100)}% of ${r.attempts}` : ""}</div>
                      <div className="mt-2 flex items-center gap-2 text-[12px] text-muted">
                        <Progress value={r ? ((r.rating - 1) / 5) * 100 : 0} tone={r && r.rating < 2.5 ? "warn" : "accent"} className="flex-1" />
                        <span className="tabular-nums">{r ? `L${r.rating.toFixed(1)}` : "—"}</span>
                      </div>
                      <div className="mt-3 flex gap-1.5">
                        <Button size="sm" onClick={() => start(t.id, false)} disabled={!n}>Practise</Button>
                        <Button size="sm" variant="ghost" onClick={() => start(t.id, true)} disabled={!n}><Timer size={13} /> Timed</Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "puzzles" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PUZZLES.map((p) => {
            const mine = (runs ?? []).filter((r) => r.puzzleId === p.id);
            const best = mine.filter((r) => r.solved).sort((a, b) => a.ms - b.ms)[0];
            return (
              <Card key={p.id} className="flex flex-col p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-medium"><PuzzleIcon size={15} className="text-accent" />{p.title}</span>
                  {best && <CheckCircle2 size={16} className="text-good" />}
                </div>
                <div className="text-[12.5px] capitalize text-muted">{p.kind} · {p.entities.length} people · level {p.difficulty}</div>
                <p className="mt-2 line-clamp-2 text-[13px] text-muted">{p.setup}</p>
                <div className="mt-2 text-[12px] text-muted">{best ? `Best time ${fmtTime(best.ms)}` : mine.length ? `${mine.length} attempt(s)` : "Not tried yet"}</div>
                <div className="mt-auto pt-3"><Button size="sm" onClick={() => setPuzzle(p.id)}>{best ? "Solve again" : "Open board"}</Button></div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "method" && (
        <Card>
          <CardTitle>Solve any arrangement puzzle in eight steps</CardTitle>
          <ol className="grid gap-3 md:grid-cols-2">
            {METHOD.map(([t, d], i) => (
              <li key={t} className="flex gap-3 rounded-xl border border-line p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent">{i + 1}</span>
                <div><div className="font-medium">{t}</div><div className="text-[13.5px] text-muted">{d}</div></div>
              </li>
            ))}
          </ol>
          <div className="mt-4"><Button onClick={() => setTab("puzzles")}>Try it on a puzzle</Button></div>
        </Card>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<Loading />}><Analytical /></Suspense>;
}
