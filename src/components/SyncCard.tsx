"use client";
import { useEffect, useState } from "react";
import { Cloud, CloudOff, Copy, RefreshCw } from "lucide-react";
import { getSyncCode, lastSync, newSyncCode, setSyncCode, syncNow, SyncNotConfigured } from "@/lib/sync";
import { Button, Card, CardTitle } from "./ui";

const input = "rounded-xl border border-line bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-accent";

export default function SyncCard() {
  const [code, setCode] = useState<string | null>(null);
  const [last, setLast] = useState<number | null>(null);
  const [entry, setEntry] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  useEffect(() => { getSyncCode().then(setCode); lastSync().then(setLast); }, []);

  async function run(c = code) {
    if (!c) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await syncNow();
      setLast(await lastSync());
      setMsg({ text: r.merged ? "Synced. Progress from your other device is merged in — reloading…" : "Synced. This device's progress is now saved in the cloud." });
      if (r.merged) setTimeout(() => location.reload(), 1200);
    } catch (e) {
      if (e instanceof SyncNotConfigured) setNotConfigured(true);
      setMsg({ text: (e as Error).message, bad: true });
    }
    setBusy(false);
  }

  async function start(c: string) {
    if (!/^[a-z]+(-[a-z]+){3}-\d{4}$/.test(c.trim().toLowerCase())) return setMsg({ text: "That doesn't look like a sync code (four words and four digits, e.g. amber-river-mango-lotus-1234).", bad: true });
    await setSyncCode(c);
    setCode(c.trim().toLowerCase());
    run(c);
  }

  return (
    <Card className="lg:col-span-2">
      <CardTitle icon={<Cloud size={16} className="text-accent" />}>Sync between phone and laptop</CardTitle>
      {code ? (
        <>
          <p className="text-[13.5px] text-muted">This device syncs with the code below. Enter the same code on your other device. Syncing happens automatically when the app opens, every 5 minutes, and when you switch away.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="select-all break-all rounded-xl bg-surface-2 px-3 py-2 text-[15px] font-semibold tracking-wide">{code}</code>
            <Button size="sm" variant="ghost" onClick={() => { const p = navigator.clipboard?.writeText(code); if (p) p.then(() => setMsg({ text: "Copied." }), () => setMsg({ text: "Couldn't copy automatically. Select the code and copy it by hand." })); else setMsg({ text: "Couldn't copy automatically. Select the code and copy it by hand." }); }}><Copy size={14} /> Copy</Button>
            <Button size="sm" onClick={() => run()} disabled={busy}><RefreshCw size={14} className={busy ? "animate-spin" : ""} /> {busy ? "Syncing…" : "Sync now"}</Button>
            <Button size="sm" variant="ghost" onClick={async () => { await setSyncCode(null); setCode(null); setMsg({ text: "Stopped syncing on this device. Your progress here is kept." }); }}><CloudOff size={14} /> Stop syncing here</Button>
          </div>
          <div className="mt-2 text-[12.5px] text-muted">{last ? `Last synced ${new Date(last).toLocaleString()}` : "Not synced yet."}</div>
          <p className="mt-2 text-[12px] text-muted">Keep the code private — anyone with it can read and change your progress. Answers from both devices are combined; nothing is overwritten. Deleting or resetting on one device doesn't delete the cloud copy.</p>
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-[14px] font-medium">First device</div>
            <p className="mb-2 text-[13px] text-muted">Create a code and upload this device's progress.</p>
            <Button onClick={() => start(newSyncCode())} disabled={busy}>Create a sync code</Button>
          </div>
          <div>
            <div className="text-[14px] font-medium">Second device</div>
            <p className="mb-2 text-[13px] text-muted">Enter the code shown on your first device.</p>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); start(entry); }}>
              <input value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="amber-river-mango-lotus-1234" className={input + " min-w-0 flex-1"} autoCapitalize="none" autoCorrect="off" />
              <Button type="submit" disabled={busy || !entry.trim()}>Connect</Button>
            </form>
          </div>
        </div>
      )}
      {msg && <p className={`mt-3 text-[13.5px] ${msg.bad ? "text-bad" : "text-good"}`}>{msg.text}</p>}
      {notConfigured && (
        <p className="mt-2 text-[12.5px] text-muted">The site owner needs to connect a Vercel Blob store once: Vercel → your project → <b>Storage</b> → <b>Create → Blob</b> (choose <b>Private</b>) → connect it to this project → redeploy. Until then, use Export / Import below.</p>
      )}
    </Card>
  );
}
