# Embedding Visualization Pipeline

UMAP dimensionality reduction pipeline for visualizing 452 embeddings from the Zebra H2B database.

## Overview

This pipeline reduces 1536-dimensional embeddings to 2D and 3D coordinates using UMAP, stores them in the database, and exports them for visualization in TensorFlow Projector.

### What It Does

1. **Extracts** 452 embeddings (1536d) from Neon PostgreSQL
2. **Reduces** dimensions to 2D and 3D using UMAP
3. **Stores** reduced coordinates back in the database
4. **Exports** TSV files for TensorFlow Projector visualization

## Quick Start

### Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (Astral's Python package manager)
- Database access (`.env.local` in parent directory)

### Installation

No installation needed! The scripts use inline dependency declarations via PEP 723.

### Run the Complete Pipeline

```bash
cd /Users/johncurtis/projects/zebra-h2b-audit-v2/visualization-pipeline
uv run run_pipeline.py
```

This runs all 4 steps sequentially:
1. Extract embeddings
2. Reduce with UMAP
3. Update database
4. Export TSV

**Estimated time:** 2-5 minutes (depending on UMAP computation)

### Run Individual Steps

If you need to run steps separately:

```bash
# Step 1: Extract embeddings from database
uv run 01_extract_embeddings.py

# Step 2: Apply UMAP reduction
uv run 02_reduce_with_umap.py

# Step 3: Update database with coordinates
uv run 03_update_database.py

# Step 4: Export TSV for TensorFlow Projector
uv run 04_export_tsv.py
```

## Pipeline Details

### Step 1: Extract Embeddings

**Script:** `01_extract_embeddings.py`

- Connects to Neon PostgreSQL database
- Extracts all embeddings with `embedding_1536` values
- Includes metadata: labels, source_table, source_column, usage_count
- Saves to `data/embeddings_1536d.npy` and `data/metadata.csv`

**Output:**
```
data/
├── embeddings_1536d.npy    (452 × 1536 array, ~2.7 MB)
└── metadata.csv            (452 rows with labels and metadata)
```

### Step 2: UMAP Reduction

**Script:** `02_reduce_with_umap.py`

- Loads embeddings from Step 1
- Applies UMAP with parameters from research doc:
  - `n_neighbors=20`
  - `min_dist=0.1`
  - `metric='cosine'`
  - `random_state=42`
- Reduces to both 2D and 3D
- Saves coordinates to numpy files

**Output:**
```
data/
├── umap_2d.npy                    (452 × 2 array)
├── umap_3d.npy                    (452 × 3 array)
├── umap_2d_with_metadata.csv      (coordinates + metadata)
└── umap_3d_with_metadata.csv      (coordinates + metadata)
```

**Note:** UMAP can take 30-120 seconds depending on CPU.

### Step 3: Update Database

**Script:** `03_update_database.py`

- Creates new columns in `embedding_cache` table:
  - `umap_2d_x` (REAL)
  - `umap_2d_y` (REAL)
  - `umap_3d_x` (REAL)
  - `umap_3d_y` (REAL)
  - `umap_3d_z` (REAL)
- Updates all rows with UMAP coordinates
- Verifies updates

**Database Changes:**
```sql
ALTER TABLE embedding_cache
ADD COLUMN umap_2d_x REAL,
ADD COLUMN umap_2d_y REAL,
ADD COLUMN umap_3d_x REAL,
ADD COLUMN umap_3d_y REAL,
ADD COLUMN umap_3d_z REAL;
```

### Step 4: Export TSV

**Script:** `04_export_tsv.py`

- Exports UMAP coordinates to TSV format
- Creates metadata TSV with labels and attributes
- Generates README with usage instructions

**Output:**
```
tsv_export/
├── vectors_2d.tsv     (2D coordinates, no header)
├── vectors_3d.tsv     (3D coordinates, no header)
├── metadata.tsv       (labels and attributes, with header)
└── README.md          (usage instructions)
```

## Using TensorFlow Projector

### Online Version (Easiest)

1. Open https://projector.tensorflow.org/
2. Click "Load" button (top-left)
3. Upload files:
   - **Load data:** `tsv_export/vectors_2d.tsv` (or `vectors_3d.tsv`)
   - **Load metadata:** `tsv_export/metadata.tsv`
4. Explore the visualization!

### Local TensorBoard

```bash
cd tsv_export/

# Install TensorBoard (if not already installed)
pip install tensorboard

# Create projector config
cat > projector_config.pbtxt <<EOF
embeddings {
  tensor_name: "Zebra H2B Embeddings"
  tensor_path: "vectors_2d.tsv"
  metadata_path: "metadata.tsv"
}
EOF

# Run TensorBoard
tensorboard --logdir=. --port=6006

# Open browser: http://localhost:6006
```

