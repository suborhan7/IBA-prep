"use client";
import { useEffect } from "react";
import { db, exportAll, TABLES, type Attempt, type DayLog, type Mistake, type MockRecord, type VocabCard, type SkillRating, type CustomQuestion, type Setting } from "./db";

/**
 * Sync between devices with a private sync code.
 *
 * - The code never leaves the device: the server only sees SHA-256(code), which names
 *   the cloud copy. Anyone without the code cannot find or read it.
 * - Each sync = download the cloud copy → merge it into this device → upload the result.
 *   Merging combines both devices' work (it never throws away answers from either).
 * - Snapshots are gzip-compressed before upload.
 */

type Snapshot = Record<string, unknown[]>;
const LOCAL_ONLY = (key: string) => key.startsWith("sync:") || key.startsWith("session:");
const CODE_KEY = "sync:code";
const LAST_KEY = "sync:last";

const WORDS = ["amber", "river", "mango", "lotus", "tiger", "cloud", "delta", "ember", "falcon", "garnet", "harbor", "indigo", "jasmine", "kestrel", "lagoon", "monsoon", "nectar", "orchid", "pepper", "quartz", "rain", "saffron", "teak", "umber", "velvet", "willow", "zephyr", "banyan", "cobalt", "dune", "fern", "hilsa"];

export function newSyncCode() {
  const r = crypto.getRandomValues(new Uint32Array(5));
  const w = (i: number) => WORDS[r[i] % WORDS.length];
  return `${w(0)}-${w(1)}-${w(2)}-${w(3)}-${String(r[4] % 10000).padStart(4, "0")}`;
}

export async function getSyncCode(): Promise<string | null> {
  return ((await db.settings.get(CODE_KEY))?.value as string | undefined) ?? null;
}
export async function setSyncCode(code: string | null) {
  if (code) await db.settings.put({ key: CODE_KEY, value: code.trim().toLowerCase() });
  else await db.settings.delete(CODE_KEY);
}
export async function lastSync(): Promise<number | null> {
  return ((await db.settings.get(LAST_KEY))?.value as number | undefined) ?? null;
}

