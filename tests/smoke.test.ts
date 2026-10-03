import { describe, it, expect } from "vitest";
import { CONFIG } from "@/lib/experiments/may-exp-06/config";

describe("Configuración científica", () => {
  it("márgenes de no inferioridad preregistrados", () => {
    expect(CONFIG.nonInferiority.CFR.margin).toBe(0.03);
    expect(CONFIG.nonInferiority.Violation.margin).toBe(0.02);
  });
  it("referencia sin congelar", () => {
    expect(CONFIG.referenceArm.value).toBe("PENDIENTE_DE_DEFINICION");
  });
});
