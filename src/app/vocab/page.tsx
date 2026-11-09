"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import clsx from "clsx";
import { Check, Search, Shuffle, X } from "lucide-react";
import { VOCAB, VOCAB_BY_WORD, THEMES } from "@/data/vocab";
import type { VocabWord } from "@/lib/types";
import { db, todayKey, type VocabCard } from "@/lib/db";
import { newCard, sm2 } from "@/lib/srs";
import { vocabQuestion } from "@/lib/bank";
import { getPrefs, savePrefs } from "@/lib/mission";
import { markTask } from "@/lib/engine";
import { hashStr, mulberry32, pick, shuffle } from "@/lib/rng";
import WordCard, { speak } from "@/components/WordCard";
import { Badge, Button, Card, CardTitle, Empty, Loading, PageHeader, Progress, Stat, Tabs } from "@/components/ui";

type Tab = "study" | "explore" | "map" | "games";
type Kind = "meaning" | "syn" | "ant" | "bn" | "context" | "recall";

interface Item { word: string; intro: boolean }

function contextQuestion(w: VocabWord, seed: number) {
  const r = mulberry32(seed ^ hashStr(w.word));
  const ex = pick(r, w.examples);
  const re = new RegExp(`\\b${w.word.slice(0, Math.max(4, w.word.length - 2))}\\w*`, "i");
  if (!re.test(ex)) return null;
  const stem = ex.replace(re, "_____");
  const others = shuffle(r, VOCAB.filter((x) => x.theme !== w.theme && x.pos === w.pos)).slice(0, 3).map((x) => x.word);
  if (others.length < 3) return null;
  const options = shuffle(r, [w.word, ...others]);
  return { stem: `Complete the sentence:\n\n“${stem}”`, options, answer: options.indexOf(w.word) };
}

function Quiz({ w, kind, onGrade }: { w: VocabWord; kind: Kind; onGrade: (q: number) => void }) {
  const seed = useMemo(() => Math.floor(Math.random() * 1e6), []);
  const [chosen, setChosen] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [t0] = useState(Date.now());

  if (kind === "recall") {
    return (
      <div>
        <div className="text-[13px] text-muted">Recall the meaning, then reveal and grade yourself honestly.</div>
        <div className="my-6 text-center font-serif text-[36px] font-semibold">{w.word}</div>
        {!revealed ? (
          <div className="flex justify-center"><Button onClick={() => setRevealed(true)}>Reveal</Button></div>
        ) : (
          <>
            <WordCard w={w} compact />
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button variant="danger" onClick={() => onGrade(1)}>Forgot</Button>
              <Button variant="secondary" onClick={() => onGrade(3)}>Hard</Button>
              <Button variant="secondary" onClick={() => onGrade(4)}>Good</Button>
              <Button onClick={() => onGrade(5)}>Easy</Button>
            </div>
          </>
        )}
      </div>
    );
  }

  const q = kind === "context" ? contextQuestion(w, seed) : vocabQuestion(kind, w.word, seed);
  if (!q) return <Quiz w={w} kind="meaning" onGrade={onGrade} />;
  const submit = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
  };
  const correct = chosen === q.answer;
  return (
    <div>
      <div className="mb-1 text-[12px] uppercase tracking-wide text-muted">{{ meaning: "Meaning recognition", syn: "Synonym", ant: "Antonym", bn: "বাংলা → English", context: "Use in context" }[kind]}</div>
      <div className="mb-4 whitespace-pre-line text-[17px] leading-relaxed">{q.stem.replace(/\*\*/g, "")}</div>
      <div className="grid gap-2 sm:grid-cols-2">
        {q.options.map((o, i) => (
          <button key={i} onClick={() => submit(i)} disabled={chosen !== null}
            className={clsx("rounded-xl border px-4 py-3 text-left text-[14.5px] transition-colors",
              chosen === null && "border-line hover:border-accent/60",
              chosen !== null && i === q.answer && "border-good bg-good/10",
              chosen === i && i !== q.answer && "border-bad bg-bad/10",
              chosen !== null && i !== q.answer && chosen !== i && "border-line opacity-60")}>
            {o}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <div className="mt-5">
          <div className={clsx("mb-3 flex items-center gap-1.5 font-medium", correct ? "text-good" : "text-bad")}>{correct ? <><Check size={16} /> Correct</> : <><X size={16} /> The answer was “{q.options[q.answer]}”</>}</div>
          <WordCard w={w} compact />
          <div className="mt-4"><Button onClick={() => onGrade(correct ? (Date.now() - t0 < 8000 ? 5 : 4) : 1)}>Continue</Button></div>
        </div>
      )}
    </div>
  );
}

