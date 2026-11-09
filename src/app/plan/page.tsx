"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { useLiveQuery } from "dexie-react-hooks";
import { PLAN } from "@/data/plan";
import { getPrefs, planDayNumber, savePrefs, type Prefs } from "@/lib/mission";
import { db } from "@/lib/db";
import { Badge, Card, CardTitle, PageHeader } from "@/components/ui";

const PHASE_INFO = [
  { n: 1, days: "1–7", name: "Foundation & diagnosis", goals: "Find strengths and weaknesses, build grammar foundations, start vocabulary, review core maths, learn the puzzle method, set baseline speed." },
  { n: 2, days: "8–14", name: "Intensive skill building", goals: "Advanced grammar, harder reading, high-speed arithmetic, algebra and number properties, complex reasoning, daily timed sets." },
  { n: 3, days: "15–21", name: "Advanced problem solving", goals: "Difficult English, inference, complex quant, multi-condition puzzles, mixed timed sets, sectional mocks." },
  { n: 4, days: "22–30", name: "Exam readiness", goals: "Full mocks, strict timing, weakness elimination, mistake-notebook revision, exam strategy." },
];

export default function PlanPage() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const daysLog = useLiveQuery(() => db.days.toArray(), []);
  useEffect(() => { getPrefs().then(setPrefs); }, []);
  if (!prefs) return null;
  const today = planDayNumber(prefs);
  const day = PLAN[(sel ?? today) - 1];
  const total = prefs.hours.english + prefs.hours.quant + prefs.hours.analytical + prefs.hours.review;
  const startDate = prefs.startDate ? new Date(prefs.startDate + "T00:00:00") : new Date();
  const dateOf = (n: number) => { const d = new Date(startDate); d.setDate(d.getDate() + n - 1); return d; };
  const activeDates = new Set((daysLog ?? []).filter((d) => d.answered > 0).map((d) => d.date));

  const setHours = (k: keyof Prefs["hours"], v: number) => {
    const next = { ...prefs, hours: { ...prefs.hours, [k]: v } };
    setPrefs(next);
    savePrefs({ hours: next.hours });
  };

  return (
    <div>
      <PageHeader eyebrow={`Today is day ${today}`} title="30-day bootcamp" subtitle="Four phases. The day's topics come from this plan, but the Daily Mission swaps in your weakest topics and sizes revision to what is actually due — so the plan adapts instead of marching on blindly." />

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        {PHASE_INFO.map((p) => (
          <Card key={p.n} className={clsx("p-4", day.phase === p.n && "border-accent")}>
            <div className="text-[12px] text-muted">Phase {p.n} · Days {p.days}</div>
            <div className="font-medium">{p.name}</div>
            <div className="mt-1 text-[12.5px] text-muted">{p.goals}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardTitle>Calendar</CardTitle>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10 lg:grid-cols-6 xl:grid-cols-10">
            {PLAN.map((d) => {
              const date = dateOf(d.day);
              const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
              const active = activeDates.has(key);
              return (
                <button key={d.day} onClick={() => setSel(d.day)}
                  className={clsx("aspect-square rounded-lg border text-[13px] tabular-nums transition-colors",
                    (sel ?? today) === d.day ? "border-accent bg-accent text-accent-ink" : d.day === today ? "border-accent text-accent" : "border-line hover:bg-surface-2",
                    d.day < today && !active && (sel ?? today) !== d.day && "text-muted")}
                  title={date.toDateString()}>
                  {d.day}
                  {active && <span className="mx-auto mt-0.5 block h-1 w-1 rounded-full bg-good" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <div className="mb-2 text-[13px] font-medium">Daily hours ({total.toFixed(1)} h total)</div>
            {(["english", "quant", "analytical", "review"] as const).map((k) => (
              <label key={k} className="mb-2 flex items-center gap-3 text-[13px]">
                <span className="w-24 capitalize text-muted">{k === "quant" ? "Maths" : k}</span>
                <input type="range" min={0} max={4} step={0.5} value={prefs.hours[k]} onChange={(e) => setHours(k, Number(e.target.value))} className="flex-1 accent-[var(--accent)]" />
                <span className="w-10 text-right tabular-nums">{prefs.hours[k]}h</span>
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-1 text-[12px] text-muted">{dateOf(day.day).toDateString()} · Phase {day.phase}: {day.phaseName}</div>
          <h2 className="mb-4 font-serif text-[22px] font-semibold">Day {day.day}</h2>
          {[
            ["English", day.english, prefs.hours.english],
            ["Mathematics", day.quant, prefs.hours.quant],
            ["Analytical", day.analytical, prefs.hours.analytical],
            ["Revision & analysis", day.review, prefs.hours.review],
          ].map(([label, items, h]) => (
            <div key={label as string} className="mb-4">
              <div className="mb-1 flex items-center gap-2 text-[14px] font-medium">{label as string} <Badge>{h as number}h</Badge></div>
              <ul className="list-disc space-y-0.5 pl-5 text-[14px] text-muted">{(items as string[]).map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          ))}
          {day.mock && <div className="rounded-xl bg-accent-soft px-4 py-3 text-[14px] text-accent">{day.mock}</div>}
        </Card>
      </div>
    </div>
  );
}
