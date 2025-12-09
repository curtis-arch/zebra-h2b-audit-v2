# Feature Scope: Enhanced Similarity Reports and XLSX Import

**Beads Epic:** `zebra-h2b-audit-v2-wxr`

## Overview
This feature enhances the component type similarity analysis with detailed match information and adds capability to import HTB attribute mappings from a Zebra-provided Excel file, with embeddings generation for semantic search.

## Goals
1. **Enhanced Similarity Reports**: TWO export buttons - CSV Report and JSON Report with match % and positions
2. **HTB XLSX Import**: Parse and store `HTB-attribute-mapping-zebra-provided.xlsx`
3. **Dual Embedding Generation**: Create BOTH embedding_large (3072d) AND embedding_small (1536d)
4. **Config-Driven Embedding Sync**: JSON config file defining table/column sources
5. **Incremental Sync**: Only embed NEW values, remove STALE values, skip unchanged
6. **UMAP Coordinate Generation**: Generate 2D/3D UMAP coordinates + TSV export for viz projector

## Non-Goals
- UI changes to display enhanced similarity data (export-only for now)
- Real-time embedding generation via API routes
- Automatic embedding updates on data changes (manual script run)

## Technical Approach

### Phase 1: Enhanced Export (Task 001)
- Modify `getComponentTypesWithSimilarity` SQL to capture individual match scores
- Add TWO export buttons: "Export CSV Report" and "Export JSON Report"
- CSV format: Component Type, Source Positions, Similar 1, Match 1 %, Match 1 Positions, ...
- JSON format: Full structured data with metadata for advanced analysis
- Backward-compatible: existing table UI unchanged

### Phase 2: HTB Data Import (Tasks 002-004)
- Create Drizzle schema for new table
- Write parser script using existing SheetJS pattern
- Import all columns from XLSX, focus on Column A for embeddings

### Phase 3: Embedding Infrastructure (Tasks 005-007)
- **Config file**: `scripts/embeddings/embedding-sources.json` defines all table/column pairs
- **Sync script**: Incremental sync with new/stale/unchanged detection
- **Dual embeddings**: Generate BOTH embedding_large AND embedding_small
- **UMAP script**: Python/uv for UMAP reduction (2D + 3D coordinates)
- **TSV export**: Generate TSV files for TensorFlow Projector visualization

## Current Embedding Inventory (PRESERVE)
| Source Table | Source Column | Count |
|--------------|---------------|-------|
| config_option | description | 1,020 |
| config_position | attribute_label | 183 |
| **Total** | | **1,203** |

## New Embedding Source (ADD)
| Source Table | Source Column | Est. Count |
|--------------|---------------|------------|
| htb_attribute_mapping_zebra_provided | attribute_name_for_htb | ~100 |

## Success Criteria
| Criterion | Measurement |
|-----------|-------------|
| CSV Report has match % | Download shows per-match percentages |
| CSV Report has positions | Download shows positions per match |
| JSON Report full structure | Contains nested similarMatches array |
| HTB data imported | All ~100 rows in new table |
| Dual embeddings generated | Both embedding_large AND embedding_small populated |
| Incremental sync works | Re-run only processes changes |
| UMAP coordinates generated | umap_x_2d, umap_y_2d, etc. populated |
| TSV files exported | Files ready for TensorFlow Projector |

## Key Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SQL performance with JSONB agg | Medium | Medium | Test with EXPLAIN ANALYZE |
| OpenAI rate limits | Low | Medium | Batching, exponential backoff |
| UMAP requires Python | N/A | N/A | Use uv for isolated Python env |
| Stale embedding cleanup | Low | Low | Transaction-based delete |

## Dependencies
- OpenAI API key for embedding generation
- Neon database access (project: still-snow-60472291)
- Python/uv for UMAP (umap-learn library)
- HTB XLSX file at project root
