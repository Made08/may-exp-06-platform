import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";
import { sha256 } from "@/lib/ingestion";
import { EXPERIMENT } from "@/lib/experiments/may-exp-06/config";

/** FUNCIÓN 6: reporte ÚLTIMO RUN o ACUMULADO (o runs explícitos runIds[]), con hashes encadenados. */
export async function POST(req: Request) {
  const s = await getSession();
  const g = requireRole(s, ["RESEARCH_ADMIN", "RESEARCHER", "ORGANIZATION_ADMIN", "VIEWER", "AUDITOR"]);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
  const { mode, runIds } = await req.json();
  if (!["LAST_RUN", "CUMULATIVE"].includes(mode)) return NextResponse.json({ error: "mode inválido" }, { status: 400 });

  const runs = Array.isArray(runIds) && runIds.length
    ? (await pool.query("SELECT * FROM processing_runs WHERE organization_id=$1 AND id=ANY($2) AND status='COMPLETED' ORDER BY started_at", [s!.orgId, runIds])).rows
    : mode === "LAST_RUN"
      ? (await pool.query("SELECT * FROM processing_runs WHERE organization_id=$1 AND status='COMPLETED' ORDER BY started_at DESC LIMIT 1", [s!.orgId])).rows
      : (await pool.query("SELECT * FROM processing_runs WHERE organization_id=$1 AND status='COMPLETED' ORDER BY started_at", [s!.orgId])).rows;
  if (!runs.length) return NextResponse.json({ error: "No hay runs completados" }, { status: 404 });

  const runScope = runs.map((r) => r.id);
  const rq = EXPERIMENT.rq;
  const dataSource = "SYNTHETIC (testbed MAY-EXP-06; los resultados no representan organizaciones reales)";
  const descriptive: unknown[] = [], inferential: unknown[] = [];
  for (const r of runs) {
    const m = await pool.query("SELECT metric_code, arm, value, ci_low, ci_high, n FROM metric_results WHERE run_id=$1", [r.id]);
    const st = await pool.query("SELECT test_code, comparison, statistic, p_value, effect_size, effect_type, ci_low, ci_high, method FROM statistical_results WHERE run_id=$1", [r.id]);
    descriptive.push(...m.rows.map((x) => ({ ...x, run_id: r.id })));
    inferential.push(...st.rows.map((x) => ({ ...x, run_id: r.id })));
  }
  const hypIds = (await pool.query(
    "SELECT h.code, hr.status FROM hypothesis_results hr JOIN hypotheses h ON h.id=hr.hypothesis_id WHERE hr.run_id=ANY($1)",
    [runScope])).rows;
  const clms = (await pool.query(
    "SELECT c.code, cr.status, cr.rationale FROM claim_results cr JOIN claims c ON c.id=cr.claim_id WHERE cr.run_id=ANY($1)",
    [runScope])).rows;
  const criteria = (await pool.query(
    "SELECT metric_code, operator, threshold, threshold_source, description FROM acceptance_criteria WHERE experiment_id=(SELECT id FROM experiments WHERE code=$1)",
    [EXPERIMENT.code])).rows;
  const threats = [
    "Validez de construcción: pesos del modelo no congelados por el protocolo (fuente: testbed).",
    "Validez interna: comparador de no inferioridad sin congelar (" + "PENDIENTE_DE_DEFINICION" + ").",
    "Validez externa: datos sintéticos; sin organizaciones reales.",
  ];
  const limitations = ["Sin comparación entre sujetos real", "Simulación con distribuciones paramétricas", "Un solo experimento del programa Mayagüez"];
  const last = runs[runs.length - 1];
  const content = {
    metadata: { experiment: EXPERIMENT, generatedAt: new Date().toISOString() },
    periodo: { desde: runs[0].started_at, hasta: last.finished_at },
    dataSource, rq, hypotheses: hypIds, claims: clms, descriptive, inferential, criteria, threats, limitations,
    reproducibility: { protocolVersion: EXPERIMENT.protocolVersion, algorithmVersion: EXPERIMENT.algorithmVersion, runs: runScope },
  };
  const reportHash = sha256(JSON.stringify(content));
  const r = await pool.query(
    "INSERT INTO reports (organization_id, mode, run_scope, content, dataset_hash, analysis_hash, report_hash) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
    [s!.orgId, mode, JSON.stringify(runScope), JSON.stringify(content), last.dataset_hash, last.analysis_hash, reportHash]);
  await pool.query("INSERT INTO audit_logs (organization_id, user_id, event, entity_type, entity_id, metadata) VALUES ($1,$2,'REPORT_GENERATED','report',$3,$4)",
    [s!.orgId, s!.userId, r.rows[0].id, JSON.stringify({ mode, runs: runScope.length })]);
  return NextResponse.json({ reportId: r.rows[0].id, reportHash });
}