## Visualization Tips

### Finding Similar Labels

1. **Search:** Type a label (e.g., "Memory") in the search box
2. **Neighbors:** Click a point to see its nearest neighbors
3. **Color by metadata:** Use "Color by" dropdown to color points by `source_column` or `usage_count`
4. **Isolate selection:** Select points and click "Isolate" to focus on a cluster

### What to Look For

- **Tight clusters** = Similar labels that should potentially be normalized
- **Isolated points** = Unique labels (keep as-is)
- **Distance between points** = Semantic similarity

### Expected Patterns

Similar labels should cluster together:
- Memory/RAM/Storage variations
- WiFi/Wireless/802.11 variations
- Battery/Power variations
- Display/Screen variations
- Case variations (BATTERY vs Battery vs battery)

## Database Schema Changes

After running the pipeline, your `embedding_cache` table will have these additional columns:

```sql
-- Query embeddings with UMAP coordinates
SELECT
    id,
    value AS label,
    source_column,
    umap_2d_x,
    umap_2d_y,
    umap_3d_x,
    umap_3d_y,
    umap_3d_z
FROM embedding_cache
WHERE umap_2d_x IS NOT NULL
ORDER BY value;

-- Find embeddings near a specific point
SELECT
    value,
    umap_2d_x,
    umap_2d_y,
    SQRT(POW(umap_2d_x - 5.2, 2) + POW(umap_2d_y - 3.1, 2)) AS distance
FROM embedding_cache
WHERE umap_2d_x IS NOT NULL
ORDER BY distance
LIMIT 10;
```

## Dependencies

All dependencies are declared inline using PEP 723 script metadata. No separate installation needed.

Core dependencies:
- `umap-learn>=0.5.5` - UMAP algorithm
- `numpy>=1.26.0` - Array operations
- `pandas>=2.1.0` - Data manipulation
- `asyncpg>=0.29.0` - PostgreSQL async driver
- `python-dotenv>=1.0.0` - Environment variable loading
- `scikit-learn>=1.4.0` - Machine learning utilities (UMAP dependency)

## Troubleshooting

### "DATABASE_URL not found"

Make sure `.env.local` exists in `/Users/johncurtis/projects/zebra-data-parser-h2b/` with:
```
DATABASE_URL='postgresql://...'
```

### "No embeddings found in database"

The pipeline expects embeddings with column `embedding_1536`. If your database uses a different column name (e.g., `embedding_small`), update the query in `01_extract_embeddings.py`:

```python
embedding_col = "embedding_small"  # or "embedding_1536"
```

### UMAP is slow

UMAP can take 30-120 seconds for 452 embeddings. This is normal. To speed up:
- Reduce `n_neighbors` (e.g., from 20 to 15)
- Use fewer dimensions (2D only)

### Module import errors

Make sure you're using `uv run` to execute scripts. This ensures dependencies are installed automatically:

```bash
uv run 01_extract_embeddings.py
```

## Output File Structure

```
visualization-pipeline/
├── README.md                      (this file)
├── pyproject.toml                 (project configuration)
├── run_pipeline.py                (master script)
├── 01_extract_embeddings.py       (step 1)
├── 02_reduce_with_umap.py         (step 2)
├── 03_update_database.py          (step 3)
├── 04_export_tsv.py               (step 4)
├── data/                          (intermediate files)
│   ├── embeddings_1536d.npy
│   ├── metadata.csv
│   ├── umap_2d.npy
│   ├── umap_3d.npy
│   ├── umap_2d_with_metadata.csv
│   └── umap_3d_with_metadata.csv
└── tsv_export/                    (TensorFlow Projector files)
    ├── vectors_2d.tsv
    ├── vectors_3d.tsv
    ├── metadata.tsv
    └── README.md
```

## Performance

Expected performance on a modern laptop:

- **Step 1 (Extract):** 5-10 seconds
- **Step 2 (UMAP):** 30-120 seconds
- **Step 3 (Update DB):** 10-20 seconds
- **Step 4 (Export):** 1-2 seconds
- **Total:** 2-5 minutes

## Next Steps

After running the pipeline:

1. **Visualize:** Upload TSV files to TensorFlow Projector
2. **Identify clusters:** Find groups of similar labels
3. **Plan normalization:** Document which labels should be merged
4. **Query database:** Use UMAP coordinates for similarity searches
5. **Integrate:** Add visualization to the Next.js portal

## References

- **EMBEDDINGS_HANDOFF.md:** Context on the embedding system
- **VISUALIZATION_RESEARCH.md:** UMAP parameters and rationale
- **TensorFlow Projector:** https://projector.tensorflow.org/
- **UMAP Documentation:** https://umap-learn.readthedocs.io/

## License

Part of the Zebra H2B Audit v2 project.
