"use client";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, HardDrive } from "lucide-react";
import { db, withTimeout } from "@/lib/db";
import { Button, Card, CardTitle } from "./ui";

type Health = { ok: boolean; ms: number; error?: string; persisted?: boolean; usage?: string };

/** Write + read + delete a probe row, with a time limit. */
export async function checkStorage(): Promise<Health> {
  const t = Date.now();
  const probe = (async () => {
    await db.settings.put({ key: "probe:health", value: t });
    const v = await db.settings.get("probe:health");
    await db.settings.delete("probe:health");
    if (v?.value !== t) throw new Error("read-back mismatch");
    return true;
  })().catch((e) => { throw e; });
  let error: string | undefined;
  const ok = await withTimeout(probe.catch((e) => { error = String(e?.message ?? e); return false; }), 5000, false);
  if (!ok && !error) error = "the browser database did not respond within 5 seconds";
  let persisted: boolean | undefined, usage: string | undefined;
  try {
    persisted = await navigator.storage?.persisted?.();
    const est = await navigator.storage?.estimate?.();
    if (est?.usage !== undefined) usage = `${(est.usage / 1024 / 1024).toFixed(1)} MB used`;
  } catch {}
  return { ok, ms: Date.now() - t, error, persisted, usage };
}

/** Asks the browser not to evict our data (mobile browsers may clear site data under storage pressure). */
export function requestPersistence() {
  try { navigator.storage?.persist?.().catch(() => {}); } catch {}
}

/** Thin warning bar shown on every page only when storage is broken. */
export function StorageBanner() {
  const [h, setH] = useState<Health | null>(null);
  useEffect(() => { requestPersistence(); checkStorage().then(setH); }, []);
  if (!h || h.ok) return null;
  return (
    <div className="flex items-start gap-2 border-b border-warn/40 bg-warn/10 px-4 py-2 text-[13px]">
      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warn" />
      <span>This browser isn't letting the app save progress ({h.error}). Close other tabs of this app and reload. In private/incognito mode or some in-app browsers, saving is blocked — open the site in Chrome or Safari instead.</span>
    </div>
  );
}

export default function StorageCard() {
  const [h, setH] = useState<Health | null>(null);
  const run = useCallback(() => { setH(null); checkStorage().then(setH); }, []);
  useEffect(run, [run]);
  return (
    <Card>
      <CardTitle icon={<HardDrive size={16} className="text-accent" />}>Storage check</CardTitle>
      {!h ? <p className="text-[14px] text-muted">Testing…</p> : h.ok ? (
        <p className="text-[14px] text-good">Saving works ({h.ms} ms){h.usage ? ` · ${h.usage}` : ""}{h.persisted ? " · protected from automatic clearing" : ""}.</p>
      ) : (
        <p className="text-[14px] text-bad">Saving is not working: {h.error}.</p>
      )}
      <p className="mt-2 text-[12.5px] text-muted">Progress lives in this browser's storage. Private/incognito windows and some in-app browsers (e.g. opening the link inside Messenger) don't keep it.</p>
      <Button size="sm" variant="secondary" className="mt-3" onClick={run}>Test again</Button>
    </Card>
  );
}
