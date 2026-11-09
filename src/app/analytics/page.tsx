"use client";
import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import clsx from "clsx";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { db, todayKey } from "@/lib/db";
import { DAY } from "@/lib/srs";
import { topicLabel } from "@/data/taxonomy";
import { MISTAKE_CAUSES } from "@/lib/types";
import { SERIES_COLORS } from "@/components/DataChart";
import { Card, CardTitle, Empty, Loading, LinkButton, PageHeader, Stat, fmtTime, pct } from "@/components/ui";

const axis = { fontSize: 11, fill: "var(--muted)" };
const tip = { contentStyle: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 } };
const SUBJ_COLOR = { english: SERIES_COLORS[2], quant: SERIES_COLORS[0], analytical: SERIES_COLORS[1] } as const;

export default function Analytics() {
  const data = useLiveQuery(async () => ({
    attempts: await db.attempts.toArray(),
    days: await db.days.toArray(),
    skills: await db.skills.toArray(),
    mocks: (await db.mocks.where("status").equals("done").toArray()).sort((a, b) => a.startedAt - b.startedAt),
    mistakes: await db.mistakes.toArray(),
    vocab: await db.vocab.toArray(),
  }), []);

  const d = useMemo(() => {
    if (!data) return null;
    const { attempts, days, skills, mocks, mistakes, vocab } = data;
    const answered = attempts.filter((a) => !a.skipped);
    const byDay: Record<string, { n: number; c: number; ms: number; e: number; ec: number; q: number; qc: number; an: number; anc: number }> = {};
    for (const a of answered) {
      const k = todayKey(new Date(a.at));
      const r = (byDay[k] ??= { n: 0, c: 0, ms: 0, e: 0, ec: 0, q: 0, qc: 0, an: 0, anc: 0 });
      r.n++; r.ms += a.timeMs; if (a.correct) r.c++;
      if (a.subject === "english") { r.e++; if (a.correct) r.ec++; }
      if (a.subject === "quant") { r.q++; if (a.correct) r.qc++; }
      if (a.subject === "analytical") { r.an++; if (a.correct) r.anc++; }
    }
    const daily = Object.entries(byDay).sort().map(([k, r]) => ({
      day: k.slice(5),
      answered: r.n,
      accuracy: Math.round((r.c / r.n) * 100),
      English: r.e ? Math.round((r.ec / r.e) * 100) : null,
      Maths: r.q ? Math.round((r.qc / r.q) * 100) : null,
      Analytical: r.an ? Math.round((r.anc / r.an) * 100) : null,
      sec: Math.round(r.ms / r.n / 1000),
    }));
    const ratings = skills.filter((s) => s.attempts >= 3).sort((a, b) => a.rating - b.rating).map((s) => ({ topic: topicLabel(s.topic), level: Math.round(s.rating * 10) / 10, subject: s.subject }));
    const mockTrend = mocks.map((m, i) => ({
      name: `#${i + 1}`,
      total: Math.round(((m.score ?? 0) / m.qids.length) * 100),
      ...Object.fromEntries(Object.entries(m.sectionScores ?? {}).map(([s, v]) => [s === "quant" ? "Maths" : s === "english" ? "English" : "Analytical", Math.round((Math.max(0, v.score) / v.max) * 100)])),
    }));
    // revision backlog for the next 14 days
    const start = new Date(todayKey() + "T00:00:00").getTime();
    const backlog = Array.from({ length: 14 }, (_, i) => {
      const lo = i === 0 ? 0 : start + i * DAY, hi = start + (i + 1) * DAY;
      return {
        day: i === 0 ? "today" : todayKey(new Date(lo)).slice(5),
        Mistakes: mistakes.filter((m) => !m.resolved && m.due >= lo && m.due < hi).length,
        Words: vocab.filter((v) => v.due > 0 && v.due >= lo && v.due < hi).length,
      };
    });
    // heatmap: last 35 days
    const dayMap = Object.fromEntries(days.map((x) => [x.date, x]));
    const heat = Array.from({ length: 35 }, (_, i) => {
      const date = todayKey(new Date(start - (34 - i) * DAY));
      return { date, n: dayMap[date]?.answered ?? 0, tasks: dayMap[date]?.tasksDone.length ?? 0 };
    });
    // insights
    const slowest = skills.filter((s) => s.attempts >= 3).map((s) => ({ s })).sort((a, b) => b.s.avgMs - a.s.avgMs)[0];
    const causes: Record<string, number> = {};
    for (const m of mistakes) if (!m.resolved) causes[m.cause] = (causes[m.cause] ?? 0) + 1;
    const topCause = Object.entries(causes).sort((a, b) => b[1] - a[1])[0];
    const weekAgo = Date.now() - 7 * DAY;
    const acc = (xs: typeof answered) => (xs.length ? xs.filter((a) => a.correct).length / xs.length : null);
    const trend = (["english", "quant", "analytical"] as const).map((s) => ({ s, now: acc(answered.filter((a) => a.subject === s && a.at >= weekAgo)), before: acc(answered.filter((a) => a.subject === s && a.at < weekAgo)) }));
    return {
      total: answered.length,
      accuracy: answered.length ? answered.filter((a) => a.correct).length / answered.length : 0,
      avgMs: answered.length ? answered.reduce((s, a) => s + a.timeMs, 0) / answered.length : 0,
      activeDays: days.filter((x) => x.answered > 0).length,
      daily, ratings, mockTrend, backlog, heat, slowest, topCause, trend,
      weakest: ratings[0], vocabMastered: vocab.filter((v) => v.status === "mastered").length, vocabTotal: vocab.length,
    };
  }, [data]);

  if (!d) return <Loading />;
  if (!d.total) return (
    <div>
      <PageHeader eyebrow="Analytics" title="Your progress" />
      <Empty title="No data yet" action={<LinkButton href="/daily?set=diagnostic">Take the diagnostic</LinkButton>}>Charts appear once you've answered some questions. The diagnostic test is the fastest way to get a full picture.</Empty>
    </div>
  );

  const improved = d.trend.filter((t) => t.now !== null && t.before !== null).sort((a, b) => (b.now! - b.before!) - (a.now! - a.before!))[0];
  const name = (s: string) => (s === "quant" ? "Mathematics" : s === "english" ? "English" : "Analytical");

  return (
    <div>
      <PageHeader eyebrow="Analytics" title="Your progress" subtitle="Everything is computed from your own answers on this device." />
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Questions answered" value={d.total} />
        <Stat label="Accuracy" value={pct(d.accuracy)} />
        <Stat label="Avg time / question" value={fmtTime(d.avgMs)} />
        <Stat label="Active days" value={d.activeDays} />
        <Stat label="Words mastered" value={`${d.vocabMastered}/${d.vocabTotal}`} />
      </div>

      <Card className="mb-5">
        <CardTitle>Quick answers</CardTitle>
        <dl className="grid gap-3 text-[14px] sm:grid-cols-2">
          <div><dt className="text-muted">What am I weakest at?</dt><dd className="font-medium">{d.weakest ? `${d.weakest.topic} (level ${d.weakest.level})` : "Answer 3+ questions in a topic to rate it."}</dd></div>
          <div><dt className="text-muted">Where am I slowest?</dt><dd className="font-medium">{d.slowest ? `${topicLabel(d.slowest.s.topic)} — ${fmtTime(d.slowest.s.avgMs)} per question` : "—"}</dd></div>
          <div><dt className="text-muted">Why do I lose marks?</dt><dd className="font-medium">{d.topCause ? `${MISTAKE_CAUSES.find((c) => c.id === d.topCause![0])?.label} (${d.topCause[1]} open)` : "No open mistakes."}</dd></div>
          <div><dt className="text-muted">Which section improved most this week?</dt><dd className="font-medium">{improved ? `${name(improved.s)}: ${pct(improved.before!)} → ${pct(improved.now!)}` : "Needs at least a week of data."}</dd></div>
        </dl>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle>Accuracy by day (%)</CardTitle>
          <div className="h-60"><ResponsiveContainer><LineChart data={d.daily} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="day" tick={axis} /><YAxis domain={[0, 100]} tick={axis} /><Tooltip {...tip} /><Legend wrapperStyle={{ fontSize: 12 }} />
            <Line dataKey="English" stroke={SUBJ_COLOR.english} strokeWidth={2} connectNulls dot={false} />
            <Line dataKey="Maths" stroke={SUBJ_COLOR.quant} strokeWidth={2} connectNulls dot={false} />
            <Line dataKey="Analytical" stroke={SUBJ_COLOR.analytical} strokeWidth={2} connectNulls dot={false} />
          </LineChart></ResponsiveContainer></div>
        </Card>
        <Card>
          <CardTitle>Volume and speed</CardTitle>
          <div className="h-60"><ResponsiveContainer><BarChart data={d.daily} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="day" tick={axis} /><YAxis yAxisId="l" tick={axis} /><YAxis yAxisId="r" orientation="right" tick={axis} /><Tooltip {...tip} /><Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="l" dataKey="answered" name="Questions" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="r" dataKey="sec" name="Avg seconds" fill={SERIES_COLORS[1]} radius={[4, 4, 0, 0]} />
          </BarChart></ResponsiveContainer></div>
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle>Topic levels (1 foundation → 6 challenge)</CardTitle>
          {d.ratings.length ? (
            <div style={{ height: Math.max(200, d.ratings.length * 24) }}><ResponsiveContainer><BarChart data={d.ratings} layout="vertical" margin={{ left: 40, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis type="number" domain={[1, 6]} tick={axis} /><YAxis type="category" dataKey="topic" width={170} tick={axis} /><Tooltip {...tip} />
              <Bar dataKey="level" radius={[0, 4, 4, 0]} fill="var(--accent)" />
            </BarChart></ResponsiveContainer></div>
          ) : <p className="text-[14px] text-muted">Topics are rated after 3 answers each.</p>}
        </Card>
        <Card>
          <CardTitle>Mock exam trend (% of max)</CardTitle>
          {d.mockTrend.length ? (
            <div className="h-60"><ResponsiveContainer><LineChart data={d.mockTrend} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="name" tick={axis} /><YAxis domain={[0, 100]} tick={axis} /><Tooltip {...tip} /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="total" name="Total" stroke="var(--text)" strokeWidth={2.5} />
              <Line dataKey="English" stroke={SUBJ_COLOR.english} strokeDasharray="4 3" />
              <Line dataKey="Maths" stroke={SUBJ_COLOR.quant} strokeDasharray="4 3" />
              <Line dataKey="Analytical" stroke={SUBJ_COLOR.analytical} strokeDasharray="4 3" />
            </LineChart></ResponsiveContainer></div>
          ) : <Empty title="No mocks yet" action={<LinkButton href="/mock" variant="secondary">Take a mock</LinkButton>} />}
        </Card>
        <Card>
          <CardTitle>Revision backlog — next 14 days</CardTitle>
          <div className="h-60"><ResponsiveContainer><BarChart data={d.backlog} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="day" tick={axis} /><YAxis tick={axis} allowDecimals={false} /><Tooltip {...tip} /><Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Mistakes" stackId="a" fill={SERIES_COLORS[3]} />
            <Bar dataKey="Words" stackId="a" fill={SERIES_COLORS[2]} radius={[4, 4, 0, 0]} />
          </BarChart></ResponsiveContainer></div>
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle>Consistency — last 5 weeks</CardTitle>
          <div className="grid max-w-md grid-cols-7 gap-1.5">
            {d.heat.map((h) => (
              <div key={h.date} title={`${h.date}: ${h.n} answered, ${h.tasks} tasks`} className={clsx("aspect-square rounded-md border border-line", h.n === 0 ? "bg-surface-2" : h.n < 15 ? "bg-accent/25" : h.n < 40 ? "bg-accent/55" : "bg-accent")} />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11.5px] text-muted">Less <span className="h-3 w-3 rounded bg-surface-2" /><span className="h-3 w-3 rounded bg-accent/25" /><span className="h-3 w-3 rounded bg-accent/55" /><span className="h-3 w-3 rounded bg-accent" /> More · each square is a day, oldest top-left</div>
        </Card>
      </div>
      <p className="mt-4 text-[12px] text-muted">Topic levels use an adaptive rating: getting a question right moves your level towards harder questions, a miss moves it back.</p>
    </div>
  );
}
