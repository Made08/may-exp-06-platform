import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getSession();
  const g = requireRole(s, ["RESEARCH_ADMIN", "RESEARCHER", "ORGANIZATION_ADMIN", "VIEWER", "AUDITOR"]);
  if (!g.ok) return NextResponse.json({ error: g.error }, { status: g.status });
  const rep = (await pool.query("SELECT * FROM reports WHERE id=$1 AND organization_id=$2", [id, s!.orgId])).rows[0];
  if (!rep) return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
  const format = new URL(req.url).searchParams.get("format") ?? "json";
  const content = typeof rep.content === "string" ? JSON.parse(rep.content) : rep.content;
  if (format === "csv") {
    const rows = [["seccion", "codigo", "brazo", "valor", "ic95_inf", "ic95_sup", "n"].join(",")];
    for (const d of content.descriptive ?? []) rows.push(["descriptive", d.metric_code, d.arm ?? "", d.value, d.ci_low ?? "", d.ci_high ?? "", d.n ?? ""].join(","));
    for (const i of content.inferential ?? []) rows.push(["inferential", i.test_code, (i.comparison?.comparison ?? ""), i.effect_size ?? "", i.ci_low ?? "", i.ci_high ?? "", ""].join(","));
    return new NextResponse(rows.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="report-' + id + '.csv"' } });
  }
  if (format === "html") {
    const h = (x: unknown) => String(x ?? "—");
    const esc = (x: unknown) => h(x).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Reporte MAY-EXP-06</title>
<style>body{font-family:Georgia,serif;max-width:860px;margin:2rem auto;color:#111}table{border-collapse:collapse;width:100%;margin:.5rem 0}td,th{border:1px solid #999;padding:.35rem;text-align:left}h1{font-size:1.4rem}.warn{background:#fff7ed;border:1px solid #f59e0b;padding:.6rem}@media print{.noprint{display:none}}</style></head><body>
<h1>Reporte ${esc(EXPERIMENT_CODE)} (${esc(content.metadata?.experiment?.version)}) — modo ${esc(rep.mode)}</h1>
<p><b>Hashes:</b> dataset ${esc(rep.dataset_hash)} · análisis ${esc(rep.analysis_hash)} · reporte ${esc(rep.report_hash)}</p>
<div class="warn">Fuente de datos: ${esc(content.dataSource)}</div>
<h2>RQ</h2><p>${esc(content.rq)}</p>
<h2>Hipótesis y claims</h2><table><tr><th>Código</th><th>Estado</th></tr>${(content.hypotheses ?? []).map((x: { code: string; status: string }) => `<tr><td>${esc(x.code)}</td><td>${esc(x.status)}</td></tr>`).join("")}${(content.claims ?? []).map((x: { code: string; status: string }) => `<tr><td>${esc(x.code)}</td><td>${esc(x.status)}</td></tr>`).join("")}</table>
<h2>Descriptivo</h2><table><tr><th>Métrica</th><th>Brazo</th><th>Valor</th><th>IC95</th></tr>${(content.descriptive ?? []).map((x: { metric_code: string; arm: string; value: number; ci_low: number; ci_high: number }) => `<tr><td>${esc(x.metric_code)}</td><td>${esc(x.arm)}</td><td>${esc(Number(x.value).toFixed(4))}</td><td>[${esc(Number(x.ci_low ?? 0).toFixed(4))}, ${esc(Number(x.ci_high ?? 0).toFixed(4))}]</td></tr>`).join("")}</table>
<h2>Amenazas y limitaciones</h2><p>${(content.threats ?? []).map(esc).join(" · ")} — ${(content.limitations ?? []).map(esc).join(" · ")}</p>
<p><small>Generado: ${esc(content.metadata?.generatedAt)} · Protocolo ${esc(content.reproducibility?.protocolVersion)} · Motor ${esc(content.reproducibility?.algorithmVersion)}</small></p>
<p class="noprint"><button onclick="window.print()">Imprimir / Guardar como PDF</button></p></body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
  return NextResponse.json(content);
}

const EXPERIMENT_CODE = "MAY-EXP-06";
