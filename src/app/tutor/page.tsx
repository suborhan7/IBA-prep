"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import clsx from "clsx";
import { Bot, Check, Cpu, Send, Sparkles, Trash2, WifiOff, X } from "lucide-react";
import { db, type CustomQuestion } from "@/lib/db";
import { getQuestion } from "@/lib/bank";
import { localReply } from "@/lib/local-tutor";
import { readiness } from "@/lib/engine";
import { TOPICS, topicLabel } from "@/data/taxonomy";
import type { Difficulty, Question, Subject } from "@/lib/types";
import { Badge, Button, Card, CardTitle, Loading, PageHeader, RichText, Select, Tabs } from "@/components/ui";

const MODES = [
  { id: "explain", label: "Explain", hint: "Ask about any concept, or open a question and ask why the answer is right." },
  { id: "hint", label: "Socratic hints", hint: "One hint at a time — the answer stays hidden until you ask for it." },
  { id: "check", label: "Check my working", hint: "Type your steps and final letter; the tutor finds the first wrong step." },
  { id: "vocab", label: "Vocabulary coach", hint: "Type one or more words for meaning, Bengali, synonyms, antonyms and a memory hook." },
  { id: "writing", label: "Writing feedback", hint: "Paste your 30-minute essay or letter." },
  { id: "coach", label: "Study coach", hint: "Uses your topic levels to plan the next few days." },
] as const;
type Mode = (typeof MODES)[number]["id"] | "generate";

interface AIStatus { available: boolean; provider: string; model: string | null }

function questionContext(q: Question, chosen: number | null) {
  return [
    `Question (${topicLabel(q.topic)}, difficulty ${q.difficulty}/6):`,
    q.stem,
    q.options.map((o, i) => `${"ABCDE"[i]}) ${o}`).join("\n"),
    `Correct answer (verified key): ${"ABCDE"[q.answer]}) ${q.options[q.answer]}`,
    chosen !== null ? `Student chose: ${"ABCDE"[chosen]}) ${q.options[chosen]}` : "",
    `App's explanation: ${q.explanation}`,
    q.fastest ? `Fastest method: ${q.fastest}` : "",
  ].filter(Boolean).join("\n");
}

async function statsSummary() {
  const r = await readiness();
  const s = (k: Subject) => r.bySubject[k];
  return [
    `Readiness (internal estimate): ${r.score}/100`,
    `English: level ${s("english").rating.toFixed(1)}, ${Math.round(s("english").accuracy * 100)}% of ${s("english").answered}`,
    `Mathematics: level ${s("quant").rating.toFixed(1)}, ${Math.round(s("quant").accuracy * 100)}% of ${s("quant").answered}`,
    `Analytical: level ${s("analytical").rating.toFixed(1)}, ${Math.round(s("analytical").accuracy * 100)}% of ${s("analytical").answered}`,
    `Weakest topics: ${r.weakest.map((w) => `${topicLabel(w.topic)} (L${w.rating.toFixed(1)})`).join(", ") || "not enough data"}`,
    `Strongest topics: ${r.strongest.map((w) => `${topicLabel(w.topic)} (L${w.rating.toFixed(1)})`).join(", ") || "not enough data"}`,
  ].join("\n");
}

