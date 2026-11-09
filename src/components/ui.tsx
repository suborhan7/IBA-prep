"use client";
import clsx from "clsx";
import Link from "next/link";
import type { ReactNode, ButtonHTMLAttributes } from "react";

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[12px] font-medium uppercase tracking-wider text-accent">{eyebrow}</div>}
        <h1 className="font-serif text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className, ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("rounded-2xl border border-line bg-surface p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ children, right, icon }: { children: ReactNode; right?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold">{icon}{children}</h2>
      {right}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" };
export function Button({ variant = "primary", size = "md", className, ...rest }: BtnProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-[13px]" : "px-4 py-2.5 text-[14px]",
        variant === "primary" && "bg-accent text-accent-ink hover:opacity-90",
        variant === "secondary" && "border border-line bg-surface hover:bg-surface-2",
        variant === "ghost" && "text-muted hover:bg-surface-2 hover:text-ink",
        variant === "danger" && "bg-bad text-white hover:opacity-90",
        className,
      )}
      {...rest}
    />
  );
}

export function LinkButton({ href, children, variant = "primary", className }: { href: string; children: ReactNode; variant?: "primary" | "secondary"; className?: string }) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-medium transition-colors",
        variant === "primary" ? "bg-accent text-accent-ink hover:opacity-90" : "border border-line bg-surface hover:bg-surface-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "good" | "bad" | "warn" | "accent"; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium",
        tone === "neutral" && "bg-surface-2 text-muted",
        tone === "good" && "bg-good/12 text-good",
        tone === "bad" && "bg-bad/12 text-bad",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "accent" && "bg-accent-soft text-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Progress({ value, tone = "accent", className }: { value: number; tone?: "accent" | "good" | "bad" | "warn"; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={clsx("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={clsx("h-full rounded-full transition-[width] duration-500", tone === "accent" && "bg-accent", tone === "good" && "bg-good", tone === "bad" && "bg-bad", tone === "warn" && "bg-warn")}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "good" | "bad" | "warn" }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="text-[12px] text-muted">{label}</div>
      <div className={clsx("mt-1 text-[24px] font-semibold tabular-nums tracking-tight", tone === "good" && "text-good", tone === "bad" && "text-bad", tone === "warn" && "text-warn")}>{value}</div>
      {hint && <div className="mt-0.5 text-[12px] text-muted">{hint}</div>}
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <div className="font-medium">{title}</div>
      {children && <div className="mx-auto mt-1 max-w-md text-[14px] text-muted">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={clsx("whitespace-nowrap rounded-lg px-3 py-1.5 text-[13.5px] transition-colors", value === t.id ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-ink")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <div className="py-10 text-center text-[14px] text-muted">{label}</div>;
}

export function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label?: string }) {
  return (
    <label className="flex flex-col gap-1 text-[13px] text-muted">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2 text-[14px] text-ink">
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

/** Lightweight inline markdown: **bold**, [underline-for-sentence-correction], newlines. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const paras = text.split(/\n\n+/);
  return (
    <div className={clsx("prose-q", className)}>
      {paras.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p.split(/(\*\*[^*]+\*\*|\[[^\]]+\])/g).map((seg, j) =>
            seg.startsWith("**") ? (
              <strong key={j}>{seg.slice(2, -2)}</strong>
            ) : seg.startsWith("[") && seg.endsWith("]") ? (
              <span key={j} className="underline decoration-accent decoration-2 underline-offset-4">{seg.slice(1, -1)}</span>
            ) : (
              <span key={j}>{seg}</span>
            ),
          )}
        </p>
      ))}
    </div>
  );
}

export function fmtTime(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? `${m}m ${String(r).padStart(2, "0")}s` : `${r}s`;
}

export function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}
