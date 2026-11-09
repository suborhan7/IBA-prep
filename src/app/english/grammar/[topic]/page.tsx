"use client";
import { use, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Lightbulb, Timer, X } from "lucide-react";
import { LESSONS, ROLE_STYLE, type Role } from "@/data/grammar";
import { questionsFor } from "@/lib/bank";
import PracticeSession from "@/components/PracticeSession";
import { markTask } from "@/lib/engine";
import { Button, Card, CardTitle, PageHeader } from "@/components/ui";

function Highlight({ text, span, tone }: { text: string; span: string; tone: "bad" | "good" }) {
  const i = text.indexOf(span);
  if (!span || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className={clsx("rounded px-0.5", tone === "bad" ? "bg-bad/20 text-bad line-through decoration-2" : "bg-good/20 text-good")}>{span}</mark>
      {text.slice(i + span.length)}
    </>
  );
}

export default function LessonPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = use(params);
  const lesson = LESSONS.find((l) => l.id === topic);
  const [mode, setMode] = useState<"learn" | "practice" | "timed">("learn");
  if (!lesson) notFound();
  const qs = questionsFor({ topic }).sort((a, b) => a.difficulty - b.difficulty);
  const legend = [...new Set(lesson.diagram.map((d) => d.role))].filter((r) => r !== "plain") as Role[];

  return (
    <div>
      <Link href="/english" className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeft size={14} /> English Mastery</Link>
      <PageHeader eyebrow="Grammar lesson" title={lesson.title}
        actions={<>
          <Button variant={mode === "learn" ? "primary" : "secondary"} size="sm" onClick={() => setMode("learn")}>Lesson</Button>
          <Button variant={mode === "practice" ? "primary" : "secondary"} size="sm" onClick={() => setMode("practice")} disabled={!qs.length}>Practice ({qs.length})</Button>
          <Button variant={mode === "timed" ? "primary" : "secondary"} size="sm" onClick={() => setMode("timed")} disabled={!qs.length}><Timer size={14} /> Timed</Button>
        </>} />

      {mode === "learn" && (
        <div className="space-y-5">
          <Card>
            <CardTitle>1 · The rule</CardTitle>
            <p className="text-[15.5px] leading-relaxed">{lesson.rule}</p>
          </Card>

          <Card>
            <CardTitle>2 · See the structure</CardTitle>
            <div className="flex flex-wrap items-end gap-2 py-2">
              {lesson.diagram.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={clsx("rounded-lg border px-3 py-2 font-serif text-[16px]", ROLE_STYLE[d.role].cls)}>{d.text}</span>
                  <span className="text-[10.5px] font-medium uppercase tracking-wide text-muted">{ROLE_STYLE[d.role].label}</span>
                  {d.note && <span className="max-w-[160px] text-center text-[11px] leading-tight text-muted">{d.note}</span>}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[13px] text-muted">{lesson.diagramCaption}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {legend.map((r) => <span key={r} className={clsx("rounded-md border px-2 py-0.5 text-[11px]", ROLE_STYLE[r].cls)}>{ROLE_STYLE[r].label}</span>)}
            </div>
          </Card>

          <Card>
            <CardTitle>3 · Wrong vs right</CardTitle>
            <div className="space-y-3">
              {lesson.pairs.map((p, i) => (
                <div key={i} className="rounded-xl border border-line p-3">
                  <div className="flex gap-2 text-[15px]"><X size={17} className="mt-0.5 shrink-0 text-bad" /><span><Highlight text={p.wrong} span={p.error} tone="bad" /></span></div>
                  <div className="mt-1.5 flex gap-2 text-[15px]"><Check size={17} className="mt-0.5 shrink-0 text-good" /><span><Highlight text={p.right} span={p.fix.startsWith("(") ? "" : p.fix} tone="good" /></span></div>
                  <div className="mt-2 pl-6 text-[13px] text-muted">{p.why}</div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardTitle icon={<Lightbulb size={16} className="text-warn" />}>4 · Why the wrong version sounds right</CardTitle>
              <p className="text-[14.5px] text-muted">{lesson.plausible}</p>
            </Card>
            <Card>
              <CardTitle>Exam tips</CardTitle>
              <ul className="list-disc space-y-1 pl-5 text-[14px] text-muted">{lesson.tips.map((t) => <li key={t}>{t}</li>)}</ul>
            </Card>
          </div>
          {qs.length > 0 && <Button onClick={() => setMode("practice")}>5 · Practise {qs.length} questions, easiest to hardest</Button>}
        </div>
      )}
      {mode === "practice" && <PracticeSession key="p" questions={qs} title={`${lesson.title} — practice`} onDone={() => markTask("grammar")} />}
      {mode === "timed" && <PracticeSession key="t" questions={qs} title={`${lesson.title} — timed`} mode="timed" timeLimitSec={qs.reduce((s, q) => s + q.timeSec, 0)} attemptMode="timed" onDone={() => markTask("grammar")} />}
    </div>
  );
}
