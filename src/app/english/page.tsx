"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight, BookOpen, FileText, ListChecks } from "lucide-react";
import { LESSONS } from "@/data/grammar";
import { PASSAGES } from "@/data/questions/reading";
import { topicsOf, topicLabel } from "@/data/taxonomy";
import { questionsFor, vocabQuestion } from "@/lib/bank";
import { db } from "@/lib/db";
import { VOCAB } from "@/data/vocab";
import { DIFFICULTY_LABEL, type Question } from "@/lib/types";
import PracticeSession from "@/components/PracticeSession";
import { markTask } from "@/lib/engine";
import { Badge, Button, Card, Loading, PageHeader, Progress, Tabs } from "@/components/ui";
import { mulberry32, shuffle } from "@/lib/rng";

type Tab = "grammar" | "reading" | "usage";

function English() {
  const sp = useSearchParams();
  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) ?? "grammar");
  const [running, setRunning] = useState<{ title: string; qs: Question[]; timed?: number; task?: string } | null>(null);
  const skills = useLiveQuery(() => db.skills.where("subject").equals("english").toArray(), []);
  const rating = (t: string) => skills?.find((s) => s.topic === t);
  const usageTopics = topicsOf("english").filter((t) => t.group !== "Grammar" && t.id !== "rc");

  const startUsage = (topic: string) => {
    let qs = questionsFor({ topic }).sort((a, b) => a.difficulty - b.difficulty);
    if (topic === "synonym" || topic === "antonym") {
      const r = mulberry32(Date.now());
      qs = shuffle(r, VOCAB).slice(0, 12).map((w) => vocabQuestion(topic === "synonym" ? "syn" : "ant", w.word, Math.floor(r() * 1e6))!).filter(Boolean);
    }
    setRunning({ title: topicLabel(topic), qs });
  };

  if (running) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setRunning(null)} className="mb-3">← Back to English</Button>
        <PageHeader title={running.title} />
        <PracticeSession questions={running.qs} title={running.title} mode={running.timed ? "timed" : "practice"} timeLimitSec={running.timed} onDone={() => running.task && markTask(running.task)} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="English Mastery" title="See the structure, then practise" subtitle="Every grammar rule is shown as a colour-coded sentence diagram with the exact error highlighted. Reading passages cover economics, psychology, technology, philosophy, environment and history." />
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: "grammar", label: "Grammar lessons" }, { id: "reading", label: "Reading comprehension" }, { id: "usage", label: "Vocabulary & usage" }]} />

      {tab === "grammar" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LESSONS.map((l) => {
            const r = rating(l.id);
            const n = questionsFor({ topic: l.id }).length;
            return (
              <Link key={l.id} href={`/english/grammar/${l.id}`}>
                <Card className="h-full p-4 transition-colors hover:border-accent/60">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-medium">{l.title}</span>
                    <BookOpen size={16} className="text-muted" />
                  </div>
                  <p className="line-clamp-2 text-[13px] text-muted">{l.rule}</p>
                  <div className="mt-3 flex items-center gap-2 text-[12px] text-muted">
                    <Progress value={r ? ((r.rating - 1) / 5) * 100 : 0} className="flex-1" />
                    <span className="tabular-nums">{r ? `L${r.rating.toFixed(1)}` : `${n} Q`}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {tab === "reading" && (
        <div className="grid gap-3 md:grid-cols-2">
          {PASSAGES.map((p) => {
            const qs = questionsFor({ topic: "rc" }).filter((q) => q.passageId === p.id);
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-[12.5px] text-muted">{p.domain} · {p.text.split(/\s+/).length} words · {qs.length} questions</div>
                  </div>
                  <Badge>L{p.difficulty} · {DIFFICULTY_LABEL[p.difficulty]}</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => setRunning({ title: p.title, qs, task: "reading" })}><FileText size={14} /> Practise</Button>
                  <Button size="sm" variant="secondary" onClick={() => setRunning({ title: `${p.title} (timed)`, qs, task: "reading", timed: Math.round(p.text.split(/\s+/).length / 200 * 60 + qs.length * 60) })}>Timed</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "usage" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {usageTopics.map((t) => {
            const r = rating(t.id);
            const count = t.id === "synonym" || t.id === "antonym" ? `${VOCAB.length} words` : `${questionsFor({ topic: t.id }).length} Q`;
            return (
              <button key={t.id} onClick={() => startUsage(t.id)} className="text-left">
                <Card className="h-full p-4 transition-colors hover:border-accent/60">
                  <div className="flex items-center justify-between"><span className="font-medium">{t.label}</span><ListChecks size={16} className="text-muted" /></div>
                  <div className="mt-1 text-[12.5px] text-muted">{count}{r ? ` · level ${r.rating.toFixed(1)}` : ""}</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-[13px] text-accent">Start <ArrowRight size={13} /></div>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<Loading />}><English /></Suspense>;
}
