import { NextResponse } from "next/server";
import { AIUnavailable, completeText } from "@/lib/ai-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface Draft {
  stem: string;
  options: string[];
  answer: number;
  explanation: string;
  fastest?: string;
  traps?: string[];
  timeSec?: number;
}

function parseJSON<T>(text: string): T | null {
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try { return JSON.parse(m[0]) as T; } catch { return null; }
}

/** Structural checks every generated question must pass. */
function structural(d: Draft): string | null {
  if (!d || typeof d.stem !== "string" || d.stem.length < 10) return "missing stem";
  if (!Array.isArray(d.options) || d.options.length < 4 || d.options.length > 5) return "needs 4–5 options";
  if (d.options.some((o) => typeof o !== "string" || !o.trim())) return "empty option";
  if (new Set(d.options.map((o) => o.trim().toLowerCase())).size !== d.options.length) return "duplicate options";
  if (!Number.isInteger(d.answer) || d.answer < 0 || d.answer >= d.options.length) return "answer index out of range";
  if (typeof d.explanation !== "string" || d.explanation.length < 20) return "explanation too short";
  return null;
}

export async function POST(req: Request) {
  let body: { subject?: string; topic?: string; topicLabel?: string; difficulty?: number; count?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const count = Math.max(1, Math.min(5, Number(body.count) || 3));
  const difficulty = Math.max(1, Math.min(6, Number(body.difficulty) || 3));
  const label = String(body.topicLabel ?? body.topic ?? "").slice(0, 80);
  const subject = String(body.subject ?? "").slice(0, 20);

  const system = `You write ORIGINAL multiple-choice practice questions for the DU IBA MBA admission test. Never copy or reconstruct real past-paper questions or copyrighted text. Every question must have exactly one defensible correct option. Difficulty scale: 1 foundation, 2 easy, 3 medium, 4 difficult, 5 IBA-level, 6 challenge. Output ONLY a JSON array, no prose.`;
  const ask = `Write ${count} questions. Section: ${subject}. Topic: ${label}. Difficulty: ${difficulty}.
Each item: {"stem": string, "options": [4 strings], "answer": index 0-3, "explanation": step-by-step string, "fastest": string (fastest exam method), "traps": [1-2 strings], "timeSec": target seconds}.
For maths, compute every number exactly and make the distractors come from realistic mistakes.`;

  try {
    const drafts = parseJSON<Draft[]>(await completeText(system, [{ role: "user", content: ask }])) ?? [];
    const structuralOk = drafts.map((d) => ({ d, err: structural(d) }));
    const candidates = structuralOk.filter((x) => !x.err).map((x) => x.d);
    let verified: { d: Draft; checks: string[] }[] = [];
    if (candidates.length) {
      // Independent re-solve: the model answers each question WITHOUT seeing the key.
      const blind = candidates.map((d, i) => `Q${i + 1}. ${d.stem}\n${d.options.map((o, j) => `${"ABCDE"[j]}) ${o}`).join("\n")}`).join("\n\n");
      const solved = parseJSON<{ q: number; answer: number; unique: boolean }[]>(
        await completeText(
          "You are a strict exam checker. Solve each multiple-choice question independently and carefully. Output ONLY a JSON array of {\"q\": number, \"answer\": zero-based index, \"unique\": true if exactly one option is defensible}.",
          [{ role: "user", content: blind }],
        ),
      ) ?? [];
      verified = candidates.map((d, i) => {
        const s = solved.find((x) => x.q === i + 1);
        const checks = ["Structure valid (4–5 distinct options, key in range, explanation present)"];
        if (s && s.answer === d.answer) checks.push("Independent re-solve matched the key");
        if (s && s.unique) checks.push("Checker found exactly one defensible option");
        return { d, checks };
      }).filter((x) => x.checks.length === 3);
    }
    return NextResponse.json({
      questions: verified.map(({ d, checks }) => ({ ...d, checks })),
      rejected: drafts.length - verified.length,
      reasons: structuralOk.filter((x) => x.err).map((x) => x.err),
    });
  } catch (e) {
    if (e instanceof AIUnavailable) return NextResponse.json({ error: "No AI provider is configured on the server." }, { status: 503 });
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
