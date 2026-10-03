import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";
import { getRowsFromFile, autoMapping, applyColumnMapping, sha256 } from "@/lib/ingestion";
import { mayExp06Processor } from "@/lib/experiments/may-exp-06/engine";

/** FUNCIÓN 2 (persistencia): guarda el archivo original (BYTEA + SHA-256), el dataset y sus registros. */
export async function POST(req: Request) {
  const s = await getSession();
  const g = requireRole(s, ["RESEARCH_ADMIN", "RESEARCHER", "ORGANIZATION_ADMIN", "DATA_CONTRIBUTOR"]);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  const maxMb = Number(process.env.MAX_UPLOAD_MB ?? 25);
  if (file.size > maxMb * 1024 * 1024) return NextResponse.json({ error: "Archivo excede MAX_UPLOAD_MB" }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  const rows = await getRowsFromFile(file, buf);
  const mapping = form.get("mapping") ? JSON.parse(String(form.get("mapping"))) : autoMapping(Object.keys(rows[0] ?? {}));
  const mapped = applyColumnMapping(rows, mapping);
  const v = mayExp06Processor.validate({ id: "upload", dataMode: "SYNTHETIC", records: mapped });
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const checksum = sha256(buf);
    const ds = (await c.query(
      "INSERT INTO datasets (experiment_id, organization_id, name, data_mode, source, schema_version, protocol_version, checksum, record_count, valid_records, invalid_records, status, quality, uploaded_by) VALUES ((SELECT id FROM experiments WHERE code=$1),$2,$3,$4,'UPLOAD','OUTPUT_SCHEMA-1.0','1.0',$5,$6,$7,$8,$9,$10,$11) RETURNING id",
      ["MAY-EXP-06", s!.orgId, file.name, "SYNTHETIC", checksum, rows.length, v.records.length, rows.length - v.records.length,
       v.valid ? "VALIDATED" : "REJECTED", JSON.stringify(v.quality), s!.userId])).rows[0].id;
    await c.query("INSERT INTO dataset_files (dataset_id, filename, checksum, size_bytes, raw_content) VALUES ($1,$2,$3,$4,$5)",
      [ds, file.name, checksum, buf.length, buf]);
    for (const r of v.records)
      await c.query("INSERT INTO dataset_records (dataset_id, organization_id, source, data, is_valid, validation_errors) VALUES ($1,$2,'UPLOAD',$3,TRUE,'[]')", [ds, s!.orgId, JSON.stringify(r)]);
    await c.query("INSERT INTO audit_logs (organization_id, user_id, event, entity_type, entity_id, metadata) VALUES ($1,$2,'DATASET_UPLOADED','dataset',$3,$4)",
      [s!.orgId, s!.userId, ds, JSON.stringify({ filename: file.name, checksum, rows: rows.length })]);
    await c.query("COMMIT");
    return NextResponse.json({ datasetId: ds, status: v.valid ? "VALIDATED" : "REJECTED", valid: v.records.length, invalid: rows.length - v.records.length, quality: v.quality });
  } catch (e) {
    await c.query("ROLLBACK");
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally { c.release(); }
}
