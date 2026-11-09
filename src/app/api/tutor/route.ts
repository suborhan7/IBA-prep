import { NextResponse } from "next/server";
import { aiConfig, streamChat, AIUnavailable, type ChatMsg } from "@/lib/ai-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = `You are a patient, exacting tutor helping a Bangladeshi graduate prepare for the University of Dhaka IBA MBA admission test (English, Mathematics, Analytical ability, plus a short written part).
Rules:
- Be accurate above all. If you are not certain of an answer, say so and show how to check it. Never invent exam facts, past-paper questions, cut-off marks or official rules.
- Use plain, short sentences. Use Markdown sparingly: short lists and **bold** for key terms. Show maths step by step with one step per line.
- When a Bengali gloss genuinely helps with vocabulary, add it in brackets.
- Keep answers focused: usually under 250 words unless the student asks for more.`;

const MODES: Record<string, string> = {
  explain: "Mode: EXPLAIN. Explain the concept or question clearly: the rule, why it works, a worked example, the fastest exam method, and the common trap.",
  hint: "Mode: SOCRATIC HINTS. Do NOT reveal the final answer or the correct option unless the student explicitly says 'show the answer'. Give one small hint or ask one guiding question at a time, then wait.",
  check: "Mode: CHECK MY WORKING. The student will show their reasoning. Identify the first step that goes wrong (if any), explain why, and let them fix it. Confirm what they did right.",
  vocab: "Mode: VOCABULARY COACH. For each word: meaning, part of speech, Bengali meaning, 2 synonyms, 1 antonym, a natural example sentence, a common confusion, and a memory hook. Then quiz the student with one quick question.",
  writing: "Mode: WRITING FEEDBACK. The student will paste a short essay or letter written under exam time. Give: an overall band (Weak / Adequate / Good / Strong), 3 strengths, the 5 most important corrections quoted with fixes (grammar first), and one paragraph rewritten as a model. Do not rewrite the whole text.",
  coach: "Mode: STUDY COACH. Use the student's statistics (provided) to give a concrete plan for the next 1–3 days: which topics, how many questions, and what to review. Be specific and realistic.",
};

export async function GET() {
  const c = aiConfig();
  return NextResponse.json({ available: c.available, provider: c.provider, model: c.available ? c.model : null });
}

export async function POST(req: Request) {
  let body: { mode?: string; messages?: ChatMsg[]; context?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }
  const mode = MODES[body.mode ?? "explain"] ? body.mode! : "explain";
  const messages = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 12000) }));
  if (!messages.length || messages[0].role !== "user") return NextResponse.json({ error: "Send a message first." }, { status: 400 });
  const system = [BASE, MODES[mode], body.context ? `Context from the app (trusted data about the current question or the student's stats):\n${String(body.context).slice(0, 8000)}` : ""].filter(Boolean).join("\n\n");
  try {
    return new Response(streamChat(system, messages), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  } catch (e) {
    if (e instanceof AIUnavailable) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
