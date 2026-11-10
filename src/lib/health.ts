"use client";
import { useEffect } from "react";

export const BUILD = process.env.NEXT_PUBLIC_BUILD ?? "dev";
const LOG_KEY = "diag:log";

export type LogEntry = { at: number; build: string; page: string; msg: string };

export function readLog(): LogEntry[] {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || "[]"); } catch { return []; }
}
export function clearLog() { try { localStorage.removeItem(LOG_KEY); } catch {} }
export function logProblem(msg: string) {
  try {
    const l = readLog();
    l.push({ at: Date.now(), build: BUILD, page: location.pathname + location.search, msg: msg.slice(0, 400) });
    localStorage.setItem(LOG_KEY, JSON.stringify(l.slice(-30)));
  } catch {}
}

/**
 * 1. Keeps an open (or installed) app on the newest version: when the app is opened or brought
 *    back to the front, it asks the server which version is live and reloads once if it differs.
 *    Practice sets and mocks resume after a reload, so nothing is lost.
 * 2. Records errors and long freezes in a small on-device problem log (Settings → Problem log).
 */
export function useAppHealth() {
  useEffect(() => {
    const onErr = (e: ErrorEvent) => logProblem(`Error: ${e.message}`);
    const onRej = (e: PromiseRejectionEvent) => logProblem(`Unhandled: ${String((e.reason as Error)?.message ?? e.reason)}`);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);

    // freeze detector: a 1 s timer that fires much later means the page was blocked
    let last = Date.now(), wasVisible = document.visibilityState === "visible";
    const beat = setInterval(() => {
      const now = Date.now(), gap = now - last, vis = document.visibilityState === "visible";
      if (gap > 6000 && vis && wasVisible && document.hasFocus()) logProblem(`Page was unresponsive for ${Math.round(gap / 1000)} s`);
      last = now; wasVisible = vis;
    }, 1000);
    const resetBeat = () => { last = Date.now(); wasVisible = false; };

    const check = async () => {
      if (BUILD === "dev" || document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        const { build } = await r.json();
        if (!build || build === "dev" || build === BUILD) return;
        const k = "update:reloaded-for";
        if (sessionStorage.getItem(k) === build) return; // never loop
        sessionStorage.setItem(k, build);
        location.reload();
      } catch {}
    };
    const vis = () => { resetBeat(); if (document.visibilityState === "visible") check(); };
    check();
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
      document.removeEventListener("visibilitychange", vis);
      clearInterval(beat);
    };
  }, []);
}
