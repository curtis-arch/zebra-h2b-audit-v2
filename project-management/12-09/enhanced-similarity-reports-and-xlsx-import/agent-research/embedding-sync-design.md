# Embedding Sync System Design

## Overview
Config-driven incremental sync system that generates dual embeddings (large + small) for specified table/column pairs and maintains them in `embedding_cache`.

## Database Schema

### embedding_cache Table (Existing)
```sql
-- Columns (from requirements)
value TEXT NOT NULL
value_hash TEXT NOT NULL UNIQUE
embedding_large VECTOR(3072)  -- text-embedding-3-large
embedding_small VECTOR(1536)  -- text-embedding-3-small
source_table TEXT
source_column TEXT
usage_count INTEGER DEFAULT 0
created_at TIMESTAMP DEFAULT NOW()
umap_x_2d REAL
umap_y_2d REAL
umap_x_3d REAL
umap_y_3d REAL
umap_z_3d REAL
```

### Source Tables (Examples)
- `config_option_component.component_type`
- `htb_attribute_mapping_zebra_provided.attribute_name_for_htb`
- `config_position.attribute_label`
- `zebra_provided_attributes.attribute_name`

## Configuration Format

### embedding-sync-config.json
```json
{
  "version": "1.0.0",
  "openai": {
    "model_large": "text-embedding-3-large",
    "model_small": "text-embedding-3-small",
    "batch_size": 100,
    "max_retries": 3,
    "retry_delay_ms": 1000
  },
  "sources": [
    {
      "table": "config_option_component",
      "column": "component_type",
      "enabled": true,
      "description": "Component types from parsed option descriptions"
    },
    {
      "table": "htb_attribute_mapping_zebra_provided",
      "column": "attribute_name_for_htb",
      "enabled": true,
      "description": "HTB attribute names for matching"
    },
    {
      "table": "config_position",
      "column": "attribute_label",
      "enabled": true,
      "description": "Position attribute labels"
    },
    {
      "table": "zebra_provided_attributes",
      "column": "attribute_name",
      "enabled": false,
      "description": "Zebra-provided attribute names (disabled by default)"
    }
  ]
}
```

## Sync Algorithm

### High-Level Flow
```
1. Load config → Validate sources → Initialize OpenAI client
2. For each enabled source:
   a. Discover phase: Find new, stale, and unchanged values
   b. Generate phase: Batch generate embeddings for new values
   c. Sync phase: Insert new embeddings, delete stale entries
   d. Report phase: Log statistics and errors
3. Global cleanup: Remove orphaned entries from deleted sources
4. Final report: Aggregate statistics across all sources
```

### Detailed Algorithm

#### Phase 1: Discovery (Per Source)
```typescript
async function discoverChanges(source: EmbeddingSource) {
  // 1. Get all distinct non-null values from source table/column
  const sourceValues = await db.execute(sql`
    SELECT DISTINCT ${sql.identifier(source.column)} as value
    FROM ${sql.identifier(source.table)}
    WHERE ${sql.identifier(source.column)} IS NOT NULL
      AND TRIM(${sql.identifier(source.column)}) != ''
  `);

  // 2. Compute hash for each source value (SHA-256 of normalized text)
  const sourceValueMap = new Map<string, string>(); // hash -> value
  for (const row of sourceValues) {
    const normalized = row.value.trim();
    const hash = sha256(normalized);
    sourceValueMap.set(hash, normalized);
  }

  // 3. Get existing embeddings for this source
  const existingEmbeddings = await db.execute(sql`
    SELECT value_hash, value
    FROM embedding_cache
    WHERE source_table = ${source.table}
      AND source_column = ${source.column}
  `);

  const existingHashes = new Set(existingEmbeddings.map(e => e.value_hash));

  // 4. Calculate differences
  const newHashes = Array.from(sourceValueMap.keys())
    .filter(h => !existingHashes.has(h));

  const staleHashes = Array.from(existingHashes)
    .filter(h => !sourceValueMap.has(h));

  const unchangedCount = existingHashes.size - staleHashes.length;

  return {
    newValues: newHashes.map(h => ({ hash: h, value: sourceValueMap.get(h)! })),
    staleHashes,
    unchangedCount,
    totalSource: sourceValueMap.size
  };
}
```

