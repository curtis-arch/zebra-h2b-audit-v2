/**
 * Types for embedding sync configuration
 */

export interface EmbeddingSource {
  name: string;
  table: string;
  column: string;
  enabled: boolean;
}

export interface EmbeddingModels {
  large: string;
  small: string;
}

export interface EmbeddingConfig {
  version: string;
  models: EmbeddingModels;
  batchSize: number;
  sources: EmbeddingSource[];
}

export interface SourceValue {
  value: string;
  valueHash: string;
}

export interface GeneratedEmbedding {
  value: string;
  valueHash: string;
  embeddingLarge: number[];
  embeddingSmall: number[];
}

export interface DiscoveryResult {
  source: EmbeddingSource;
  newValues: SourceValue[];
  staleHashes: string[];
  unchangedCount: number;
}

export interface SyncResult {
  source: EmbeddingSource;
  newCount: number;
  staleCount: number;
  unchangedCount: number;
  errors: string[];
}

export interface SyncReport {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  dryRun: boolean;
  results: SyncResult[];
  totalNew: number;
  totalStale: number;
  totalUnchanged: number;
  totalErrors: number;
}
