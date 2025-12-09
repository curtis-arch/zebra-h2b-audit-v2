#!/usr/bin/env bun
/**
 * Config-Driven Embedding Sync Script
 *
 * Incrementally syncs embeddings from source tables to embedding_cache.
 * - Detects NEW values (not in cache)
 * - Detects STALE values (in cache but not in source)
 * - Skips UNCHANGED values
 * - Generates BOTH embedding_large (3072d) AND embedding_small (1536d)
 *
 * Usage:
 *   bun run sync-embeddings.ts          # Full sync
 *   bun run sync-embeddings.ts --dry-run # Preview changes only
 */

import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import OpenAI from "openai";
import { dirname, join } from "path";
import type {
  DiscoveryResult,
  EmbeddingConfig,
  EmbeddingSource,
  GeneratedEmbedding,
  SourceValue,
  SyncReport,
  SyncResult,
} from "./config";

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");

// Load config
function loadConfig(): EmbeddingConfig {
  const scriptDir = dirname(Bun.main);
  const configPath = join(scriptDir, "embedding-sources.json");
  const configJson = readFileSync(configPath, "utf-8");
  return JSON.parse(configJson) as EmbeddingConfig;
}

// SHA-256 hash matching PostgreSQL's encode(sha256(...), 'hex')
function sha256Hash(value: string): string {
  return createHash("sha256").update(value.trim()).digest("hex");
}

// Chunk array into batches
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Discover NEW and STALE values for a source
async function discoverChanges(
  source: EmbeddingSource,
  sql: ReturnType<typeof neon>
): Promise<DiscoveryResult> {
  console.log(`\n📊 Discovering changes for: ${source.name}`);
  console.log(`   Table: ${source.table}, Column: ${source.column}`);

  // Get all current source values with their hashes
  const sourceQuery = `
    SELECT DISTINCT ${source.column} AS value,
           encode(sha256(trim(${source.column})::bytea), 'hex') AS value_hash
    FROM ${source.table}
    WHERE ${source.column} IS NOT NULL
      AND trim(${source.column}) != ''
  `;
  const sourceRows = await sql(sourceQuery);
  const sourceHashes = new Set(sourceRows.map((r) => r.value_hash as string));

  console.log(`   Source values: ${sourceRows.length}`);

  // Get cached values for this source
  const cachedQuery = `
    SELECT value, value_hash
    FROM embedding_cache
    WHERE source_table = $1 AND source_column = $2
  `;
  const cachedRows = await sql(cachedQuery, [source.table, source.column]);
  const cachedHashes = new Set(cachedRows.map((r) => r.value_hash as string));

  console.log(`   Cached values: ${cachedRows.length}`);

  // Find NEW values (in source but not in cache)
  const newValues: SourceValue[] = sourceRows
    .filter((r) => !cachedHashes.has(r.value_hash as string))
    .map((r) => ({
      value: r.value as string,
      valueHash: r.value_hash as string,
    }));

  // Find STALE hashes (in cache but not in source)
  const staleHashes = cachedRows
    .filter((r) => !sourceHashes.has(r.value_hash as string))
    .map((r) => r.value_hash as string);

  // Count unchanged
  const unchangedCount = cachedRows.length - staleHashes.length;

  console.log(`   🆕 NEW: ${newValues.length}`);
  console.log(`   🗑️  STALE: ${staleHashes.length}`);
  console.log(`   ✓ UNCHANGED: ${unchangedCount}`);

  return {
    source,
    newValues,
    staleHashes,
    unchangedCount,
  };
}

// Generate embeddings for a batch of values
async function generateEmbeddings(
  values: SourceValue[],
  config: EmbeddingConfig,
  openai: OpenAI
): Promise<GeneratedEmbedding[]> {
  if (values.length === 0) return [];

  const texts = values.map((v) => v.value);

  // Generate both embedding sizes in parallel
  const [largeResponse, smallResponse] = await Promise.all([
    openai.embeddings.create({
      model: config.models.large,
      input: texts,
    }),
    openai.embeddings.create({
      model: config.models.small,
      input: texts,
    }),
  ]);

  return values.map((v, i) => ({
    value: v.value,
    valueHash: v.valueHash,
    embeddingLarge: largeResponse.data[i].embedding,
    embeddingSmall: smallResponse.data[i].embedding,
  }));
}

