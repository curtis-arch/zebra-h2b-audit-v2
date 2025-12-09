# UMAP Dimensionality Reduction

This directory contains scripts for generating UMAP coordinates from embeddings stored in the `embedding_cache` table.

## Overview

The `umap-reduce.py` script:
1. Fetches all `embedding_small` (1536d) vectors from the database
2. Reduces them to 2D and 3D using UMAP
3. Updates the database with UMAP coordinates
4. Exports TSV files for visualization in TensorFlow Projector

## Setup

Install dependencies using uv:

```bash
cd /Users/johncurtis/projects/zebra-h2b-audit-v2/scripts/embeddings
uv sync
```

Dependencies:
- numpy>=1.26
- umap-learn>=0.5.5
- psycopg2-binary>=2.9
- python-dotenv>=1.0

## Usage

Run the UMAP reduction script:

```bash
uv run umap-reduce.py
```

The script will:
1. Connect to Neon PostgreSQL using `DATABASE_URL` from `.env.local`
2. Add UMAP columns to `embedding_cache` if they don't exist
3. Fetch all embeddings with `embedding_small` populated
4. Run UMAP reduction for 2D and 3D
5. Update database with UMAP coordinates
6. Export TSV files to `tsv_export/` directory

## UMAP Parameters

All reductions use these parameters:
- **n_neighbors**: 20 (balance local vs global structure)
- **min_dist**: 0.1 (minimum distance between points)
- **metric**: cosine (appropriate for embeddings)
- **random_state**: 42 (reproducibility)

## Database Schema

The script adds these columns to `embedding_cache`:

| Column | Type | Description |
|--------|------|-------------|
| umap_x_2d | DOUBLE PRECISION | 2D X coordinate |
| umap_y_2d | DOUBLE PRECISION | 2D Y coordinate |
| umap_x_3d | DOUBLE PRECISION | 3D X coordinate |
| umap_y_3d | DOUBLE PRECISION | 3D Y coordinate |
| umap_z_3d | DOUBLE PRECISION | 3D Z coordinate |

## Output Files

The script creates three TSV files in `tsv_export/`:

1. **embeddings_2d.tsv**: 2D UMAP coordinates (no header)
   ```
   3.211718	10.332922
   2.868975	10.958860
   ```

2. **embeddings_3d.tsv**: 3D UMAP coordinates (no header)
   ```
   3.211718	10.332922	5.142857
   2.868975	10.958860	4.837261
   ```

3. **metadata.tsv**: Metadata for each embedding (with header)
   ```
   value	source_table	source_column	usage_count
   Bluetooth 4.0	config_option	description	1
   ```

## Verification

Verify UMAP coordinates were written to the database:

```bash
bun run verify-umap.ts
```

This will show:
- Total count of records with UMAP coordinates
- Sample records with their 2D and 3D coordinates

## Visualization

Use the exported TSV files with TensorFlow Projector:

1. Open https://projector.tensorflow.org/
2. Click "Load"
3. Upload files:
   - **Load data**: `tsv_export/embeddings_2d.tsv` or `tsv_export/embeddings_3d.tsv`
   - **Load metadata**: `tsv_export/metadata.tsv`
4. Explore the visualization

See `tsv_export/README.md` for detailed visualization instructions.

## Performance

- **Input**: 1536-dimensional embeddings (OpenAI text-embedding-3-small)
- **Output**: 2D and 3D UMAP coordinates
- **Processing time**: ~30 seconds for 1276 embeddings
- **Database updates**: Batched updates (100 rows at a time)

## Files

- **pyproject.toml**: Python dependencies (uv format)
- **umap-reduce.py**: Main UMAP reduction script
- **verify-umap.ts**: Database verification script (Bun)
- **tsv_export/**: Output directory for TSV files
  - embeddings_2d.tsv
  - embeddings_3d.tsv
  - metadata.tsv
  - README.md

## Troubleshooting

### "DATABASE_URL not found"
Ensure `.env.local` exists in the project root and contains:
```
DATABASE_URL="postgresql://..."
```

### "No embeddings found"
Run the embedding sync script first:
```bash
bun run sync-embeddings.ts
```

### "UMAP columns already exist"
This is normal. The script checks for existing columns before adding them.

## Related Scripts

- **sync-embeddings.ts**: Sync embeddings from source tables to `embedding_cache`
- **verify-htb-embeddings.ts**: Verify HTB attribute embeddings
- **config.ts**: Embedding configuration types

---

Generated: 2025-12-09
BEADS Task: zebra-h2b-audit-v2-wxr.7
Total Embeddings Processed: 1276
