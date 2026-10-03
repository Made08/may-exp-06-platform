import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  const g = requireRole(s, ["RESEARCH_ADMIN", "RESEARCHER", "ORGANIZATION_ADMIN", "VIEWER", "AUDITOR"]);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
  const run = (await pool.query("SELECT * FROM processing_runs WHERE id=$1 AND organization_id=$2", [id, s!.orgId])).rows[0];
  if (!run) return NextResponse.json({ error: "Run no encontrado" }, { status: 404 });
  const [metrics, stats, hyps, claims, ev] = await Promise.all([
    pool.query("SELECT * FROM metric_results WHERE run_id=$1", [id]),
    pool.query("SELECT * FROM statistical_results WHERE run_id=$1", [id]),
    pool.query("SELECT h.code, hr.* FROM hypothesis_results hr JOIN hypotheses h ON h.id=hr.hypothesis_id WHERE hr.run_id=$1", [id]),
    pool.query("SELECT c.code, cr.* FROM claim_results cr JOIN claims c ON c.id=cr.claim_id WHERE cr.run_id=$1", [id]),
    pool.query("SELECT kind, checksum, created_at FROM evidence WHERE run_id=$1", [id]),
  ]);
  return NextResponse.json({ run, metrics: metrics.rows, statistics: stats.rows, hypotheses: hyps.rows, claims: claims.rows, evidence: ev.rows });
}
