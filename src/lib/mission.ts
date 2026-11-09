"use client";
import { db, getSetting, setSetting, todayKey } from "./db";
import { PLAN, type PlanDay } from "@/data/plan";
import { getRatings, dueMistakes } from "./engine";
import { TOPICS, topicLabel } from "@/data/taxonomy";
import { DAY } from "./srs";

export interface Prefs {
  startDate: string | null;
  examDate: string | null;
  newWords: number;
  hours: { english: number; quant: number; analytical: number; review: number };
  examPreset: string;
  negative: number;
  diagnosticDone: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  startDate: null,
  examDate: null,
  newWords: 15,
  hours: { english: 2, quant: 2, analytical: 1.5, review: 0.5 },
  examPreset: "reported-70",
  negative: 0,
  diagnosticDone: false,
};

export async function getPrefs(): Promise<Prefs> {
  const p = await getSetting<Partial<Prefs>>("prefs", {});
  return { ...DEFAULT_PREFS, ...p, hours: { ...DEFAULT_PREFS.hours, ...(p.hours ?? {}) } };
}

export async function savePrefs(patch: Partial<Prefs>) {
  const p = await getPrefs();
  await setSetting("prefs", { ...p, ...patch });
}

export function planDayNumber(prefs: Prefs, now = new Date()): number {
  if (!prefs.startDate) return 1;
  const start = new Date(prefs.startDate + "T00:00:00");
  const d = Math.floor((now.getTime() - start.getTime()) / DAY) + 1;
  return Math.max(1, Math.min(30, d));
}

export interface Task {
  id: string;
  subject: "english" | "quant" | "analytical" | "review" | "final";
  title: string;
  detail: string;
  href: string;
  minutes: number;
  done: boolean;
}

export interface Mission {
  day: number;
  plan: PlanDay;
  tasks: Task[];
  focusTopics: string[];
}

/**
 * Today's mission = the plan for today's day number, adapted to performance:
 * the two weakest rated topics in each subject replace part of the scheduled topics,
 * and the vocabulary / mistake loads come from what is actually due.
 */
export async function buildMission(): Promise<Mission> {
  const prefs = await getPrefs();
  const day = planDayNumber(prefs);
  const plan = PLAN[day - 1];
  const ratings = await getRatings();
  const doneToday = (await db.days.get(todayKey()))?.tasksDone ?? [];
  const now = Date.now();
  const [vDue, mDue] = await Promise.all([db.vocab.where("due").between(1, now, true, true).count(), dueMistakes(200)]);

  const weakest = (subject: string) =>
    TOPICS.filter((t) => t.subject === subject && ratings[t.id] && ratings[t.id].attempts >= 3)
      .sort((a, b) => ratings[a.id].rating - ratings[b.id].rating)
      .slice(0, 2)
      .map((t) => t.id);

  const wEn = weakest("english"), wQt = weakest("quant"), wAn = weakest("analytical");
  const phase = plan.phase;
  const nQuant = phase === 1 ? 15 : 20;
  const t = (id: string, rest: Omit<Task, "id" | "done">): Task => ({ id, ...rest, done: doneToday.includes(id) });

  const tasks: Task[] = [
    t("vocab", { subject: "english", title: `Learn ${prefs.newWords} new words + review ${vDue} due`, detail: "Spaced repetition. Forgotten words come back within minutes.", href: "/vocab?mode=study", minutes: 25 }),
    t("grammar", { subject: "english", title: `Grammar: ${plan.english[0].replace("Grammar: ", "")}`, detail: "Read the visual lesson, then practise its questions (or the 15-question English set).", href: `/english/grammar/${plan.ids.english[0]}`, minutes: 40 }),
    t("reading", { subject: "english", title: phase >= 3 ? "Reading: 2 timed passages" : "Reading: 1 passage", detail: "Main idea, tone, inference, vocabulary in context.", href: "/english?tab=reading", minutes: 25 }),
    t("speed", { subject: "quant", title: phase === 1 ? "Speed Gym: 2 drills" : "Speed Gym: 3 drills", detail: "Percentages, multiplication, fractions — the level rises automatically.", href: "/speed", minutes: 15 }),
    t("quant", { subject: "quant", title: `Solve ${nQuant} problems`, detail: `Scheduled: ${plan.quant[0].replace("Topics: ", "")}${wQt.length ? ` · Weakest: ${wQt.map(topicLabel).join(", ")}` : ""}`, href: "/daily?set=quant", minutes: 60 }),
    t("shortcuts", { subject: "quant", title: "Review 3 shortcuts", detail: "From the shortcut library, with when-not-to-use notes.", href: "/quant?tab=shortcuts", minutes: 10 }),
    t("puzzle", { subject: "analytical", title: phase === 1 ? "Learn the puzzle method + 1 puzzle" : "Solve 2 arrangement puzzles", detail: "Drag people into seats; the board checks every condition.", href: "/analytical?tab=puzzles", minutes: 30 }),
    t("analytical", { subject: "analytical", title: `${phase === 1 ? 10 : 15} reasoning questions`, detail: `Scheduled: ${plan.analytical[0].replace("Topics: ", "")}${wAn.length ? ` · Weakest: ${wAn.map(topicLabel).join(", ")}` : ""}`, href: "/daily?set=analytical", minutes: 45 }),
    t("mistakes", { subject: "review", title: mDue.length ? `Revise ${mDue.length} mistake${mDue.length > 1 ? "s" : ""} due today` : "Mistake notebook: nothing due", detail: "Wrong or slow questions return on a 1-3-7-14-30 day ladder.", href: "/mistakes?tab=review", minutes: 20 }),
    t("final", { subject: "final", title: plan.mock ?? "Final challenge: mixed timed set (15 Q, 18 min)", detail: plan.mock ? "From the 30-day plan." : "Mixed English, Maths and Analytical under time pressure.", href: plan.mock?.toLowerCase().includes("diagnostic") ? "/daily?set=diagnostic" : plan.mock?.toLowerCase().includes("mock") ? "/mock" : "/daily?set=mixed", minutes: 30 }),
  ];
  if (wEn.length) tasks[1].detail += ` · Weakest: ${wEn.map(topicLabel).join(", ")}`;
  if (!prefs.diagnosticDone) tasks.unshift(t("diagnostic", { subject: "final", title: "Take the diagnostic test (28 questions)", detail: "Sets your starting level in every topic so practice is pitched correctly.", href: "/daily?set=diagnostic", minutes: 35 }));

  return { day, plan, tasks, focusTopics: [...wEn, ...wQt, ...wAn] };
}

export async function ensureStarted() {
  const p = await getPrefs();
  if (!p.startDate) await savePrefs({ startDate: todayKey() });
}

export async function streak(): Promise<{ current: number; best: number; activeDays: number }> {
  const days = (await db.days.toArray()).filter((d) => d.answered > 0 || d.tasksDone.length > 0).map((d) => d.date).sort();
  const set = new Set(days);
  let current = 0;
  const cursor = new Date();
  if (!set.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1); // today not started yet doesn't break the streak
  while (set.has(todayKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }
  let best = 0, run = 0;
  let prev: Date | null = null;
  for (const d of days) {
    const dt = new Date(d + "T00:00:00");
    run = prev && Math.round((dt.getTime() - prev.getTime()) / DAY) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = dt;
  }
  return { current, best, activeDays: days.length };
}
