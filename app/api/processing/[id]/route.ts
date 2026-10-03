import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  const g = requireRole(s, ["RESEARCH_ADMIN", "RESEARCHER", "ORGANIZATION_ADMIN", "VIEWER", "AUDITOR"]);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
  const run = (await pool.query("SELECT id, status, protocol_version, algorithm_version, dataset_hash, analysis_hash, started_at, finished_at FROM processing_runs WHERE id=$1 AND organization_id=$2", [id, s!.orgId])).rows[0];
  if (!run) return NextResponse.json({ error: "Run no encontrado" }, { status: 404 });
  return NextResponse.json({ run });
}
