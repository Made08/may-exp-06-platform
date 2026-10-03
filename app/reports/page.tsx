'use client';
import { useState } from "react";

export default function ReportsPage() {
  const [mode, setMode] = useState<"LAST_RUN" | "CUMULATIVE">("LAST_RUN");
  const [rep, setRep] = useState<{ reportId: string; reportHash: string } | null>(null);
  const gen = async () => {
    const r = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
    setRep(await r.json());
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Reportes del experimento</h1>
      <div className="flex gap-2">
        <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="bg-zinc-900 border border-zinc-700 rounded p-1">
          <option value="LAST_RUN">Último run</option><option value="CUMULATIVE">Acumulado (todos los runs)</option>
        </select>
        <button onClick={gen} className="bg-sky-600 rounded p-2">Generar</button>
      </div>
      {rep && (
        <div className="text-sm space-y-1">
          <p>report_hash: <code>{rep.reportHash}</code></p>
          <p>
            <a className="text-sky-400 underline" href={"/api/reports/" + rep.reportId + "?format=html"} target="_blank">Ver / Imprimir PDF</a> ·{" "}
            <a className="text-sky-400 underline" href={"/api/reports/" + rep.reportId + "?format=csv"}>CSV</a> ·{" "}
            <a className="text-sky-400 underline" href={"/api/reports/" + rep.reportId + "?format=json"}>JSON</a>
          </p>
        </div>)}
    </div>
  );
}
