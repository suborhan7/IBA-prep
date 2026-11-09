import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-side AI access. Keys are read from environment variables only and never
 * reach the browser.
 *
 *   AI_PROVIDER        anthropic (default) | openai-compatible
 *   ANTHROPIC_API_KEY  key for the Anthropic provider (AI_API_KEY also accepted)
 *   AI_MODEL           model id; default claude-opus-5-5 for Anthropic
 *   AI_BASE_URL        base URL for an OpenAI-compatible provider, e.g. https://api.example.com/v1
 *   AI_API_KEY         key for the OpenAI-compatible provider
 */
export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export function aiConfig() {
  const provider = (process.env.AI_PROVIDER ?? "anthropic").toLowerCase();
  if (provider === "openai-compatible") {
    const key = process.env.AI_API_KEY;
    const base = process.env.AI_BASE_URL;
    const model = process.env.AI_MODEL;
    return { provider, model: model ?? "", available: !!(key && base && model), key, base };
  }
  const key = process.env.ANTHROPIC_API_KEY ?? process.env.AI_API_KEY;
  return { provider: "anthropic", model: process.env.AI_MODEL ?? "claude-opus-5-5", available: !!key, key, base: undefined };
}

export class AIUnavailable extends Error {}

/** Streams plain text. Errors are reported inline so the UI can show them. */
export function streamChat(system: string, messages: ChatMsg[], maxTokens = 4000): ReadableStream<Uint8Array> {
  const cfg = aiConfig();
  if (!cfg.available) throw new AIUnavailable("No AI provider configured.");
  const enc = new TextEncoder();

  if (cfg.provider === "openai-compatible") {
    return new ReadableStream({
      async start(ctrl) {
        try {
          ctrl.enqueue(enc.encode(await openaiCompatible(cfg, system, messages, maxTokens)));
        } catch (e) {
          ctrl.enqueue(enc.encode(`\n\n[AI error: ${(e as Error).message}]`));
        }
        ctrl.close();
      },
    });
  }

  const client = new Anthropic({ apiKey: cfg.key });
  const fallback = cfg.model.startsWith("claude-opus-5");
  return new ReadableStream({
    async start(ctrl) {
      try {
        const stream = client.beta.messages.stream({
          model: cfg.model,
          max_tokens: maxTokens,
          thinking: { type: "adaptive" },
          system,
          messages,
          ...(fallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
        });
        stream.on("text", (t) => ctrl.enqueue(enc.encode(t)));
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") ctrl.enqueue(enc.encode("\n\n[The model declined to answer this request. Try rephrasing it as a study question.]"));
        if (final.stop_reason === "max_tokens") ctrl.enqueue(enc.encode("\n\n[Answer cut short — ask me to continue.]"));
      } catch (e) {
        ctrl.enqueue(enc.encode(`\n\n[AI error: ${describe(e)}]`));
      }
      ctrl.close();
    },
  });
}

/** Non-streaming call that returns the full text (used by the question generator). */
export async function completeText(system: string, messages: ChatMsg[], maxTokens = 16000): Promise<string> {
  const cfg = aiConfig();
  if (!cfg.available) throw new AIUnavailable("No AI provider configured.");
  if (cfg.provider === "openai-compatible") return openaiCompatible(cfg, system, messages, maxTokens);
  const client = new Anthropic({ apiKey: cfg.key });
  const fallback = cfg.model.startsWith("claude-opus-5");
  const stream = client.beta.messages.stream({
    model: cfg.model,
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    system,
    messages,
    ...(fallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
  });
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal") throw new Error("The model declined this request.");
  return final.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

async function openaiCompatible(cfg: ReturnType<typeof aiConfig>, system: string, messages: ChatMsg[], maxTokens: number) {
  const res = await fetch(`${cfg.base!.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({ model: cfg.model, max_tokens: maxTokens, messages: [{ role: "system", content: system }, ...messages] }),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return String(j.choices?.[0]?.message?.content ?? "");
}

function describe(e: unknown) {
  if (e instanceof Anthropic.AuthenticationError) return "the API key was rejected — check ANTHROPIC_API_KEY.";
  if (e instanceof Anthropic.RateLimitError) return "rate limited — wait a minute and try again.";
  if (e instanceof Anthropic.APIError) return `${e.status ?? ""} ${e.message}`.trim();
  return (e as Error)?.message ?? "unknown error";
}
