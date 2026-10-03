import { describe, it, expect } from "vitest";
import { computeRisk, computeTrust, autonomyIndex, decide, riskWeights, trustWeights, mayExp06Processor } from "@/lib/experiments/may-exp-06/engine";

const V = { criticality: 0.5, exposure: 0.5, blast_radius: 0.5, incident_history: 0.5, policy_risk: 0.5, test_coverage: 0.5 };

describe("Motor MAY-EXP-06 — vectores corregidos de la batería", () => {
  it("Risk = 0.20C+0.16X+0.18B+0.14H+0.16P+0.16(1−T) — vector 0.5 uniforme → 0.50", () => {
    expect(computeRisk(V)).toBeCloseTo(0.50, 10); // el vector 0.58 de la versión anterior ERA ERRÓNEO
  });

  it("Pesos suman 1.0 exacto", () => {
    expect(Object.values(riskWeights).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(Object.values(trustWeights).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it("computeTrust extremos", () => {
    expect(computeTrust({ maturity: 1, evidence: 1, error_budget: 1, policy_compliance: 1, observability: 1 })).toBeCloseTo(1, 10);
    expect(computeTrust({ maturity: 0, evidence: 0, error_budget: 0, policy_compliance: 0, observability: 0 })).toBeCloseTo(0, 10);
  });

  it("Umbrales de decisión: 0.20→FAST_TRACK, 0.1999→AUTOMATED_GATES, −0.15→AUTOMATED_GATES, −0.1501→HUMAN_REVIEW", () => {
    expect(decide(0.20)).toBe("FAST_TRACK");
    expect(decide(0.1999)).toBe("AUTOMATED_GATES");
    expect(decide(-0.15)).toBe("AUTOMATED_GATES");
    expect(decide(-0.1501)).toBe("HUMAN_REVIEW");
  });

  it("Consistencia derivadas: risk/trust/AI provistos ≠ recomputados → warning y normalización", () => {
    const v = { unit_id: "X1", arm: "MAYAGUEZ_ADAPTIVE", ...V, approval_minutes: 10, failed_change: false, control_violation: false, human_intervention: false, evidence_completeness: 0.9, risk: 0.99, trust: 0.99, data_type: "SYNTHETIC" } as const;
    const out = mayExp06Processor.validate({ id: "t", dataMode: "SYNTHETIC", records: [v] });
    expect(out.warnings.length).toBeGreaterThanOrEqual(2);
    expect(out.records[0].risk).toBeCloseTo(0.5, 10);
    expect(out.records[0].autonomy_index).toBeCloseTo(0, 10);
  });

  it("Claim C06 bloqueado (NOT_EVALUABLE) con umbrales prácticos pendientes", () => {
    const rec = (over: Record<string, unknown>) => ({
      unit_id: "U", arm: "MAYAGUEZ_ADAPTIVE", criticality: 0.5, exposure: 0.5, blast_radius: 0.5, incident_history: 0.5,
      policy_risk: 0.5, test_coverage: 0.5, maturity: 0.5, evidence: 0.5, error_budget: 0.5, policy_compliance: 0.5,
      observability: 0.5, approval_minutes: 15, failed_change: false, control_violation: false, human_intervention: false,
      evidence_completeness: 0.9, seed: 101, replication: 1, data_type: "SYNTHETIC", ...over,
    });
    const recs = [
      rec({}), rec({ arm: "CAB_UNIFORM", approval_minutes: 800, human_intervention: true, seed: 202 }),
      rec({ arm: "POLICY_UNIFORM", approval_minutes: 14, seed: 303, failed_change: false }),
    ];
    const res = mayExp06Processor.runAnalysis(recs.map((r) => r as never));
    expect(res.claimResults[0].status).toBe("NOT_EVALUABLE");
  });
});
