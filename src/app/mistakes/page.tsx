"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import clsx from "clsx";
import { Bookmark, CalendarClock, RotateCcw } from "lucide-react";
import { db, type Mistake } from "@/lib/db";
import { getQuestion } from "@/lib/bank";
import { adaptiveSet, markTask, mistakeQuestions } from "@/lib/engine";
import { topicLabel } from "@/data/taxonomy";
import { MISTAKE_CAUSES, type MistakeCause, type Question, type Subject } from "@/lib/types";
import PracticeSession from "@/components/PracticeSession";
import { Explanation } from "@/components/QuestionCard";
import { Badge, Button, Card, Empty, Loading, PageHeader, Select, Stat, Tabs } from "@/components/ui";
import { SUBJECT_NAME } from "@/lib/mock";

type Tab = "list" | "review" | "bookmarks";

function Mistakes() {
  const sp = useSearchParams();
  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) ?? "list");
  const [subject, setSubject] = useState("all");
  const [cause, setCause] = useState("all");
  const [status, setStatus] = useState<"open" | "due" | "resolved" | "all">("open");
  const [open, setOpen] = useState<string | null>(null);
  const [running, setRunning] = useState<{ title: string; qs: Question[] } | null>(null);
  const rows = useLiveQuery(() => db.mistakes.toArray(), []);
  const bookmarks = useLiveQuery(async () => (await db.bookmarks.toArray()).sort((a, b) => b.at - a.at), []);
  const now = Date.now();

  const filtered = useMemo(() => (rows ?? [])
    .filter((m) => subject === "all" || m.subject === subject)
    .filter((m) => cause === "all" || m.cause === cause)
    .filter((m) => status === "all" || (status === "resolved" ? m.resolved : !m.resolved && (status === "open" || m.due <= now)))
    .sort((a, b) => a.due - b.due), [rows, subject, cause, status, now]);

  const due = (rows ?? []).filter((m) => !m.resolved && m.due <= now).length;
  const byCause = useMemo(() => {
    const c: Record<string, number> = {};
    for (const m of rows ?? []) if (!m.resolved) c[m.cause] = (c[m.cause] ?? 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  async function startReview() {
    const qs = await mistakeQuestions(20);
    setRunning({ title: `Revision · ${qs.length} due`, qs });
  }
  async function similar(m: Mistake) {
    setRunning({ title: `Similar to your mistake · ${topicLabel(m.topic)}`, qs: await adaptiveSet({ topic: m.topic, count: 5, avoidRecent: true }) });
  }

  if (running) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setRunning(null)} className="mb-3">← Mistake Notebook</Button>
        <PageHeader title={running.title} subtitle="Three correct reviews in a row (1 → 3 → 7 days apart) and a mistake is marked resolved. A new miss resets it to tomorrow." />
        {running.qs.length ? (
          <PracticeSession questions={running.qs} title={running.title} attemptMode="revision" onDone={() => markTask("mistakes")} />
        ) : <Empty title="Nothing due right now">Come back tomorrow — or practise similar questions from the list.</Empty>}
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Mistake Notebook" title="Every miss, scheduled to come back" subtitle="Wrong answers and very slow correct answers land here automatically. They return 1, 3, 7, 14 and 30 days later until you get them right three times in a row." actions={<Button onClick={startReview} disabled={!due}><RotateCcw size={15} /> Revise {due} due</Button>} />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Due today" value={due} tone={due ? "warn" : undefined} />
        <Stat label="Open" value={(rows ?? []).filter((m) => !m.resolved).length} />
        <Stat label="Resolved" value={(rows ?? []).filter((m) => m.resolved).length} tone="good" />
        <Stat label="Top cause" value={<span className="text-[16px]">{byCause[0] ? MISTAKE_CAUSES.find((c) => c.id === byCause[0][0])?.label : "—"}</span>} />
      </div>
      <Tabs<Tab> value={tab} onChange={(t) => (t === "review" ? startReview() : setTab(t))} tabs={[{ id: "list", label: "All mistakes" }, { id: "review", label: `Review due (${due})` }, { id: "bookmarks", label: `Bookmarks (${bookmarks?.length ?? 0})` }]} />

      {tab === "list" && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Select label="Section" value={subject} onChange={setSubject} options={[{ value: "all", label: "All sections" }, ...(["english", "quant", "analytical"] as Subject[]).map((s) => ({ value: s, label: SUBJECT_NAME[s] }))]} />
            <Select label="Cause" value={cause} onChange={setCause} options={[{ value: "all", label: "All causes" }, ...MISTAKE_CAUSES.map((c) => ({ value: c.id, label: c.label }))]} />
            <Select label="Status" value={status} onChange={(v) => setStatus(v as typeof status)} options={[{ value: "open", label: "Open" }, { value: "due", label: "Due now" }, { value: "resolved", label: "Resolved" }, { value: "all", label: "All" }]} />
          </div>
          {!rows ? <Loading /> : !filtered.length ? (
            <Empty title={rows.length ? "No mistakes match these filters" : "No mistakes yet"}>{rows.length ? "Try another filter." : "Answer some questions — anything you get wrong (or take far too long on) is saved here with its explanation."}</Empty>
          ) : (
            <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {filtered.map((m) => <MistakeRow key={m.qid} m={m} open={open === m.qid} onToggle={() => setOpen(open === m.qid ? null : m.qid)} onSimilar={() => similar(m)} />)}
            </div>
          )}
        </>
      )}

      {tab === "bookmarks" && (
        !bookmarks?.length ? <Empty title="No bookmarks">Tap the bookmark icon on any question to save it here.</Empty> : (
          <div className="space-y-4">
            <Button variant="secondary" onClick={() => setRunning({ title: "Bookmarked questions", qs: bookmarks.map((b) => getQuestion(b.qid)).filter(Boolean) as Question[] })}><Bookmark size={14} /> Practise all bookmarks</Button>
            {bookmarks.map((b) => {
              const q = getQuestion(b.qid);
              return q ? (
                <Card key={b.qid} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1"><div className="truncate text-[14px]">{q.stem.replace(/\*\*|\[|\]/g, "").split("\n")[0]}</div><Badge tone="accent" className="mt-1">{topicLabel(q.topic)}</Badge></div>
                  <Button size="sm" variant="ghost" onClick={() => db.bookmarks.delete(b.qid)}>Remove</Button>
                </Card>
              ) : null;
            })}
          </div>
        )
      )}
    </div>
  );
}

