# Task 007: UMAP Coordinates and TSV Export

## What
Create a Python script (using uv for isolation) that:
1. Reads embeddings from embedding_cache
2. Runs UMAP dimensionality reduction (2D and 3D)
3. Updates embedding_cache with UMAP coordinates
4. Exports TSV files for TensorFlow Projector visualization

## Why
- UMAP provides meaningful 2D/3D visualization of embedding relationships
- TSV files are needed for the TensorFlow Projector tool currently in use
- Coordinates stored in DB enable future in-app visualization
- Python required for umap-learn library (no TS equivalent)

## Files to Touch
| File | Action |
|------|--------|
| `/scripts/embeddings/pyproject.toml` | CREATE - uv project config |
| `/scripts/embeddings/umap-reduce.py` | CREATE - UMAP script |
| `/scripts/embeddings/tsv_export/` | CREATE - Output directory |

## Design

### Directory Structure
```
scripts/embeddings/
├── pyproject.toml          # Python deps via uv
├── umap-reduce.py          # Main UMAP script
└── tsv_export/
    ├── embeddings.tsv      # Embedding vectors (tab-separated)
    ├── metadata.tsv        # Labels and source info
    └── config.json         # TensorFlow Projector config
```

### pyproject.toml
```toml
[project]
name = "zebra-embeddings-umap"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "numpy>=1.26.0",
    "umap-learn>=0.5.5",
    "psycopg2-binary>=2.9.9",
    "python-dotenv>=1.0.0",
]

[tool.uv]
dev-dependencies = []
```

### UMAP Parameters (matching existing pipeline)
```python
UMAP_PARAMS = {
    "n_neighbors": 20,
    "min_dist": 0.1,
    "metric": "cosine",
    "random_state": 42,
}

# Generate both 2D and 3D
DIMENSIONS = [2, 3]
```

### Algorithm
```
1. CONNECT to Neon database
2. FETCH all embeddings with embedding_small (1536d vectors)
3. CONVERT to numpy array
4. FOR each dimension (2, 3):
   a. RUN UMAP reduction
   b. UPDATE embedding_cache with coordinates
5. EXPORT TSV files:
   a. embeddings.tsv - raw vectors or UMAP coords
   b. metadata.tsv - value, source_table, source_column
   c. config.json - projector configuration
```

### TSV Export Format

**embeddings.tsv** (tab-separated, no header):
```
0.123\t0.456\t0.789\t...  (1536 values per row OR UMAP 2D/3D coords)
0.234\t0.567\t0.890\t...
```

**metadata.tsv** (tab-separated, with header):
```
value\tsource_table\tsource_column\tumap_x_2d\tumap_y_2d
Camera\tconfig_option\tdescription\t1.234\t-0.567
Display\tconfig_option\tdescription\t2.345\t0.123
```

### Usage
```bash
cd scripts/embeddings
uv sync                    # Install Python deps
uv run umap-reduce.py      # Run UMAP + export

# Options:
uv run umap-reduce.py --export-only    # Skip UMAP, just export TSV
uv run umap-reduce.py --dimensions 2   # Only 2D UMAP
```

## Suggested Tools

| Tool | Purpose |
|------|---------|
| mcp__filesystem-with-morph__edit_file | Create Python files |
| Bash | Run `uv sync` and `uv run umap-reduce.py` |
| mcp__Neon__run_sql | Verify UMAP coordinates in DB |
| Read | Check TSV output files |

## Acceptance Criteria & Proof

| Criterion (WHAT) | Proof (HOW) | Expected |
|------------------|-------------|----------|
| uv project initializes | `uv sync` | Dependencies installed |
| Script runs without error | `uv run umap-reduce.py` | Completes successfully |
| 2D coordinates generated | Query `SELECT umap_x_2d, umap_y_2d FROM embedding_cache LIMIT 5` | Non-null values |
| 3D coordinates generated | Query `SELECT umap_x_3d, umap_y_3d, umap_z_3d FROM embedding_cache LIMIT 5` | Non-null values |
| embeddings.tsv created | Check `scripts/embeddings/tsv_export/` | File exists with correct format |
| metadata.tsv created | Check file contents | Headers + data present |
| TensorFlow Projector works | Load files into projector | Visualization renders |

## Dependencies
- Task 006 complete (embeddings exist in embedding_cache)
- `DATABASE_URL` environment variable
- Python 3.11+ installed
- uv package manager installed
