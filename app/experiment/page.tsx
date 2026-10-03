import { EXPERIMENT, CONFIG, PENDING, HYPOTHESES } from "@/lib/experiments/may-exp-06/config";
import { VARIABLES } from "@/lib/experiments/may-exp-06/variables";
import { TeX } from "@/components/Katex";

export default function ExperimentPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-2xl font-bold">{EXPERIMENT.id} — {EXPERIMENT.scientificName}</h1>
      <section><h2 className="font-semibold">Contexto</h2>
        <p>Las políticas uniformes de aprobación imponen la misma fricción a cambios de riesgo dispar, y la automatización
        indiscriminada debilita el control sobre cambios peligrosos. Este experimento evalúa la propuesta del Modelo Mayagüez:
        modular la intensidad del control según riesgo, madurez y evidencia (contribución: demostrar que la autonomía puede
        condicionarse por evidencia, AI = Trust − Risk).</p></section>
      <section><h2 className="font-semibold">Diseño científico</h2>
        <p><b>{EXPERIMENT.rq}</b> Unidad experimental: solicitud de cambio. Brazos: CAB_UNIFORM (revisión humana uniforme),
        POLICY_UNIFORM (política automatizada uniforme), MAYAGUEZ_ADAPTIVE (FAST_TRACK / AUTOMATED_GATES / HUMAN_REVIEW).
        H0: la gobernanza adaptativa no reduce fricción y/o no es no inferior. Subhipótesis: {HYPOTHESES.filter(h => h.code !== "H0").map(h => h.code).join(", ")}.
        Ground truth: risk/trust/autonomy_index del generador sintético. Amenazas: pesos no congelados, comparador de NI pendiente,
        validez externa limitada (datos sintéticos).</p></section>
      <section><h2 className="font-semibold">Modelo matemático</h2>
        <TeX block math={String.raw`R_i = w_1 C_i + w_2 X_i + w_3 B_i + w_4 H_i + w_5 P_i + w_6(1-T_i)`} />
        <TeX block math={String.raw`Trust_i = \lambda_1 M_i + \lambda_2 E_i + \lambda_3 EB_i + \lambda_4 PC_i + \lambda_5 O_i`} />
        <TeX block math={String.raw`AI_i = Trust_i - Risk_i,\quad Decision_i=egin{cases}	ext{FAST\_TRACK} & AI_i\ge 0.20\ 	ext{AUTOMATED\_GATES} & -0.15 \le AI_i < 0.20\ 	ext{HUMAN\_REVIEW} & AI_i < -0.15\end{cases}`} />
        <TeX block math={String.raw`NI:\ UpperCI_{95\%}(\Delta_{CFR}) < 0.03,\quad UpperCI_{95\%}(\Delta_{Viol}) < 0.02`} /></section>
      <section><h2 className="font-semibold">Criterios de aceptación</h2>
        <table className="w-full text-sm border"><thead><tr><th className="p-1 border border-zinc-800">Métrica</th><th className="p-1 border border-zinc-800">Operador</th><th className="p-1 border border-zinc-800">Umbral</th><th className="p-1 border border-zinc-800">Fuente</th></tr></thead>
        <tbody>
          <tr><td className="p-1 border border-zinc-800">CFR</td><td className="p-1 border border-zinc-800">NI</td><td className="p-1 border border-zinc-800">0.03</td><td className="p-1 border border-zinc-800">preregistration.json</td></tr>
          <tr><td className="p-1 border border-zinc-800">ViolationRate</td><td className="p-1 border border-zinc-800">NI</td><td className="p-1 border border-zinc-800">0.02</td><td className="p-1 border border-zinc-800">preregistration.json</td></tr>
          <tr><td className="p-1 border border-zinc-800">ApprovalLeadTime</td><td className="p-1 border border-zinc-800">&lt;</td><td className="p-1 border border-zinc-800">{PENDING.altThreshold}</td><td className="p-1 border border-zinc-800">—</td></tr>
          <tr><td className="p-1 border border-zinc-800">MIR</td><td className="p-1 border border-zinc-800">&lt;</td><td className="p-1 border border-zinc-800">{PENDING.mirThreshold}</td><td className="p-1 border border-zinc-800">—</td></tr>
        </tbody></table></section>
      <section><h2 className="font-semibold">Variables</h2>
        <ul className="text-sm">{VARIABLES.map((v) => (<li key={v.name}><b>{v.name}</b> [{v.role}] ({v.unit}) — {v.definition}</li>))}</ul></section>
      <section><h2 className="font-semibold">Flujo científico</h2>
        <p className="text-sm">Problema → RQ → Hipótesis → Datos → Procesamiento → Métrica → Prueba estadística → Evidencia → Claim</p></section>
    </div>
  );
}
