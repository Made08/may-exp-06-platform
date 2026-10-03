import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";
import { sha256 } from "@/lib/ingestion";
import { mayExp06Processor } from "@/lib/experiments/may-exp-06/engine";
import { buildRunManifest } from "@/lib/reproducibility";
import { EXPERIMENT, CONFIG_REF } from "@/lib/experiments/may-exp-06/config";

/** FUNCIÓN 7: Processing Run versionado, transaccional, con evidencia y manifest encadenados. */
export async function POST(req: Request) {
  const s = await getSession();
  const g = requireRole(s, ["RESEARCH_ADMIN", "RESEARCHER", "ORGANIZATION_ADMIN"]);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
  const { datasetIds } = await req.json();
  if (!Array.isArray(datasetIds) || datasetIds.length === 0)
    return NextResponse.json({ error: "datasetIds requerido" }, { status: 400 });
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const ds = (await c.query(
      "SELECT * FROM datasets WHERE id=ANY($1) AND organization_id=$2 AND status IN ('VALIDATED','ANALYZED')",
      [datasetIds, s!.orgId])).rows;
    if (!ds.length) throw new Error("No hay datasets VALIDADOS seleccionados");
    const recs = (await c.query("SELECT data FROM dataset_records WHERE dataset_id=ANY($1) AND is_valid", [ds.map((d) => d.id)])).rows.map((r) => r.data);
    const startedAt = new Date().toISOString();
    const run = (await c.query(
      "INSERT INTO processing_runs (organization_id, experiment_id, status, protocol_version, schema_version, algorithm_version, configuration, started_at) VALUES ($1,(SELECT id FROM experiments WHERE code=$2),'RUNNING',$3,$4,$5,$6,now()) RETURNING id",
      [s!.orgId, EXPERIMENT.code, EXPERIMENT.protocolVersion, EXPERIMENT.schemaVersion, EXPERIMENT.algorithmVersion,
       JSON.stringify({ datasetIds, referenceArm: CONFIG_REF })])).rows[0].id;

    const datasetHash = sha256(ds.map((d) => d.name + ":" + d.checksum).join("|"));
    await c.query("INSERT INTO evidence (run_id, kind, content, checksum) VALUES ($1,'INGESTION',$2,$3)",
      [run, JSON.stringify({ datasets: ds.map((d) => ({ id: d.id, name: d.name, checksum: d.checksum })) }), datasetHash]);
    for (const id of ds.map((d) => d.id))
      await c.query("INSERT INTO processing_run_datasets (run_id, dataset_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [run, id]);

    const validation = mayExp06Processor.validate({ id: run, dataMode: "SYNTHETIC", records: recs });
    await c.query("INSERT INTO evidence (run_id, kind, content, checksum) VALUES ($1,'VALIDATION',$2,$3)",
      [run, JSON.stringify({ warnings: validation.warnings, quality: validation.quality, errors: validation.errors.slice(0, 500) }), sha256(JSON.stringify(validation.warnings))]);

    const results = mayExp06Processor.runAnalysis(validation.records);
    const analysisHash = sha256(JSON.stringify({ metrics: results.metrics, hypotheses: results.hypothesisResults, claims: results.claimResults, config: CONFIG_REF }));

    for (const [code, m] of Object.entries(results.metrics))
      for (const [mk, mv] of [["ALT", m.ALT], ["MIR", m.MIR], ["FTR", m.FTR], ["CFR", m.CFR], ["ViolationRate", m.ViolationRate], ["EC", m.EC]] as const) {
        const ci = m.CIs[mk] ?? m.CIs.MIR;
        await c.query("INSERT INTO metric_results (run_id, metric_code, arm, value, ci_low, ci_high, n) VALUES ($1,$2,$3,$4,$5,$6,$7)",
          [run, mk, code, mv, mk === "ALT" ? null : ci[0], mk === "ALT" ? null : ci[1], m.n]);
      }
    for (const st of results.statistics)
      await c.query("INSERT INTO statistical_results (run_id, test_code, comparison, statistic, p_value, effect_size, effect_type, ci_low, ci_high, method) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
        [run, st.code, JSON.stringify({ comparison: st.comparison }), st.statistic ?? null, st.p ?? null, st.effect ?? null, st.effectType ?? null, st.ci?.[0] ?? null, st.ci?.[1] ?? null, st.method]);
    for (const h of results.hypothesisResults) {
      const hid = (await c.query("SELECT id FROM hypotheses WHERE code=$1 AND experiment_id=(SELECT id FROM experiments WHERE code=$2)", [h.code, EXPERIMENT.code])).rows[0]?.id;
      if (hid) await c.query(
        "INSERT INTO hypothesis_results (run_id, hypothesis_id, status, statistical_criterion, practical_criterion, robustness_criterion, traceability_criterion, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [run, hid, h.status, h.criteria.statistical.reason, h.criteria.practical.reason, h.criteria.robustness.reason, h.criteria.traceability.reason, JSON.stringify(h.criteria)]);
    }
    for (const cl of results.claimResults) {
      const cid = (await c.query("SELECT id FROM claims WHERE code=$1 AND experiment_id=(SELECT id FROM experiments WHERE code=$2)", [cl.code, EXPERIMENT.code])).rows[0]?.id;
      if (cid) await c.query("INSERT INTO claim_results (run_id, claim_id, status, rationale) VALUES ($1,$2,$3,$4)", [run, cid, cl.status, cl.rationale]);
    }

    await c.query("INSERT INTO evidence (run_id, kind, content, checksum) VALUES ($1,'RESULT',$2,$3)",
      [run, JSON.stringify(results), analysisHash]);
    const manifest = buildRunManifest({
      runId: run, experimentId: EXPERIMENT.id, experimentVersion: EXPERIMENT.version,
      protocolVersion: EXPERIMENT.protocolVersion, algorithmVersion: EXPERIMENT.algorithmVersion,
      datasetFiles: ds.map((d) => ({ filename: d.name, checksum: d.checksum, sizeBytes: 0 })),
      datasetHash, analysisHash, processingConfiguration: { referenceArm: CONFIG_REF },
      recordsAnalyzed: results.recordsAnalyzed, seeds: EXPERIMENT.seeds,
      nodeVersion: process.version, platform: process.platform, startedAt, finishedAt: new Date().toISOString(),
    });
    await c.query("INSERT INTO evidence (run_id, kind, content, checksum) VALUES ($1,'MANIFEST',$2,$3)",
      [run, JSON.stringify(manifest), manifest.manifest_hash]);

    await c.query("UPDATE datasets SET status='ANALYZED' WHERE id=ANY($1)", [ds.map((d) => d.id)]);
    await c.query("UPDATE processing_runs SET status='COMPLETED', dataset_hash=$2, analysis_hash=$3, finished_at=now() WHERE id=$1",
      [run, datasetHash, analysisHash]);
    await c.query("INSERT INTO audit_logs (organization_id, user_id, event, entity_type, entity_id, metadata) VALUES ($1,$2,'PROCESSING_RUN','run',$3,$4)",
      [s!.orgId, s!.userId, run, JSON.stringify({ datasets: ds.length, records: results.recordsAnalyzed })]);
    await c.query("COMMIT");
    return NextResponse.json({ runId: run, datasetHash, analysisHash, hypotheses: results.hypothesisResults, claims: results.claimResults, quality: validation.quality });
  } catch (e) {
    await c.query("ROLLBACK");
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally { c.release(); }
}
