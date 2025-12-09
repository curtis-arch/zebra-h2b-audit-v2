# Task 005: Config-Driven Embedding Sync Script

## What
Create a reusable, config-driven embedding sync system that:
1. Reads source table/column pairs from a JSON config file
2. Generates BOTH embedding_large (3072d) AND embedding_small (1536d)
3. Performs incremental sync: only NEW values, removes STALE, skips unchanged
4. Tracks source_table and source_column for each embedding

## Why
Need a robust tool for:
1. Initial embedding generation for new data sources
2. Incremental sync as data changes (add new, remove stale)
3. Re-embedding after model updates
4. Consistent dual-embedding strategy matching existing Python pipeline

## Files to Touch
| File | Action |
|------|--------|
| `/scripts/embeddings/package.json` | CREATE |
| `/scripts/embeddings/embedding-sources.json` | CREATE - Config file |
| `/scripts/embeddings/config.ts` | CREATE - Config types |
| `/scripts/embeddings/sync-embeddings.ts` | CREATE - Main sync script |

## Design

### Directory Structure
```
scripts/
├── embeddings/
│   ├── package.json
│   ├── embedding-sources.json    # Config: which tables/columns to embed
│   ├── config.ts                 # TypeScript types for config
│   ├── sync-embeddings.ts        # Main sync script
│   ├── generate-htb-embeddings.ts  # Task 006
│   ├── umap-reduce.py            # Task 007
│   └── tsv_export/               # Output TSV files for projector
```

### embedding-sources.json (Config File)
```json
{
  "version": "1.0",
  "models": {
    "large": "text-embedding-3-large",
    "small": "text-embedding-3-small"
  },
  "batchSize": 100,
  "sources": [
    {
      "name": "Option Descriptions",
      "table": "config_option",
      "column": "description",
      "enabled": true
    },
    {
      "name": "Attribute Labels",
      "table": "config_position",
      "column": "attribute_label",
      "enabled": true
    },
    {
      "name": "HTB Attribute Names",
      "table": "htb_attribute_mapping_zebra_provided",
      "column": "attribute_name_for_htb",
      "enabled": true
    }
  ]
}
```

### Sync Algorithm
```
1. LOAD config from embedding-sources.json
2. FOR each enabled source:
   a. GET all distinct values from source table/column
   b. HASH each value with SHA-256
   c. COMPARE with embedding_cache:
      - NEW: hash not in cache for this source -> generate
      - STALE: hash in cache but not in source -> delete
      - UNCHANGED: hash in cache and in source -> skip
3. BATCH generate embeddings for NEW values:
   - Call OpenAI with BOTH models in parallel
   - Get embedding_large (3072d) + embedding_small (1536d)
4. INSERT new embeddings with source tracking
5. DELETE stale embeddings
6. REPORT statistics
```

### Key SQL Queries

**Find NEW values needing embeddings:**
```sql
WITH source_values AS (
  SELECT DISTINCT $column AS value,
    encode(sha256(trim($column)::bytea), 'hex') AS value_hash
  FROM $table
  WHERE $column IS NOT NULL AND trim($column) != ''
)
SELECT sv.value, sv.value_hash
FROM source_values sv
LEFT JOIN embedding_cache ec
  ON ec.value_hash = sv.value_hash
  AND ec.source_table = $table
  AND ec.source_column = $column
WHERE ec.value_hash IS NULL;
```

**Find STALE values to delete:**
```sql
SELECT ec.id, ec.value_hash
FROM embedding_cache ec
WHERE ec.source_table = $table
  AND ec.source_column = $column
  AND NOT EXISTS (
    SELECT 1 FROM $table
    WHERE encode(sha256(trim($column)::bytea), 'hex') = ec.value_hash
  );
```

**Batch upsert pattern:**
```sql
INSERT INTO embedding_cache (
  value, value_hash, embedding_large, embedding_small,
  source_table, source_column, usage_count, created_at
)
SELECT
  unnest($1::text[]), unnest($2::text[]),
  unnest($3::vector[]), unnest($4::vector[]),
  $5, $6, 1, NOW()
ON CONFLICT (value_hash) DO UPDATE SET
  embedding_large = EXCLUDED.embedding_large,
  embedding_small = EXCLUDED.embedding_small,
  source_table = EXCLUDED.source_table,
  source_column = EXCLUDED.source_column,
  created_at = NOW();
```

### package.json
```json
{
  "name": "@zebra-h2b-audit-v2/embeddings",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "sync": "bun run sync-embeddings.ts",
    "sync:htb": "bun run generate-htb-embeddings.ts",
    "sync:dry-run": "bun run sync-embeddings.ts --dry-run"
  },
  "dependencies": {
    "@neondatabase/serverless": "^1.0.2",
    "openai": "^4.0.0"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

## Suggested Tools

| Tool | Purpose |
|------|---------|
| mcp__filesystem-with-morph__edit_file | Create all script files |
| mcp__context7__get-library-docs | OpenAI SDK embeddings API |
| Bash | Run `bun install` and test sync |
| mcp__Neon__run_sql | Verify embeddings in database |

## Acceptance Criteria & Proof

| Criterion (WHAT) | Proof (HOW) | Expected |
|------------------|-------------|----------|
| Config file loads | `bun run sync --dry-run` | Shows sources from config |
| NEW values detected | Run on fresh source | Reports "X new values" |
| STALE values detected | Delete row from source, re-run | Reports "X stale values" |
| Dual embeddings generated | Query `SELECT embedding_large IS NOT NULL, embedding_small IS NOT NULL` | Both true |
| Source tracking works | Query `SELECT DISTINCT source_table, source_column` | All sources listed |
| Batch processing | Check logs | Shows "Batch 1 of N" |
| Idempotent | Re-run immediately | Reports "0 new, 0 stale" |
| Statistics reported | Check output | Shows total/new/stale/errors |

## Dependencies
- `OPENAI_API_KEY` environment variable
- `DATABASE_URL` environment variable
- `embedding_cache` table exists (already present)
