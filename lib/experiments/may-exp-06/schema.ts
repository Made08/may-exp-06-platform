import { z } from "zod";

const f01 = z.coerce.number().min(0).max(1);
const boolish = z.coerce.boolean();

/** Registro del OUTPUT_SCHEMA (solo variables requeridas; derivadas se recalculan en el motor). */
export const recordInput = z.object({
  unit_id: z.string().min(1),
  arm: z.enum(["CAB_UNIFORM", "POLICY_UNIFORM", "MAYAGUEZ_ADAPTIVE"]),
  criticality: f01, exposure: f01, blast_radius: f01, incident_history: f01, policy_risk: f01,
  test_coverage: f01, maturity: f01, evidence: f01, error_budget: f01,
  policy_compliance: f01, observability: f01,
  approval_minutes: z.coerce.number().min(0),
  failed_change: boolish, control_violation: boolish, human_intervention: boolish,
  evidence_completeness: f01.optional(),
  seed: z.coerce.number().int().optional(),
  replication: z.coerce.number().int().optional(),
  data_type: z.enum(["REAL", "SYNTHETIC", "MIXED"]).default("SYNTHETIC"),
  // derivadas opcionales (si se proveen, el motor verifica consistencia y normaliza)
  risk: z.coerce.number().optional(),
  trust: z.coerce.number().optional(),
  autonomy_index: z.coerce.number().optional(),
  decision: z.string().optional(),
  fast_track: boolish.optional(),
});

export const manualRecordInput = recordInput;
export type RecordInput = z.infer<typeof recordInput>;