async function syncId(code: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("du-iba-prep:" + code.trim().toLowerCase()));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function gzip(text: string): Promise<Blob> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Response(stream).blob();
}
async function gunzip(data: ArrayBuffer): Promise<string> {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

export class SyncNotConfigured extends Error {}

async function download(id: string): Promise<Snapshot | null> {
  const res = await fetch(`/api/sync?id=${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (res.status === 503) throw new SyncNotConfigured("Cloud sync is not set up on the server yet.");
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const json = JSON.parse(await gunzip(await res.arrayBuffer()));
  if (json?.app !== "du-iba-prep" || !json.data) throw new Error("Cloud copy is not a valid backup.");
  return json.data as Snapshot;
}

async function upload(id: string, data: Snapshot) {
  const body = await gzip(JSON.stringify({ app: "du-iba-prep", version: 1, exportedAt: new Date().toISOString(), data }));
  const res = await fetch(`/api/sync?id=${id}`, { method: "PUT", body, headers: { "content-type": "application/gzip" } });
  if (res.status === 503) throw new SyncNotConfigured("Cloud sync is not set up on the server yet.");
  if (!res.ok) throw new Error(`Upload failed (${res.status}): ${(await res.text()).slice(0, 120)}`);
}

/* ── merging ─────────────────────────────────────────────── */

// tables with auto-increment ids: rows are matched by a natural key, never by id
const NATURAL: Record<string, (r: Record<string, unknown>) => string> = {
  attempts: (r) => `${r.qid}|${r.at}`,
  drills: (r) => `${r.kind}|${r.at}`,
  mocks: (r) => `${r.startedAt}`,
  puzzles: (r) => `${r.puzzleId}|${r.at}`,
  tutor: (r) => `${r.thread}|${r.at}|${r.role}`,
};

/** Apply the remote snapshot to the local database, keeping the best of both. */
async function mergeIntoLocal(remote: Snapshot) {
  await db.transaction("rw", TABLES.map((t) => db.table(t)), async () => {
    // 1. append-only logs
    for (const [table, key] of Object.entries(NATURAL)) {
      const local = (await db.table(table).toArray()) as Record<string, unknown>[];
      const byKey = new Map(local.map((r) => [key(r), r]));
      const add: Record<string, unknown>[] = [];
      for (const r of (remote[table] ?? []) as Record<string, unknown>[]) {
        const existing = byKey.get(key(r));
        if (!existing) {
          const { id: _drop, ...rest } = r; // eslint-disable-line @typescript-eslint/no-unused-vars
          add.push(rest);
          byKey.set(key(r), rest);
        } else if (table === "mocks" && (existing as unknown as MockRecord).status === "active" && (r as unknown as MockRecord).status === "done") {
          await db.table(table).put({ ...r, id: existing.id }); // finished on the other device
        }
      }
      if (add.length) await db.table(table).bulkAdd(add);
    }
    // 2. keyed records: newest wins
    const newer = async <T>(table: string, pk: keyof T, score: (r: T) => number) => {
      const rows = (remote[table] ?? []) as T[];
      if (!rows.length) return;
      const locals = (await db.table(table).bulkGet(rows.map((r) => r[pk] as never))) as (T | undefined)[];
      const put = rows.filter((r, i) => !locals[i] || score(r) > score(locals[i]!));
      if (put.length) await db.table(table).bulkPut(put);
    };
    await newer<Mistake>("mistakes", "qid", (r) => r.lastAt);
    await newer<VocabCard>("vocab", "word", (r) => r.lastAt * 1000 + r.seen);
    await newer<SkillRating>("skills", "topic", (r) => r.attempts);
    await newer<CustomQuestion>("custom", "id", (r) => (r.status === "pending" ? 0 : 1));
    await newer<{ qid: string; at: number }>("bookmarks", "qid", (r) => r.at);

    // 3. settings: keep local values, fill gaps, combine the plan preferences
    for (const s of (remote.settings ?? []) as Setting[]) {
      if (LOCAL_ONLY(s.key)) continue;
      const l = await db.settings.get(s.key);
      if (!l) { await db.settings.put(s); continue; }
      if (s.key === "prefs") {
        const a = l.value as Record<string, unknown>, b = s.value as Record<string, unknown>;
        const start = [a.startDate, b.startDate].filter(Boolean).sort()[0] ?? null;
        await db.settings.put({ key: "prefs", value: { ...a, startDate: start, diagnosticDone: !!(a.diagnosticDone || b.diagnosticDone), examDate: a.examDate ?? b.examDate ?? null } });
      } else if (s.key === "speed:levels") {
        const a = l.value as Record<string, number>, b = s.value as Record<string, number>;
        const m = { ...a };
        for (const [k, v] of Object.entries(b)) m[k] = Math.max(m[k] ?? 1, v);
        await db.settings.put({ key: s.key, value: m });
      }
    }

    // 4. day logs: union of tasks, counts recomputed from the merged answers
    const remoteDays = new Map(((remote.days ?? []) as DayLog[]).map((d) => [d.date, d]));
    const localDays = new Map((await db.days.toArray()).map((d) => [d.date, d]));
    const dates = new Set([...remoteDays.keys(), ...localDays.keys()]);
    const attempts = (await db.attempts.toArray()) as Attempt[];
    const counts = new Map<string, { answered: number; correct: number; ms: number }>();
    for (const a of attempts) {
      if (a.skipped || a.chosen === null) continue;
      const d = new Date(a.at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const c = counts.get(k) ?? { answered: 0, correct: 0, ms: 0 };
      c.answered++; c.ms += a.timeMs; if (a.correct) c.correct++;
      counts.set(k, c);
    }
    await db.days.bulkPut([...dates].map((date) => {
      const l = localDays.get(date), r = remoteDays.get(date);
      const c = counts.get(date) ?? { answered: 0, correct: 0, ms: 0 };
      return { date, ...c, tasksDone: [...new Set([...(l?.tasksDone ?? []), ...(r?.tasksDone ?? [])])] };
    }));
  });
}

async function localSnapshot(): Promise<Snapshot> {
  const { data } = await exportAll();
  data.settings = (data.settings as Setting[]).filter((s) => !LOCAL_ONLY(s.key));
  return data;
}

let running: Promise<{ merged: boolean }> | null = null;

/** Download → merge → upload. Safe to call often; concurrent calls share one run. */
export function syncNow(): Promise<{ merged: boolean }> {
  if (running) return running;
  running = (async () => {
    const code = await getSyncCode();
    if (!code) throw new Error("No sync code set on this device.");
    const id = await syncId(code);
    const remote = await download(id);
    if (remote) await mergeIntoLocal(remote);
    await upload(id, await localSnapshot());
    await db.settings.put({ key: LAST_KEY, value: Date.now() });
    return { merged: !!remote };
  })().finally(() => { running = null; });
  return running;
}

/** Background sync: when the app opens, every 5 minutes, and when you switch away. */
export function useAutoSync() {
  useEffect(() => {
    let last = 0;
    const tick = async (force = false) => {
      if (!force && Date.now() - last < 60_000) return;
      if (!(await getSyncCode())) return;
      last = Date.now();
      syncNow().catch(() => {});
    };
    // first sync a few seconds after opening, so it never delays loading the page
    const first = setTimeout(() => tick(true), 6000);
    const t = setInterval(() => tick(), 5 * 60_000);
    const vis = () => { if (document.visibilityState === "hidden") tick(true); else tick(); };
    document.addEventListener("visibilitychange", vis);
    return () => { clearTimeout(first); clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, []);
}
