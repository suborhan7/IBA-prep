"use client";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Check, Clock, Lightbulb, MessageCircle, X, Zap, AlertTriangle } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import type { Question, MistakeCause } from "@/lib/types";
import { DIFFICULTY_LABEL, MISTAKE_CAUSES, SOURCE_LABEL } from "@/lib/types";
import { db } from "@/lib/db";
import { PASSAGE_BY_ID } from "@/lib/bank";
import { topicLabel } from "@/data/taxonomy";
import { Badge, Button, RichText, fmtTime } from "./ui";
import DataChart from "./DataChart";

const LETTERS = "ABCDE";

export function QuestionMeta({ q }: { q: Question }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone="accent">{topicLabel(q.topic)}</Badge>
      <Badge>L{q.difficulty} · {DIFFICULTY_LABEL[q.difficulty]}</Badge>
      <Badge>{SOURCE_LABEL[q.source]}</Badge>
      <Badge><Clock size={11} /> target {q.timeSec}s</Badge>
    </div>
  );
}

export function Passage({ id }: { id: string }) {
  const p = PASSAGE_BY_ID[id];
  if (!p) return null;
  return (
    <details open className="mb-4 rounded-xl border border-line bg-surface-2/40">
      <summary className="cursor-pointer select-none px-4 py-2.5 text-[13px] font-medium text-muted">
        Passage · {p.title} <span className="font-normal">({p.domain})</span>
      </summary>
      <div className="max-h-[420px] overflow-y-auto px-4 pb-4 font-serif text-[15.5px] leading-relaxed">
        {p.text.split("\n\n").map((para, i) => <p key={i} className="mb-3">{para}</p>)}
      </div>
    </details>
  );
}

export function Explanation({ q, chosen }: { q: Question; chosen: number | null }) {
  const [tab, setTab] = useState<"exp" | "fast" | "short" | "traps">("exp");
  const tabs = [
    { id: "exp" as const, label: "Step-by-step", show: true },
    { id: "fast" as const, label: "Fastest method", show: !!(q.fastest || q.mental) },
    { id: "short" as const, label: "Shortcut", show: !!q.shortcut },
    { id: "traps" as const, label: "Traps", show: !!q.traps?.length || chosen !== null },
  ].filter((t) => t.show);
  return (
    <div className="mt-4 rounded-xl border border-line bg-surface-2/40 p-4 fade-in">
      <div className="mb-3 flex flex-wrap gap-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={clsx("rounded-lg px-2.5 py-1 text-[12.5px]", tab === t.id ? "bg-surface font-medium shadow-sm" : "text-muted hover:text-ink")}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="text-[14.5px] leading-relaxed">
        {tab === "exp" && <RichText text={q.explanation} />}
        {tab === "fast" && (
          <div className="space-y-2">
            {q.fastest && <p className="flex gap-2"><Zap size={16} className="mt-0.5 shrink-0 text-accent" /><span>{q.fastest}</span></p>}
            {q.mental && <p className="flex gap-2"><Lightbulb size={16} className="mt-0.5 shrink-0 text-warn" /><span><b>Mental route:</b> {q.mental}</span></p>}
          </div>
        )}
        {tab === "short" && q.shortcut && (
          <div className="space-y-2">
            <p><b>Trick:</b> {q.shortcut.trick}</p>
            <p><b>Why it works:</b> {q.shortcut.why}</p>
            <p className="text-warn"><b>When NOT to use it:</b> {q.shortcut.whenNot}</p>
          </div>
        )}
        {tab === "traps" && (
          <div className="space-y-2">
            {chosen !== null && chosen !== q.answer && (
              <p className="flex gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-bad" /><span>You chose <b>{LETTERS[chosen]}. {q.options[chosen]}</b>. Compare it with the explanation — what made it look right?</span></p>
            )}
            {q.traps?.filter(Boolean).map((t, i) => <p key={i}>• {t}</p>)}
          </div>
        )}
      </div>
      {q.objective && <div className="mt-3 text-[12.5px] text-muted">Learning objective: {q.objective}</div>}
    </div>
  );
}

