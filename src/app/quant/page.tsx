"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Lightbulb, Sparkles, Timer, Zap } from "lucide-react";
import { topicsOf, topicLabel } from "@/data/taxonomy";
import { SHORTCUTS } from "@/data/shortcuts";
import { generatedFor, questionsFor } from "@/lib/bank";
import { generatorsForTopic } from "@/lib/generators";
import { adaptiveSet, markTask } from "@/lib/engine";
import { db } from "@/lib/db";
import type { Question } from "@/lib/types";
import PracticeSession from "@/components/PracticeSession";
import { Badge, Button, Card, Loading, PageHeader, Progress, Select, Tabs } from "@/components/ui";

type Tab = "topics" | "shortcuts";

function Quant() {
  const sp = useSearchParams();
  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) ?? "topics");
  const [running, setRunning] = useState<{ title: string; qs: Question[]; timed?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [scTopic, setScTopic] = useState("all");
  const skills = useLiveQuery(() => db.skills.where("subject").equals("quant").toArray(), []);
  const topics = topicsOf("quant");
  const groups = useMemo(() => [...new Set(topics.map((t) => t.group))], [topics]);

  async function start(topic: string, kind: "adaptive" | "fresh" | "timed") {
    setLoading(true);
    let qs: Question[];
    if (kind === "fresh") qs = generatedFor(topic, 10, Math.floor(Math.random() * 1e9));
    else qs = await adaptiveSet({ topic, count: 10 });
    setLoading(false);
    setRunning({ title: `${topicLabel(topic)}${kind === "fresh" ? " · fresh numbers" : kind === "timed" ? " · timed" : ""}`, qs, timed: kind === "timed" ? qs.reduce((s, q) => s + q.timeSec, 0) : undefined });
  }

  if (running) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setRunning(null)} className="mb-3">← Back to Mathematics</Button>
        <PageHeader title={running.title} subtitle={running.timed ? `Timed at exam pace: ${Math.round(running.timed / 60)} minutes for ${running.qs.length} questions.` : "Check each answer to see the full method, the fastest method, a shortcut and the common traps."} />
        <PracticeSession questions={running.qs} title={running.title} mode={running.timed ? "timed" : "practice"} timeLimitSec={running.timed} />
      </div>
    );
  }

  const shown = SHORTCUTS.filter((s) => scTopic === "all" || s.topic === scTopic);

  return (
    <div>
      <PageHeader
        eyebrow="Quantitative"
        title="Mathematics by topic"
        subtitle="Every topic has written questions; topics marked ∞ also have generators that produce unlimited new questions with computed answers, so the answer key is always right."
        actions={<Link href="/speed"><Button variant="secondary"><Zap size={15} /> Speed Gym</Button></Link>}
      />
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: "topics", label: "Topics" }, { id: "shortcuts", label: `Shortcut library (${SHORTCUTS.length})` }]} />
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
                  const gens = generatorsForTopic(t.id).length;
                  return (
                    <Card key={t.id} className="flex flex-col p-4">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <span className="font-medium">{t.label}</span>
                        {t.weight === 3 && <Badge tone="accent">high yield</Badge>}
                      </div>
                      <div className="text-[12.5px] text-muted">{n} written{gens ? " · ∞ generated" : ""}{r ? ` · ${Math.round((r.correct / r.attempts) * 100)}% of ${r.attempts}` : ""}</div>
                      <div className="mt-2 flex items-center gap-2 text-[12px] text-muted">
                        <Progress value={r ? ((r.rating - 1) / 5) * 100 : 0} tone={r && r.rating < 2.5 ? "warn" : "accent"} className="flex-1" />
                        <span className="tabular-nums">{r ? `L${r.rating.toFixed(1)}` : "—"}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Button size="sm" onClick={() => start(t.id, "adaptive")} disabled={!n && !gens}>Practise</Button>
                        {gens > 0 && <Button size="sm" variant="secondary" onClick={() => start(t.id, "fresh")}><Sparkles size={13} /> Fresh</Button>}
                        <Button size="sm" variant="ghost" onClick={() => start(t.id, "timed")} disabled={!n && !gens}><Timer size={13} /> Timed</Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "shortcuts" && (
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div className="w-64">
              <Select label="Topic" value={scTopic} onChange={setScTopic} options={[{ value: "all", label: "All topics" }, ...[...new Set(SHORTCUTS.map((s) => s.topic))].map((t) => ({ value: t, label: topicLabel(t) }))]} />
            </div>
            <Button variant="secondary" size="sm" onClick={() => markTask("shortcuts")}>Mark today's shortcut review done</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {shown.map((s) => (
              <Card key={s.id} className="p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-medium"><Lightbulb size={15} className="text-warn" />{s.title}</span>
                  <Badge>{topicLabel(s.topic)}</Badge>
                </div>
                <p className="text-[14px]">{s.rule}</p>
                <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 font-mono text-[13px]">{s.example}</p>
                <p className="mt-2 text-[13px] text-muted"><span className="font-medium text-ink">Why it works: </span>{s.why}</p>
                <p className="mt-1 text-[13px] text-muted"><span className="font-medium text-bad">When not to use: </span>{s.whenNot}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<Loading />}><Quant /></Suspense>;
}