#### Phase 2: Generation (Batched)
```typescript
async function generateEmbeddings(values: Array<{hash: string, value: string}>) {
  const results: Array<{
    hash: string,
    value: string,
    embeddingLarge: number[],
    embeddingSmall: number[]
  }> = [];

  // Batch processing to avoid rate limits
  const batches = chunk(values, config.openai.batch_size);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} values)`);

    try {
      // Generate BOTH embeddings in parallel
      const [largeBatch, smallBatch] = await Promise.all([
        openai.embeddings.create({
          model: config.openai.model_large,
          input: batch.map(v => v.value),
          encoding_format: "float"
        }),
        openai.embeddings.create({
          model: config.openai.model_small,
          input: batch.map(v => v.value),
          encoding_format: "float"
        })
      ]);

      // Combine results
      for (let j = 0; j < batch.length; j++) {
        results.push({
          hash: batch[j].hash,
          value: batch[j].value,
          embeddingLarge: largeBatch.data[j].embedding,
          embeddingSmall: smallBatch.data[j].embedding
        });
      }

      // Rate limiting: small delay between batches
      if (i < batches.length - 1) {
        await sleep(config.openai.retry_delay_ms);
      }
    } catch (error) {
      console.error(`Batch ${i + 1} failed:`, error);
      // Exponential backoff retry logic here
      throw error;
    }
  }

  return results;
}
```

#### Phase 3: Sync (Transactional)
```typescript
async function syncToDatabase(
  source: EmbeddingSource,
  newEmbeddings: Array<GeneratedEmbedding>,
  staleHashes: string[]
) {
  await db.transaction(async (tx) => {
    // 1. Insert new embeddings
    if (newEmbeddings.length > 0) {
      await tx.execute(sql`
        INSERT INTO embedding_cache (
          value,
          value_hash,
          embedding_large,
          embedding_small,
          source_table,
          source_column,
          usage_count,
          created_at
        )
        SELECT
          unnest(${sql.array(newEmbeddings.map(e => e.value))}::text[]),
          unnest(${sql.array(newEmbeddings.map(e => e.hash))}::text[]),
          unnest(${sql.array(newEmbeddings.map(e => `[${e.embeddingLarge.join(',')}]`))}::vector[]),
          unnest(${sql.array(newEmbeddings.map(e => `[${e.embeddingSmall.join(',')}]`))}::vector[]),
          ${source.table},
          ${source.column},
          0,
          NOW()
        ON CONFLICT (value_hash) DO UPDATE SET
          embedding_large = EXCLUDED.embedding_large,
          embedding_small = EXCLUDED.embedding_small,
          source_table = EXCLUDED.source_table,
          source_column = EXCLUDED.source_column,
          created_at = NOW()
      `);
    }

    // 2. Delete stale embeddings
    if (staleHashes.length > 0) {
      await tx.execute(sql`
        DELETE FROM embedding_cache
        WHERE value_hash = ANY(${sql.array(staleHashes)})
          AND source_table = ${source.table}
          AND source_column = ${source.column}
      `);
    }
  });

  return {
    inserted: newEmbeddings.length,
    deleted: staleHashes.length
  };
}
```

#### Phase 4: Orphan Cleanup
```typescript
async function cleanupOrphanedEmbeddings(enabledSources: EmbeddingSource[]) {
  // Find embeddings from sources no longer in config
  const enabledSourcePairs = enabledSources.map(s =>
    `('${s.table}', '${s.column}')`
  ).join(',');

  const orphans = await db.execute(sql`
    SELECT value_hash, source_table, source_column, value
    FROM embedding_cache
    WHERE (source_table, source_column) NOT IN (${sql.raw(enabledSourcePairs)})
  `);

  if (orphans.length > 0) {
    console.warn(`Found ${orphans.length} orphaned embeddings from removed sources`);

    // Optional: Delete or just report
    if (config.cleanup_orphans) {
      const hashes = orphans.map(o => o.value_hash);
      await db.execute(sql`
        DELETE FROM embedding_cache
        WHERE value_hash = ANY(${sql.array(hashes)})
      `);
      console.log(`Deleted ${orphans.length} orphaned embeddings`);
    }
  }

  return orphans.length;
}
```

## SQL Queries Reference

### Query 1: Find New Values Needing Embeddings
```sql
-- Get distinct values from source that don't have embeddings yet
WITH source_values AS (
  SELECT DISTINCT
    component_type AS value,
    ENCODE(SHA256(TRIM(component_type)::bytea), 'hex') AS value_hash
  FROM config_option_component
  WHERE component_type IS NOT NULL
    AND TRIM(component_type) != ''
)
SELECT sv.value, sv.value_hash
FROM source_values sv
LEFT JOIN embedding_cache ec
  ON ec.value_hash = sv.value_hash
  AND ec.source_table = 'config_option_component'
  AND ec.source_column = 'component_type'