export function CausePicker({ qid }: { qid: string }) {
  const m = useLiveQuery(() => db.mistakes.get(qid), [qid]);
  if (!m) return null;
  const set = (cause: MistakeCause) => db.mistakes.update(qid, { cause });
  return (
    <div className="mt-3">
      <div className="mb-1.5 text-[12.5px] text-muted">Why did this go wrong? (saved to your Mistake Notebook)</div>
      <div className="flex flex-wrap gap-1.5">
        {MISTAKE_CAUSES.map((c) => (
          <button key={c.id} onClick={() => set(c.id)} className={clsx("rounded-full border px-2.5 py-1 text-[12px]", m.cause === c.id ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:text-ink")}>
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BookmarkButton({ qid }: { qid: string }) {
  const b = useLiveQuery(() => db.bookmarks.get(qid), [qid]);
  return (
    <button
      onClick={() => (b ? db.bookmarks.delete(qid) : db.bookmarks.put({ qid, at: Date.now() }))}
      className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
      aria-label={b ? "Remove bookmark" : "Bookmark question"}
      title={b ? "Bookmarked" : "Bookmark"}
    >
      {b ? <BookmarkCheck size={18} className="text-accent" /> : <Bookmark size={18} />}
    </button>
  );
}

/**
 * One question. In "practice" the student checks the answer and sees explanations.
 * In "exam" mode the choice is reported upward with no feedback.
 */
export default function QuestionCard({
  q,
  mode = "practice",
  index,
  total,
  selected,
  onSelect,
  onSubmit,
  onNext,
  submitted,
  hideTimer,
}: {
  q: Question;
  mode?: "practice" | "exam";
  index?: number;
  total?: number;
  selected?: number | null;
  onSelect?: (i: number | null) => void;
  onSubmit?: (chosen: number | null, timeMs: number) => void;
  onNext?: () => void;
  submitted?: boolean;
  hideTimer?: boolean;
}) {
  const [local, setLocal] = useState<number | null>(selected ?? null);
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(Date.now());
  const choice = selected !== undefined ? selected : local;

  useEffect(() => {
    start.current = Date.now();
    setElapsed(0);
    setLocal(selected ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id]);

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => setElapsed(Date.now() - start.current), 500);
    return () => clearInterval(t);
  }, [submitted, q.id]);

  const pick = (i: number) => {
    if (submitted) return;
    const v = choice === i ? null : i;
    setLocal(v);
    onSelect?.(v);
  };

  // keyboard: 1-5 / A-E to choose, Enter to check/next
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const k = e.key.toUpperCase();
      const idx = "12345".indexOf(k) >= 0 ? "12345".indexOf(k) : LETTERS.indexOf(k);
      if (idx >= 0 && idx < q.options.length && k.length === 1) pick(idx);
      if (e.key === "Enter") {
        if (!submitted && mode === "practice" && onSubmit) onSubmit(choice, Date.now() - start.current);
        else if (submitted && onNext) onNext();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const over = elapsed > q.timeSec * 1000;

  return (
    <div className="fade-in">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {index !== undefined && <span className="text-[13px] font-medium text-muted">Q{index + 1}{total ? ` / ${total}` : ""}</span>}
          <QuestionMeta q={q} />
        </div>
        <div className="flex items-center gap-1">
          {!hideTimer && !submitted && (
            <span className={clsx("flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] tabular-nums", over ? "bg-warn/15 text-warn" : "text-muted")}>
              <Clock size={13} /> {fmtTime(elapsed)}
            </span>
          )}
          <BookmarkButton qid={q.id} />
        </div>
      </div>

      {q.passageId && <Passage id={q.passageId} />}
      {q.chart && <div className="mb-4"><DataChart spec={q.chart} /></div>}

      <RichText text={q.stem} className="mb-4 text-[16px] leading-relaxed" />

      <div className="space-y-2" role="radiogroup">
        {q.options.map((o, i) => {
          const isAns = i === q.answer;
          const isChosen = choice === i;
          const showResult = submitted && mode === "practice";
          return (
            <button
              key={i}
              role="radio"
              aria-checked={isChosen}
              onClick={() => pick(i)}
              disabled={submitted}
              className={clsx(
                "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[14.5px] transition-colors",
                !showResult && isChosen && "border-accent bg-accent-soft",
                !showResult && !isChosen && "border-line bg-surface hover:border-accent/50",
                showResult && isAns && "border-good bg-good/10",
                showResult && isChosen && !isAns && "border-bad bg-bad/10",
                showResult && !isAns && !isChosen && "border-line opacity-70",
              )}
            >
              <span className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-md border text-[12px] font-semibold", isChosen ? "border-accent text-accent" : "border-line text-muted")}>
                {showResult && isAns ? <Check size={14} className="text-good" /> : showResult && isChosen ? <X size={14} className="text-bad" /> : LETTERS[i]}
              </span>
              <span className="pt-0.5">{o}</span>
            </button>
          );
        })}
      </div>

      {mode === "practice" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!submitted ? (
            <>
              <Button onClick={() => onSubmit?.(choice, Date.now() - start.current)} disabled={choice === null}>Check answer</Button>
              <Button variant="ghost" onClick={() => onSubmit?.(null, Date.now() - start.current)}>Skip / show solution</Button>
              <span className="text-[12px] text-muted">Keys: 1–5 to choose, Enter to check</span>
            </>
          ) : (
            <>
              <div className={clsx("flex items-center gap-1.5 text-[14px] font-medium", choice === q.answer ? "text-good" : "text-bad")}>
                {choice === q.answer ? <><Check size={16} /> Correct</> : choice === null ? "Skipped" : <><X size={16} /> Not quite — the answer is {LETTERS[q.answer]}</>}
              </div>
              <div className="flex-1" />
              <Link href={`/tutor?q=${encodeURIComponent(q.id)}${choice !== null ? `&chosen=${choice}` : ""}`} className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-[13px] hover:bg-surface-2">
                <MessageCircle size={14} /> Ask the tutor
              </Link>
              {onNext && <Button onClick={onNext}>Next</Button>}
            </>
          )}
        </div>
      )}
      {mode === "practice" && submitted && (
        <>
          <Explanation q={q} chosen={choice} />
          {choice !== q.answer && <CausePicker qid={q.id} />}
        </>
      )}
    </div>
  );
}
