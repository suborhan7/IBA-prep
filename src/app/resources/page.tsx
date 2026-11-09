"use client";
import { useMemo, useState } from "react";
import { ExternalLink, Search, ShieldAlert } from "lucide-react";
import { RESOURCES, VERIFICATION_LABEL, type Verification } from "@/data/resources";
import { Badge, Card, PageHeader, Select } from "@/components/ui";

const TONE: Record<Verification, "good" | "warn" | "neutral" | "accent" | "bad"> = {
  "official-unreadable": "warn",
  "notice-copy": "accent",
  press: "neutral",
  "prep-provider": "neutral",
  reference: "good",
  book: "neutral",
};

export default function Resources() {
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("all");
  const [type, setType] = useState("all");
  const list = useMemo(() => RESOURCES.filter((r) =>
    (subject === "all" || r.subject === subject) &&
    (type === "all" || r.type === type) &&
    (!q || `${r.name} ${r.topic} ${r.points.join(" ")}`.toLowerCase().includes(q.toLowerCase())),
  ), [q, subject, type]);

  return (
    <div>
      <PageHeader eyebrow="Resource Library" title="Sources, with how far to trust each one" subtitle="Every exam-format fact in this app traces to one of these. Nothing here is a copied past paper: the app links out instead of reproducing copyrighted material." />
      <Card className="mb-5 flex items-start gap-3 border-warn/50">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-warn" />
        <div className="text-[13.5px]">
          <div className="font-medium">What is verified and what is not</div>
          <p className="mt-1 text-muted">The official site (mba.iba-du.edu) blocks automated reading, so the current intake's exact question counts, timing and negative marking could not be confirmed from it. The test date (5 Dec 2025), fee and the per-section minimum rule come from copies of the official notice. The 70-mark/90-minute structure and the 0.25 negative marking come from press and coaching sources and are labelled unverified throughout the app. Check the official site and update Settings → Exam format if anything differs.</p>
        </div>
      </Card>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_200px]">
        <label className="flex flex-col gap-1 text-[13px] text-muted">
          Search
          <span className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2"><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. negative marking, vocabulary, statistics" className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none" /></span>
        </label>
        <Select label="Subject" value={subject} onChange={setSubject} options={[{ value: "all", label: "All" }, ...[...new Set(RESOURCES.map((r) => r.subject))].map((s) => ({ value: s, label: s }))]} />
        <Select label="Type" value={type} onChange={setType} options={[{ value: "all", label: "All" }, ...[...new Set(RESOURCES.map((r) => r.type))].map((s) => ({ value: s, label: s }))]} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((r) => (
          <Card key={r.name} className="flex flex-col p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="font-medium">{r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-accent">{r.name} <ExternalLink size={13} /></a> : r.name}</div>
              <Badge tone={TONE[r.verification]} className="shrink-0">{VERIFICATION_LABEL[r.verification]}</Badge>
            </div>
            <div className="mt-1 text-[12.5px] text-muted">{r.subject} · {r.topic} · {r.type} · {r.difficulty}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[13.5px]">{r.points.map((p) => <li key={p}>{p}</li>)}</ul>
            <div className="mt-auto pt-2 text-[11.5px] text-muted">{r.url ? <span className="break-all">{r.url}</span> : "Offline book"} · researched {r.checked}</div>
          </Card>
        ))}
      </div>
      {!list.length && <p className="text-center text-[14px] text-muted">No resources match.</p>}
    </div>
  );
}
