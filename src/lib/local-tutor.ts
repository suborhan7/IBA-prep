import type { Question } from "./types";
import { LESSONS } from "@/data/grammar";
import { SHORTCUTS } from "@/data/shortcuts";
import { VOCAB, VOCAB_BY_WORD } from "@/data/vocab";
import { TOPICS } from "@/data/taxonomy";

/**
 * Offline tutor used when no AI key is configured. It never invents content:
 * every reply is assembled from the app's own verified explanations, lessons,
 * shortcuts and vocabulary data.
 */
const L = "ABCDE";

export function localReply(mode: string, input: string, q: Question | undefined, turn: number, stats?: string): string {
  if (mode === "vocab") return vocab(input);
  if (mode === "writing") return writing(input);
  if (mode === "coach") return coach(stats);
  if (q) {
    if (mode === "hint") return hint(q, turn, input);
    if (mode === "check") return checkWork(q, input);
    return explain(q);
  }
  return search(input);
}

function explain(q: Question) {
  const parts = [`**Answer: ${L[q.answer]}) ${q.options[q.answer]}**`, q.explanation];
  if (q.fastest) parts.push(`**Fastest method:** ${q.fastest}`);
  if (q.shortcut) parts.push(`**Shortcut:** ${q.shortcut.trick}\nWhy it works: ${q.shortcut.why}\nWhen not to use it: ${q.shortcut.whenNot}`);
  if (q.traps?.length) parts.push(`**Common traps:** ${q.traps.join(" · ")}`);
  return parts.join("\n\n");
}

function hint(q: Question, turn: number, input: string) {
  if (/show (me )?the answer|give up|solution/i.test(input)) return explain(q);
  const firstSentence = q.explanation.split(/(?<=[.!?])\s/)[0];
  const steps = [
    `Start with what the question is really testing: **${q.objective}**\nWhat is the unknown, and which information in the stem connects to it?`,
    q.fastest ? `Think about the quickest route: ${q.fastest}` : q.shortcut ? `A rule that helps here: ${q.shortcut.trick}` : `Try eliminating options that clearly break the rule being tested. Which ones can you rule out?`,
    `First step of the solution: ${firstSentence}\nCan you finish it from here?`,
    q.traps?.length ? `Watch out — a common trap is: ${q.traps[0]}\nWhich option is left?` : `You should be able to pick the answer now. Type "show the answer" if you'd like the full solution.`,
  ];
  return turn < steps.length ? `**Hint ${turn + 1} of ${steps.length}.** ${steps[turn]}` : explain(q);
}

function checkWork(q: Question, input: string) {
  const letter = input.match(/\b([A-E])\)?\b/)?.[1];
  const mentionsRight = letter === L[q.answer] || input.toLowerCase().includes(q.options[q.answer].toLowerCase());
  const head = mentionsRight
    ? "Your final answer matches the key. Compare your steps with the model solution below to see if there's a faster route."
    : letter
      ? `Your answer (${letter}) doesn't match the key. Find the first line where your working differs from the model below.`
      : "I can't tell which option you chose — end your working with the letter. Here is the model solution to compare against.";
  return `${head}\n\n${explain(q)}`;
}

function vocab(input: string) {
  const words = input.toLowerCase().match(/[a-z-]+/g) ?? [];
  const found = [...new Set(words)].map((w) => VOCAB_BY_WORD[w] ?? VOCAB.find((v) => v.word.toLowerCase() === w)).filter(Boolean);
  if (!found.length) {
    const near = VOCAB.filter((v) => words.some((w) => w.length >= 3 && v.word.toLowerCase().startsWith(w.slice(0, 3)))).slice(0, 6);
    return `I don't have that word in the app's word list (offline mode only knows the ${VOCAB.length} words in the Vocabulary Lab).${near.length ? `\n\nDid you mean: ${near.map((v) => `**${v.word}**`).join(", ")}?` : ""}`;
  }
  return found.slice(0, 3).map((w) => [
    `**${w!.word}** ${w!.ipa} (${w!.pos}) — ${w!.definition}`,
    `বাংলা: ${w!.bengali}`,
    `Synonyms: ${w!.synonyms.join(", ")}${w!.antonyms.length ? `\nAntonyms: ${w!.antonyms.join(", ")}` : ""}`,
    `Example: "${w!.examples[0]}"`,
    `Common mistake: ${w!.mistakes}`,
    `Memory hook: ${w!.memory}`,
  ].join("\n")).join("\n\n");
}

