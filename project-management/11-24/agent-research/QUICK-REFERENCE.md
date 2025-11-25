# Quick Reference: Database Schema & Embeddings

## Core Numbers
- **452** embeddings (attribute labels)
- **3,426** semantic components (170 types)
- **289** configuration files
- **2,647** SKU positions
- **6,981** configuration options
- **198** grammar cohorts
- **11 MB** total database size

## Key Tables

### embedding_cache
- **Records:** 452
- **Content:** OpenAI embeddings + UMAP coordinates
- **Dimensions:** 1536d (small) + 3072d (large)
- **Status:** 100% populated with 2D and 3D UMAP coords
- **Key Fields:** value, embedding_small, embedding_large, umap_x_2d, umap_y_2d, umap_x_3d, umap_y_3d, umap_z_3d

### config_option_component
- **Records:** 3,426
- **Types:** 170 unique component_type values
- **Content:** Extracted semantic components from descriptions
- **Key Fields:** option_id, raw_value, component_type, sequence_position

### config_position
- **Records:** 2,647
- **Content:** SKU character positions with labels
- **Unique Constraint:** (file_id, position_index, normalized_label)
- **Key Fields:** file_id, position_index, attribute_label, normalized_label

### config_option
- **Records:** 6,981
- **Content:** Valid codes at each position
- **Unique Constraint:** (position_id, code)

### config_file
- **Records:** 289
- **Content:** Configuration matrix files
- **Key Fields:** base_model, product_code, spec_style, cohort_id

### config_grammar_cohort
- **Records:** 198
- **Content:** Groups of files with identical SKU structure

## UMAP Coordinates

### 2D Space
- X: [-0.85, 5.28]
- Y: [-0.56, 4.27]
- **Use:** Scatter plots, dashboards

### 3D Space
- X: [0.33, 4.11]
- Y: [0.19, 4.30]
- Z: [9.24, 12.87]
- **Use:** Interactive 3D visualizations

## Component Types (Top 10)
1. Control Panel (605)
2. Data Capture (184)
3. Base (173)
4. Channel Type (153)
5. Media Options (152)
6. Keypad (98)
7. Battery (96)
8. Family (95)
9. Keyboard Type (91)
10. Advanced Features (79)

## Database Connection
- **Project:** still-snow-60472291 (zebra-data-parser-h2b)
- **Database:** neondb
- **Branch:** br-tiny-pond-a4x4aleg (production)
- **PostgreSQL:** Version 17
- **Region:** aws-us-east-1
- **ORM:** Drizzle ORM + @neondatabase/serverless

## Pipeline Scripts
1. `01_extract_embeddings.py` - Extract from DB → numpy
2. `02_reduce_with_umap.py` - 1536d → 2D/3D coordinates
3. `03_update_database.py` - Write coordinates to DB
4. `04_export_tsv.py` - Create TensorFlow Projector files

## API Routers (TRPC)
- `/packages/api/src/routers/components.ts` - Component queries
- `/packages/api/src/routers/dashboard.ts` - KPI metrics
- `/packages/api/src/routers/products.ts` - File queries
- `/packages/api/src/routers/cohorts.ts` - Cohort queries

## SQL Query Examples

### Check embedding status
```sql
SELECT COUNT(*) as total, COUNT(umap_x_2d) as with_2d, COUNT(umap_x_3d) as with_3d
FROM embedding_cache;
```

### Find embeddings by 2D region
```sql
SELECT id, value, umap_x_2d as x, umap_y_2d as y
FROM embedding_cache
WHERE umap_x_2d BETWEEN -2 AND 2 AND umap_y_2d BETWEEN -1 AND 1;
```

### Get component statistics
```sql
SELECT component_type, COUNT(*) as count
FROM config_option_component
WHERE component_type IS NOT NULL
GROUP BY component_type
ORDER BY count DESC;
```

## TypeScript Example

```typescript
import { db, embeddingCache, isNotNull } from "@zebra-h2b-audit-v2/db";

// Query embeddings with UMAP coordinates
const embeddings = await db
  .select({
    id: embeddingCache.id,
    label: embeddingCache.value,
    x: embeddingCache.umapX2d,
    y: embeddingCache.umapY2d,
  })
  .from(embeddingCache)
  .where(isNotNull(embeddingCache.umapX2d))
  .limit(100);
```

## Known Data Quality Issues
- **Component types:** 170 variations with inconsistent naming
- **Encoding:** Some component types have special characters ("Add\u00fdl")
- **Typos:** "Disaply" instead of "Display" (1 instance)
- **Blanks:** "BLANK COLUMN" values present (3 instances)

## Future Enhancements
1. Normalize component type taxonomy
2. Implement semantic search via embeddings
3. Add pgvector similarity operators
4. Support incremental UMAP updates
5. Add cluster visualization
6. Parse flat-spec CSV files (8 files, not yet supported)

## File Locations
- Schema definitions: `/packages/db/src/schema/`
- UMAP queries: `/packages/db/sql/umap-queries.sql`
- Pipeline scripts: `/visualization-pipeline/`
- API routers: `/packages/api/src/routers/`
- Full documentation: `/project-management/11-24/agent-research/database-schema.md`
