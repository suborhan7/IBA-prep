"use client";
import Dexie, { type EntityTable } from "dexie";
import type { MistakeCause, Question, Subject } from "./types";

/**
 * Persistent store. Everything lives in the browser's IndexedDB, so the app works
 * offline, needs no account, and can be hosted on any static/Node host.
 * Use Settings → Export to back up or move progress to another device.
 */

export type AttemptMode = "practice" | "timed" | "mock" | "diagnostic" | "daily" | "revision";

export interface Attempt {
  id?: number;
  qid: string;
  subject: Subject;
  topic: string;
  difficulty: number;
  correct: boolean;
  skipped?: boolean;
  chosen: number | null;
  timeMs: number;
  at: number;
  mode: AttemptMode;
}

export interface Mistake {
  qid: string;
  subject: Subject;
  topic: string;
  chosen: number | null;
  cause: MistakeCause;
  note: string;
  slow: boolean;
  wrongCount: number;
  rightStreak: number;
  interval: number; // days
  due: number; // epoch ms
  firstAt: number;
  lastAt: number;
  resolved: boolean;
}

export interface VocabCard {
  word: string;
  status: "new" | "learning" | "familiar" | "mastered" | "revise";
  ease: number;
  interval: number; // days
  reps: number;
  lapses: number;
  due: number;
  lastAt: number;
  seen: number;
  correct: number;
}

export interface SkillRating {
  topic: string;
  subject: Subject;
  rating: number; // 1..6, continuous difficulty the student handles ~60% of the time
  attempts: number;
  correct: number;
  avgMs: number;
}

export interface DrillResult {
  id?: number;
  kind: string;
  level: number;
  correct: number;
  total: number;
  avgMs: number;
  at: number;
}

export interface MockRecord {
  id?: number;
  mode: "practice" | "timed" | "full";
  configName: string;
  startedAt: number;
  finishedAt?: number;
  durationSec: number;
  qids: string[];
  answers: (number | null)[];
  times: number[];
  marked: boolean[];
  current: number;
  negative: number;
  autoSubmitted?: boolean;
  elapsedSec?: number;
  writing?: { prompt: string; text: string; seconds: number };
  status: "active" | "done";
  score?: number;
  sectionScores?: Record<string, { score: number; max: number; correct: number; wrong: number; blank: number }>;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  answered: number;
  correct: number;
  ms: number;
  tasksDone: string[];
}

export interface CustomQuestion extends Question {
  status: "pending" | "approved" | "rejected";
  checks: string[];
  createdAt: number;
}

export interface TutorMessage {
  id?: number;
  thread: string;
  role: "user" | "assistant";
  content: string;
  at: number;
  mode: string;
}

export interface Setting {
  key: string;
  value: unknown;
}

export interface Bookmark {
  qid: string;
  at: number;
}

export interface PuzzleRun {
  id?: number;
  puzzleId: string;
  solved: boolean;
  ms: number;
  at: number;
}

class PrepDB extends Dexie {
  attempts!: EntityTable<Attempt, "id">;
  mistakes!: EntityTable<Mistake, "qid">;
  vocab!: EntityTable<VocabCard, "word">;
  skills!: EntityTable<SkillRating, "topic">;
  drills!: EntityTable<DrillResult, "id">;
  mocks!: EntityTable<MockRecord, "id">;
  days!: EntityTable<DayLog, "date">;
  custom!: EntityTable<CustomQuestion, "id">;
  tutor!: EntityTable<TutorMessage, "id">;
  settings!: EntityTable<Setting, "key">;
  bookmarks!: EntityTable<Bookmark, "qid">;
  puzzles!: EntityTable<PuzzleRun, "id">;

  constructor() {
    super("du-iba-prep");
    this.version(1).stores({
      attempts: "++id, qid, subject, topic, at, mode, correct",
      mistakes: "qid, subject, topic, due, resolved, cause",
      vocab: "word, status, due",
      skills: "topic, subject",
      drills: "++id, kind, at",
      mocks: "++id, status, startedAt",
      days: "date",
      custom: "id, status, subject",
      tutor: "++id, thread, at",
      settings: "key",
      bookmarks: "qid",
      puzzles: "++id, puzzleId, at",
    });
  }
}

export const db = new PrepDB();

export const TABLES = [
  "attempts",
  "mistakes",
  "vocab",
  "skills",
  "drills",
  "mocks",
  "days",
  "custom",
  "tutor",
  "settings",
  "bookmarks",
  "puzzles",
] as const;

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return (row?.value as T) ?? fallback;
}

export async function setSetting(key: string, value: unknown) {
  await db.settings.put({ key, value });
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function exportAll() {
  const out: Record<string, unknown[]> = {};
  for (const name of TABLES) out[name] = await db.table(name).toArray();
  return { app: "du-iba-prep", version: 1, exportedAt: new Date().toISOString(), data: out };
}

export async function importAll(payload: unknown, mode: "replace" | "merge" = "replace") {
  if (!payload || typeof payload !== "object") throw new Error("Not a valid backup file.");
  const p = payload as { app?: string; data?: Record<string, unknown[]> };
  if (p.app !== "du-iba-prep" || !p.data) throw new Error("This file is not a DU IBA Prep backup.");
  await db.transaction("rw", TABLES.map((t) => db.table(t)), async () => {
    for (const name of TABLES) {
      const rows = p.data![name];
      if (!Array.isArray(rows)) continue;
      if (mode === "replace") await db.table(name).clear();
      await db.table(name).bulkPut(rows);
    }
  });
}

export async function resetAll() {
  await db.transaction("rw", TABLES.map((t) => db.table(t)), async () => {
    for (const name of TABLES) await db.table(name).clear();
  });
}

/** Resolve with `fallback` if `p` hasn't settled within `ms` (or rejects). Keeps the UI moving if storage stalls. */
export function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(fallback), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, () => { clearTimeout(t); resolve(fallback); });
  });
}
