"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight, CheckCircle2, Circle, Flame, Info, Target } from "lucide-react";
import clsx from "clsx";
import { buildMission, ensureStarted, streak, type Mission } from "@/lib/mission";
import { readiness, type Readiness } from "@/lib/engine";
import { db } from "@/lib/db";
import { topicLabel } from "@/data/taxonomy";
import { bankStats } from "@/lib/bank";
import { Badge, Card, CardTitle, LinkButton, PageHeader, Progress, Stat, pct } from "@/components/ui";

function Ring({ value }: { value: number }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32" role="img" aria-label={`Readiness ${value} out of 100`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset .6s" }} />
      <text x="60" y="58" textAnchor="middle" fontSize="28" fontWeight="600" fill="var(--text)">{value}</text>
      <text x="60" y="78" textAnchor="middle" fontSize="11" fill="var(--muted)">readiness</text>
    </svg>
  );
}

export default function Dashboard() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [ready, setReady] = useState<Readiness | null>(null);
  const [st, setSt] = useState<{ current: number; best: number; activeDays: number } | null>(null);
  const tick = useLiveQuery(() => db.attempts.count(), []);
  const today = useLiveQuery(async () => (await db.days.toArray()).at(-1), []);

  useEffect(() => {
    (async () => {
      await ensureStarted();
      setMission(await buildMission());
      setReady(await readiness());
      setSt(await streak());
    })();
  }, [tick, today?.tasksDone.length]);

  const stats = bankStats();
  const doneCount = mission?.tasks.filter((t) => t.done).length ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow={mission ? `Day ${mission.day} of 30 · ${mission.plan.phaseName}` : "Welcome"}
        title="Today's mission"
        subtitle="Built from your 30-day plan and adjusted to your weakest topics. Finish the list, then stop — consistency beats marathons."
        actions={<LinkButton href="/daily">Start practising <ArrowRight size={15} /></LinkButton>}
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardTitle right={<span className="text-[13px] text-muted">{doneCount}/{mission?.tasks.length ?? 0} done</span>} icon={<Target size={16} className="text-accent" />}>Mission checklist</CardTitle>
          <Progress value={mission ? (doneCount / mission.tasks.length) * 100 : 0} className="mb-4" />
          <ul className="divide-y divide-line">
            {mission?.tasks.map((t) => (
              <li key={t.id}>
                <Link href={t.href} className="group flex items-start gap-3 py-3">
                  {t.done ? <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-good" /> : <Circle size={19} className="mt-0.5 shrink-0 text-muted" />}
                  <div className="min-w-0 flex-1">
                    <div className={clsx("text-[14.5px] font-medium", t.done && "text-muted line-through")}>{t.title}</div>
                    <div className="text-[12.5px] text-muted">{t.detail}</div>
                  </div>
                  <Badge className="shrink-0 capitalize">{t.subject === "quant" ? "maths" : t.subject}</Badge>
                  <span className="hidden shrink-0 text-[12px] text-muted sm:block">{t.minutes}m</span>
                  <ArrowRight size={15} className="mt-1 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card className="flex items-center gap-5">
            <Ring value={ready?.score ?? 0} />
            <div className="min-w-0">
              <div className="text-[13px] text-muted">An internal estimate from your topic levels and how much you have practised.</div>
              <div className="mt-2 flex items-start gap-1.5 text-[12px] text-muted"><Info size={13} className="mt-0.5 shrink-0" />It does not predict admission — IBA's cut-offs aren't published.</div>
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Study streak" value={<span className="flex items-center gap-1.5"><Flame size={20} className="text-warn" />{st?.current ?? 0}d</span>} hint={`Best ${st?.best ?? 0}d · ${st?.activeDays ?? 0} active days`} />
            <Stat label="Answered today" value={today?.answered ?? 0} hint={today?.answered ? `${pct((today.correct ?? 0) / today.answered)} correct` : "Let's start"} />
          </div>
          <Card>
            <CardTitle>By section</CardTitle>
            {(["english", "quant", "analytical"] as const).map((s) => {
              const v = ready?.bySubject[s];
              return (
                <div key={s} className="mb-3 last:mb-0">
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span>{s === "english" ? "English" : s === "quant" ? "Mathematics" : "Analytical"}</span>
                    <span className="tabular-nums text-muted">{v?.answered ? `${pct(v.accuracy)} · level ${v.rating.toFixed(1)}` : "not started"}</span>
                  </div>
                  <Progress value={v ? ((v.rating - 1) / 5) * 100 : 0} tone={v && v.rating < 2.5 ? "warn" : "accent"} />
                </div>
              );
            })}
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Card>
          <CardTitle>Focus topics (weakest first)</CardTitle>
          {ready?.weakest.length ? (
            <div className="flex flex-wrap gap-1.5">
              {ready.weakest.map((w) => <Badge key={w.topic} tone="bad">{topicLabel(w.topic)} · L{w.rating.toFixed(1)}</Badge>)}
            </div>
          ) : (
            <p className="text-[14px] text-muted">Answer at least three questions in a topic to rate it. The diagnostic test rates everything at once.</p>
          )}
          {ready?.strongest.length ? (
            <>
              <div className="mb-1.5 mt-4 text-[12.5px] text-muted">Strongest</div>
              <div className="flex flex-wrap gap-1.5">{ready.strongest.map((w) => <Badge key={w.topic} tone="good">{topicLabel(w.topic)} · L{w.rating.toFixed(1)}</Badge>)}</div>
            </>
          ) : null}
        </Card>
        <Card>
          <CardTitle>About the test</CardTitle>
          <p className="text-[14px] text-muted">
            Recent unofficial reports describe roughly 70 multiple-choice marks in 90 minutes (English, Maths, Analytical) plus a 30-minute written part, with a minimum score needed in each section. Negative marking of 0.25 is widely reported but not confirmed by an official source this app could read.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <LinkButton href="/resources" variant="secondary">Sources & verification</LinkButton>
            <LinkButton href="/settings" variant="secondary">Adjust exam format</LinkButton>
          </div>
          <div className="mt-4 text-[12px] text-muted">Bank: {stats.total} written questions · {stats.generators} generators with unlimited computed questions · {stats.vocab} vocabulary words.</div>
        </Card>
      </div>
    </div>
  );
}
