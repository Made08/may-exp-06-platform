export interface VarMeta {
  name: string;
  role: "INDEPENDENT" | "DEPENDENT" | "COVARIATE" | "IDENTIFIER" | "DERIVED" | "EVIDENCE";
  unit: string; definition: string; min?: number; max?: number; required: boolean; step?: number;
}

export const VARIABLES: VarMeta[] = [
  { name: "unit_id", role: "IDENTIFIER", unit: "—", definition: "Identificador único de la solicitud de cambio", required: true },
  { name: "arm", role: "INDEPENDENT", unit: "—", definition: "Brazo experimental", required: true },
  { name: "criticality", role: "COVARIATE", unit: "0–1", definition: "Criticidad del servicio afectado", min: 0, max: 1, step: 0.01, required: true },
  { name: "exposure", role: "COVARIATE", unit: "0–1", definition: "Exposición a producción/usuarios", min: 0, max: 1, step: 0.01, required: true },
  { name: "blast_radius", role: "COVARIATE", unit: "0–1", definition: "Alcance potencial del fallo", min: 0, max: 1, step: 0.01, required: true },
  { name: "incident_history", role: "COVARIATE", unit: "0–1", definition: "Historial normalizado de incidentes", min: 0, max: 1, step: 0.01, required: true },
  { name: "policy_risk", role: "COVARIATE", unit: "0–1", definition: "Riesgo de política del cambio", min: 0, max: 1, step: 0.01, required: true },
  { name: "test_coverage", role: "COVARIATE", unit: "0–1", definition: "Cobertura de pruebas (entra como 1−T al riesgo)", min: 0, max: 1, step: 0.01, required: true },
  { name: "maturity", role: "COVARIATE", unit: "0–1", definition: "Madurez DevSecOps del equipo", min: 0, max: 1, step: 0.01, required: true },
  { name: "evidence", role: "COVARIATE", unit: "0–1", definition: "Calidad de evidencia aportada", min: 0, max: 1, step: 0.01, required: true },
  { name: "error_budget", role: "COVARIATE", unit: "0–1", definition: "Salud del Error Budget (SRE)", min: 0, max: 1, step: 0.01, required: true },
  { name: "policy_compliance", role: "COVARIATE", unit: "0–1", definition: "Cumplimiento de políticas", min: 0, max: 1, step: 0.01, required: true },
  { name: "observability", role: "COVARIATE", unit: "0–1", definition: "Nivel de observabilidad del servicio", min: 0, max: 1, step: 0.01, required: true },
  { name: "approval_minutes", role: "DEPENDENT", unit: "minutos", definition: "Approval Lead Time", min: 0, step: 0.1, required: true },
  { name: "failed_change", role: "DEPENDENT", unit: "bool", definition: "Fallo del cambio desplegado", required: true },
  { name: "control_violation", role: "DEPENDENT", unit: "bool", definition: "Violación de control", required: true },
  { name: "evidence_completeness", role: "EVIDENCE", unit: "0–1", definition: "Completitud de la evidencia", min: 0, max: 1, step: 0.01, required: true },
  { name: "human_intervention", role: "DEPENDENT", unit: "bool", definition: "Intervención humana en la aprobación", required: true },
];