function MistakeRow({ m, open, onToggle, onSimilar }: { m: Mistake; open: boolean; onToggle: () => void; onSimilar: () => void }) {
  const q = getQuestion(m.qid);
  const [note, setNote] = useState(m.note);
  const overdue = !m.resolved && m.due <= Date.now();
  if (!q) return null;
  return (
    <div>
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2/60">
        <span className={clsx("h-2 w-2 shrink-0 rounded-full", m.resolved ? "bg-good" : overdue ? "bg-warn" : "bg-bad")} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px]">{q.stem.replace(/\*\*|\[|\]/g, "").split("\n")[0]}</div>
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            <Badge tone="accent">{topicLabel(m.topic)}</Badge>
            <Badge>{MISTAKE_CAUSES.find((c) => c.id === m.cause)?.label}</Badge>
            {m.slow && <Badge tone="warn">slow</Badge>}
            {m.wrongCount > 1 && <Badge tone="bad">missed {m.wrongCount}×</Badge>}
          </div>
        </div>
        <div className="hidden shrink-0 text-right text-[12px] text-muted sm:block">
          <div className="flex items-center justify-end gap-1"><CalendarClock size={12} />{m.resolved ? "resolved" : overdue ? "due now" : new Date(m.due).toLocaleDateString()}</div>
          <div>streak {m.rightStreak}/3</div>
        </div>
      </button>
      {open && (
        <div className="space-y-3 px-4 pb-4">
          <div className="text-[13px] text-muted">Your answer: {m.chosen === null ? "— (skipped / timed out)" : q.options[m.chosen]} · Correct: <span className="text-good">{q.options[q.answer]}</span></div>
          <Explanation q={q} chosen={m.chosen} />
          <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
            <Select label="Cause" value={m.cause} onChange={(v) => db.mistakes.update(m.qid, { cause: v as MistakeCause })} options={MISTAKE_CAUSES.map((c) => ({ value: c.id, label: c.label }))} />
            <label className="flex flex-col gap-1 text-[13px] text-muted">
              Your note (what to do differently)
              <textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => db.mistakes.update(m.qid, { note })} rows={2} className="rounded-xl border border-line bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-accent" />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={onSimilar}>Practise 5 similar</Button>
            {!m.resolved ? <Button size="sm" variant="ghost" onClick={() => db.mistakes.update(m.qid, { resolved: true })}>Mark resolved</Button> : <Button size="sm" variant="ghost" onClick={() => db.mistakes.update(m.qid, { resolved: false, due: Date.now(), rightStreak: 0 })}>Reopen</Button>}
            <span className="self-center text-[12px] text-muted">First missed {new Date(m.firstAt).toLocaleDateString()} · next interval {m.interval} day(s)</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<Loading />}><Mistakes /></Suspense>;
}
