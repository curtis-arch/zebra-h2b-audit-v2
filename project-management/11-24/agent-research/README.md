# Database Schema & Vector Embeddings Investigation Results

## Overview

This directory contains a comprehensive investigation of the zebra-h2b-audit-v2 project's database schema and vector embedding system.

## Documents Included

### 1. **database-schema.md** (30 KB, 976 lines)
**Complete technical reference** - Read this for in-depth understanding

**Contents:**
- Executive summary with key statistics
- Neon database connection details (verified credentials)
- Core table definitions (8 tables, 289-6,981 records)
- **embedding_cache** structure and statistics (452 embeddings, 100% UMAP populated)
- **config_option_component** semantic extraction (3,426 components, 170 types)
- Vector embedding system (OpenAI dual dimensions: 1536d + 3072d)
- UMAP pipeline with detailed scripts (4-stage: extract → reduce → update → export)
- TypeScript/Drizzle ORM query patterns
- 12 SQL visualization queries
- Complete entity relationship diagram
- Embedding statistics and characteristics
- Semantic component analysis with data quality assessment
- Vector search capabilities and potential enhancements
- API endpoint documentation
- Development notes and setup instructions
- File locations and resource references

### 2. **QUICK-REFERENCE.md** (4.4 KB, 153 lines)
**Fast lookup guide** - Bookmark this for common tasks

**Contents:**
- Core numbers at a glance
- Key tables with record counts
- UMAP coordinate ranges
- Component type distribution (top 10)
- Database connection parameters
- Pipeline script workflow
- SQL query examples
- TypeScript query example
- Known data quality issues
- Future enhancements list
- File location shortcuts

### 3. **terminology-clarification.md** (18 KB, 542 lines)
**Glossary and concepts** - Read when encountering unfamiliar terms

### 4. **web-ui-structure.md** (24 KB, 848 lines)
**Frontend architecture** - Read for UI implementation details

---

## Key Findings

### Database Scale
- **452 embeddings** from attribute labels
- **3,426 semantic components** (170 types)
- **289 configuration files** analyzed
- **2,647 SKU positions** with metadata
- **6,981 configuration options** available
- **11 MB total** database footprint

### Embedding System
- ✅ **100% complete** - All 452 labels have embeddings
- ✅ **Dual dimensions** - 1536d (small) + 3072d (large)
- ✅ **UMAP processed** - 2D and 3D coordinates computed and stored
- ✅ **Fully indexed** - Dedicated indexes for visualization queries
- OpenAI text-embedding-3 models used
- Cosine metric UMAP (n_neighbors=20, min_dist=0.1)

### Component Extraction
- **170 types** of semantic components extracted from descriptions
- **Top categories:** Control Panel (605), Data Capture (184), Base (173)
- **Data quality issues:** Some type naming inconsistencies, encoding variations
- Stores raw values with sequence positions for reconstruction

### Architecture Highlights
- **Drizzle ORM** for type-safe TypeScript database access
- **Neon serverless** PostgreSQL with edge compatibility
- **TRPC API** with type-safe endpoints
- **4-stage pipeline:** Extract → Reduce → Update → Export
- **12 SQL queries** pre-built for common visualization tasks

---

## Database Connection (Verified)

```
Project:    still-snow-60472291 (zebra-data-parser-h2b)
Database:   neondb
Branch:     br-tiny-pond-a4x4aleg (production)
PostgreSQL: Version 17
Region:     aws-us-east-1
ORM:        Drizzle + @neondatabase/serverless
```

**All credentials verified live from Neon.**

---

## Quick Start: Common Tasks

### Check Embedding Status
```sql
SELECT COUNT(*) as total, COUNT(umap_x_2d) as with_2d
FROM embedding_cache;
-- Result: 452 total, 452 with 2D coordinates (100%)
```

### Query Embeddings with Coordinates
```typescript
import { db, embeddingCache, isNotNull } from "@zebra-h2b-audit-v2/db";

const embeddings = await db
  .select({
    id: embeddingCache.id,
    label: embeddingCache.value,
    x: embeddingCache.umapX2d,
    y: embeddingCache.umapY2d,
  })
  .from(embeddingCache)
  .where(isNotNull(embeddingCache.umapX2d));
```

