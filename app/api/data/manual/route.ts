import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { manualRecordInput } from "@/lib/experiments/may-exp-06/schema";
import { sha256 } from "@/lib/ingestion";
import { getSession, requireRole } from "@/lib/auth";

export async function POST(req: Request) {
  const s = await getSession();
  const g = requireRole(s, ["RESEARCH_ADMIN", "RESEARCHER", "ORGANIZATION_ADMIN", "DATA_CONTRIBUTOR"]);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
  const body = await req.json();
  const parsed = manualRecordInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Registro inválido", issues: parsed.error.issues }, { status: 422 });
  const r = parsed.data; const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const ds = (await c.query(
      "INSERT INTO datasets (experiment_id, organization_id, name, data_mode, source, schema_version, protocol_version, checksum, record_count, valid_records, invalid_records, status, uploaded_by) VALUES ((SELECT id FROM experiments WHERE code=$1),$2,$3,$4,'MANUAL','OUTPUT_SCHEMA-1.0','1.0',$5,1,1,0,'VALIDATED',$6) RETURNING id",
      ["MAY-EXP-06", s!.orgId, "Captura manual " + new Date().toISOString(), r.data_type, "MANUAL-" + r.unit_id + "-" + Date.now(), s!.userId])).rows[0].id;
    await c.query("INSERT INTO dataset_records (dataset_id, organization_id, source, data, is_valid, validation_errors) VALUES ($1,$2,'MANUAL',$3,TRUE,'[]')",
      [ds, s!.orgId, JSON.stringify(r)]);
    await c.query("INSERT INTO audit_logs (organization_id, user_id, event, entity_type, entity_id, metadata) VALUES ($1,$2,'RECORD_CREATED','dataset',$3,$4)",
      [s!.orgId, s!.userId, ds, JSON.stringify({ unit_id: r.unit_id })]);
    await c.query("COMMIT");
    return NextResponse.json({ datasetId: ds, ok: true });
  } catch (e) {
    await c.query("ROLLBACK");
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally { c.release(); }
}
