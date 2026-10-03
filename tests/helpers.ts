// Reexporta el motor real para los tests (el archivo statistics.test.ts importa de aquí
// para poder añadir utilidades de prueba sin tocar la librería de producción).
export { wilsonInterval, newcombeInterval, mannWhitney, bootstrapMedianDiffCI, median } from "@/lib/statistics";
export { computeTrust as computeTrustSafe, computeRisk, autonomyIndex, decide } from "@/lib/experiments/may-exp-06/engine";
