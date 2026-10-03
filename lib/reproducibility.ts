import { sha256 } from "./ingestion";

export interface RunManifestInput {
  runId: string; experimentId: string; experimentVersion: string; protocolVersion: string; algorithmVersion: string;
  datasetFiles: { filename: string; checksum: string; sizeBytes: number }[];
  datasetHash: string | null; analysisHash: string | null; processingConfiguration: unknown;
  recordsAnalyzed: number; seeds: number[]; nodeVersion: string; platform: string; startedAt: string; finishedAt: string;
}

/** Manifest verificable por run: hashes dataset → análisis → manifest (evidencia kind='MANIFEST'). */
export function buildRunManifest(i: RunManifestInput): Record<string, unknown> {
  const base = { ...i, synthetic_data: true, generatedAt: new Date().toISOString() };
  return { ...base, manifest_hash: sha256(JSON.stringify(base)) };
}