function Study() {
  const cards = useLiveQuery(() => db.vocab.toArray(), []);
  const [queue, setQueue] = useState<Item[] | null>(null);
  const [pos, setPos] = useState(0);
  const [kind, setKind] = useState<Kind>("meaning");
  const [newPerDay, setNewPerDay] = useState(15);
  const [sessionDone, setSessionDone] = useState({ reviewed: 0, learned: 0, right: 0 });

  useEffect(() => { getPrefs().then((p) => setNewPerDay(p.newWords)); }, []);

  const build = async () => {
    const all = await db.vocab.toArray();
    const byWord = new Map(all.map((c) => [c.word, c]));
    const now = Date.now();
    const due = all.filter((c) => c.seen > 0 && c.due <= now).sort((a, b) => a.due - b.due).map((c) => ({ word: c.word, intro: false }));
    const introducedToday = await db.settings.get(`vocab-new:${todayKey()}`);
    const already = (introducedToday?.value as number) ?? 0;
    const fresh = VOCAB.filter((w) => !byWord.get(w.word) || byWord.get(w.word)!.seen === 0)
      .sort((a, b) => a.level - b.level)
      .slice(0, Math.max(0, newPerDay - already))
      .map((w) => ({ word: w.word, intro: true }));
    // interleave: 1 new intro, then its first quiz comes back after ~3 items
    const q: Item[] = [];
    let di = 0;
    for (const f of fresh) {
      q.push(f);
      for (let k = 0; k < 2 && di < due.length; k++) q.push(due[di++]);
      q.push({ word: f.word, intro: false });
    }
    while (di < due.length) q.push(due[di++]);
    setQueue(q);
    setPos(0);
    setSessionDone({ reviewed: 0, learned: 0, right: 0 });
    pickKind(q[0]?.word);
  };

  const pickKind = (word?: string) => {
    if (!word) return;
    const kinds: Kind[] = ["meaning", "syn", "ant", "bn", "context", "recall"];
    const w = VOCAB_BY_WORD[word];
    const usable = kinds.filter((k) => k !== "ant" || w.antonyms.length);
    setKind(usable[Math.floor(Math.random() * usable.length)]);
  };

  const grade = async (quality: number) => {
    if (!queue) return;
    const item = queue[pos];
    const card: VocabCard = (await db.vocab.get(item.word)) ?? newCard(item.word);
    const updated = sm2(card, quality);
    await db.vocab.put(updated);
    const extra: Item[] = [];
    if (quality < 3) extra.push({ word: item.word, intro: false }); // forgotten → see it again this session
    const nextQueue = [...queue];
    if (extra.length) nextQueue.splice(Math.min(nextQueue.length, pos + 4), 0, ...extra);
    setQueue(nextQueue);
    setSessionDone((s) => ({ ...s, reviewed: s.reviewed + 1, right: s.right + (quality >= 3 ? 1 : 0) }));
    advance(nextQueue);
  };

  const finishIntro = async () => {
    if (!queue) return;
    const key = `vocab-new:${todayKey()}`;
    const cur = ((await db.settings.get(key))?.value as number) ?? 0;
    await db.settings.put({ key, value: cur + 1 });
    const card = (await db.vocab.get(queue[pos].word)) ?? newCard(queue[pos].word);
    if (card.seen === 0) await db.vocab.put({ ...card, status: "learning" });
    setSessionDone((s) => ({ ...s, learned: s.learned + 1 }));
    advance(queue);
  };

  const advance = (q: Item[]) => {
    const n = pos + 1;
    setPos(n);
    if (n >= q.length) markTask("vocab");
    else pickKind(q[n].word);
  };

  const counts = useMemo(() => {
    const m = { new: VOCAB.length, learning: 0, familiar: 0, mastered: 0, revise: 0, due: 0 };
    const now = Date.now();
    for (const c of cards ?? []) {
      if (c.seen === 0 && c.status === "new") continue;
      m.new--;
      m[c.status === "new" ? "learning" : c.status]++;
      if (c.seen > 0 && c.due <= now) m.due++;
    }
    return m;
  }, [cards]);

  if (!cards) return <Loading />;

  if (!queue || pos >= queue.length) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="New" value={counts.new} />
          <Stat label="Learning" value={counts.learning} />
          <Stat label="Familiar" value={counts.familiar} />
          <Stat label="Mastered" value={counts.mastered} tone="good" />
          <Stat label="Needs revision" value={counts.revise} tone={counts.revise ? "bad" : undefined} />
        </div>
        <Card>
          {queue && pos >= queue.length && queue.length > 0 ? (
            <div className="mb-4 rounded-xl bg-good/10 px-4 py-3 text-[14px] text-good">Session complete: {sessionDone.learned} new words introduced, {sessionDone.reviewed} reviews ({sessionDone.right} remembered).</div>
          ) : null}
          <CardTitle>Today's vocabulary session</CardTitle>
          <p className="text-[14px] text-muted">{counts.due} review{counts.due === 1 ? "" : "s"} due + up to {newPerDay} new words. Each review tests a different skill: meaning, synonym, antonym, Bengali, use in context or free recall. Forgotten words return within minutes; remembered ones space out to 1, 6, then ~15+ days (SM-2).</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={build}>Start session</Button>
            <label className="flex items-center gap-2 text-[13px] text-muted">
              New words / day
              <input type="number" min={0} max={40} value={newPerDay} onChange={(e) => { const v = Math.max(0, Math.min(40, Number(e.target.value))); setNewPerDay(v); savePrefs({ newWords: v }); }} className="w-16 rounded-lg border border-line bg-surface px-2 py-1 text-ink" />
            </label>
          </div>
        </Card>
      </div>
    );
  }

  const item = queue[pos];
  const w = VOCAB_BY_WORD[item.word];
  return (
    <Card className="p-5 sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <Progress value={(pos / queue.length) * 100} />
        <span className="shrink-0 text-[12.5px] tabular-nums text-muted">{pos}/{queue.length}</span>
      </div>
      {item.intro ? (
        <>
          <div className="mb-3 text-[12px] uppercase tracking-wide text-accent">New word</div>
          <WordCard w={w} />
          <div className="mt-5"><Button onClick={finishIntro}>Got it — quiz me later</Button></div>
        </>
      ) : (
        <Quiz key={pos} w={w} kind={kind} onGrade={grade} />
      )}
    </Card>
  );
}

