"use client";
import { useEffect, useState } from "react";
import { Bug } from "lucide-react";
import { BUILD, clearLog, readLog, type LogEntry } from "@/lib/health";
import { Button, Card, CardTitle } from "./ui";

/** Shows the app version and anything that went wrong on this device, so it can be reported. */
export default function ProblemLog() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [msg, setMsg] = useState("");
  useEffect(() => setLog(readLog().reverse()), []);
  const text = `IBA Prep v${BUILD} · ${navigator.userAgent}\n` + log.map((l) => `${new Date(l.at).toLocaleString()} [v${l.build}] ${l.page}: ${l.msg}`).join("\n");
  return (
    <Card>
      <CardTitle icon={<Bug size={16} className="text-accent" />}>Version and problem log</CardTitle>
      <p className="text-[14px]">You are running version <b>v{BUILD}</b>. The app updates itself when you open it or switch back to it.</p>
      {log.length ? (
        <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-xl bg-surface-2 p-3 font-mono text-[11.5px]">
          {log.map((l, i) => <li key={i} className="break-words">{new Date(l.at).toLocaleString()} · v{l.build} · {l.page} · {l.msg}</li>)}
        </ul>
      ) : <p className="mt-2 text-[13px] text-muted">No problems recorded on this device.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => { const p = navigator.clipboard?.writeText(text); (p ?? Promise.reject()).then(() => setMsg("Copied. Paste it to me in the chat."), () => setMsg("Couldn't copy. Take a screenshot instead.")); }}>Copy log</Button>
        {log.length > 0 && <Button size="sm" variant="ghost" onClick={() => { clearLog(); setLog([]); }}>Clear</Button>}
      </div>
      {msg && <p className="mt-2 text-[12.5px] text-muted">{msg}</p>}
    </Card>
  );
}
