'use client";
import { useEffect, useState } from "react";

interface Dash {
  run: { id: string; dataset_hash: string; analysis_hash: string };
  metrics: { metric_code: string; arm: string; value: number; ci_low: number | null; ci_high: number | null; n: number }[];
  statistics: { test_code: string; comparison: string; statistic: number | null; p_value: number | null; effect_size: number | null; ci_low: number | null; ci_high: number | null; method: string }[];
  hypotheses: { code: string; status: string }[];
  claims: { code: string; status: string; rationale: string }[];
  boxplot: Record<string, { min: number; p25: number; p50: number; p75: number; p95: number; max: number }>;
  nRecords: number;
}

export default function DashboardPage() {
  const [d, setD] = useState<Dash | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { fetch("/api/dashboard").then(async (r) => { if (!r.ok) setErr((await r.json()).error); else setD(await r.json()); }); }, []);
  if (err) return <p className="text-rose-400">{err}</p>;
  if (!d) return <p>Cargando dashboard (datos reales de la BD)…</p>;
  const arms = ["CAB_UNIFORM", "POLICY_UNIFORM", "MAYAGUEZ_ADAPTIVE"];
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard MAY-EXP-06 — run {String(d.run.id).slice(0, 8)} ({d.nRecords} registros)</h1>
      <section>
        <h2 className="font-semibold">Métricas por brazo</h2>
        <table className="w-full text-sm border"><thead><tr><th className="p-1 border border-zinc-800">Métrica</th>{arms.map((a) => <th key={a} className="p-1 border border-zinc-800">{a}</th>)}</tr></thead>
        <tbody>{["ALT", "MIR", "FTR", "CFR", "ViolationRate", "EC"].map((m) => (
          <tr key={m}><td className="p-1 border border-zinc-800">{m}</td>
            {arms.map((a) => {
              const row = d.metrics.find((x) => x.metric_code === m && x.arm === a);
              return <td key={a} className="p-1 border border-zinc-800">{row ? row.value.toFixed(4) : "—"}{row?.ci_low != null ? <span className="text-zinc-500"> [{row.ci_low.toFixed(3)}, {row.ci_high?.toFixed(3)}]</span> : null}</td>;
            })}</tr>))}</tbody></table>
      </section>
      <section>
        <h2 className="font-semibold">Boxplot ALT (p25/mediana/p75/p95, escala comparativa)</h2>
        <div className="space-y-1 text-xs">
          {arms.map((a) => { const b = d.boxplot[a]; if (!b) return null; const w = (v: number) => Math.max(2, Math.min(100, (v / (b.max || 1)) * 100)); return (
            <div key={a}><span className="inline-block w-40">{a}</span>
              <span className="inline-block bg-sky-900" style={{ width: w(b.p50) + "px", height: 10 }} title={"mediana " + b.p50} />
              <span className="ml-2">mediana {b.p50.toFixed(1)} · p95 {b.p95.toFixed(1)}</span></div>); })}
        </div>
      </section>
      <section>
        <h2 className="font-semibold">Estadística inferencial</h2>
        <ul className="text-sm">{d.statistics.map((s) => <li key={s.test_code}><b>{s.test_code}</b> — {s.comparison} [{s.method}] p={s.p_value ?? "—"}{s.ci_low != null ? " IC95=[" + s.ci_low.toFixed(5) + ", " + s.ci_high?.toFixed(5) + "]" : ""}</li>)}</ul>
      </section>
      <section>
        <h2 className="font-semibold">Hipótesis y claims</h2>
        <ul className="text-sm">{d.hypotheses.map((h) => <li key={h.code}>{h.code}: <b>{h.status}</b></li>)}
          {d.claims.map((c) => <li key={c.code}>Claim {c.code}: <b>{c.status}</b> — {c.rationale}</li>)}</ul>
      </section>
      <p className="text-xs text-zinc-500">dataset_hash {d.run.dataset_hash} · analysis_hash {d.run.analysis_hash}</p>
    </div>
  );
}
