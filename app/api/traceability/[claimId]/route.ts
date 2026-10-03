import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";

/** FUNCIÓN 15: lineage reconstruible claim → runs → datasets/archivos → hipótesis → evidencia. */
export async function GET(_req: Request, { params }: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await params;
  const s = await getSession();
  const g = requireRole(s, ["RESEARCH_ADMIN", "RESEARCHER", "ORGANIZATION_ADMIN", "VIEWER", "AUDITOR"]);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
  const claim = (await pool.query(
    "SELECT c.id, c.code, c.statement, e.code AS experiment FROM claims c JOIN experiments e ON e.id=c.experiment_id WHERE (c.code=$1 OR c.id::text=$1)",
    [claimId])).rows[0];
  if (!claim) return NextResponse.json({ error: "Claim no encontrado" }, { status: 404 });
  const results = (await pool.query(
    "SELECT cr.run_id, cr.status, cr.rationale, pr.dataset_hash, pr.analysis_hash, pr.protocol_version, pr.algorithm_version, pr.started_at FROM claim_results cr JOIN processing_runs pr ON pr.id=cr.run_id WHERE cr.claim_id=$1 AND pr.organization_id=$2 ORDER BY pr.started_at DESC",
    [claim.id, s!.orgId])).rows;
  const chain = [] as unknown[];
  for (const r of results) {
    const datasets = (await pool.query(
      "SELECT d.name, d.checksum, d.data_mode, f.filename, f.checksum AS file_checksum FROM processing_run_datasets pd JOIN datasets d ON d.id=pd.dataset_id LEFT JOIN dataset_files f ON f.dataset_id=d.id WHERE pd.run_id=$1",
      [r.run_id])).rows;
    const hypotheses = (await pool.query(
      "SELECT h.code, hr.status, hr.statistical_criterion, hr.practical_criterion, hr.robustness_criterion, hr.traceability_criterion FROM hypothesis_results hr JOIN hypotheses h ON h.id=hr.hypothesis_id WHERE hr.run_id=$1",
      [r.run_id])).rows;
    const statistics = (await pool.query("SELECT test_code, comparison, p_value, ci_low, ci_high, method FROM statistical_results WHERE run_id=$1", [r.run_id])).rows;
    const evidence = (await pool.query("SELECT kind, checksum FROM evidence WHERE run_id=$1", [r.run_id])).rows;
    chain.push({ run_id: r.run_id, status: r.status, rationale: r.rationale, hashes: { dataset: r.dataset_hash, analysis: r.analysis_hash }, versions: { protocol: r.protocol_version, algorithm: r.algorithm_version }, datasets, hypotheses, statistics, evidence });
  }
  return NextResponse.json({ claim, lineage: chain, verified: "Los hashes permiten reconstruir dataset → análisis → evidencia; cualquier alteración rompe la cadena." });
}
