"use client";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Cpu, Download, Upload, WifiOff } from "lucide-react";
import { EXAM_PRESETS, type ExamConfig } from "@/data/plan";
import { exportAll, importAll, resetAll, setSetting, getSetting } from "@/lib/db";
import { getPrefs, savePrefs, type Prefs } from "@/lib/mission";
import { SUBJECT_NAME } from "@/lib/mock";
import { Button, Card, CardTitle, Loading, PageHeader, Select } from "@/components/ui";
import SyncCard from "@/components/SyncCard";
import StorageCard from "@/components/StorageCheck";
import InstallButton from "@/components/InstallButton";

const input = "rounded-xl border border-line bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-accent";

export default function Settings() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [custom, setCustom] = useState<ExamConfig | null>(null);
  const [msg, setMsg] = useState("");
  const [ai, setAi] = useState<{ available: boolean; provider: string; model: string | null } | null>(null);
  const [confirmReset, setConfirmReset] = useState("");
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getPrefs().then(setPrefs);
    getSetting<ExamConfig | null>("examConfig:custom", null).then(setCustom);
    fetch("/api/tutor").then((r) => r.json()).then(setAi).catch(() => setAi({ available: false, provider: "none", model: null }));
  }, []);

  if (!prefs) return <Loading />;
  const update = async (patch: Partial<Prefs>) => { const p = { ...prefs, ...patch }; setPrefs(p); await savePrefs(patch); flash("Saved."); };
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };
  const editable: ExamConfig = custom ?? { ...EXAM_PRESETS[0], id: "custom", name: "My custom format", note: "Edited in Settings to match the official circular.", sections: EXAM_PRESETS[0].sections.map((s) => ({ ...s })) };

  async function saveCustom(c: ExamConfig) {
    setCustom(c);
    await setSetting("examConfig:custom", c);
  }

  async function doExport() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `du-iba-prep-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function doImport(mode: "replace" | "merge") {
    const f = file.current?.files?.[0];
    if (!f) return flash("Choose a backup file first.");
    try {
      await importAll(JSON.parse(await f.text()), mode);
      flash(`Imported (${mode}). Reloading…`);
      setTimeout(() => location.reload(), 800);
    } catch (e) {
      flash(`Import failed: ${(e as Error).message}`);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Settings" title="Preferences and data" subtitle="Everything is stored in this browser. Export a backup before clearing browser data or switching devices." />
      {msg && <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-ink px-4 py-2 text-[14px] text-bg shadow-lg">{msg}</div>}
      <div className="grid gap-5 lg:grid-cols-2">
        <SyncCard />
        <Card className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[15px] font-semibold">Install as an app</div>
            <p className="text-[13px] text-muted">Opens in its own window with an icon on your home screen or desktop, and practice works offline. If no button shows, the app is already installed (or open this page in Chrome, Edge or Safari).</p>
          </div>
          <div className="w-40"><InstallButton /></div>
        </Card>
        <Card>
          <CardTitle>Study plan</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-[13px] text-muted">Plan start date<input type="date" className={input} value={prefs.startDate ?? ""} onChange={(e) => update({ startDate: e.target.value || null })} /></label>
            <label className="flex flex-col gap-1 text-[13px] text-muted">Exam date (optional)<input type="date" className={input} value={prefs.examDate ?? ""} onChange={(e) => update({ examDate: e.target.value || null })} /></label>
            <label className="flex flex-col gap-1 text-[13px] text-muted">New words per day<input type="number" min={0} max={50} className={input} value={prefs.newWords} onChange={(e) => update({ newWords: Math.max(0, Math.min(50, Number(e.target.value) || 0)) })} /></label>
            <label className="flex items-center gap-2 self-end pb-2 text-[14px]"><input type="checkbox" checked={prefs.diagnosticDone} onChange={(e) => update({ diagnosticDone: e.target.checked })} /> Diagnostic completed</label>
          </div>
          <p className="mt-3 text-[12px] text-muted">The plan day is counted from the start date (day 1 = start date, capped at 30). Daily hours are set on the 30-Day Plan page.</p>
        </Card>

        <Card>
          <CardTitle>Exam format</CardTitle>
          <Select label="Default format for mocks" value={prefs.examPreset} onChange={(v) => update({ examPreset: v })} options={[...EXAM_PRESETS, ...(custom ? [custom] : [])].map((c) => ({ value: c.id, label: c.name }))} />
          <div className="mt-4 rounded-xl border border-warn/50 bg-warn/5 p-3">
            <div className="flex items-center gap-2 text-[14px] font-medium"><AlertTriangle size={15} className="text-warn" /> Negative marking</div>
            <p className="mt-1 text-[12.5px] text-muted">Reported as 0.25 per wrong answer by press and coaching sources (one source says 0.2). Not confirmed from an official source, so it's off by default.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[0, 0.2, 0.25].map((n) => <Button key={n} size="sm" variant={prefs.negative === n ? "primary" : "secondary"} onClick={() => update({ negative: n })}>{n === 0 ? "Off" : `−${n}`}</Button>)}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle>Custom exam format</CardTitle>
          <p className="mb-3 text-[13px] text-muted">If the official circular gives different numbers, enter them here; the format then appears in the mock exam list.</p>
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="flex flex-col gap-1 text-[13px] text-muted sm:col-span-2">Name<input className={input} value={editable.name} onChange={(e) => saveCustom({ ...editable, name: e.target.value })} /></label>
            <label className="flex flex-col gap-1 text-[13px] text-muted">Total minutes<input type="number" min={5} max={240} className={input} value={editable.totalMinutes} onChange={(e) => saveCustom({ ...editable, totalMinutes: Math.max(5, Number(e.target.value) || 5) })} /></label>
            <label className="flex flex-col gap-1 text-[13px] text-muted">Negative per wrong<input type="number" step={0.05} min={0} max={1} className={input} value={editable.negative} onChange={(e) => saveCustom({ ...editable, negative: Math.max(0, Math.min(1, Number(e.target.value) || 0)) })} /></label>
            {editable.sections.map((s, i) => (
              <label key={s.subject} className="flex flex-col gap-1 text-[13px] text-muted">{SUBJECT_NAME[s.subject]} questions
                <input type="number" min={0} max={60} className={input} value={s.count} onChange={(e) => saveCustom({ ...editable, sections: editable.sections.map((x, j) => (j === i ? { ...x, count: Math.max(0, Math.min(60, Number(e.target.value) || 0)) } : x)) })} />
              </label>
            ))}
          </div>
          {custom && <Button className="mt-3" size="sm" variant="ghost" onClick={async () => { setCustom(null); await setSetting("examConfig:custom", null); if (prefs.examPreset === "custom") update({ examPreset: "reported-70" }); }}>Remove custom format</Button>}
        </Card>

        <StorageCard />
        <Card>
          <CardTitle>AI tutor</CardTitle>
          {!ai ? <Loading /> : ai.available ? (
            <p className="flex items-center gap-2 text-[14px] text-good"><Cpu size={16} /> Connected: {ai.provider} · {ai.model}</p>
          ) : (
            <>
              <p className="flex items-center gap-2 text-[14px] text-muted"><WifiOff size={16} /> Not configured — the offline tutor is used.</p>
              <p className="mt-2 text-[12.5px] text-muted">Set <code>ANTHROPIC_API_KEY</code> (and optionally <code>AI_MODEL</code>) as environment variables on the server — in Vercel: Project → Settings → Environment Variables — then redeploy. Keys are only read on the server and never sent to the browser. See the README for an OpenAI-compatible provider.</p>
            </>
          )}
        </Card>

        <Card>
          <CardTitle>Backup and restore</CardTitle>
          <div className="flex flex-wrap gap-2"><Button onClick={doExport}><Download size={15} /> Export all progress</Button></div>
          <div className="mt-4 flex flex-col gap-2">
            <input ref={file} type="file" accept="application/json,.json" className="text-[13px]" />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => doImport("merge")}><Upload size={14} /> Import and merge</Button>
              <Button variant="secondary" size="sm" onClick={() => doImport("replace")}><Upload size={14} /> Import and replace</Button>
            </div>
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <div className="text-[14px] font-medium text-bad">Reset everything</div>
            <p className="text-[12.5px] text-muted">Deletes all answers, mistakes, vocabulary progress, mocks and settings in this browser. Type RESET to confirm.</p>
            <div className="mt-2 flex gap-2">
              <input value={confirmReset} onChange={(e) => setConfirmReset(e.target.value)} className={input + " w-32"} placeholder="RESET" />
              <Button variant="danger" size="sm" disabled={confirmReset !== "RESET"} onClick={async () => { await resetAll(); location.href = "/"; }}>Reset</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
