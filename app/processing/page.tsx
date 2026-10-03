'use client";
import { useEffect, useState } from "react";

export default function ProcessingPage() {
  const [datasets, setDatasets] = useState<{ id: string; name: string; status: string; valid_records: number }[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const [out, setOut] = useState<Record<string, unknown> | null>(null);
  useEffect(() => { fetch("/api/datasets").then((r) => r.json()).then((d) => setDatasets(d.datasets ?? [])); }, []);
  const run = async () => {
    const r = await fetch("/api/processing/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ datasetIds: sel }) });
    setOut(await r.json());
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Motor de ejecución — Processing Run versionado</h1>
      <div className="space-y-1">
        {datasets.filter((d) => d.status === "VALIDATED" || d.status === "ANALYZED").map((d) => (
          <label key={d.id} className="flex gap-2 text-sm">
            <input type="checkbox" checked={sel.includes(d.id)}
              onChange={(e) => setSel(e.target.checked ? [...sel, d.id] : sel.filter((x) => x !== d.id))} />
            {d.name} — {d.status} ({d.valid_records} válidos, checksum registrado)
          </label>))}
      </div>
      <button onClick={run} disabled={!sel.length} className="bg-sky-600 rounded p-2 disabled:opacity-40">Ejecutar análisis</button>
      {out && (
        <div className="text-sm space-y-2">
          <p>Run: {String(out.runId)}</p>
          {(out.hypotheses as { code: string; status: string }[] | undefined)?.map((h) => <p key={h.code}>{h.code}: <b>{h.status}</b></p>)}
          {(out.claims as { code: string; status: string }[] | undefined)?.map((c) => <p key={c.code}>Claim {c.code}: <b>{c.status}</b></p>)}
          <p><a className="text-sky-400 underline" href="/dashboard">Ver dashboard</a> · <a className="text-sky-400 underline" href="/reports">Generar reporte</a></p>
        </div>)}
    </div>
  );
}
