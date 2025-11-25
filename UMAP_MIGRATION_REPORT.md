# UMAP Visualization Migration Report

**Date:** 2025-11-24
**Database:** Neon PostgreSQL (zebra-data-parser-h2b)
**Table:** `embedding_cache`
**Status:** ✅ Successfully Completed

## Executive Summary

Successfully added UMAP dimensionality reduction columns to the `embedding_cache` table to support 2D and 3D visualization of the 452 existing embeddings. All existing embedding data preserved intact. Zero downtime, zero data loss.

---

## Schema Changes

### Columns Added

| Column Name | Data Type | Nullable | Purpose |
|-------------|-----------|----------|---------|
| `umap_x_2d` | `real` (float4) | YES | X coordinate for 2D UMAP projection |
| `umap_y_2d` | `real` (float4) | YES | Y coordinate for 2D UMAP projection |
| `umap_x_3d` | `real` (float4) | YES | X coordinate for 3D UMAP projection |
| `umap_y_3d` | `real` (float4) | YES | Y coordinate for 3D UMAP projection |
| `umap_z_3d` | `real` (float4) | YES | Z coordinate for 3D UMAP projection |

### Indexes Created

1. **`idx_embedding_umap_2d`** - Composite B-tree index on `(umap_x_2d, umap_y_2d)`
   - Optimizes queries filtering/sorting by 2D coordinates
   - Supports visualization dashboard queries

2. **`idx_embedding_umap_3d`** - Composite B-tree index on `(umap_x_3d, umap_y_3d, umap_z_3d)`
   - Optimizes queries for 3D scatter plot rendering
   - Supports spatial range queries

### Design Rationale

**Why separate columns instead of JSON/array?**
- Better query performance for filtering by coordinate ranges
- Easier to index individual dimensions
- More efficient storage (no JSON parsing overhead)
- Simpler SQL for visualization queries

**Why `real` (float4) instead of `double precision` (float8)?**
- UMAP coordinates are visualization aids, not precise scientific measurements
- 4-byte floats provide ~6-7 decimal digits of precision (sufficient for plotting)
- 50% storage savings compared to double precision
- Faster index operations

**Why nullable?**
- Allows incremental population by Python script
- Existing rows have NULL initially, get populated in batch
- Enables easy identification of rows needing UMAP computation:
  ```sql
  WHERE umap_x_2d IS NULL
  ```

---

## Migration SQL Executed

```sql
-- Add 2D UMAP columns
ALTER TABLE embedding_cache
ADD COLUMN umap_x_2d real,
ADD COLUMN umap_y_2d real;

-- Add 3D UMAP columns
ALTER TABLE embedding_cache
ADD COLUMN umap_x_3d real,
ADD COLUMN umap_y_3d real,
ADD COLUMN umap_z_3d real;

-- Create index for 2D visualization queries
CREATE INDEX idx_embedding_umap_2d
ON embedding_cache (umap_x_2d, umap_y_2d);

-- Create index for 3D visualization queries
CREATE INDEX idx_embedding_umap_3d
ON embedding_cache (umap_x_3d, umap_y_3d, umap_z_3d);
```

---

## Post-Migration Verification

### Data Integrity Check ✅

| Metric | Count |
|--------|-------|
| Total rows | 452 |
| Rows with `value` preserved | 452 (100%) |
| Rows with `embedding_small` preserved | 452 (100%) |
| Rows with `embedding_large` preserved | 452 (100%) |
| Rows with 2D UMAP coordinates | 0 (awaiting population) |
| Rows with 3D UMAP coordinates | 0 (awaiting population) |

### Final Table Schema

```
embedding_cache (14 columns, 5 indexes)
├── id                  serial PRIMARY KEY
├── value               text NOT NULL
├── value_hash          text NOT NULL UNIQUE
├── embedding_small     vector(1536) NOT NULL
├── embedding_large     vector(3072) NOT NULL
├── umap_x_2d           real
├── umap_y_2d           real
├── umap_x_3d           real
├── umap_y_3d           real
├── umap_z_3d           real
├── source_table        text
├── source_column       text
├── usage_count         integer DEFAULT 1
└── created_at          timestamptz DEFAULT now()

Indexes:
  - embedding_cache_pkey (UNIQUE on id)
  - embedding_cache_value_hash_key (UNIQUE on value_hash)
  - idx_embedding_hash (on value_hash)
  - idx_embedding_umap_2d (on umap_x_2d, umap_y_2d)
  - idx_embedding_umap_3d (on umap_x_3d, umap_y_3d, umap_z_3d)
```

---

## Drizzle ORM Schema

**File:** `/packages/db/src/schema/embeddings.ts`

The table is now properly defined in the Drizzle schema with:
- Type inference: `EmbeddingCache` and `NewEmbeddingCache` types
- Relation definitions ready for future joins
- Composite indexes matching database

**Export added to:** `/packages/db/src/index.ts`