### Find Component Statistics
```sql
SELECT component_type, COUNT(*) as count
FROM config_option_component
WHERE component_type IS NOT NULL
GROUP BY component_type
ORDER BY count DESC
LIMIT 10;
```

### Run Full Embedding Pipeline
```bash
cd /Users/johncurtis/projects/zebra-h2b-audit-v2
uv run visualization-pipeline/run_pipeline.py
```

---

## Investigation Methodology

This investigation was conducted at the **"very thorough" exploration level**, including:

1. ✅ Database schema definitions located in TypeScript Drizzle schemas
2. ✅ Vector embedding table structure analyzed and queried
3. ✅ Embedding computation pipeline documented (4-stage process)
4. ✅ Component extraction system understood (semantic types mapped)
5. ✅ Vector search implementations identified (UMAP-based visualization)
6. ✅ Database connection code examined (Neon HTTP + Drizzle ORM)
7. ✅ Live database queries executed to verify all statistics
8. ✅ API router patterns analyzed (TRPC endpoints)
9. ✅ Data quality assessment performed (170 component types, identified issues)
10. ✅ Future enhancement opportunities cataloged

---

## Data Quality Notes

**Issues identified:**
- Component types have naming variations (170 unique values)
- Some encoding issues ("Add\u00fdl" instead of "Addi'l")
- Typos present ("Disaply" instead of "Display", 1 instance)
- Blank/placeholder values ("BLANK COLUMN", 3 instances)

**Strengths:**
- 100% embedding coverage (no missing embeddings)
- Consistent UMAP coordinate population
- Proper indexing for visualization queries
- Maintainable schema with foreign key constraints

---

## Recommended Next Steps

1. **Normalize component types** - Map 170 variations to canonical types
2. **Implement semantic search** - Use embeddings for natural language queries
3. **Add visualization components** - Build interactive 2D/3D scatter plots
4. **Support incremental updates** - Handle new embeddings without full UMAP recompute
5. **pgvector operators** - Use native PostgreSQL distance operators
6. **Parse flat-spec CSV** - Extend to 8 files not yet supported

---

## Files & Resources

| Location | Purpose |
|----------|---------|
| `/packages/db/src/schema/embeddings.ts` | EmbeddingCache table definition |
| `/packages/db/src/schema/zebra.ts` | Config tables (file, position, option, component) |
| `/packages/db/sql/umap-queries.sql` | 12 visualization SQL queries |
| `/visualization-pipeline/` | 4-stage embedding pipeline scripts |
| `/packages/api/src/routers/` | TRPC API endpoints |

---

## Questions Answered

### 1. Database Schema & Migrations?
✅ Found: Drizzle ORM schemas (TypeScript-first) with 8 tables

### 2. Vector Embedding Table Structure?
✅ Found: `embedding_cache` table with 1536d + 3072d vectors + UMAP coordinates

### 3. Where Embeddings Computed/Stored?
✅ Found: OpenAI API → PostgreSQL → Python UMAP pipeline → database

### 4. What Data is Embedded?
✅ Found: 452 attribute labels from SKU position definitions

### 5. Vector Search Implementations?
✅ Found: UMAP-based coordinates + 12 SQL visualization queries

### 6. Database Connection Code?
✅ Found: Neon HTTP API + Drizzle ORM in `packages/db/src/index.ts`

---

## Document Map

```
README.md (this file)
├── database-schema.md (full technical reference)
│   ├── Tables 1-6 detailed definitions
│   ├── Embedding workflow and statistics
│   ├── UMAP computation and parameters
│   ├── Query patterns and API endpoints
│   └── Development notes
├── QUICK-REFERENCE.md (fast lookup)
│   ├── Core numbers and key fields
│   ├── Code examples
│   └── Quick SQL queries
├── terminology-clarification.md (glossary)
│   └── Definitions of project-specific terms
└── web-ui-structure.md (frontend details)
    └── React component organization
```

---

**Investigation Date:** November 24, 2025  
**Database Branch:** br-tiny-pond-a4x4aleg (production)  
**PostgreSQL Version:** 17  
**Status:** ✅ Complete and verified
