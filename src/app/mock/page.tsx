"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import clsx from "clsx";
import { AlertTriangle, ChevronLeft, ChevronRight, Flag, PenLine, Play, Timer } from "lucide-react";
import type { ExamConfig } from "@/data/plan";
import { WRITING_PROMPTS } from "@/data/plan";
import { topicLabel } from "@/data/taxonomy";
import { db, type MockRecord } from "@/lib/db";
import { markTask } from "@/lib/engine";
import { getPrefs } from "@/lib/mission";
import { examConfigs, mockQuestions, startMock, submitMock, SUBJECT_NAME } from "@/lib/mock";
import type { Question } from "@/lib/types";
import QuestionCard, { Explanation } from "@/components/QuestionCard";
import { Badge, Button, Card, CardTitle, Loading, PageHeader, Select, Stat, fmtTime, pct } from "@/components/ui";

const MODES = [
  { id: "practice", label: "Practice mock", desc: "No clock pressure (time is still recorded). Full report at the end." },
  { id: "timed", label: "Timed mock", desc: "MCQ section under the exam clock. Auto-submits when time runs out." },
  { id: "full", label: "Full simulation", desc: "Timed MCQs, then the 30-minute written part — like the real day." },
] as const;

function MockHome() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp.get("id") ? Number(sp.get("id")) : null;
  const rec = useLiveQuery(() => (id ? db.mocks.get(id) : undefined), [id]);
  if (id && rec === undefined) return <Loading />;
  if (rec) return rec.status === "active" ? <ExamRunner key={rec.id} rec={rec} /> : <Report rec={rec} onBack={() => router.push("/mock")} />;
  return <Setup onStart={(nid) => router.push(`/mock?id=${nid}`)} />;
}

