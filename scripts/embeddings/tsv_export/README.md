# TSV Export - UMAP Embeddings

This directory contains UMAP-reduced embeddings exported from the `embedding_cache` table.

## Files

- **embeddings_2d.tsv**: 2D UMAP coordinates (1276 rows)
- **embeddings_3d.tsv**: 3D UMAP coordinates (1276 rows)
- **metadata.tsv**: Metadata for each embedding (value, source_table, source_column, usage_count)

## UMAP Parameters

All embeddings were reduced using UMAP with these parameters:
- **n_neighbors**: 20 (balance local vs global structure)
- **min_dist**: 0.1 (minimum distance between points)
- **metric**: cosine (appropriate for embeddings)
- **random_state**: 42 (reproducibility)

## Data Source

- **Original dimension**: 1536d (OpenAI text-embedding-3-small)
- **Reduced dimensions**: 2D and 3D
- **Database**: Neon PostgreSQL (still-snow-60472291)
- **Table**: embedding_cache
- **Total embeddings**: 1276

## Visualization

Use TensorFlow Projector to visualize:

1. Open https://projector.tensorflow.org/
2. Click "Load"
3. Upload files:
   - **Load data**: `embeddings_2d.tsv` or `embeddings_3d.tsv`
   - **Load metadata**: `metadata.tsv`
4. Explore the visualization

## Regenerating

To regenerate these files:

```bash
cd /Users/johncurtis/projects/zebra-h2b-audit-v2/scripts/embeddings
uv run umap-reduce.py
```

## File Formats

### embeddings_2d.tsv / embeddings_3d.tsv
Tab-separated coordinates with no header:
```
3.211718	10.332922
2.868975	10.958860
```

### metadata.tsv
Tab-separated metadata with header:
```
value	source_table	source_column	usage_count
Bluetooth 4.0	config_option	description	1
```

---

Generated: 2025-12-09
UMAP Parameters: n_neighbors=20, min_dist=0.1, metric=cosine, random_state=42
Total Embeddings: 1276