function Explore() {
  const cards = useLiveQuery(() => db.vocab.toArray(), []);
  const status = useMemo(() => new Map((cards ?? []).map((c) => [c.word, c.status])), [cards]);
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState("all");
  const [st, setSt] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const list = VOCAB.filter((w) =>
    (theme === "all" || w.theme === theme) &&
    (st === "all" || (status.get(w.word) ?? "new") === st) &&
    (!q || [w.word, w.definition, w.bengali, ...w.synonyms].join(" ").toLowerCase().includes(q.toLowerCase())));
  const ow = open ? VOCAB_BY_WORD[open] : null;
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
          <Search size={15} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search words, meanings, বাংলা…" className="w-full bg-transparent text-[14px] outline-none" />
        </label>
        <select value={theme} onChange={(e) => setTheme(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2 text-[14px]">
          <option value="all">All themes</option>{THEMES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={st} onChange={(e) => setSt(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2 text-[14px]">
          {["all", "new", "learning", "familiar", "mastered", "revise"].map((s) => <option key={s} value={s}>{s === "all" ? "Any status" : s}</option>)}
        </select>
      </div>
      {ow && (
        <Card className="mb-5 border-accent">
          <div className="mb-2 flex justify-end"><Button variant="ghost" size="sm" onClick={() => setOpen(null)}>Close</Button></div>
          <WordCard w={ow} status={status.get(ow.word) ?? "new"} />
        </Card>
      )}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((w) => (
          <button key={w.word} onClick={() => { setOpen(w.word); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-left">
            <Card className="flex items-center gap-3 p-3 transition-colors hover:border-accent/60">
              <span className="text-[26px]" aria-hidden>{w.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><span className="font-medium">{w.word}</span><span className="text-[11px] capitalize text-muted">{status.get(w.word) ?? "new"}</span></div>
                <div className="truncate text-[12.5px] text-muted">{w.definition}</div>
              </div>
            </Card>
          </button>
        ))}
      </div>
      {!list.length && <Empty title="No words match">Try a different search or filter.</Empty>}
    </div>
  );
}

function ThemeMap() {
  const [theme, setTheme] = useState<string>(THEMES[0]);
  const [open, setOpen] = useState<string | null>(null);
  const words = VOCAB.filter((w) => w.theme === theme);
  const size = 520, cx = size / 2, cy = size / 2, R = size * 0.38;
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <Card>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {THEMES.map((t) => <button key={t} onClick={() => { setTheme(t); setOpen(null); }} className={clsx("rounded-full border px-2.5 py-1 text-[12px]", t === theme ? "border-accent bg-accent-soft text-accent" : "border-line text-muted")}>{t}</button>)}
        </div>
        <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full" role="img" aria-label={`Semantic map: ${theme}`}>
          {words.map((w, i) => {
            const a = (2 * Math.PI * i) / words.length - Math.PI / 2;
            const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
            return <line key={"l" + w.word} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" />;
          })}
          {/* synonym links inside the theme */}
          {words.flatMap((w, i) => words.map((v, j) => {
            if (j <= i) return null;
            const linked = w.synonyms.includes(v.word) || v.synonyms.includes(w.word) || w.antonyms.includes(v.word) || v.antonyms.includes(w.word);
            if (!linked) return null;
            const anti = w.antonyms.includes(v.word) || v.antonyms.includes(w.word);
            const a1 = (2 * Math.PI * i) / words.length - Math.PI / 2, a2 = (2 * Math.PI * j) / words.length - Math.PI / 2;
            return <line key={w.word + v.word} x1={cx + R * Math.cos(a1)} y1={cy + R * Math.sin(a1)} x2={cx + R * Math.cos(a2)} y2={cy + R * Math.sin(a2)} stroke={anti ? "var(--bad)" : "var(--good)"} strokeWidth={1.5} strokeDasharray={anti ? "4 3" : undefined} />;
          }))}
          <circle cx={cx} cy={cy} r={56} fill="var(--accent)" />
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--accent-text)">{theme.split(" & ")[0]}</text>
          {words.map((w, i) => {
            const a = (2 * Math.PI * i) / words.length - Math.PI / 2;
            const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
            return (
              <g key={w.word} onClick={() => setOpen(w.word)} className="cursor-pointer">
                <rect x={x - 50} y={y - 14} width={100} height={28} rx={14} fill={open === w.word ? "var(--accent-soft)" : "var(--surface)"} stroke={open === w.word ? "var(--accent)" : "var(--border)"} />
                <text x={x} y={y + 4} textAnchor="middle" fontSize={12} fill="var(--text)">{w.word}</text>
              </g>
            );
          })}
        </svg>
        <p className="text-[12px] text-muted">Green lines join words that are synonyms; red dashed lines join opposites. Click a word.</p>
      </Card>
      <Card>{open ? <WordCard w={VOCAB_BY_WORD[open]} /> : <Empty title="Pick a word on the map">Study words in clusters — related meanings stick better than alphabetical lists.</Empty>}</Card>
    </div>
  );
}

const CONFUSABLES: { a: string; b: string; sentence: string; answer: "a" | "b"; why: string }[] = [
  { a: "imminent", b: "eminent", sentence: "An ____ economist chaired the reform commission.", answer: "b", why: "Eminent = famous and respected; imminent = about to happen." },
  { a: "imminent", b: "eminent", sentence: "With the storm's landfall ____, the port suspended operations.", answer: "a", why: "About to happen → imminent." },
  { a: "ambiguous", b: "ambivalent", sentence: "Voters felt ____ about the reform — they liked the goal but feared the cost.", answer: "b", why: "Mixed feelings → ambivalent." },
  { a: "ambiguous", b: "ambivalent", sentence: "The ____ wording of clause 4 allowed two interpretations.", answer: "a", why: "Two meanings → ambiguous." },
  { a: "tenacious", b: "tenuous", sentence: "The link between the two events is ____ at best.", answer: "b", why: "Weak/thin → tenuous." },
  { a: "tenacious", b: "tenuous", sentence: "A ____ negotiator, she refused to accept the first offer.", answer: "a", why: "Persistent → tenacious." },
  { a: "credulous", b: "credible", sentence: "Only a ____ investor would believe returns of 40% a month.", answer: "a", why: "Too ready to believe → credulous; credible = believable." },
  { a: "negligent", b: "negligible", sentence: "The effect of the rule change on prices was ____.", answer: "b", why: "Very small → negligible; negligent = careless." },
  { a: "complacent", b: "complaisant", sentence: "After two strong quarters, management grew ____ and ignored rising costs.", answer: "a", why: "Smugly unaware of danger → complacent." },
  { a: "prudent", b: "prudish", sentence: "It is ____ to keep three months' expenses in savings.", answer: "a", why: "Wise and careful → prudent." },
  { a: "eminent", b: "immanent", sentence: "Many philosophers held that God is ____ in nature, present within the world.", answer: "b", why: "Immanent = existing within." },
  { a: "affect", b: "effect", sentence: "Higher interest rates will ____ consumer borrowing.", answer: "a", why: "Verb 'to influence' → affect; 'effect' is usually the noun (result)." },
];

function Games() {
  const [order, setOrder] = useState(() => shuffle(mulberry32(Date.now()), CONFUSABLES));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<"a" | "b" | null>(null);
  const [score, setScore] = useState(0);
  const item = order[i];

  // Match game
  const [match, setMatch] = useState(() => shuffle(mulberry32(Date.now() + 1), VOCAB).slice(0, 5));
  const [bn, setBn] = useState(() => shuffle(mulberry32(Date.now() + 2), match.map((w) => w.word)));
  const [sel, setSel] = useState<string | null>(null);
  const [paired, setPaired] = useState<Record<string, boolean>>({});
  const [wrong, setWrong] = useState<string | null>(null);
  const newMatch = () => { const m = shuffle(mulberry32(Date.now()), VOCAB).slice(0, 5); setMatch(m); setBn(shuffle(mulberry32(Date.now() + 3), m.map((w) => w.word))); setPaired({}); setSel(null); };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardTitle right={<Badge>{score}/{Math.min(i + (picked ? 1 : 0), order.length)}</Badge>}>Word duel — commonly confused pairs</CardTitle>
        {item ? (
          <>
            <p className="my-4 font-serif text-[18px]">{item.sentence}</p>
            <div className="grid grid-cols-2 gap-2">
              {(["a", "b"] as const).map((k) => (
                <button key={k} disabled={!!picked} onClick={() => { setPicked(k); if (k === item.answer) setScore((s) => s + 1); }}
                  className={clsx("rounded-xl border px-4 py-3 text-[15px] font-medium", !picked && "border-line hover:border-accent/60", picked && k === item.answer && "border-good bg-good/10", picked === k && k !== item.answer && "border-bad bg-bad/10")}>
                  {item[k]}
                </button>
              ))}
            </div>
            {picked && (
              <div className="mt-3 text-[14px]">
                <p className="text-muted">{item.why}</p>
                <Button className="mt-3" onClick={() => { setPicked(null); setI(i + 1); }}>Next</Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-6 text-center"><div className="mb-3">Done: {score}/{order.length}</div><Button onClick={() => { setOrder(shuffle(mulberry32(Date.now()), CONFUSABLES)); setI(0); setScore(0); }}><Shuffle size={14} /> Play again</Button></div>
        )}
      </Card>
      <Card>
        <CardTitle right={<Button size="sm" variant="ghost" onClick={newMatch}><Shuffle size={14} /> New set</Button>}>Match the Bengali meaning</CardTitle>
        <p className="mb-3 text-[13px] text-muted">Select a Bengali meaning, then the English word.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            {match.map((w) => (
              <button key={w.word} disabled={paired[w.word]} onClick={() => setSel(w.word)}
                className={clsx("w-full rounded-xl border px-3 py-2 text-left text-[13.5px]", paired[w.word] ? "border-good bg-good/10 opacity-70" : sel === w.word ? "border-accent bg-accent-soft" : "border-line")}>
                {w.bengali}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {bn.map((word) => (
              <button key={word} disabled={paired[word]} onClick={() => {
                if (!sel) return;
                if (sel === word) { setPaired((p) => ({ ...p, [word]: true })); setSel(null); speak(word); }
                else { setWrong(word); setTimeout(() => setWrong(null), 500); }
              }}
                className={clsx("w-full rounded-xl border px-3 py-2 text-left text-[14px] font-medium transition-colors", paired[word] ? "border-good bg-good/10 opacity-70" : wrong === word ? "border-bad bg-bad/10" : "border-line hover:border-accent/60")}>
                {word}
              </button>
            ))}
          </div>
        </div>
        {Object.keys(paired).length === match.length && <div className="mt-4 text-[14px] text-good">All matched! <Button size="sm" variant="secondary" onClick={newMatch} className="ml-2">Another round</Button></div>}
      </Card>
    </div>
  );
}

function Vocab() {
  const sp = useSearchParams();
  const [tab, setTab] = useState<Tab>((sp.get("tab") as Tab) ?? "study");
  return (
    <div>
      <PageHeader eyebrow="Visual Vocabulary Lab" title="Words you can see, hear and use" subtitle={`${VOCAB.length} admission-level words with pronunciation, বাংলা meaning, synonym/antonym networks, roots, memory hooks and spaced repetition.`} />
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: "study", label: "Study session" }, { id: "explore", label: "Word cards" }, { id: "map", label: "Semantic maps" }, { id: "games", label: "Word games" }]} />
      {tab === "study" && <Study />}
      {tab === "explore" && <Explore />}
      {tab === "map" && <ThemeMap />}
      {tab === "games" && <Games />}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<Loading />}><Vocab /></Suspense>;
}
