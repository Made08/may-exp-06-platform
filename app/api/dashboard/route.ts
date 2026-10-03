import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";
import { mayExp06Processor } from "@/lib/experiments/may-exp-06/engine";
import { median } from "@/lib/statistics";

/** FUNCIÓN 3: datos REALES de la BD — nunca ficticios. */
export async function GET(req: Request) {
  const s = await getSession();
  const g = requireRole(s, ["RESEARCH_ADMIN", "RESEARCHER", "ORGANIZATION_ADMIN", "VIEWER", "AUDITOR"]);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
  const runId = new URL(req.url).searchParams.get("runId");
  const run = (await pool.query(
    "SELECT id, started_at, finished_at, dataset_hash, analysis_hash FROM processing_runs WHERE organization_id=$1 AND status='COMPLETED'" + (runId ? " AND id=$2" : "") + " ORDER BY started_at DESC LIMIT 1",
    runId ? [s!.orgId, runId] : [s!.orgId])).rows[0];
  if (!run) return NextResponse.json({ error: "Sin runs completados" }, { status: 404 });
  const [metrics, stats, hyps, claims] = await Promise.all([
    pool.query("SELECT metric_code, arm, value, ci_low, ci_high, n FROM metric_results WHERE run_id=$1", [run.id]),
    pool.query("SELECT test_code, comparison, statistic, p_value, effect_size, effect_type, ci_low, ci_high, method FROM statistical_results WHERE run_id=$1", [run.id]),
    pool.query("SELECT h.code, hr.status FROM hypothesis_results hr JOIN hypotheses h ON h.id=hr.hypothesis_id WHERE hr.run_id=$1", [run.id]),
    pool.query("SELECT c.code, cr.status, cr.rationale FROM claim_results cr JOIN claims c ON c.id=cr.claim_id WHERE cr.run_id=$1", [run.id]),
  ]);
  const recs = (await pool.query(
    "SELECT r.data FROM dataset_records r JOIN processing_run_datasets pd ON pd.dataset_id = r.dataset_id WHERE pd.run_id=$1 AND r.is_valid",
    [run.id])).rows.map((x) => x.data);
  const norm = mayExp06Processor.preprocess({ id: run.id, dataMode: "SYNTHETIC", records: recs });
  const arms = ["CAB_UNIFORM", "POLICY_UNIFORM", "MAYAGUEZ_ADAPTIVE"];
  const q = (a: number[], p: number) => { const s2 = [...a].sort((x, y) => x - y); return s2[Math.min(s2.length - 1, Math.floor(p * s2.length))] ?? NaN; };
  const boxplot = Object.fromEntries(arms.map((a) => {
    const v = norm.filter((r) => r.arm === a).map((r) => r.approval_minutes as number);
    return [a, { min: Math.min(...v), p25: q(v, 0.25), p50: median(v), p75: q(v, 0.75), p95: q(v, 0.95), max: Math.max(...v) }];
  }));
  const ais = norm.map((r) => r.autonomy_index as number);
  const [aiMin, aiMax] = [Math.min(...ais), Math.max(...ais)];
  const bins = Array.from({ length: 20 }, (_, i) => ({ lo: aiMin + ((aiMax - aiMin) * i) / 20, hi: aiMin + ((aiMax - aiMin) * (i + 1)) / 20, n: 0 }));
  for (const x of ais) bins[Math.min(19, Math.floor((x - aiMin) / ((aiMax - aiMin) / 20)))].n++;
  const seeds = [...new Set(norm.map((r) => Number(r.seed)))].sort((a, b) => a - b);
  const robustness = Object.fromEntries(
    arms.map((a) => [
      a,
      seeds.map((sd) => ({
        seed: sd,
        alt: median(
          norm
            .filter((r) => r.arm === a && Number(r.seed) === sd)
            .map((r) => r.approval_minutes as number)
        ),
      })),
    ])
  );
  return NextResponse.json({ run, metrics: metrics.rows, statistics: stats.rows, hypotheses: hyps.rows, claims: claims.rows, boxplot, aiHistogram: bins, robustnessBySeed: robustness, nRecords: recs.length });
}
