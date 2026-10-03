'use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { manualRecordInput } from "@/lib/experiments/may-exp-06/schema";
import { VARIABLES } from "@/lib/experiments/may-exp-06/variables";

type ValRes = {
  total: number; valid: number; invalid: number; warnings: string[];
  errors: { row: number; field: string; message: string }[]; errorsCsv: string;
  mapping: Record<string, string>; columns: string[]; preview: Record<string, unknown>[];
  quality: { DataQualityScore: number };
};

const BOOLS = ["failed_change", "control_violation", "human_intervention"];

export default function DataPage() {
  const [tab, setTab] = useState<"manual" | "bulk">("manual");
  const [val, setVal] = useState<ValRes | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const form = useForm({ resolver: zodResolver(manualRecordInput) });
  const onManual = form.handleSubmit(async (v) => {
    const r = await fetch("/api/data/manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    setResult(JSON.stringify(await r.json()));
  });
  const onValidate = async () => {
    if (!file) return; const fd = new FormData(); fd.append("file", file);
    setVal(await (await fetch("/api/data/validate", { method: "POST", body: fd })).json());
  };
  const onConfirm = async () => {
    if (!file || !val) return; const fd = new FormData(); fd.append("file", file);
    fd.append("mapping", JSON.stringify(val.mapping));
    setResult(JSON.stringify(await (await fetch("/api/data/upload", { method: "POST", body: fd })).json()));
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["manual", "bulk"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={"px-3 py-1 rounded " + (tab === t ? "bg-sky-600" : "bg-zinc-800")}>
            {t === "manual" ? "Registro manual" : "Carga masiva"}
          </button>))}
      </div>
      {tab === "manual" && (
        <form onSubmit={onManual} className="grid grid-cols-2 gap-3">
          {VARIABLES.map((v) => (
            <label key={v.name} className="text-sm" title={v.definition}>
              {v.name} <span className="text-xs text-zinc-400">[{v.role} · {v.unit}]</span>
              {v.name === "arm" ? (
                <select {...form.register("arm")} className="w-full bg-zinc-900 border border-zinc-700 rounded p-1">
                  {["CAB_UNIFORM", "POLICY_UNIFORM", "MAYAGUEZ_ADAPTIVE"].map((a) => <option key={a}>{a}</option>)}
                </select>
              ) : BOOLS.includes(v.name) ? (
                <input type="checkbox" {...form.register(v.name as "failed_change")} />
              ) : (
                <input type="number" step={v.step} min={v.min} max={v.max}
                  {...form.register(v.name as "criticality", { valueAsNumber: true })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded p-1" />
              )}
            </label>))}
          <button className="col-span-2 bg-sky-600 rounded p-2">Registrar</button>
        </form>)}
      {tab === "bulk" && (
        <div className="space-y-3">
          <input type="file" accept=".csv,.xlsx,.xls,.json" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button onClick={onValidate} className="bg-amber-600 rounded p-2">Validar (sin persistir)</button>
          {val && (
            <div className="space-y-2 text-sm">
              <p>Total {val.total} · válidas {val.valid} · inválidas {val.invalid} · DataQualityScore {val.quality.DataQualityScore.toFixed(3)}</p>
              <details><summary>Mapeo columna → variable (editable)</summary>
                {val.columns.map((c) => (
                  <div key={c} className="flex gap-2"><span className="w-64">{c}</span>
                    <select className="bg-zinc-900 border border-zinc-700" value={val.mapping[c] ?? ""}
                      onChange={(e) => setVal({ ...val, mapping: { ...val.mapping, [c]: e.target.value } })}>
                      <option value="">(sin mapear)</option>
                      {[...new Set([...Object.values(val.mapping), c])].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select></div>))}
              </details>
              <pre className="text-xs overflow-auto">{JSON.stringify(val.preview, null, 2).slice(0, 2000)}</pre>
              {val.errors.length > 0 && (
                <button className="bg-rose-700 rounded p-2" onClick={() => {
                  const b = new Blob([val.errorsCsv], { type: "text/csv" });
                  const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "errores_carga.csv"; a.click();
                }}>Descargar reporte de errores</button>)}
              <button onClick={onConfirm} className="bg-emerald-600 rounded p-2">Confirmar y persistir dataset RAW</button>
            </div>)}
        </div>)}
      {result && <pre className="text-xs bg-zinc-900 p-2 rounded overflow-auto">{result}</pre>}
    </div>
  );
}
