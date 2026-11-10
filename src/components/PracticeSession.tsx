"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import type { Question } from "@/lib/types";
import type { AttemptMode } from "@/lib/db";
import { getSetting, setSetting, withTimeout } from "@/lib/db";
import { recordAnswer, recordAnswers } from "@/lib/engine";
import { getQuestion } from "@/lib/bank";
import { loadCustom } from "@/lib/custom-registry";
import { logProblem } from "@/lib/health";
import { topicLabel } from "@/data/taxonomy";
import QuestionCard, { Explanation } from "./QuestionCard";
import { Badge, Button, Card, Progress, fmtTime, pct } from "./ui";

interface Result {
  qid: string;
  chosen: number | null;
  correct: boolean;
  timeMs: number;
}

interface Saved {
  qids: string[];
  idx: number;
  results: Result[];
  choices?: (number | null)[];
  times?: number[];
}

/**
 * Runs a list of questions.
 *  - practice: instant feedback after each question
 *  - timed: no feedback until the end; an overall countdown auto-finishes the set
 * Pass `saveKey` to make the session resumable (pause / come back later).
 */
export default function PracticeSession({
  questions,
  mode = "practice",
  attemptMode = "practice",
  timeLimitSec,
  saveKey,
  title,
  onDone,
}: {
  questions: Question[];
  mode?: "practice" | "timed";
  attemptMode?: AttemptMode;
  timeLimitSec?: number;
  saveKey?: string;
  title?: string;
  onDone?: (results: Result[]) => void;
}) {
  const [qs, setQs] = useState<Question[]>(questions);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [timedChoices, setTimedChoices] = useState<(number | null)[]>([]);
  const [timedTimes, setTimedTimes] = useState<number[]>([]);
  const [remaining, setRemaining] = useState(timeLimitSec ?? 0);
  const [qStart, setQStart] = useState(Date.now());
  const [loaded, setLoaded] = useState(!saveKey);
  const [saveError, setSaveError] = useState<string | null>(null);
  const finishing = useRef(false);
  const done = idx >= qs.length;

  // resume
  useEffect(() => {
    if (!saveKey) return;
    (async () => {
      await withTimeout(loadCustom(), 2500, undefined);
      const s = await withTimeout(getSetting<Saved | null>(saveKey, null), 2500, null);
      if (s && s.idx < s.qids.length) {
        const restored = s.qids.map((id) => getQuestion(id)).filter(Boolean) as Question[];
        if (restored.length === s.qids.length) {
          setQs(restored);
          setIdx(s.idx);
          setResults(s.results);
          if (s.choices) setTimedChoices(s.choices);
          if (s.times) setTimedTimes(s.times);
          // the current question was already checked (e.g. you opened the tutor) → show its result again
          if (mode === "practice" && s.results.length > s.idx) setSubmitted(true);
        }
      }
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveKey]);

  useEffect(() => {
    if (!saveKey || !loaded) return;
    setSetting(saveKey, done ? null : { qids: qs.map((q) => q.id), idx, results, choices: timedChoices, times: timedTimes });
  }, [saveKey, loaded, idx, results, qs, done, timedChoices, timedTimes]);

  // countdown for timed sets
  useEffect(() => {
    if (mode !== "timed" || !timeLimitSec || done || paused) return;
    const t = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [mode, timeLimitSec, done, paused]);

  useEffect(() => {
    if (mode === "timed" && timeLimitSec && remaining <= 0 && !done) finishTimed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const q = qs[idx];

  async function submitPractice(chosen: number | null, timeMs: number) {
    if (!q) return;
    if (submitted) return;
    if (results.length > idx) return setSubmitted(true); // already recorded (resumed set)
    // Show the result immediately; saving to storage happens in the background
    // so a slow or blocked browser database can never freeze the Check button.
    const correct = chosen === q.answer;
    setResults((r) => [...r, { qid: q.id, chosen, correct, timeMs }]);
    setSubmitted(true);
    const t0 = Date.now();
    recordAnswer(q, chosen, timeMs, attemptMode)
      .then(() => { if (Date.now() - t0 > 3000) logProblem(`Saving an answer took ${Math.round((Date.now() - t0) / 1000)} s`); })
      .catch((e) => { setSaveError(String(e?.message ?? e)); logProblem(`Saving an answer failed: ${e?.message ?? e}`); });
  }

  function next() {
    setSubmitted(false);
    setIdx((i) => i + 1);
    setQStart(Date.now());
  }

  function timedNext(chosen: number | null) {
    const spent = Date.now() - qStart;
    const choices = [...timedChoices];
    choices[idx] = chosen;
    const times = [...timedTimes];
    times[idx] = (times[idx] ?? 0) + spent;
    setTimedChoices(choices);
    setTimedTimes(times);
    setQStart(Date.now());
    if (idx + 1 >= qs.length) finishTimed(choices, times);
    else setIdx(idx + 1);
  }

  function finishTimed(choices = timedChoices, times = timedTimes) {
    if (finishing.current) return;
    finishing.current = true;
    const res: Result[] = qs.map((q, i) => {
      const c = choices[i] ?? null;
      return { qid: q.id, chosen: c, correct: c === q.answer, timeMs: times[i] ?? 0 };
    });
    setResults(res);
    setIdx(qs.length);
    recordAnswers(qs.map((q, i) => ({ q, chosen: res[i].chosen, timeMs: res[i].timeMs })), attemptMode).catch((e) => setSaveError(String(e?.message ?? e)));
  }

  useEffect(() => {
    if (done && results.length && onDone) onDone(results);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (!loaded) return null;
  if (!qs.length) return <Card>No questions available for this selection yet.</Card>;

  const saveWarning = saveError && (
    <div className="mb-3 rounded-xl border border-warn/50 bg-warn/10 px-4 py-2 text-[13px]">Your answers are shown, but this browser couldn't save them ({saveError}). Progress for this set may not be kept. See Settings → Storage check.</div>
  );
  if (done) return <>{saveWarning}<SessionSummary qs={qs} results={results} title={title} /></>;

  return (
    <Card className="p-5 sm:p-7">
      {saveWarning}
      <div className="mb-4 flex items-center gap-3">
        <Progress value={(idx / qs.length) * 100} />
        <span className="shrink-0 text-[12.5px] tabular-nums text-muted">{idx}/{qs.length}</span>
        {mode === "timed" && timeLimitSec ? (
          <span className={clsx("flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-medium tabular-nums", remaining < 60 ? "bg-bad/12 text-bad" : "bg-surface-2")}>
            <Timer size={14} /> {fmtTime(remaining * 1000)}
          </span>
        ) : null}
        {mode === "timed" && (
          <Button variant="ghost" size="sm" onClick={() => setPaused((p) => !p)} aria-label={paused ? "Resume" : "Pause"}>
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </Button>
        )}
      </div>
      {paused ? (
        <div className="py-16 text-center">
          <div className="mb-3 text-muted">Paused. The question is hidden while the clock is stopped.</div>
          <Button onClick={() => setPaused(false)}><Play size={15} /> Resume</Button>
        </div>
      ) : mode === "practice" ? (
        <QuestionCard key={q.id} q={q} index={idx} total={qs.length} onSubmit={submitPractice} onNext={next} submitted={submitted} selected={submitted ? results[idx]?.chosen ?? null : undefined} />
      ) : (
        <TimedItem key={q.id} q={q} idx={idx} total={qs.length} onNext={timedNext} onFinish={() => finishTimed()} />
      )}
    </Card>
  );
}

function TimedItem({ q, idx, total, onNext, onFinish }: { q: Question; idx: number; total: number; onNext: (c: number | null) => void; onFinish: () => void }) {
  const [sel, setSel] = useState<number | null>(null);
  return (
    <>
      <QuestionCard q={q} mode="exam" index={idx} total={total} selected={sel} onSelect={setSel} />
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => onNext(sel)}>{idx + 1 === total ? "Finish" : "Next"}</Button>
        <Button variant="ghost" onClick={() => onNext(null)}>Skip</Button>
        <div className="flex-1" />
        <Button variant="secondary" onClick={onFinish}>End set now</Button>
      </div>
    </>
  );
}

export function SessionSummary({ qs, results, title }: { qs: Question[]; results: Result[]; title?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const correct = results.filter((r) => r.correct).length;
  const answered = results.filter((r) => r.chosen !== null).length;
  const totalMs = results.reduce((s, r) => s + r.timeMs, 0);
  const byTopic = useMemo(() => {
    const m: Record<string, { c: number; n: number }> = {};
    results.forEach((r, i) => {
      const t = qs[i]?.topic;
      if (!t) return;
      m[t] = m[t] ?? { c: 0, n: 0 };
      m[t].n++;
      if (r.correct) m[t].c++;
    });
    return Object.entries(m).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n);
  }, [qs, results]);
  const slow = results.map((r, i) => ({ r, q: qs[i] })).filter(({ r, q }) => q && r.timeMs > q.timeSec * 1600);

  return (
    <Card className="p-5 sm:p-7 fade-in">
      <div className="mb-1 text-[12px] font-medium uppercase tracking-wider text-accent">Set complete</div>
      <h2 className="font-serif text-[24px] font-semibold">{title ?? "Results"}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div><div className="text-[12px] text-muted">Score</div><div className="text-[22px] font-semibold tabular-nums">{correct}/{qs.length}</div></div>
        <div><div className="text-[12px] text-muted">Accuracy (answered)</div><div className="text-[22px] font-semibold tabular-nums">{answered ? pct(correct / answered) : "—"}</div></div>
        <div><div className="text-[12px] text-muted">Total time</div><div className="text-[22px] font-semibold tabular-nums">{fmtTime(totalMs)}</div></div>
        <div><div className="text-[12px] text-muted">Avg / question</div><div className="text-[22px] font-semibold tabular-nums">{fmtTime(totalMs / Math.max(1, results.length))}</div></div>
      </div>
      {byTopic.length > 1 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {byTopic.map(([t, v]) => <Badge key={t} tone={v.c / v.n >= 0.7 ? "good" : v.c / v.n >= 0.4 ? "warn" : "bad"}>{topicLabel(t)} {v.c}/{v.n}</Badge>)}
        </div>
      )}
      {slow.length > 0 && <p className="mt-3 text-[13px] text-warn">{slow.length} question(s) took much longer than the target time — they were added to your Mistake Notebook for speed review.</p>}
      <div className="mt-5 divide-y divide-line rounded-xl border border-line">
        {qs.map((q, i) => {
          const r = results[i];
          if (!r) return null;
          return (
            <div key={q.id + i}>
              <button onClick={() => setOpen(open === q.id ? null : q.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13.5px] hover:bg-surface-2">
                <span className={clsx("h-2 w-2 shrink-0 rounded-full", r.correct ? "bg-good" : r.chosen === null ? "bg-muted" : "bg-bad")} />
                <span className="w-8 text-muted">Q{i + 1}</span>
                <span className="flex-1 truncate">{q.stem.replace(/\*\*|\[|\]/g, "").split("\n")[0]}</span>
                <span className="tabular-nums text-muted">{fmtTime(r.timeMs)}</span>
              </button>
              {open === q.id && (
                <div className="px-4 pb-4">
                  <div className="text-[13px] text-muted">Your answer: {r.chosen === null ? "—" : q.options[r.chosen]} · Correct: {q.options[q.answer]}</div>
                  <Explanation q={q} chosen={r.chosen} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-5"><Button variant="secondary" onClick={() => location.reload()}><RotateCcw size={14} /> New set</Button></div>
    </Card>
  );
}