// Insert new embeddings and delete stale ones
async function syncToDatabase(
  source: EmbeddingSource,
  embeddings: GeneratedEmbedding[],
  staleHashes: string[],
  sql: ReturnType<typeof neon>
): Promise<void> {
  // Delete stale embeddings
  if (staleHashes.length > 0) {
    console.log(`   Deleting ${staleHashes.length} stale embeddings...`);
    await sql`
      DELETE FROM embedding_cache
      WHERE source_table = ${source.table}
        AND source_column = ${source.column}
        AND value_hash = ANY(${staleHashes})
    `;
  }

  // Insert new embeddings in batches
  if (embeddings.length > 0) {
    console.log(`   Inserting ${embeddings.length} new embeddings...`);

    for (const batch of chunk(embeddings, 50)) {
      const values = batch.map((e) => e.value);
      const hashes = batch.map((e) => e.valueHash);
      const largeVecs = batch.map((e) => JSON.stringify(e.embeddingLarge));
      const smallVecs = batch.map((e) => JSON.stringify(e.embeddingSmall));

      await sql`
        INSERT INTO embedding_cache (
          value, value_hash, embedding_large, embedding_small,
          source_table, source_column, usage_count, created_at
        )
        SELECT
          unnest(${values}::text[]),
          unnest(${hashes}::text[]),
          unnest(${largeVecs}::vector[]),
          unnest(${smallVecs}::vector[]),
          ${source.table},
          ${source.column},
          1,
          NOW()
        ON CONFLICT (value_hash, source_table, source_column) DO UPDATE SET
          embedding_large = EXCLUDED.embedding_large,
          embedding_small = EXCLUDED.embedding_small,
          created_at = NOW()
      `;
    }
  }
}

// Main sync function
async function main() {
  const startTime = Date.now();
  console.log("🚀 Embedding Sync Script");
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}`);
  console.log("");

  // Load config
  const config = loadConfig();
  console.log(`📋 Config loaded: ${config.sources.length} sources defined`);
  console.log(
    `   Models: large=${config.models.large}, small=${config.models.small}`
  );
  console.log(`   Batch size: ${config.batchSize}`);

  // Initialize clients
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable not set");
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  let openai: OpenAI | null = null;
  if (!DRY_RUN) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ OPENAI_API_KEY environment variable not set");
      process.exit(1);
    }
    openai = new OpenAI({ apiKey });
  }

  // Process each enabled source
  const results: SyncResult[] = [];

  for (const source of config.sources) {
    if (!source.enabled) {
      console.log(`\n⏭️  Skipping disabled source: ${source.name}`);
      continue;
    }

    const discovery = await discoverChanges(source, sql);
    const errors: string[] = [];

    if (
      !DRY_RUN &&
      (discovery.newValues.length > 0 || discovery.staleHashes.length > 0)
    ) {
      try {
        // Generate embeddings for new values
        if (discovery.newValues.length > 0) {
          console.log(
            `\n   🔄 Generating embeddings for ${discovery.newValues.length} values...`
          );

          const allEmbeddings: GeneratedEmbedding[] = [];
          const batches = chunk(discovery.newValues, config.batchSize);

          for (let i = 0; i < batches.length; i++) {
            console.log(`      Batch ${i + 1}/${batches.length}...`);
            const batchEmbeddings = await generateEmbeddings(
              batches[i],
              config,
              openai!
            );
            allEmbeddings.push(...batchEmbeddings);

            // Small delay between batches to avoid rate limits
            if (i < batches.length - 1) {
              await new Promise((r) => setTimeout(r, 100));
            }
          }

          // Sync to database
          await syncToDatabase(
            source,
            allEmbeddings,
            discovery.staleHashes,
            sql
          );
        } else if (discovery.staleHashes.length > 0) {
          // Only stale values to delete
          await syncToDatabase(source, [], discovery.staleHashes, sql);
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error: ${errMsg}`);
        errors.push(errMsg);
      }
    }

    results.push({
      source,
      newCount: discovery.newValues.length,
      staleCount: discovery.staleHashes.length,
      unchangedCount: discovery.unchangedCount,
      errors,
    });
  }

  // Build and display report
  const endTime = Date.now();
  const report: SyncReport = {
    startedAt: new Date(startTime).toISOString(),
    completedAt: new Date(endTime).toISOString(),
    durationMs: endTime - startTime,
    dryRun: DRY_RUN,
    results,
    totalNew: results.reduce((sum, r) => sum + r.newCount, 0),
    totalStale: results.reduce((sum, r) => sum + r.staleCount, 0),
    totalUnchanged: results.reduce((sum, r) => sum + r.unchangedCount, 0),
    totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
  };

  console.log("\n" + "═".repeat(60));
  console.log("📊 SYNC REPORT");
  console.log("═".repeat(60));
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`   Duration: ${report.durationMs}ms`);
  console.log(`   🆕 Total NEW: ${report.totalNew}`);
  console.log(`   🗑️  Total STALE: ${report.totalStale}`);
  console.log(`   ✓ Total UNCHANGED: ${report.totalUnchanged}`);
  if (report.totalErrors > 0) {
    console.log(`   ❌ Total ERRORS: ${report.totalErrors}`);
  }
  console.log("═".repeat(60));

  if (DRY_RUN) {
    console.log("\n💡 Run without --dry-run to apply changes");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
