# Task 006: Generate HTB Attribute Embeddings

## What
Create a runner script that uses the embedding sync infrastructure to generate embeddings specifically for HTB attribute names (Column A from the XLSX).

## Why
Enable semantic similarity matching between:
- HTB attribute names and existing component types
- HTB attributes and Zebra-provided attributes
- Cross-reference for attribute standardization

## Files to Touch
| File | Action |
|------|--------|
| `/scripts/embeddings/generate-htb-embeddings.ts` | CREATE |

## Design

### Script Implementation
```typescript
#!/usr/bin/env bun
/**
 * Generate embeddings for HTB attribute names
 *
 * Run after Task 004 (import HTB data) completes.
 * Uses the generic sync-embeddings infrastructure.
 */

import { syncEmbeddings } from "./sync-embeddings";
import type { EmbeddingConfig } from "./config";

const HTB_CONFIG: EmbeddingConfig = {
  model: "text-embedding-3-small",
  batchSize: 50,
  concurrency: 1,
  skipExisting: true,
  sources: [
    {
      name: "HTB Attribute Names",
      table: "htb_attribute_mapping_zebra_provided",
      column: "attribute_name_for_htb",
      idColumn: "id",
    },
  ],
};

async function main() {
  console.log("Generating embeddings for HTB attribute names...\n");

  const stats = await syncEmbeddings(HTB_CONFIG);

  console.log("\nSummary:");
  console.log(`  Total values: ${stats.total}`);
  console.log(`  Already embedded: ${stats.skipped}`);
  console.log(`  Newly embedded: ${stats.embedded}`);
  console.log(`  Errors: ${stats.errors}`);

  if (stats.errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
```

### Usage
```bash
cd scripts/embeddings
bun install
export OPENAI_API_KEY="sk-..."
export DATABASE_URL="postgresql://..."
bun run sync:htb
```

## Suggested Tools

| Tool | Purpose |
|------|---------|
| mcp__filesystem-with-morph__edit_file | Create HTB runner script |
| Bash | Run `bun run sync:htb` |
| mcp__Neon__run_sql | Verify embeddings with query below |

### Verification Query
```sql
SELECT
  COUNT(*) as count,
  source_table,
  source_column
FROM embedding_cache
WHERE source_table = 'htb_attribute_mapping_zebra_provided'
GROUP BY source_table, source_column;
```

### Similarity Test Query
```sql
-- Find HTB attributes similar to existing component types
SELECT
  ec1.value as htb_attribute,
  ec2.value as component_type,
  ROUND((1 - (ec1.embedding_small <=> ec2.embedding_small)) * 100, 1) as similarity_pct
FROM embedding_cache ec1
JOIN embedding_cache ec2 ON ec2.source_column = 'attribute_label'
WHERE ec1.source_table = 'htb_attribute_mapping_zebra_provided'
  AND (1 - (ec1.embedding_small <=> ec2.embedding_small)) > 0.8
ORDER BY similarity_pct DESC
LIMIT 20;
```

## Acceptance Criteria & Proof

| Criterion (WHAT) | Proof (HOW) | Expected |
|------------------|-------------|----------|
| Script runs | `bun run sync:htb` | Completes without error |
| Embeddings created | Run verification query above | Count = ~100 (unique HTB attributes) |
| Source tracking correct | Check `source_table` column | `htb_attribute_mapping_zebra_provided` |
| Idempotent | Re-run script | Reports "Already embedded" |
| Similarity works | Run similarity test query | Returns matching rows with percentages |

## Dependencies
- Task 004 (HTB data imported to database)
- Task 005 (sync infrastructure created)
- OpenAI API key available
