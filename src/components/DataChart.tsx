"use client";
import type { ChartSpec } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from "recharts";

export const SERIES_COLORS = ["#2f7d62", "#c0862b", "#4d6fb3", "#a1496b", "#6b8f2a", "#7a5cb8"];

export default function DataChart({ spec }: { spec: ChartSpec }) {
  const tick = { fill: "var(--muted)", fontSize: 12 };
  const tooltipStyle = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 12 };

  if (spec.kind === "pie" && spec.slices) {
    return (
      <figure className="rounded-xl border border-line bg-surface-2/50 p-3">
        <figcaption className="mb-1 text-[12.5px] font-medium text-muted">{spec.title}</figcaption>
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={spec.slices} dataKey="value" nameKey="label" outerRadius="75%" innerRadius="40%" paddingAngle={1} isAnimationActive={false}>
                {spec.slices.map((_, i) => <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} stroke="var(--surface)" />)}
                <LabelList dataKey="value" position="outside" formatter={(v) => `${v}${spec.unit ?? ""}`} style={{ fill: "var(--text)", fontSize: 12 }} />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}${spec.unit ?? ""}`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </figure>
    );
  }

  if (spec.kind === "table" && spec.columns && spec.rows) {
    return (
      <figure className="overflow-x-auto rounded-xl border border-line">
        <figcaption className="px-3 pt-2 text-[12.5px] font-medium text-muted">{spec.title}</figcaption>
        <table className="w-full text-[13px]">
          <thead><tr>{spec.columns.map((c) => <th key={c} className="border-b border-line px-3 py-2 text-left font-medium">{c}</th>)}</tr></thead>
          <tbody>{spec.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border-b border-line px-3 py-1.5 tabular-nums">{c}</td>)}</tr>)}</tbody>
        </table>
      </figure>
    );
  }

  const data = (spec.categories ?? []).map((c, i) => Object.fromEntries([["x", c], ...(spec.series ?? []).map((s) => [s.name, s.values[i]])]));
  return (
    <figure className="rounded-xl border border-line bg-surface-2/50 p-3">
      <figcaption className="mb-1 text-[12.5px] font-medium text-muted">{spec.title}</figcaption>
      <div className="h-64">
        <ResponsiveContainer>
          {spec.kind === "line" ? (
            <LineChart data={data} margin={{ top: 16, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="x" tick={tick} stroke="var(--border)" />
              <YAxis tick={tick} stroke="var(--border)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {(spec.series ?? []).map((s, i) => (
                <Line key={s.name} dataKey={s.name} stroke={SERIES_COLORS[i]} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false}>
                  <LabelList dataKey={s.name} position="top" style={{ fill: SERIES_COLORS[i], fontSize: 11 }} />
                </Line>
              ))}
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="x" tick={tick} stroke="var(--border)" />
              <YAxis tick={tick} stroke="var(--border)" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-2)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {(spec.series ?? []).map((s, i) => (
                <Bar key={s.name} dataKey={s.name} fill={SERIES_COLORS[i]} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  <LabelList dataKey={s.name} position="top" style={{ fill: "var(--text)", fontSize: 11 }} />
                </Bar>
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
