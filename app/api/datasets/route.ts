import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";

export async function GET() {
  const s = await getSession();
  const g = requireRole(s, ["RESEARCH_ADMIN", "RESEARCHER", "ORGANIZATION_ADMIN", "DATA_CONTRIBUTOR", "VIEWER", "AUDITOR"]);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
  const r = await pool.query(
    "SELECT d.id, d.name, d.data_mode, d.source, d.status, d.record_count, d.valid_records, d.invalid_records, d.checksum, d.quality, d.uploaded_at FROM datasets d WHERE d.organization_id=$1 ORDER BY d.uploaded_at DESC",
    [s!.orgId]);
  return NextResponse.json({ datasets: r.rows });
}
