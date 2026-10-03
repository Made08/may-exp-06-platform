import { createHash } from "crypto";

export function sha256(s: string | Buffer) { return createHash("sha256").update(s).digest("hex"); }

/** Parser CSV RFC-4180 (comillas, comas embebidas, saltos de línea). */
export function parseCsv(text: string): Record<string, unknown>[] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
      else cell += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = ""; rows.push(row); row = [];
    } else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (!nonEmpty.length) return [];
  const header = nonEmpty[0].map((h) => h.trim());
  return nonEmpty.slice(1).map((r) => Object.fromEntries(header.map((h, j) => [h, r[j] ?? ""])));
}

/** Puntuación de calidad de datos del marco común de rigor. */
export function dataQuality(total: number, valid: number, unique: number, warnings: number) {
  const completeness = total ? valid / total : 0;
  const validity = total ? valid / total : 0;
  const uniqueness = valid ? unique / valid : 0;
  const consistency = total ? 1 - Math.min(1, warnings / Math.max(total, 1)) : 0;
  return { completeness, validity, uniqueness, consistency, DataQualityScore: 0.25 * completeness + 0.35 * validity + 0.2 * uniqueness + 0.2 * consistency };
}

export const TARGET_VARIABLES = [
  "unit_id", "criticality", "exposure", "blast_radius", "incident_history", "policy_risk", "test_coverage",
  "maturity", "evidence", "error_budget", "policy_compliance", "observability", "risk", "trust",
  "autonomy_index", "decision", "approval_minutes", "failed_change", "control_violation",
  "evidence_completeness", "human_intervention", "fast_track", "arm", "experiment_id", "seed",
  "replication", "data_type",
] as const;

/** Detección por extensión/MIME: CSV, JSON (array u objeto con array), XLSX (primera hoja). */
export async function getRowsFromFile(file: File, buf?: Buffer): Promise<Record<string, unknown>[]> {
  const b = buf ?? Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  if (file.type === "application/json" || name.endsWith(".json")) {
    const parsed: unknown = JSON.parse(b.toString("utf8"));
    const arr = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown>)[Object.keys(parsed)[0]];
    if (!Array.isArray(arr)) throw new Error("JSON debe ser un array de registros");
    return arr as Record<string, unknown>[];
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || file.type.includes("spreadsheetml")) {
    const xb = await import("xlsx");
    const wb = xb.read(b);
    return xb.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  }
  return parseCsv(b.toString("utf8"));
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[\s-]+/g, "_");
const SYNONYMS: Record<string, string> = {
  alt: "approval_minutes", approval_time: "approval_minutes", lead_time: "approval_minutes",
  autonomy: "autonomy_index", ai: "autonomy_index", decision_outcome: "decision",
};

/** Mapeo automático columna_origen → variable Mayagüez (exacto, normalizado o sinónimo). */
export function autoMapping(columns: string[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const c of columns) {
    const n = norm(c);
    m[c] = TARGET_VARIABLES.find((t) => t === n) ?? SYNONYMS[n] ?? "";
  }
  return m;
}

export function applyColumnMapping(rows: Record<string, unknown>[], mapping: Record<string, string>): Record<string, unknown>[] {
  if (!Object.keys(mapping).length) return rows;
  return rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [mapping[k] || k, v])));
}

/** Reporte de errores descargable (FUNCIÓN 2). */
export function errorsToCsv(errors: { row: number; field: string; message: string }[]): string {
  const esc = (s: string | number) => '"' + String(s).replace(/"/g, '""') + '"';
  return ["fila,columna,mensaje", ...errors.map((e) => [e.row, e.field, e.message].map(esc).join(","))].join("\n");
}