function Setup({ onStart }: { onStart: (id: number) => void }) {
  const [configs, setConfigs] = useState<ExamConfig[]>([]);
  const [cfgId, setCfgId] = useState("reported-70");
  const [mode, setMode] = useState<MockRecord["mode"]>("timed");
  const [neg, setNeg] = useState(0);
  const [busy, setBusy] = useState(false);
  const history = useLiveQuery(() => db.mocks.orderBy("startedAt").reverse().toArray(), []);
  useEffect(() => { examConfigs().then(setConfigs); getPrefs().then((p) => { setNeg(p.negative); setCfgId(p.examPreset); }); }, []);
  const cfg = configs.find((c) => c.id === cfgId) ?? configs[0];
  const active = history?.find((m) => m.status === "active");

  return (
    <div>
      <PageHeader eyebrow="Mock exam" title="Sit a full paper" subtitle="Questions are drawn across every topic at exam difficulty (levels 2–5), avoiding ones you've seen in earlier mocks. You can leave mid-exam and resume; the clock only runs while the exam is open." />
      {active && (
        <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 border-warn/50">
          <div><div className="font-medium">You have an unfinished mock</div><div className="text-[13px] text-muted">{active.configName} · started {new Date(active.startedAt).toLocaleString()}</div></div>
          <Button onClick={() => onStart(active.id!)}><Play size={14} /> Resume</Button>
        </Card>
      )}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle>Exam format</CardTitle>
          {cfg && (
            <>
              <Select value={cfgId} onChange={setCfgId} options={configs.map((c) => ({ value: c.id, label: c.name }))} />
              <p className="mt-2 text-[13px] text-muted">{cfg.note}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cfg.sections.map((s) => <Badge key={s.subject}>{SUBJECT_NAME[s.subject]} · {s.count}</Badge>)}
                <Badge tone="accent">{cfg.totalMinutes} min</Badge>
                <Badge tone={neg ? "warn" : "neutral"}>{neg ? `−${neg} per wrong answer` : "No negative marking"}</Badge>
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-[12px] text-muted"><AlertTriangle size={13} className="mt-0.5 shrink-0" />Negative marking is reported (usually 0.25) but not confirmed by an official source, so it is off unless you switch it on in Settings.</p>
            </>
          )}
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {MODES.map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)} className={clsx("rounded-xl border p-3 text-left transition-colors", mode === m.id ? "border-accent bg-accent-soft" : "border-line hover:border-accent/50")}>
                <div className="text-[14px] font-medium">{m.label}</div>
                <div className="mt-0.5 text-[12px] text-muted">{m.desc}</div>
              </button>
            ))}
          </div>
          <Button className="mt-5" disabled={!cfg || busy} onClick={async () => { setBusy(true); onStart(await startMock({ ...cfg!, negative: neg }, mode)); }}>
            <Timer size={15} /> {busy ? "Preparing paper…" : "Start the exam"}
          </Button>
        </Card>
        <Card>
          <CardTitle>Past mocks</CardTitle>
          {history?.filter((m) => m.status === "done").length ? (
            <ul className="divide-y divide-line">
              {history.filter((m) => m.status === "done").map((m) => (
                <li key={m.id}>
                  <button onClick={() => onStart(m.id!)} className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-[13.5px] hover:text-accent">
                    <span><span className="font-medium">{new Date(m.startedAt).toLocaleDateString()}</span> <span className="text-muted">· {m.mode}</span></span>
                    <span className="tabular-nums">{m.score} / {m.qids.length}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p className="text-[14px] text-muted">No completed mocks yet. The plan schedules your first one at the end of week 1.</p>}
        </Card>
      </div>
    </div>
  );
}

function ExamRunner({ rec }: { rec: MockRecord }) {
  const qs = useMemo(() => mockQuestions(rec), [rec.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [m, setM] = useState<MockRecord>(rec);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const qStart = useRef(Date.now());
  const closing = useRef(false);
  const timed = m.mode !== "practice";
  const remaining = m.durationSec - (m.elapsedSec ?? 0);
  const ref = useRef(m);
  ref.current = m;

  // book time spent on the current question into times[]
  const bank = useCallback((s: MockRecord): MockRecord => {
    const now = Date.now();
    const times = [...s.times];
    times[s.current] = (times[s.current] ?? 0) + (now - qStart.current);
    qStart.current = now;
    return { ...s, times };
  }, []);

  const finish = useCallback(async (auto: boolean) => {
    if (closing.current) return;
    closing.current = true;
    setSubmitting(true);
    const final = bank(ref.current);
    await submitMock(final, auto);
    await markTask("final");
  }, [bank]);

  useEffect(() => {
    const t = setInterval(() => {
      setM((s) => ({ ...s, elapsedSec: (s.elapsedSec ?? 0) + 1 }));
    }, 1000);
    const save = setInterval(() => {
      if (closing.current) return;
      const next = bank(ref.current);
      setM((s) => ({ ...s, times: next.times }));
      db.mocks.put({ ...next, status: "active" });
    }, 5000);
    return () => { clearInterval(t); clearInterval(save); };
  }, [bank]);

  useEffect(() => {
    if (timed && remaining <= 0 && !submitting) finish(true);
  }, [remaining, timed, submitting, finish]);

  const go = (i: number) => { if (closing.current) return; const s = bank(m); const next = { ...s, current: Math.max(0, Math.min(qs.length - 1, i)) }; setM(next); db.mocks.put(next); };
  const choose = (c: number | null) => setM((s) => ({ ...s, answers: s.answers.map((a, i) => (i === s.current ? c : a)) }));
  const toggleMark = () => setM((s) => ({ ...s, marked: s.marked.map((x, i) => (i === s.current ? !x : x)) }));

  if (submitting) return <Loading label="Marking your paper…" />;
  const q = qs[m.current];
  const answered = m.answers.filter((a) => a !== null).length;
  const sections = [...new Set(qs.map((x) => x.subject))];

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-3 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium">{m.configName}</div>
          <div className="text-[12px] text-muted">{answered}/{qs.length} answered · {m.marked.filter(Boolean).length} marked</div>
        </div>
        <span className={clsx("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[15px] font-semibold tabular-nums", timed && remaining < 300 ? "bg-bad/12 text-bad" : "bg-surface-2")}>
          <Timer size={15} /> {timed ? fmtTime(remaining * 1000) : fmtTime((m.elapsedSec ?? 0) * 1000)}
        </span>
        <Button onClick={() => setConfirm(true)}>Submit</Button>
      </div>

      {confirm && (
        <Card className="mb-4 border-warn/60">
          <div className="font-medium">Submit the paper?</div>
          <p className="mt-1 text-[14px] text-muted">{qs.length - answered} unanswered{m.marked.some(Boolean) ? `, ${m.marked.filter(Boolean).length} marked for review` : ""}. {m.negative ? `Wrong answers cost ${m.negative}; blanks cost nothing.` : ""}</p>
          <div className="mt-3 flex gap-2"><Button onClick={() => finish(false)}>Submit now</Button><Button variant="secondary" onClick={() => setConfirm(false)}>Keep working</Button></div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <Card className="p-5 sm:p-7">
          <QuestionCard key={q.id + m.current} q={q} mode="exam" index={m.current} total={qs.length} selected={m.answers[m.current]} onSelect={choose} />
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => go(m.current - 1)} disabled={m.current === 0}><ChevronLeft size={15} /> Previous</Button>
            <Button onClick={() => go(m.current + 1)} disabled={m.current === qs.length - 1}>Next <ChevronRight size={15} /></Button>
            <Button variant={m.marked[m.current] ? "primary" : "ghost"} onClick={toggleMark}><Flag size={14} /> {m.marked[m.current] ? "Marked" : "Mark for review"}</Button>
            {m.answers[m.current] !== null && <Button variant="ghost" onClick={() => choose(null)}>Clear answer</Button>}
          </div>
        </Card>
        <Card className="h-fit p-4">
          {sections.map((s) => (
            <div key={s} className="mb-4 last:mb-0">
              <div className="mb-2 text-[12px] font-medium uppercase tracking-wider text-muted">{SUBJECT_NAME[s]}</div>
              <div className="grid grid-cols-6 gap-1.5">
                {qs.map((x, i) => x.subject !== s ? null : (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    aria-label={`Question ${i + 1}`}
                    className={clsx(
                      "relative h-8 rounded-md border text-[12px] tabular-nums",
                      i === m.current ? "border-accent ring-2 ring-accent/40" : "border-line",
                      m.answers[i] !== null ? "bg-accent text-accent-ink" : "bg-surface",
                    )}
                  >
                    {i + 1}
                    {m.marked[i] && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-warn" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-3 space-y-1 text-[11.5px] text-muted">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-accent" /> answered</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-line" /> not answered</div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-warn" /> marked for review</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Report({ rec, onBack }: { rec: MockRecord; onBack: () => void }) {
  const qs = useMemo(() => mockQuestions(rec), [rec]);
  const [open, setOpen] = useState<number | null>(null);
  const correct = qs.filter((q, i) => rec.answers[i] === q.answer).length;
  const blank = rec.answers.filter((a) => a === null).length;
  const wrong = qs.length - correct - blank;
  const totalMs = rec.times.reduce((s, t) => s + t, 0);
  const topics = useMemo(() => {
    const t: Record<string, { c: number; n: number }> = {};
    qs.forEach((q, i) => { (t[q.topic] ??= { c: 0, n: 0 }).n++; if (rec.answers[i] === q.answer) t[q.topic].c++; });
    return Object.entries(t).filter(([, v]) => v.n >= 2).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n);
  }, [qs, rec]);
  const slow = qs.map((q, i) => ({ q, i, t: rec.times[i] })).filter((x) => x.t > x.q.timeSec * 1600).sort((a, b) => b.t - a.t);

  const recs: string[] = [];
  const secs = Object.entries(rec.sectionScores ?? {});
  const weakSec = secs.sort((a, b) => a[1].score / a[1].max - b[1].score / b[1].max)[0];
  if (weakSec) recs.push(`Your weakest section was ${SUBJECT_NAME[weakSec[0] as Question["subject"]]} (${pct(Math.max(0, weakSec[1].score) / weakSec[1].max)}). Each section has its own minimum, so lift this one first.`);
  if (topics[0] && topics[0][1].c / topics[0][1].n < 0.5) recs.push(`Re-learn ${topics.slice(0, 3).filter(([, v]) => v.c / v.n < 0.5).map(([t]) => topicLabel(t)).join(", ")} — they're in your Mistake Notebook now.`);
  if (slow.length >= 3) recs.push(`${slow.length} questions took over 1.6× the target time. Practise skipping: if you're not on a clear path after the target time, mark it and move on.`);
  if (rec.negative && wrong > blank) recs.push(`With −${rec.negative} per wrong answer, guess only when you can eliminate at least one option (with four options and two eliminated, a guess has positive expected value).`);
  if (blank > qs.length * 0.15) recs.push(`${blank} questions were left blank — take a timed sectional set each day to build pace.`);
  if (!recs.length) recs.push("Solid paper. Keep the daily routine and take another full simulation in 3–4 days.");

  return (
    <div className="fade-in">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-3">← Mock exams</Button>
      <PageHeader eyebrow={`${rec.mode} mock · ${new Date(rec.startedAt).toLocaleString()}`} title={`Score ${rec.score} / ${qs.length}`} subtitle={`${rec.configName}${rec.autoSubmitted ? " · auto-submitted when time ran out" : ""}${rec.negative ? ` · −${rec.negative} per wrong answer` : " · no negative marking"}`} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Accuracy (answered)" value={correct + wrong ? pct(correct / (correct + wrong)) : "—"} />
        <Stat label="Correct · wrong · blank" value={<span><span className="text-good">{correct}</span> · <span className="text-bad">{wrong}</span> · <span className="text-muted">{blank}</span></span>} />
        <Stat label="Time used" value={fmtTime(totalMs)} hint={`of ${Math.round(rec.durationSec / 60)} min`} />
        <Stat label="Avg per question" value={fmtTime(totalMs / qs.length)} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle>By section</CardTitle>
          <table className="w-full text-[13.5px]">
            <thead className="text-left text-[12px] text-muted"><tr><th className="pb-2">Section</th><th>Score</th><th>✓</th><th>✗</th><th>—</th></tr></thead>
            <tbody>
              {Object.entries(rec.sectionScores ?? {}).map(([s, v]) => (
                <tr key={s} className="border-t border-line"><td className="py-2">{SUBJECT_NAME[s as Question["subject"]]}</td><td className="tabular-nums">{v.score} / {v.max} <span className="text-muted">({pct(Math.max(0, v.score) / v.max)})</span></td><td className="text-good">{v.correct}</td><td className="text-bad">{v.wrong}</td><td className="text-muted">{v.blank}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[12px] text-muted">IBA requires a minimum in each section, but the cut-offs are not published, so no pass/fail is shown.</p>
        </Card>
        <Card>
          <CardTitle>What to do next</CardTitle>
          <ul className="list-disc space-y-1.5 pl-5 text-[14px]">{recs.map((r) => <li key={r}>{r}</li>)}</ul>
          {topics.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{topics.slice(0, 8).map(([t, v]) => <Badge key={t} tone={v.c / v.n >= 0.7 ? "good" : v.c / v.n >= 0.4 ? "warn" : "bad"}>{topicLabel(t)} {v.c}/{v.n}</Badge>)}</div>}
        </Card>
      </div>
      {rec.mode === "full" && <WritingSection rec={rec} />}
      <Card className="mt-5">
        <CardTitle right={slow.length ? <Badge tone="warn">{slow.length} slow</Badge> : null}>Question review</CardTitle>
        <div className="divide-y divide-line rounded-xl border border-line">
          {qs.map((q, i) => {
            const a = rec.answers[i];
            const isSlow = rec.times[i] > q.timeSec * 1600;
            return (
              <div key={i}>
                <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13.5px] hover:bg-surface-2">
                  <span className={clsx("h-2 w-2 shrink-0 rounded-full", a === q.answer ? "bg-good" : a === null ? "bg-muted" : "bg-bad")} />
                  <span className="w-9 text-muted">Q{i + 1}</span>
                  <span className="flex-1 truncate">{q.stem.replace(/\*\*|\[|\]/g, "").split("\n")[0]}</span>
                  {isSlow && <Badge tone="warn">slow</Badge>}
                  <span className="tabular-nums text-muted">{fmtTime(rec.times[i])}</span>
                </button>
                {open === i && (
                  <div className="px-4 pb-4">
                    <div className="text-[13px] text-muted">Your answer: {a === null ? "—" : q.options[a]} · Correct: {q.options[q.answer]} · {topicLabel(q.topic)}</div>
                    <Explanation q={q} chosen={a} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function WritingSection({ rec }: { rec: MockRecord }) {
  const [prompt] = useState(rec.writing?.prompt ?? WRITING_PROMPTS[(rec.id ?? 0) % WRITING_PROMPTS.length]);
  const [text, setText] = useState(rec.writing?.text ?? "");
  const [running, setRunning] = useState(false);
  const [secs, setSecs] = useState(rec.writing?.seconds ?? 0);
  const left = 30 * 60 - secs;
  useEffect(() => {
    if (!running || left <= 0) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running, left]);
  useEffect(() => {
    const t = setTimeout(() => db.mocks.update(rec.id!, { writing: { prompt, text, seconds: secs } }), 800);
    return () => clearTimeout(t);
  }, [text, secs, prompt, rec.id]);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const locked = left <= 0;
  return (
    <Card className="mt-5">
      <CardTitle icon={<PenLine size={16} className="text-accent" />} right={<span className={clsx("rounded-lg px-2 py-1 text-[13px] font-medium tabular-nums", left < 300 ? "bg-bad/12 text-bad" : "bg-surface-2")}>{fmtTime(Math.max(0, left) * 1000)}</span>}>Written part · 30 minutes</CardTitle>
      <p className="mb-3 font-serif text-[16px]">{prompt}</p>
      {!running && !locked && <Button onClick={() => setRunning(true)} className="mb-3"><Play size={14} /> {secs ? "Continue writing" : "Start the 30-minute clock"}</Button>}
      <textarea value={text} onFocus={() => !locked && setRunning(true)} onChange={(e) => { setText(e.target.value); if (!running) setRunning(true); }} disabled={locked} rows={12} className="w-full rounded-xl border border-line bg-surface p-3 text-[15px] leading-relaxed outline-none focus:border-accent disabled:opacity-70" placeholder="Tap here to start writing (the clock starts with you). Plan for 3 minutes, write for 22, proofread for 5." />
      <div className="mt-2 flex justify-between text-[12.5px] text-muted"><span>{words} words</span>{locked && <span className="text-bad">Time's up — writing is locked.</span>}</div>
      <details className="mt-3 text-[13.5px]">
        <summary className="cursor-pointer font-medium">Self-check (the written part isn't auto-graded)</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>Clear position in the first two sentences?</li>
          <li>Two or three reasons, each with a concrete example (ideally from Bangladesh)?</li>
          <li>One paragraph per idea, with a linking word at the start of each?</li>
          <li>Subject-verb agreement, articles and tense checked in the last five minutes?</li>
          <li>A conclusion that restates the position without repeating sentences?</li>
        </ul>
        <p className="mt-2 text-muted">For feedback, paste your answer into the AI Tutor in "Writing feedback" mode.</p>
      </details>
    </Card>
  );
}

export default function Page() {
  return <Suspense fallback={<Loading />}><MockHome /></Suspense>;
}
