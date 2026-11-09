"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpenText, Brain, Calculator, Shuffle, Stethoscope } from "lucide-react";
import type { Question } from "@/lib/types";
import { adaptiveSet, diagnosticSet } from "@/lib/engine";
import { savePrefs } from "@/lib/mission";
import { markTask } from "@/lib/engine";
import { todayKey } from "@/lib/db";
import PracticeSession from "@/components/PracticeSession";
import { Card, Loading, PageHeader } from "@/components/ui";
import { mulberry32, shuffle } from "@/lib/rng";

const SETS = {
  english: { title: "English set (15)", icon: BookOpenText, count: 15, desc: "Grammar, vocabulary and usage, pitched just above your level." },
  quant: { title: "Mathematics set (20)", icon: Calculator, count: 20, desc: "Adaptive problems, weakest topics first, fresh generated numbers." },
  analytical: { title: "Analytical set (15)", icon: Brain, count: 15, desc: "Logic, critical reasoning, data interpretation and sufficiency." },
  mixed: { title: "Final challenge (15 Q · 18 min)", icon: Shuffle, count: 15, desc: "Mixed and timed. No feedback until the end." },
  diagnostic: { title: "Diagnostic test (28)", icon: Stethoscope, count: 28, desc: "No feedback until the end. Sets your level in every topic." },
} as const;
type SetId = keyof typeof SETS;

function Daily() {
  const sp = useSearchParams();
  const router = useRouter();
  const set = sp.get("set") as SetId | null;
  const [qs, setQs] = useState<Question[] | null>(null);

  useEffect(() => {
    setQs(null);
    if (!set || !SETS[set]) return;
    (async () => {
      if (set === "diagnostic") return setQs(diagnosticSet());
      if (set === "mixed") {
        const [e, q, a] = await Promise.all([adaptiveSet({ subject: "english", count: 5 }), adaptiveSet({ subject: "quant", count: 6 }), adaptiveSet({ subject: "analytical", count: 4 })]);
        return setQs(shuffle(mulberry32(Date.now()), [...e, ...q, ...a]));
      }
      setQs(await adaptiveSet({ subject: set, count: SETS[set].count }));
    })();
  }, [set]);

  if (set && SETS[set]) {
    const meta = SETS[set];
    return (
      <div>
        <button onClick={() => router.push("/daily")} className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink"><ArrowLeft size={14} /> All sets</button>
        <PageHeader title={meta.title} subtitle={meta.desc + " You can leave and come back — progress in this set is saved."} />
        {!qs ? <Loading label="Choosing questions for your level…" /> : (
          <PracticeSession
            key={set}
            questions={qs}
            title={meta.title}
            mode={set === "mixed" || set === "diagnostic" ? "timed" : "practice"}
            timeLimitSec={set === "mixed" ? 18 * 60 : undefined}
            attemptMode={set === "diagnostic" ? "diagnostic" : "daily"}
            saveKey={`session:${todayKey()}:${set}`}
            onDone={async () => {
              const task = set === "english" ? "grammar" : set === "mixed" ? "final" : set;
              await markTask(task);
              if (set === "diagnostic") await savePrefs({ diagnosticDone: true });
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Daily practice" subtitle="Pick a set. Every set adapts to your current level in each topic and avoids questions you've seen in the last two days." />
      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.keys(SETS) as SetId[]).map((id) => {
          const S = SETS[id];
          return (
            <Link key={id} href={`/daily?set=${id}`}>
              <Card className="h-full transition-colors hover:border-accent/60">
                <S.icon size={20} className="mb-2 text-accent" />
                <div className="font-medium">{S.title}</div>
                <div className="text-[13px] text-muted">{S.desc}</div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<Loading />}><Daily /></Suspense>;
}
