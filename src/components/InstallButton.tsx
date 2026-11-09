"use client";
import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import clsx from "clsx";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Registers the service worker once (production only). */
export function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
}

/**
 * "Install app". Chrome/Edge/Android get the browser's own install prompt;
 * iPhone/iPad Safari (which has no prompt) get short Add-to-Home-Screen steps.
 * Hidden when the app is already running installed.
 */
export default function InstallButton({ compact, className }: { compact?: boolean; className?: string }) {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [help, setHelp] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    const onInstalled = () => { setInstalled(true); setEvt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (installed) return null;

  async function install() {
    if (evt) {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setEvt(null);
    } else setHelp(true);
  }

  return (
    <>
      <button
        onClick={install}
        aria-label="Install app"
        className={clsx(
          compact ? "rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" : "flex w-full items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 text-[13px] font-medium text-accent hover:bg-accent-soft/70",
          className,
        )}
      >
        <Download size={compact ? 18 : 15} />{!compact && "Install app"}
      </button>
      {help && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-4 sm:place-items-center" onClick={() => setHelp(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><div className="font-semibold">Install IBA Prep</div><button onClick={() => setHelp(false)} aria-label="Close" className="rounded-lg p-1 hover:bg-surface-2"><X size={17} /></button></div>
            {ios ? (
              <ol className="space-y-2 text-[14px]">
                <li className="flex items-center gap-2">1. Open this site in <b>Safari</b>.</li>
                <li className="flex items-center gap-2">2. Tap <Share size={16} className="text-accent" /> <b>Share</b> at the bottom.</li>
                <li className="flex items-center gap-2">3. Tap <SquarePlus size={16} className="text-accent" /> <b>Add to Home Screen</b>, then <b>Add</b>.</li>
              </ol>
            ) : (
              <ol className="space-y-2 text-[14px]">
                <li>1. Open this site in <b>Chrome</b> or <b>Edge</b>.</li>
                <li>2. Phone: tap the <b>⋮</b> menu → <b>Install app</b> (or <b>Add to Home screen</b>).</li>
                <li>3. Laptop: click the install icon at the right end of the address bar, or <b>⋮ → Cast, save and share → Install page as app</b>.</li>
              </ol>
            )}
            <p className="mt-3 text-[12.5px] text-muted">The installed app opens in its own window, works offline for practice, and keeps the same progress as this browser.</p>
          </div>
        </div>
      )}
    </>
  );
}
