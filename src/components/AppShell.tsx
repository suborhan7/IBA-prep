"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, BookOpenText, Calculator, Brain, Sparkles, CalendarCheck, Timer, MessageCircle,
  NotebookPen, Library, BarChart3, Map, Settings, Menu, X, Moon, Sun, Zap,
} from "lucide-react";
import clsx from "clsx";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { registerCustom } from "@/lib/bank";
import InstallButton, { useServiceWorker } from "./InstallButton";
import { useAutoSync } from "@/lib/sync";

export const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plan", label: "30-Day Plan", icon: Map },
  { href: "/daily", label: "Daily Practice", icon: CalendarCheck },
  { href: "/english", label: "English Mastery", icon: BookOpenText },
  { href: "/vocab", label: "Vocabulary Lab", icon: Sparkles },
  { href: "/quant", label: "Quantitative", icon: Calculator },
  { href: "/speed", label: "Speed Gym", icon: Zap },
  { href: "/analytical", label: "Analytical", icon: Brain },
  { href: "/mock", label: "Mock Exam", icon: Timer },
  { href: "/tutor", label: "AI Tutor", icon: MessageCircle },
  { href: "/mistakes", label: "Mistake Notebook", icon: NotebookPen },
  { href: "/resources", label: "Resource Library", icon: Library },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  };
  return (
    <button onClick={toggle} aria-label="Toggle dark mode" className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useServiceWorker();
  useAutoSync();

  // keep approved AI questions available to the question bank
  const custom = useLiveQuery(() => db.custom.where("status").equals("approved").toArray(), []);
  useEffect(() => { if (custom) registerCustom(custom); }, [custom]);

  const due = useLiveQuery(async () => {
    const now = Date.now();
    const [m, v] = await Promise.all([
      db.mistakes.where("due").belowOrEqual(now).filter((x) => !x.resolved).count(),
      db.vocab.where("due").between(1, now, true, true).count(),
    ]);
    return { m, v };
  }, []);

  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] transition-colors",
            isActive(href) ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-ink",
          )}
        >
          <Icon size={17} strokeWidth={1.8} />
          <span className="flex-1">{label}</span>
          {href === "/mistakes" && !!due?.m && <span className="rounded-full bg-bad/15 px-1.5 text-[11px] font-semibold text-bad">{due.m}</span>}
          {href === "/vocab" && !!due?.v && <span className="rounded-full bg-accent/15 px-1.5 text-[11px] font-semibold text-accent">{due.v}</span>}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent font-serif text-[15px] font-bold text-accent-ink">I</div>
          <div>
            <div className="text-[15px] font-semibold leading-tight">IBA Prep</div>
            <div className="text-[11px] text-muted">DU IBA MBA trainer</div>
          </div>
        </Link>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <InstallButton className="mt-3" />
        <div className="mt-3 flex items-center justify-between px-2 text-[11px] text-muted">
          <span>Progress saved on this device</span>
          <ThemeToggle />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-surface-2"><Menu size={20} /></button>
        <Link href="/" className="font-semibold">IBA Prep</Link>
        <div className="flex items-center"><InstallButton compact /><ThemeToggle /></div>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-surface p-4 shadow-xl fade-in">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold">IBA Prep</span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg p-2 hover:bg-surface-2"><X size={18} /></button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}
