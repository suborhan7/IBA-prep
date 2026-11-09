"use client";
import clsx from "clsx";
import { Volume2 } from "lucide-react";
import type { VocabWord } from "@/lib/types";
import { Badge } from "./ui";

export function speak(word: string) {
  try {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "en-GB";
    u.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {}
}

/** Radial network: synonyms (green) on the upper arc, antonyms (red) on the lower arc. */
export function SemanticNetwork({ w, size = 340 }: { w: VocabWord; size?: number }) {
  const cx = size / 2, cy = size / 2, R = size * 0.36;
  const place = (items: string[], from: number, to: number) =>
    items.map((t, i) => {
      const a = items.length === 1 ? (from + to) / 2 : from + ((to - from) * i) / (items.length - 1);
      return { t, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });
  const syn = place(w.synonyms, Math.PI * 1.1, Math.PI * 1.9);
  const ant = place(w.antonyms, Math.PI * 0.2, Math.PI * 0.8);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[360px]" role="img" aria-label={`Synonyms and antonyms of ${w.word}`}>
      {syn.map((n) => <line key={"ls" + n.t} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke="var(--good)" strokeOpacity={0.45} strokeWidth={1.5} />)}
      {ant.map((n) => <line key={"la" + n.t} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke="var(--bad)" strokeOpacity={0.45} strokeWidth={1.5} strokeDasharray="4 3" />)}
      <circle cx={cx} cy={cy} r={size * 0.13} fill="var(--accent)" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={size * 0.045} fontWeight={600} fill="var(--accent-text)">{w.word}</text>
      {syn.map((n) => (
        <g key={"s" + n.t}>
          <rect x={n.x - 46} y={n.y - 13} width={92} height={26} rx={13} fill="var(--surface)" stroke="var(--good)" />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={11.5} fill="var(--good)">{n.t}</text>
        </g>
      ))}
      {ant.map((n) => (
        <g key={"a" + n.t}>
          <rect x={n.x - 46} y={n.y - 13} width={92} height={26} rx={13} fill="var(--surface)" stroke="var(--bad)" />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={11.5} fill="var(--bad)">{n.t}</text>
        </g>
      ))}
      <text x={8} y={16} fontSize={10.5} fill="var(--good)">— synonyms</text>
      <text x={8} y={size - 8} fontSize={10.5} fill="var(--bad)">- - antonyms</text>
    </svg>
  );
}

export default function WordCard({ w, status, compact }: { w: VocabWord; status?: string; compact?: boolean }) {
  return (
    <div className="fade-in">
      <div className="flex flex-wrap items-start gap-4">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-accent-soft text-[40px]" aria-hidden>{w.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-[28px] font-semibold leading-none">{w.word}</h3>
            <button onClick={() => speak(w.word)} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Pronounce"><Volume2 size={17} /></button>
            {status && <Badge tone={status === "mastered" ? "good" : status === "revise" ? "bad" : status === "new" ? "neutral" : "accent"} className="capitalize">{status}</Badge>}
          </div>
          <div className="mt-1 text-[13.5px] text-muted">{w.ipa} · <i>{w.pos}</i></div>
          <div className="mt-2 text-[16px]">{w.definition}</div>
          <div className="mt-1 text-[15px] text-accent">বাংলা: {w.bengali}</div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-surface-2/40 p-3 text-[14px]">
        <span className="font-medium">Picture it: </span>{w.visual}
      </div>

      {!compact && (
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-3 text-[14px]">
            <div><span className="font-medium">Examples</span>
              <ul className="mt-1 space-y-1 text-muted">{w.examples.map((e) => <li key={e} className="font-serif text-[15px]">“{e.split(new RegExp(`(${w.word}\\w*)`, "i")).map((s, i) => i % 2 ? <b key={i} className="text-ink">{s}</b> : s)}”</li>)}</ul>
            </div>
            <div className="flex flex-wrap gap-1.5"><span className="font-medium">Collocations:</span>{w.collocations.map((c) => <Badge key={c}>{c}</Badge>)}</div>
            <div className="flex flex-wrap gap-1.5"><span className="font-medium">Word family:</span>{w.family.length ? w.family.map((c) => <Badge key={c} tone="accent">{c}</Badge>) : <span className="text-muted">—</span>}</div>
            {w.root && <div><span className="font-medium">Root: </span><span className="text-muted">{w.root}</span></div>}
            <div><span className="font-medium">Common mistake: </span><span className="text-muted">{w.mistakes}</span></div>
            <div className="rounded-lg bg-warn/10 px-3 py-2"><span className="font-medium text-warn">Memory hook: </span>{w.memory}</div>
          </div>
          <SemanticNetwork w={w} />
        </div>
      )}
    </div>
  );
}

export function statusTone(s?: string) {
  return clsx(s === "mastered" && "text-good", s === "revise" && "text-bad");
}
