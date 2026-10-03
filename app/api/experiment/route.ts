import { NextResponse } from "next/server";
import { EXPERIMENT, CONFIG, PENDING, HYPOTHESES, CLAIM_C06 } from "@/lib/experiments/may-exp-06/config";
import { VARIABLES } from "@/lib/experiments/may-exp-06/variables";

export async function GET() {
  return NextResponse.json({
    experiment: EXPERIMENT, configuration: CONFIG, pending: PENDING,
    hypotheses: HYPOTHESES, claim: CLAIM_C06, variables: VARIABLES,
    warnings: [
      "Pesos de Risk/Trust: fuente src/experiment.py (testbed); NO congelados por el protocolo.",
      "Brazo de referencia de no inferioridad: " + CONFIG.referenceArm.value + ".",
      "Umbrales prácticos ALT/MIR/FTR: PENDIENTE_DE_DEFINICION — el claim confirmatorio queda bloqueado mientras falten.",
    ],
  });
}
