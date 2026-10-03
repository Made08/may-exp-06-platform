import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    confirmatory: [
      "ApprovalLeadTime (Mann-Whitney + bootstrap de medianas)",
      "MIR (Newcombe)",
      "CFR NI (Newcombe, δ=0.03)",
      "ViolationRate NI (Newcombe, δ=0.02)",
    ],
    exploratory: ["Risk", "Trust", "Autonomy Index", "Distribución de decisiones", "Sensibilidad de pesos", "Comparación secundaria contra CAB_UNIFORM"],
    claimRule: "ClaimSupported = Statistical ∧ Practical ∧ Robustness ∧ Traceability",
    states: ["SUPPORTED", "PARTIALLY_SUPPORTED", "NOT_SUPPORTED", "NOT_EVALUABLE", "EXPLORATORY"],
    historicalResult: {
      source: "src/experiment.py (testbed)", cfr_difference: -0.0020, violation_difference: -0.0053,
      status: "SUPPORTED_IN_SIMULATION", note: "No se reutiliza como observación del nuevo procesamiento",
    },
  });
}