WHERE ec.value_hash IS NULL
ORDER BY sv.value;
```

### Query 2: Find Stale Values to Delete
```sql
-- Get embeddings that no longer exist in source table
WITH source_values AS (
  SELECT DISTINCT
    ENCODE(SHA256(TRIM(component_type)::bytea), 'hex') AS value_hash
  FROM config_option_component
  WHERE component_type IS NOT NULL
    AND TRIM(component_type) != ''
)
SELECT ec.value_hash, ec.value
FROM embedding_cache ec
WHERE ec.source_table = 'config_option_component'
  AND ec.source_column = 'component_type'
  AND NOT EXISTS (
    SELECT 1 FROM source_values sv
    WHERE sv.value_hash = ec.value_hash
  );
```

### Query 3: Upsert Embeddings (PostgreSQL)
```sql
-- Insert new embeddings or update if hash collision (shouldn't happen)
INSERT INTO embedding_cache (
  value,
  value_hash,
  embedding_large,
  embedding_small,
  source_table,
  source_column,
  usage_count,
  created_at
) VALUES (
  $1,  -- value
  $2,  -- value_hash
  $3,  -- embedding_large (vector)
  $4,  -- embedding_small (vector)
  $5,  -- source_table
  $6,  -- source_column
  0,
  NOW()
)
ON CONFLICT (value_hash) DO UPDATE SET
  embedding_large = EXCLUDED.embedding_large,
  embedding_small = EXCLUDED.embedding_small,
  source_table = EXCLUDED.source_table,
  source_column = EXCLUDED.source_column,
  created_at = NOW()
RETURNING *;
```

### Query 4: Batch Insert with UNNEST
```sql
-- More efficient batch insert for multiple embeddings
INSERT INTO embedding_cache (
  value,
  value_hash,
  embedding_large,
  embedding_small,
  source_table,
  source_column,
  usage_count,
  created_at
)
SELECT
  unnest($1::text[]) AS value,
  unnest($2::text[]) AS value_hash,
  unnest($3::vector[]) AS embedding_large,
  unnest($4::vector[]) AS embedding_small,
  $5 AS source_table,
  $6 AS source_column,
  0,
  NOW()
ON CONFLICT (value_hash) DO UPDATE SET
  embedding_large = EXCLUDED.embedding_large,
  embedding_small = EXCLUDED.embedding_small,
  created_at = NOW();
```

### Query 5: Verify Sync Status
```sql
-- Check sync status for a source
SELECT
  ec.source_table,
  ec.source_column,
  COUNT(*) AS total_embeddings,
  COUNT(ec.embedding_large) AS have_large,
  COUNT(ec.embedding_small) AS have_small,
  COUNT(*) FILTER (WHERE ec.embedding_large IS NULL OR ec.embedding_small IS NULL) AS incomplete,
  MIN(ec.created_at) AS oldest_embedding,
  MAX(ec.created_at) AS newest_embedding
FROM embedding_cache ec
WHERE ec.source_table = 'config_option_component'
  AND ec.source_column = 'component_type'
GROUP BY ec.source_table, ec.source_column;
```

### Query 6: Find Orphaned Embeddings
```sql
-- Find embeddings from sources not in current config
WITH active_sources AS (
  SELECT 'config_option_component' AS table_name, 'component_type' AS column_name
  UNION ALL
  SELECT 'htb_attribute_mapping_zebra_provided', 'attribute_name_for_htb'
  UNION ALL
  SELECT 'config_position', 'attribute_label'
)
SELECT ec.value_hash, ec.source_table, ec.source_column, ec.value, ec.created_at
FROM embedding_cache ec
WHERE NOT EXISTS (
  SELECT 1 FROM active_sources a
  WHERE a.table_name = ec.source_table
    AND a.column_name = ec.source_column
)
ORDER BY ec.source_table, ec.source_column, ec.value;
```

## Edge Cases & Error Handling

### 1. Empty/Null Values
**Scenario**: Source column contains NULL or empty strings
**Handling**:
- Filter in SQL: `WHERE column IS NOT NULL AND TRIM(column) != ''`
- Skip normalization for empty strings
- Log count of skipped empty values

### 2. Duplicate Values Across Sources
**Scenario**: Same value appears in multiple source tables
**Handling**:
- Hash is the same, so embedding is shared (value_hash is unique)
- **Decision**: First source wins, OR store multiple source mappings
- **Recommended**: Add `embedding_cache_sources` junction table for many-to-many
- **Workaround**: Composite key in source tracking: `source_table || '.' || source_column`

### 3. OpenAI API Rate Limits
**Scenario**: 429 Too Many Requests
**Handling**:
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Batch size reduction: If batch fails, split in half and retry
- Progress persistence: Save progress after each successful batch
- Resume capability: Track last processed hash in state file

### 4. Partial Failures
**Scenario**: 50 of 100 embeddings generated, then API fails
**Handling**:
- Transactional inserts per batch (not per run)
- Idempotent operation: Re-running inserts same data
- Progress logging: "Batch 5/10 completed, 50 embeddings inserted"
- Resume from checkpoint: Skip batches already in DB

### 5. Schema Changes in Source Tables
**Scenario**: Source column renamed or deleted
**Handling**:
- Config validation: Check table/column exists before sync
- Graceful degradation: Skip missing sources with warning
- Manual cleanup: Flag orphaned embeddings for review

### 6. Hash Collisions
**Scenario**: SHA-256 collision (extremely rare: 1 in 2^256)
**Handling**:
- ON CONFLICT DO UPDATE: Overwrites with latest embedding
- Log warning if value differs but hash matches
- In practice: Never happens with SHA-256

### 7. Very Long Values
**Scenario**: Value exceeds OpenAI token limit (8191 tokens for text-embedding-3)
**Handling**:
- Pre-check: Count tokens using `tiktoken` library
- Truncate: Take first 8000 tokens with "..." suffix
- Log warning: "Value truncated: {first 100 chars}..."
- Skip option: Mark as `embedding_error` with reason

### 8. Model Version Changes
**Scenario**: OpenAI releases text-embedding-4-large
**Handling**:
- Config-driven model names
- Versioning: Add `model_version` column to `embedding_cache`
- Migration strategy: Keep old embeddings, generate new in parallel
- A/B testing: Compare old vs new model results

### 9. Cost Overruns
**Scenario**: Accidentally sync 1 million values
**Handling**:
- Dry-run mode: Report counts without generating embeddings
- Confirmation prompt: "Generate 1,000,000 embeddings ($X estimated)? y/n"
- Batch limits: Max 10,000 values per run (configurable)
- Budget tracking: Log token usage and estimated cost

### 10. Concurrent Runs
**Scenario**: Two sync processes run simultaneously
**Handling**:
- Advisory lock: `SELECT pg_try_advisory_lock(hash_code('embedding_sync'))`
- Skip if locked: Exit with "Another sync in progress"
- Timeout: Release lock after 30 minutes max
- Process ID tracking: Store PID in lock metadata

### 11. Source Table Has No Distinct Values
**Scenario**: All rows have NULL or empty strings
**Handling**:
- Report: "0 values found in source, skipping"
- Don't delete existing embeddings (preserve historical data)
- Log warning for investigation

### 12. Database Connection Loss Mid-Sync
**Scenario**: Network interruption during transaction
**Handling**:
- Transaction rollback: Batch inserts rolled back automatically
- Retry logic: Reconnect and resume from last checkpoint
- Health check: Ping DB before starting each batch

## Performance Considerations

### Batch Sizing
- **OpenAI API**: 100 values per batch (safe default)
- **Database INSERT**: Use UNNEST for bulk insert (1000+ rows efficient)
- **Trade-off**: Larger batches = fewer API calls but higher failure cost

### Indexing Requirements
```sql
-- Essential indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_embedding_cache_value_hash
  ON embedding_cache (value_hash);

CREATE INDEX IF NOT EXISTS idx_embedding_cache_source
  ON embedding_cache (source_table, source_column);

CREATE INDEX IF NOT EXISTS idx_embedding_cache_created_at
  ON embedding_cache (created_at);

-- For similarity queries (if not already present)
CREATE INDEX IF NOT EXISTS idx_embedding_cache_small_cosine
  ON embedding_cache USING ivfflat (embedding_small vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_embedding_cache_large_cosine
  ON embedding_cache USING ivfflat (embedding_large vector_cosine_ops);
```

### Parallelization Strategy
- **Sequential sources**: Process sources one at a time to avoid complexity
- **Parallel batches**: Within a source, generate embeddings in parallel batches
- **Rate limiting**: Respect OpenAI rate limits (tier-based)

### Memory Usage
- **Streaming**: Don't load all source values into memory at once
- **Pagination**: Process source values in chunks (e.g., 10,000 at a time)
- **Embeddings size**:
  - Large: 3072 floats × 4 bytes = 12.3 KB per embedding
  - Small: 1536 floats × 4 bytes = 6.1 KB per embedding
  - 1000 values = ~18 MB in memory (acceptable)

## Output & Reporting

### Console Output (During Sync)
```
=== Embedding Sync Started ===
Config: /path/to/embedding-sync-config.json
Sources: 3 enabled, 1 disabled

[1/3] Processing: config_option_component.component_type
  Discovery: 450 total values in source
  Found: 25 new, 3 stale, 422 unchanged
  Generating embeddings for 25 values...
    Batch 1/1: Generating dual embeddings (large + small)
    OpenAI API: 25 values × 2 models = 50 API calls completed
  Syncing to database...
    Inserted: 25 new embeddings
    Deleted: 3 stale embeddings
  ✓ Completed in 3.2s

[2/3] Processing: htb_attribute_mapping_zebra_provided.attribute_name_for_htb
  Discovery: 260 total values in source
  Found: 260 new, 0 stale, 0 unchanged
  Generating embeddings for 260 values...
    Batch 1/3: Generating dual embeddings (large + small)
    Batch 2/3: Generating dual embeddings (large + small)
    Batch 3/3: Generating dual embeddings (large + small)
    OpenAI API: 260 values × 2 models = 520 API calls completed
  Syncing to database...
    Inserted: 260 new embeddings
    Deleted: 0 stale embeddings
  ✓ Completed in 12.5s

[3/3] Processing: config_position.attribute_label
  Discovery: 85 total values in source
  Found: 0 new, 0 stale, 85 unchanged
  Skipping (no changes detected)
  ✓ Completed in 0.1s

Orphan cleanup: 0 orphaned embeddings found

=== Sync Summary ===
Total sources processed: 3
Total values synced: 285 new, 3 deleted, 507 unchanged
Total embeddings generated: 570 (285 large + 285 small)
Estimated cost: $0.043 (based on OpenAI pricing)
Total duration: 15.8s
```

### JSON Report (For CI/CD)
```json
{
  "timestamp": "2025-12-09T10:30:45Z",
  "duration_seconds": 15.8,
  "config_path": "/path/to/embedding-sync-config.json",
  "sources": [
    {
      "table": "config_option_component",
      "column": "component_type",
      "status": "success",
      "total_values": 450,
      "new": 25,
      "stale": 3,
      "unchanged": 422,
      "duration_seconds": 3.2
    },
    {
      "table": "htb_attribute_mapping_zebra_provided",
      "column": "attribute_name_for_htb",
      "status": "success",
      "total_values": 260,
      "new": 260,
      "stale": 0,
      "unchanged": 0,
      "duration_seconds": 12.5
    },
    {
      "table": "config_position",
      "column": "attribute_label",
      "status": "skipped",
      "total_values": 85,
      "new": 0,
      "stale": 0,
      "unchanged": 85,
      "duration_seconds": 0.1
    }
  ],
  "totals": {
    "sources_processed": 3,
    "values_new": 285,
    "values_deleted": 3,
    "values_unchanged": 507,
    "embeddings_generated": 570,
    "estimated_cost_usd": 0.043
  },
  "orphans": {
    "found": 0,
    "deleted": 0
  },
  "errors": []
}
```

## Testing Strategy

### Unit Tests
1. **Config Loading**: Valid/invalid JSON, missing required fields
2. **Hash Generation**: Consistent hashing, normalization rules
3. **Batch Splitting**: Edge cases (0, 1, 100, 101, 1000 values)
4. **Error Handling**: Retry logic, exponential backoff

### Integration Tests
1. **Database Queries**: Discovery, upsert, delete operations
2. **OpenAI API**: Mock responses, rate limit simulation
3. **Transaction Rollback**: Verify cleanup on failure

### End-to-End Tests
1. **Fresh Sync**: Empty embedding_cache → populate from scratch
2. **Incremental Sync**: Add new values to source → verify only new embedded
3. **Stale Cleanup**: Remove values from source → verify deletion
4. **Re-sync**: Run twice with no changes → verify idempotency
5. **Orphan Cleanup**: Remove source from config → verify orphan handling

### Performance Tests
1. **Large Dataset**: 10,000 values (measure time and memory)
2. **Concurrent Sources**: Multiple sources in parallel
3. **Rate Limiting**: Verify batch delays and retry logic

## Deployment Checklist

- [ ] Config file created and validated
- [ ] OpenAI API key available in environment
- [ ] Database has pgvector extension enabled
- [ ] Indexes created on embedding_cache
- [ ] Test run on subset of data (dry-run mode)
- [ ] Full sync executed and verified
- [ ] CI/CD pipeline configured (optional)
- [ ] Monitoring/alerting set up for failures
- [ ] Documentation updated with usage examples
- [ ] Rollback plan documented

## Future Enhancements

1. **UMAP Integration**: Auto-generate 2D/3D projections after sync
2. **Delta Tracking**: Track when each value was last seen in source
3. **Multi-Model Support**: Generate embeddings from multiple models in parallel
4. **Embedding Versioning**: Keep historical embeddings for comparison
5. **Source Priority**: Process high-priority sources first
6. **Smart Batching**: Adjust batch size based on value length
7. **Cost Optimization**: Use cheaper models for less critical sources
8. **Webhook Notifications**: Alert on completion or errors
9. **Web UI**: Dashboard for monitoring sync status
10. **Incremental UMAP**: Only recompute UMAP for changed values

---

## REPORT BACK

### ALGORITHM_STEPS
1. **Load Configuration**: Parse JSON config, validate sources, initialize OpenAI client
2. **Discovery Phase**: For each enabled source, compare source table values with existing embeddings
3. **Generate Embeddings**: Batch process new values through OpenAI API (dual models in parallel)
4. **Sync to Database**: Transactional insert of new embeddings and deletion of stale entries
5. **Orphan Cleanup**: Remove embeddings from sources no longer in config
6. **Report Statistics**: Log comprehensive sync report with counts, timing, and cost estimates

### SQL_QUERIES
1. **Find New Values**: LEFT JOIN source values with embedding_cache, filter WHERE NULL
2. **Find Stale Values**: LEFT JOIN embedding_cache with source values, filter WHERE NOT EXISTS
3. **Batch Upsert**: INSERT with ON CONFLICT DO UPDATE using UNNEST for bulk operations
4. **Verify Sync**: Aggregate COUNT and GROUP BY source to check completeness
5. **Find Orphans**: NOT EXISTS check against config's enabled sources list
6. **Cleanup Orphans**: DELETE WHERE source not in active config

### EDGE_CASES
1. **Empty/Null Values**: Filtered with `WHERE column IS NOT NULL AND TRIM(column) != ''`
2. **Duplicate Values Across Sources**: Shared by hash (value_hash unique constraint)
3. **API Rate Limits**: Exponential backoff with batch size reduction and resume capability
4. **Partial Failures**: Transactional per-batch inserts with checkpoint-based resume
5. **Schema Changes**: Config validation checks table/column existence before sync
6. **Hash Collisions**: ON CONFLICT DO UPDATE handles (theoretical only with SHA-256)
7. **Token Limits**: Pre-check with tiktoken, truncate or skip values exceeding limits
8. **Model Versions**: Config-driven model names with optional version tracking column
9. **Cost Control**: Dry-run mode, confirmation prompts, and batch limits
10. **Concurrent Runs**: PostgreSQL advisory locks prevent simultaneous execution
11. **Empty Source Tables**: Skip with warning, preserve existing embeddings
12. **Connection Loss**: Transaction rollback with reconnect and resume logic
