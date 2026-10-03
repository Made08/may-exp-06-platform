import { NextResponse } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { getRowsFromFile, autoMapping, applyColumnMapping, errorsToCsv, dataQuality } from "@/lib/ingestion";
import { mayExp06Processor } from "@/lib/experiments/may-exp-06/engine";

/** FUNCIÓN 2 (preview): valida sin persistir; devuelve mapeo editable, preview y reporte de errores. */
export async function POST(req: Request) {
  const s = await getSession();
  const guard = requireRole(s, ["RESEARCH_ADMIN", "RESEARCHER", "ORGANIZATION_ADMIN", "DATA_CONTRIBUTOR"]);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  const rows = await getRowsFromFile(file);
  const mapping = form.get("mapping") ? JSON.parse(String(form.get("mapping"))) : autoMapping(Object.keys(rows[0] ?? {}));
  const mapped = applyColumnMapping(rows, mapping);
  const v = mayExp06Processor.validate({ id: "preview", dataMode: "SYNTHETIC", records: mapped });
  const invalidRows = new Set(v.errors.map((e) => e.row)).size;
  return NextResponse.json({
    columns: Object.keys(rows[0] ?? {}), mapping, preview: mapped.slice(0, 5),
    total: rows.length, valid: rows.length - invalidRows, invalid: invalidRows,
    warnings: v.warnings, errors: v.errors.slice(0, 1000), errorsCsv: errorsToCsv(v.errors),
    quality: dataQuality(rows.length, rows.length - invalidRows, new Set(mapped.map((r) => r.unit_id)).size, v.warnings.length),
  });
}
