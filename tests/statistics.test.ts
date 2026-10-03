import { describe, it, expect } from "vitest";
import { wilsonInterval, newcombeInterval, mannWhitney, bootstrapMedianDiffCI, median, computeTrustSafe } from "./helpers";

describe("Motor estadístico — vectores de la batería de validación", () => {
  it("Wilson(10/100) = [0.055229, 0.174366] (validado contra scipy)", () => {
    const [lo, hi] = wilsonInterval(10, 100);
    expect(lo).toBeCloseTo(0.055229, 5);
    expect(hi).toBeCloseTo(0.174366, 5);
  });

  it("Newcombe(0/10 vs 0/10) simétrico y contenido en [−0.5, 0.5]", () => {
    const [lo, hi] = newcombeInterval(0, 10, 0, 10);
    expect(lo).toBeLessThanOrEqual(0);
    expect(hi).toBeLessThan(0.5);
    expect(Math.abs(hi - Math.abs(lo))).toBeLessThan(1e-9);
  });

  it("Mann-Whitney exacto: [1..5] vs [10..14] → p≈0.0079 (ruta exacta)", () => {
    const r = mannWhitney([1, 2, 3, 4, 5], [10, 11, 12, 13, 14]);
    expect(r.method).toBe("exact");
    expect(r.p).toBeCloseTo(0.0079365, 5);
  });

  it("Mann-Whitney idénticos → p=1", () => {
    const r = mannWhitney([1, 2, 3], [1, 2, 3]);
    expect(r.p).toBeCloseTo(1, 6);
  });

  it("Varianza de Mann-Whitney con empates: [1,1,2] vs [2,3,3] corre sin NaN", () => {
    const r = mannWhitney([1, 1, 2], [2, 3, 3]);
    expect(Number.isFinite(r.p)).toBe(true);
    expect(r.p).toBeGreaterThanOrEqual(0);
    expect(r.p).toBeLessThanOrEqual(1);
  });

  it("Bootstrap de diferencia de medianas es determinista por semilla", () => {
    const a = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], b = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const r1 = bootstrapMedianDiffCI(a, b, 101, 2000), r2 = bootstrapMedianDiffCI(a, b, 101, 2000);
    expect(r1).toEqual(r2);
  });

  it("median() con n par e impar", () => {
    expect(median([1, 2, 3])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("computeTrustSafe suma 1 con pesos unitarios", () => {
    expect(computeTrustSafe(1, 1, 1, 1, 1)).toBeCloseTo(1, 10);
    expect(computeTrustSafe(0, 0, 0, 0, 0)).toBeCloseTo(0, 10);
  });
});