function writing(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length < 40) return "Paste your full answer (at least 40 words) and I'll check its structure. Offline mode checks length, paragraphing, sentence length, repetition and some common errors; for detailed feedback, configure an AI key.";
  const paras = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const sentences = text.split(/[.!?]+\s/).filter((s) => s.trim().length > 3);
  const avg = words.length / Math.max(1, sentences.length);
  const freq: Record<string, number> = {};
  for (const w of words.map((x) => x.toLowerCase().replace(/[^a-z']/g, "")).filter((x) => x.length > 4)) freq[w] = (freq[w] ?? 0) + 1;
  const repeated = Object.entries(freq).filter(([, n]) => n >= 4).map(([w]) => w);
  const notes: string[] = [];
  notes.push(`Length: **${words.length} words** ${words.length < 180 ? "— short for a 30-minute task; aim for 220–300." : words.length > 380 ? "— long; under time pressure, quality beats length." : "— a good length for 30 minutes."}`);
  notes.push(`Paragraphs: **${paras}** ${paras < 3 ? "— use at least an introduction, two body paragraphs and a conclusion." : "— good structure."}`);
  notes.push(`Average sentence: **${avg.toFixed(0)} words** ${avg > 28 ? "— long sentences invite grammar errors; split some." : avg < 10 ? "— very short; combine a few with linking words." : "— comfortable."}`);
  if (repeated.length) notes.push(`Repeated words: ${repeated.map((w) => `**${w}**`).join(", ")} — vary them.`);
  const checks: [RegExp, string][] = [
    [/\bvery very\b/i, "'very very' — choose a stronger adjective."],
    [/\bdiscuss about\b/i, "'discuss about' → 'discuss'."],
    [/\bcope up with\b/i, "'cope up with' → 'cope with'."],
    [/\bin the other hand\b/i, "'in the other hand' → 'on the other hand'."],
    [/\bis consist\b/i, "'is consist of' → 'consists of'."],
    [/\breturn back\b/i, "'return back' → 'return'."],
    [/\bmore better\b/i, "'more better' → 'better'."],
    [/\bpeoples\b/i, "'peoples' usually → 'people' (unless you mean nations)."],
  ];
  const hits = checks.filter(([re]) => re.test(text)).map(([, m]) => m);
  if (hits.length) notes.push(`Common errors found:\n${hits.map((h) => `- ${h}`).join("\n")}`);
  if (!/\b(however|therefore|moreover|for example|for instance|in conclusion|firstly|secondly)\b/i.test(text)) notes.push("No linking words found — add 'however', 'for example', 'therefore', 'in conclusion' to guide the reader.");
  return `**Offline structure check**\n\n${notes.join("\n\n")}\n\nThis check can't judge argument quality. Re-read for subject-verb agreement, articles and tense in the last five minutes.`;
}

function coach(stats?: string) {
  if (!stats) return "Answer some questions first — I build the plan from your topic levels.";
  return `**Your next study session (offline coach)**\n\n${stats}\n\nRule of thumb: spend 60% of today's time on the weakest three topics above (learn → 10 questions → review mistakes), 25% on mixed timed practice, and 15% on vocabulary and due mistakes. Re-take a timed sectional set in the weakest section within three days.`;
}

function search(input: string) {
  const terms = input.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
  const score = (s: string) => terms.reduce((n, t) => n + (s.toLowerCase().includes(t) ? 1 : 0), 0);
  const lesson = LESSONS.map((l) => ({ l, s: score(l.title + " " + l.rule) * 2 + score(l.tips.join(" ")) })).sort((a, b) => b.s - a.s)[0];
  const sc = SHORTCUTS.map((x) => ({ x, s: score(x.title + " " + x.rule + " " + x.topic) })).sort((a, b) => b.s - a.s)[0];
  const topic = TOPICS.map((t) => ({ t, s: score(t.label + " " + t.id) })).sort((a, b) => b.s - a.s)[0];
  const out: string[] = [];
  if (lesson && lesson.s > 0) out.push(`**Grammar: ${lesson.l.title}**\n${lesson.l.rule}\nWrong: ${lesson.l.pairs[0].wrong}\nRight: ${lesson.l.pairs[0].right}\nWhy: ${lesson.l.pairs[0].why}`);
  if (sc && sc.s > 0) out.push(`**Shortcut: ${sc.x.title}**\n${sc.x.rule}\nExample: ${sc.x.example}\nWhen not to use: ${sc.x.whenNot}`);
  if (!out.length && topic && topic.s > 0) out.push(`That's covered under **${topic.t.label}** (${topic.t.subject}). Open it from the ${topic.t.subject === "quant" ? "Quantitative" : topic.t.subject === "english" ? "English" : "Analytical"} page and practise a set.`);
  if (!out.length) return "Offline mode answers from the app's own lessons, shortcuts and explanations. Try a topic name (e.g. 'subject verb agreement', 'successive percentage', 'alligation'), or open a question and press 'Ask the tutor' on it.";
  return out.join("\n\n");
}
