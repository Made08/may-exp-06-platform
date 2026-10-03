'use client";
import { useState } from "react";

export default function PrivacyPage() {
  const [st, setSt] = useState<string>("");
  const consent = async (accepted: boolean) =>
    setSt(JSON.stringify(await (await fetch("/api/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accepted }) })).json()));
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-bold">Privacidad y tratamiento de datos</h1>
      <p className="text-sm">Los datos aportados se usan exclusivamente para investigación experimental del Modelo Mayagüez
      (MAY-EXP-06). Se registran: usuario, organización, versión de política, hash de IP (opcional) y aceptación/rechazo.
      Ningún secreto se registra en auditoría. Aislamiento multitenant por organización; solo investigadores autorizados
      realizan análisis agregados.</p>
      <div className="flex gap-2">
        <button onClick={() => consent(true)} className="bg-emerald-600 rounded p-2">Acepto</button>
        <button onClick={() => consent(false)} className="bg-rose-700 rounded p-2">Rechazo</button>
      </div>
      {st && <pre className="text-xs">{st}</pre>}
    </div>
  );
}
