'use client";
import { useState } from "react";

export default function TraceabilityPage() {
  const [code, setCode] = useState("C06");
  const [lin, setLin] = useState<Record<string, unknown> | null>(null);
  const go = async () => setLin(await (await fetch("/api/traceability/" + code)).json());
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Trazabilidad y lineage</h1>
      <div className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} className="bg-zinc-900 border border-zinc-700 rounded p-1" />
        <button onClick={go} className="bg-sky-600 rounded p-2">Reconstruir</button>
      </div>
      {lin && <pre className="text-xs bg-zinc-900 p-3 rounded overflow-auto max-h-96">{JSON.stringify(lin, null, 2)}</pre>}
    </div>
  );
}