function Tutor() {
  const sp = useSearchParams();
  const qid = sp.get("q");
  const chosen = sp.get("chosen") !== null ? Number(sp.get("chosen")) : null;
  const q = useMemo(() => (qid ? getQuestion(qid) : undefined), [qid]);
  const [mode, setMode] = useState<Mode>((sp.get("mode") as Mode) ?? (q ? "hint" : "explain"));
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [useAI, setUseAI] = useState(true);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const thread = `${mode}:${qid ?? "general"}`;
  const messages = useLiveQuery(() => db.tutor.where("thread").equals(thread).sortBy("at"), [thread]);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { fetch("/api/tutor").then((r) => r.json()).then(setStatus).catch(() => setStatus({ available: false, provider: "none", model: null })); }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages?.length, streaming]);

  const ai = !!status?.available && useAI;

  async function send(text = input) {
    if (!text.trim() || streaming !== null) return;
    setInput("");
    await db.tutor.add({ thread, role: "user", content: text, at: Date.now(), mode });
    const history = [...(messages ?? []), { role: "user" as const, content: text }].map((m) => ({ role: m.role, content: m.content }));
    const stats = mode === "coach" ? await statsSummary() : undefined;
    let reply = "";
    if (ai) {
      setStreaming("");
      try {
        const res = await fetch("/api/tutor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode, messages: history, context: q ? questionContext(q, chosen) : stats }) });
        if (!res.ok || !res.body) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          reply += dec.decode(value, { stream: true });
          setStreaming(reply);
        }
      } catch (e) {
        reply = `${reply}\n\n[Could not reach the AI (${(e as Error).message}). Offline answer below.]\n\n${localReply(mode, text, q, (messages ?? []).filter((m) => m.role === "assistant").length, stats)}`;
      }
      setStreaming(null);
    } else {
      reply = localReply(mode, text, q, (messages ?? []).filter((m) => m.role === "assistant").length, stats);
    }
    await db.tutor.add({ thread, role: "assistant", content: reply, at: Date.now(), mode });
  }

  const modeInfo = MODES.find((m) => m.id === mode);
  const starters: Record<string, string[]> = {
    explain: q ? ["Why is this the right answer?", "Why is my answer wrong?", "Is there a faster way?"] : ["Explain subject-verb agreement with 'either…or'", "How does alligation work?", "What is a 'weaken' question in critical reasoning?"],
    hint: q ? ["Give me a hint", "Another hint", "Show the answer"] : ["Open a question and press 'Ask the tutor' to get hints on it."],
    check: q ? ["My working: … so the answer is B"] : ["Paste a problem and your working."],
    vocab: ["ubiquitous", "mitigate and alleviate — difference?", "pragmatic"],
    writing: ["(paste your essay here)"],
    coach: ["Plan my next 3 days", "Which section should I focus on?"],
  };

  return (
    <div>
      <PageHeader
        eyebrow="AI Tutor"
        title="Ask, get hints, get feedback"
        subtitle="With an AI key on the server, answers come from Claude. Without one, an offline tutor answers from the app's own verified explanations, lessons and word list."
        actions={status && (
          <span className={clsx("inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12.5px]", status.available ? "border-good/40 text-good" : "border-line text-muted")}>
            {status.available ? <><Cpu size={14} /> {status.model}</> : <><WifiOff size={14} /> Offline tutor</>}
          </span>
        )}
      />
      <Tabs<Mode> value={mode} onChange={setMode} tabs={[...MODES.map((m) => ({ id: m.id as Mode, label: m.label })), { id: "generate", label: "Question generator" }]} />

      {mode === "generate" ? <Generator available={!!status?.available} /> : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Card className="flex min-h-[520px] flex-col p-0">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
              <div className="text-[13px] text-muted">{modeInfo?.hint}</div>
              {!!messages?.length && <Button size="sm" variant="ghost" onClick={() => db.tutor.where("thread").equals(thread).delete()}><Trash2 size={13} /> Clear</Button>}
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4" aria-live="polite">
              {!messages ? <Loading /> : !messages.length && streaming === null ? (
                <div className="py-8 text-center text-[14px] text-muted">
                  <Bot size={28} className="mx-auto mb-2 text-accent" />
                  Try one of these:
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {(starters[mode] ?? []).map((s) => <button key={s} onClick={() => (s.startsWith("(") || s.startsWith("Open") || s.startsWith("Paste") || s.includes("…") ? setInput(s.startsWith("(") ? "" : s) : send(s))} className="rounded-full border border-line px-3 py-1.5 text-[13px] hover:border-accent">{s}</button>)}
                  </div>
                </div>
              ) : null}
              {messages?.map((m) => <Bubble key={m.id} role={m.role} text={m.content} />)}
              {streaming !== null && <Bubble role="assistant" text={streaming || "…"} />}
              <div ref={end} />
            </div>
            <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && mode !== "writing") { e.preventDefault(); send(); } }}
                rows={mode === "writing" ? 6 : 2}
                placeholder={mode === "writing" ? "Paste your essay…" : "Type a message (Enter to send, Shift+Enter for a new line)"}
                className="min-w-0 flex-1 resize-none rounded-xl border border-line bg-surface px-3 py-2 text-[14.5px] outline-none focus:border-accent"
              />
              <Button type="submit" disabled={!input.trim() || streaming !== null} aria-label="Send"><Send size={15} /></Button>
            </form>
          </Card>
          <div className="space-y-5">
            {q && (
              <Card>
                <CardTitle right={<Badge tone="accent">{topicLabel(q.topic)}</Badge>}>Current question</CardTitle>
                <RichText text={q.stem} className="text-[14px]" />
                <ol className="mt-2 space-y-1 text-[13.5px]">{q.options.map((o, i) => <li key={i} className={clsx(i === chosen && "font-medium text-accent")}>{"ABCDE"[i]}) {o}</li>)}</ol>
              </Card>
            )}
            <Card>
              <CardTitle>How answers are produced</CardTitle>
              {status?.available ? (
                <>
                  <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} /> Use the AI model</label>
                  <p className="mt-2 text-[12.5px] text-muted">The AI gets the verified answer key and explanation for the current question, so it explains rather than guesses. AI can still make mistakes — the key shown in practice is the one to trust.</p>
                </>
              ) : (
                <p className="text-[13px] text-muted">No AI key is set on the server, so the offline tutor is answering. To enable Claude, set <code>ANTHROPIC_API_KEY</code> in the hosting environment (see the README).</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Bubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  return (
    <div className={clsx("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div className={clsx("max-w-[88%] rounded-2xl px-4 py-2.5 text-[14.5px] leading-relaxed", role === "user" ? "bg-accent text-accent-ink" : "bg-surface-2")}>
        {role === "user" ? <div className="whitespace-pre-wrap">{text}</div> : <RichText text={text} />}
      </div>
    </div>
  );
}

function Generator({ available }: { available: boolean }) {
  const [subject, setSubject] = useState<Subject>("quant");
  const [topic, setTopic] = useState("percent");
  const [difficulty, setDifficulty] = useState("3");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const pending = useLiveQuery(() => db.custom.where("status").equals("pending").toArray(), []);
  const approved = useLiveQuery(() => db.custom.where("status").equals("approved").count(), []);
  const topics = TOPICS.filter((t) => t.subject === subject && t.id !== "rc");

  async function generate() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subject, topic, topicLabel: topicLabel(topic), difficulty: Number(difficulty), count: 3 }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? res.statusText);
      const now = Date.now();
      const rows: CustomQuestion[] = (j.questions as (Question & { checks: string[] })[]).map((d, i) => ({
        id: `ai-${now}-${i}`,
        subject,
        topic,
        difficulty: Number(difficulty) as Difficulty,
        stem: d.stem,
        options: d.options,
        answer: d.answer,
        explanation: d.explanation,
        fastest: d.fastest,
        traps: d.traps,
        timeSec: d.timeSec ?? 60,
        source: "ai-reviewed",
        objective: `Practise ${topicLabel(topic)}`,
        status: "pending",
        checks: d.checks,
        createdAt: now,
      }));
      await db.custom.bulkPut(rows);
      setMsg(`${rows.length} question(s) passed the automatic checks and are waiting for your review below.${j.rejected ? ` ${j.rejected} were discarded because they failed a check.` : ""}`);
    } catch (e) {
      setMsg(`Generation failed: ${(e as Error).message}`);
    }
    setBusy(false);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit">
        <CardTitle icon={<Sparkles size={16} className="text-accent" />}>Generate practice questions</CardTitle>
        {!available ? (
          <p className="text-[13.5px] text-muted">Needs an AI key on the server. Until then, Mathematics already has unlimited computed questions under Quantitative → Fresh.</p>
        ) : (
          <div className="space-y-3">
            <Select label="Section" value={subject} onChange={(v) => { setSubject(v as Subject); setTopic(TOPICS.find((t) => t.subject === v && t.id !== "rc")!.id); }} options={[{ value: "english", label: "English" }, { value: "quant", label: "Mathematics" }, { value: "analytical", label: "Analytical" }]} />
            <Select label="Topic" value={topic} onChange={setTopic} options={topics.map((t) => ({ value: t.id, label: t.label }))} />
            <Select label="Difficulty" value={difficulty} onChange={setDifficulty} options={[1, 2, 3, 4, 5, 6].map((d) => ({ value: String(d), label: `Level ${d}` }))} />
            <Button onClick={generate} disabled={busy}>{busy ? "Writing and checking…" : "Generate 3"}</Button>
            {msg && <p className="text-[13px] text-muted">{msg}</p>}
          </div>
        )}
        <p className="mt-4 text-[12px] text-muted">Every generated question is labelled “AI-generated, reviewed”, never as a past-paper question. It must pass structure checks and an independent re-solve, then you approve it before it enters practice. {approved ?? 0} approved so far.</p>
      </Card>
      <div className="space-y-4">
        {!pending?.length ? <Card><p className="text-[14px] text-muted">No questions waiting for review.</p></Card> : pending.map((p) => (
          <Card key={p.id}>
            <div className="mb-2 flex flex-wrap gap-1.5"><Badge tone="accent">{topicLabel(p.topic)}</Badge><Badge>L{p.difficulty}</Badge>{p.checks.map((c) => <Badge key={c} tone="good"><Check size={11} /> {c}</Badge>)}</div>
            <RichText text={p.stem} className="text-[15px]" />
            <ol className="mt-2 space-y-1 text-[14px]">{p.options.map((o, i) => <li key={i} className={clsx(i === p.answer && "font-medium text-good")}>{"ABCDE"[i]}) {o}{i === p.answer && " ✓"}</li>)}</ol>
            <p className="mt-2 text-[13.5px] text-muted">{p.explanation}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => db.custom.update(p.id, { status: "approved" })}><Check size={13} /> Approve</Button>
              <Button size="sm" variant="secondary" onClick={() => db.custom.update(p.id, { status: "rejected" })}><X size={13} /> Reject</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<Loading />}><Tutor /></Suspense>;
}