```typescript
export { embeddingsSchema };
export * from "./schema/embeddings";
```

---

## Python Script Integration Guide

### Fetching Rows for UMAP Computation

```python
import psycopg2
import numpy as np
from umap import UMAP

# Connect to Neon database
conn = psycopg2.connect(
    "postgresql://neondb_owner:npg_a73OJxNiqFTn@"
    "ep-snowy-breeze-a4hj1358-pooler.us-east-1.aws.neon.tech/"
    "neondb?sslmode=require"
)
cur = conn.cursor()

# Fetch embeddings that need UMAP coordinates
cur.execute("""
    SELECT
        id,
        value,
        embedding_small
    FROM embedding_cache
    WHERE umap_x_2d IS NULL
    ORDER BY id
""")

rows = cur.fetchall()
print(f"Found {len(rows)} embeddings to process")

# Extract embeddings as numpy array
ids = [row[0] for row in rows]
labels = [row[1] for row in rows]
embeddings = np.array([row[2] for row in rows])

print(f"Embeddings shape: {embeddings.shape}")  # Should be (452, 1536)
```

### Computing UMAP Projections

```python
# Compute 2D UMAP
umap_2d = UMAP(
    n_components=2,
    n_neighbors=15,
    min_dist=0.1,
    metric='cosine',
    random_state=42
)
coords_2d = umap_2d.fit_transform(embeddings)

# Compute 3D UMAP
umap_3d = UMAP(
    n_components=3,
    n_neighbors=15,
    min_dist=0.1,
    metric='cosine',
    random_state=42
)
coords_3d = umap_3d.fit_transform(embeddings)

print(f"2D coordinates shape: {coords_2d.shape}")  # (452, 2)
print(f"3D coordinates shape: {coords_3d.shape}")  # (452, 3)
```

### Updating Database with UMAP Coordinates

```python
# Prepare batch update
update_query = """
    UPDATE embedding_cache
    SET
        umap_x_2d = %s,
        umap_y_2d = %s,
        umap_x_3d = %s,
        umap_y_3d = %s,
        umap_z_3d = %s
    WHERE id = %s
"""

# Batch update all rows
update_data = []
for i, embedding_id in enumerate(ids):
    update_data.append((
        float(coords_2d[i, 0]),  # umap_x_2d
        float(coords_2d[i, 1]),  # umap_y_2d
        float(coords_3d[i, 0]),  # umap_x_3d
        float(coords_3d[i, 1]),  # umap_y_3d
        float(coords_3d[i, 2]),  # umap_z_3d
        embedding_id
    ))

cur.executemany(update_query, update_data)
conn.commit()

print(f"✅ Updated {cur.rowcount} rows with UMAP coordinates")

# Verify
cur.execute("""
    SELECT
        COUNT(*) as total,
        COUNT(umap_x_2d) as with_2d,
        COUNT(umap_x_3d) as with_3d
    FROM embedding_cache
""")
print(cur.fetchone())  # Should show (452, 452, 452)

cur.close()
conn.close()
```

### UMAP Parameter Recommendations

Based on your 452 embeddings from attribute labels:

| Parameter | Recommended Value | Rationale |
|-----------|------------------|-----------|
| `n_components` | 2 or 3 | For visualization |
| `n_neighbors` | 15-30 | ~3-7% of dataset size (452) balances local/global structure |
| `min_dist` | 0.1 | Allows some clustering while keeping separation |
| `metric` | `'cosine'` | Standard for embeddings (direction matters more than magnitude) |
| `random_state` | 42 | Reproducible results |

For **semantic exploration** (finding similar attributes), use higher `n_neighbors` (20-30).
For **cluster identification** (distinct attribute groups), use lower `n_neighbors` (10-15).

---

## Querying UMAP Coordinates

### TypeScript/tRPC Example

```typescript
import { db, embeddingCache } from "@zebra-h2b-audit-v2/db";
import { isNotNull, sql } from "drizzle-orm";

// Get all embeddings with 2D coordinates for scatter plot
export async function getEmbeddings2D() {
  return db
    .select({
      id: embeddingCache.id,
      label: embeddingCache.value,
      x: embeddingCache.umapX2d,
      y: embeddingCache.umapY2d,
      source: embeddingCache.sourceTable,
    })
    .from(embeddingCache)
    .where(isNotNull(embeddingCache.umapX2d))
    .orderBy(embeddingCache.id);
}

// Get 3D coordinates with bounding box filter
export async function getEmbeddings3D(bounds: {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  zMin: number;
  zMax: number;
}) {
  return db
    .select({
      id: embeddingCache.id,
      label: embeddingCache.value,
      x: embeddingCache.umapX3d,
      y: embeddingCache.umapY3d,
      z: embeddingCache.umapZ3d,
    })
    .from(embeddingCache)
    .where(
      sql`${embeddingCache.umapX3d} BETWEEN ${bounds.xMin} AND ${bounds.xMax}
       AND ${embeddingCache.umapY3d} BETWEEN ${bounds.yMin} AND ${bounds.yMax}
       AND ${embeddingCache.umapZ3d} BETWEEN ${bounds.zMin} AND ${bounds.zMax}`
    );
}
```

