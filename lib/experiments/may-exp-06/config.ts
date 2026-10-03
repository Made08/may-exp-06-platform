export const EXPERIMENT = {
  id: "MAY-EXP-06",
  code: "MAY-EXP-06",
  version: "1.0",
  protocolVersion: "1.0",
  schemaVersion: "OUTPUT_SCHEMA-1.0",
  algorithmVersion: "engine-1.0.0",
  scientificName: "Gobernanza adaptativa frente a CAB/gobernanza uniforme",
  arms: ["CAB_UNIFORM", "POLICY_UNIFORM", "MAYAGUEZ_ADAPTIVE"] as const,
  seeds: [101, 202, 303, 404, 505],
  rq: "RQ06: ¿Gobernanza adaptativa reduce fricción sin deterioro material de confiabilidad/cumplimiento?",
};
export type Arm = (typeof EXPERIMENT.arms)[number];

export const CONFIG = {
  thresholds: {
    thetaHigh: 0.20, thetaLow: -0.15,
    source: "config.yaml thresholds.risk_high/risk_low (semántica: src/experiment.py)",
  },
  nonInferiority: {
    CFR: { margin: 0.03, source: "PREREGISTRATION" },
    Violation: { margin: 0.02, source: "PREREGISTRATION" },
  },
  alpha: 0.05,
  robustness: {
    minConsistentShare: 0.8,
    source: "Regla del script (src/experiment.py): consistencia ≥0.8 — definida SOLO para ALT",
  },
  referenceArm: {
    value: "PENDIENTE_DE_DEFINICION" as const,
    candidate: "POLICY_UNIFORM",
    note: "El preregistro no congela el brazo de referencia; src/experiment.py usó POLICY_UNIFORM",
  },
  practicalThresholds: {
    ApprovalLeadTime: "PENDIENTE_DE_DEFINICION",
    MIR: "PENDIENTE_DE_DEFINICION",
    FTR: "PENDIENTE_DE_DEFINICION",
  },
};

export const PENDING = {
  altThreshold: "PENDIENTE_DE_DEFINICION",
  mirThreshold: "PENDIENTE_DE_DEFINICION",
  ftrThreshold: "PENDIENTE_DE_DEFINICION",
  referenceArm: "PENDIENTE_DE_DEFINICION",
};

/** Brazo de comparación usado por el motor mientras el protocolo no congele el oficial. */
export const CONFIG_REF = CONFIG.referenceArm.candidate;

export const HYPOTHESES = [
  { code: "H0", statement: "La gobernanza adaptativa NO reduce la fricción y/o NO es no inferior al comparador.", type: "H0" },
  { code: "H1a", statement: "La gobernanza adaptativa reduce el Approval Lead Time frente a CAB_UNIFORM.", type: "H1" },
  { code: "H1b", statement: "La gobernanza adaptativa reduce la intervención humana (MIR) frente a CAB_UNIFORM.", type: "H1" },
  { code: "H1c", statement: "El CFR adaptativo es no inferior al comparador con margen δ_CFR = 0.03.", type: "H1" },
  { code: "H1d", statement: "La tasa de violaciones adaptativa es no inferior al comparador con margen δ_Violation = 0.02.", type: "H1" },
];

export const CLAIM_C06 = {
  code: "C06",
  statement: "Dentro del testbed experimental, la política adaptativa reduce fricción y satisface los márgenes de no inferioridad preregistrados (δ_CFR=0.03; δ_Violation=0.02). Pendiente de validación externa.",
};