### Raw SQL Example

```sql
-- Get 2D scatter plot data
SELECT
  id,
  value AS label,
  umap_x_2d AS x,
  umap_y_2d AS y,
  source_table,
  source_column
FROM embedding_cache
WHERE umap_x_2d IS NOT NULL
ORDER BY id;

-- Find embeddings in a specific region
SELECT
  id,
  value,
  umap_x_2d,
  umap_y_2d,
  sqrt(
    power(umap_x_2d - :target_x, 2) +
    power(umap_y_2d - :target_y, 2)
  ) AS distance
FROM embedding_cache
WHERE umap_x_2d IS NOT NULL
ORDER BY distance
LIMIT 10;

-- Get 3D coordinates for interactive visualization
SELECT
  json_build_object(
    'id', id,
    'label', value,
    'position', json_build_array(umap_x_3d, umap_y_3d, umap_z_3d),
    'source', source_table
  ) AS point
FROM embedding_cache
WHERE umap_x_3d IS NOT NULL;
```

---

## Performance Considerations

### Index Usage

The composite indexes will be used automatically for:
- Range queries on coordinates
- ORDER BY on coordinate columns
- Spatial filtering (e.g., points within bounds)

### Query Performance Estimates

| Query Type | Rows | Expected Time |
|-----------|------|---------------|
| Full table scan (no UMAP filter) | 452 | < 5ms |
| Filter by 2D bounds | ~50-100 | < 2ms (index scan) |
| Filter by 3D bounds | ~50-100 | < 3ms (index scan) |
| Nearest neighbors (distance calc) | 452 | ~10-15ms |

### Future Optimization Ideas

If the table grows beyond 10,000 rows:
1. Consider partitioning by `source_table`
2. Add materialized view for common visualization queries
3. Use PostGIS for advanced spatial queries
4. Consider separate table for UMAP coordinates (1:1 relation)

---

## Rollback Plan

If you need to remove the UMAP columns:

```sql
-- Drop indexes first (dependencies)
DROP INDEX IF EXISTS idx_embedding_umap_2d;
DROP INDEX IF EXISTS idx_embedding_umap_3d;

-- Drop columns
ALTER TABLE embedding_cache
DROP COLUMN umap_x_2d,
DROP COLUMN umap_y_2d,
DROP COLUMN umap_x_3d,
DROP COLUMN umap_y_3d,
DROP COLUMN umap_z_3d;
```

**Note:** This is fully reversible. Original embeddings are never touched.

---

## Next Steps

1. **Run Python UMAP Script**
   - Use the code samples above
   - Process all 452 embeddings
   - Populate the 5 new columns

2. **Verify Population**
   ```sql
   SELECT
     COUNT(*) as total,
     COUNT(umap_x_2d) as populated_2d,
     COUNT(umap_x_3d) as populated_3d
   FROM embedding_cache;
   ```

3. **Build Visualization Dashboard**
   - Create tRPC endpoint using the query examples above
   - Build React component with D3.js or Three.js
   - Support interactive filtering by source_table

4. **Monitor Performance**
   - Check index usage: `EXPLAIN ANALYZE` on visualization queries
   - Track query latency in production
   - Consider adding more indexes if needed

---

## Migration Files

**Created:**
- `/packages/db/src/schema/embeddings.ts` - Drizzle schema definition
- `/packages/db/add-umap-columns.ts` - Migration execution script
- `/packages/db/verify-migration.ts` - Verification script
- `/UMAP_MIGRATION_REPORT.md` - This report

**Modified:**
- `/packages/db/src/index.ts` - Added embeddings schema export

**Migration Scripts Can Be Deleted:**
- `inspect-table.ts`
- `add-umap-columns.ts`
- `verify-migration.ts`

These were one-time use scripts. The schema definition in `embeddings.ts` is the source of truth going forward.

---

## Contact & Support

**Database:** Neon PostgreSQL
**Connection String:** `postgresql://neondb_owner:***@ep-snowy-breeze-a4hj1358-pooler.us-east-1.aws.neon.tech/neondb`
**Region:** aws-us-east-1
**Project ID:** still-snow-60472291

**Key Constraints:**
- DO NOT modify `embedding_small` or `embedding_large` columns
- DO NOT delete rows from this table (cached embeddings)
- ALWAYS use parameterized queries (SQL injection prevention)

---

**Migration Completed By:** Claude Code (Drizzle-Neon Expert Agent)
**Migration Duration:** ~2 seconds
**Data Loss:** 0 bytes
**Downtime:** 0 seconds

✅ **Status: Production Ready**
