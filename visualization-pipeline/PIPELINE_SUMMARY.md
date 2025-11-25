# UMAP Pipeline Execution Summary

## Overview

Successfully processed **ALL 3,474 embeddings** from the database and created separate TSV exports for different data types.

## Execution Timeline

### Step 1: Database Discovery
- **Script**: `00_discover_database.py`
- **Result**: Discovered 3,474 total embeddings (significantly more than the original 452)

### Step 2: Embedding Extraction
- **Script**: `01_extract_embeddings.py`
- **Duration**: ~2 seconds
- **Result**: Extracted 3,474 embeddings (1536d vectors, 20.36 MB)

### Step 3: UMAP Dimensionality Reduction
- **Script**: `02_reduce_with_umap.py`
- **Duration**: 27.9 seconds total
  - 2D reduction: 13.32 seconds
  - 3D reduction: 11.27 seconds
- **Parameters**:
  - n_neighbors: 20
  - min_dist: 0.1
  - metric: cosine
  - random_state: 42
- **Result**: Generated 2D and 3D coordinates for all 3,474 embeddings

### Step 4: Database Update
- **Script**: `03_update_database.py`
- **Duration**: ~2 minutes
- **Result**: Updated all 3,474 rows in database with UMAP coordinates
- **Verification**: 100% success rate (3474/3474 rows updated)

### Step 5: Filtered TSV Export
- **Script**: `05_export_by_type.py`
- **Duration**: <5 seconds
- **Result**: Created separate exports for each data type

## Database State

### Before Pipeline
- Total rows: 3,474
- With embeddings: 3,474
- With UMAP coordinates: 0

### After Pipeline
- Total rows: 3,474
- With embeddings: 3,474
- With UMAP 2D coordinates: 3,474 ✓
- With UMAP 3D coordinates: 3,474 ✓

## Data Breakdown by Type

### 1. Attribute Labels
- **Source**: `config_position.attribute_label`
- **Count**: 452 embeddings
- **Examples**:
  - Camera
  - Color
  - BCR
  - Bluetooth
  - Compact Flash

### 2. Descriptions
- **Source**: `config_option.description`
- **Count**: 3,022 embeddings
- **Examples**:
  - "MobiControl, OTT and Naurtech (MC Load only – No License)"
  - "Multi-Operator, HSPA+/LTE (America's excluding US)"
  - "FFC - 8MP_ RFC - 16MP With OIS_ Time Of Flight"

## Export Structure

```
/Users/johncurtis/projects/zebra-h2b-audit-v2/visualization-pipeline/tsv_export/
├── attribute_labels/
│   ├── vectors_2d.tsv      (8.5 KB,  452 rows)
│   ├── vectors_3d.tsv      (13 KB,   452 rows)
│   ├── metadata.tsv        (22 KB,   452 rows + header)
│   └── README.md           (1.8 KB)
└── descriptions/
    ├── vectors_2d.tsv      (56 KB,   3,022 rows)
    ├── vectors_3d.tsv      (84 KB,   3,022 rows)
    ├── metadata.tsv        (170 KB,  3,022 rows + header)
    └── README.md           (1.8 KB)
```

### File Sizes Summary
- **Attribute Labels Total**: 45.3 KB
- **Descriptions Total**: 311.7 KB
- **Grand Total**: 357 KB

### Row Counts
- **Attribute Labels**: 452 embeddings
- **Descriptions**: 3,022 embeddings
- **Total Processed**: 3,474 embeddings

## TSV File Formats

### vectors_2d.tsv
```
-0.097278	-3.717260
-0.758524	-0.040604
-0.558923	0.401255
```
- No header
- Tab-separated
- 6 decimal places
- Format: `x\ty`

### vectors_3d.tsv
```
10.599765	13.128089	10.546144
7.617244	10.818968	9.952645
8.461189	10.391952	10.083414
```
- No header
- Tab-separated
- 6 decimal places
- Format: `x\ty\tz`

### metadata.tsv
```
label	source_table	source_column	usage_count
/b>WAN	config_position	attribute_label	1
Accessory Attachments	config_position	attribute_label	1
```
- Has header
- Tab-separated
- Columns: label, source_table, source_column, usage_count

## Coordinate Ranges

### 2D Projection
- X range: [-6.988, 15.859]
- Y range: [-7.536, 13.453]

### 3D Projection
- X range: [-5.401, 13.339]
- Y range: [-2.119, 15.523]
- Z range: [2.279, 13.441]

## Usage Instructions

### Option 1: TensorFlow Projector (Recommended)

1. Visit https://projector.tensorflow.org/
2. Click "Load" in the top-left corner
3. For **Attribute Labels**:
   - Load data: `tsv_export/attribute_labels/vectors_2d.tsv` (or vectors_3d.tsv)
   - Load metadata: `tsv_export/attribute_labels/metadata.tsv`
4. For **Descriptions**:
   - Load data: `tsv_export/descriptions/vectors_2d.tsv` (or vectors_3d.tsv)
   - Load metadata: `tsv_export/descriptions/metadata.tsv`

### Option 2: Local TensorBoard

```bash
cd /Users/johncurtis/projects/zebra-h2b-audit-v2/visualization-pipeline/tsv_export/attribute_labels

# Create projector config
cat > projector_config.pbtxt <<EOF
embeddings {
  tensor_name: "Attribute Labels"
  tensor_path: "vectors_2d.tsv"
  metadata_path: "metadata.tsv"
}
EOF

# Install and run TensorBoard
pip install tensorboard
tensorboard --logdir=. --port=6006

# Open browser to http://localhost:6006
```

## Performance Metrics

### Total Pipeline Execution Time
- Extraction: ~2 seconds
- UMAP reduction: ~28 seconds
- Database update: ~120 seconds
- TSV export: ~5 seconds
- **Total: ~2.5 minutes** for 3,474 embeddings

### Memory Usage
- Embeddings in memory: 20.36 MB
- Peak memory during UMAP: ~150 MB (estimated)

### Throughput
- UMAP: ~124 embeddings/second
- Database updates: ~29 embeddings/second

## Verification

All steps completed successfully with 100% success rate:

- ✓ 3,474 embeddings extracted from database
- ✓ 3,474 2D UMAP coordinates computed
- ✓ 3,474 3D UMAP coordinates computed
- ✓ 3,474 database rows updated with coordinates
- ✓ 452 attribute labels exported to TSV
- ✓ 3,022 descriptions exported to TSV
- ✓ No errors or failed updates
- ✓ All file sizes reasonable and complete

## Issues Encountered

### 1. Column Naming Discovery
- **Issue**: Initial script used wrong column names (`umap_2d_x` vs `umap_x_2d`)
- **Resolution**: Fixed by inspecting database schema in `packages/db/src/schema/embeddings.ts`

### 2. Environment Path Updates
- **Issue**: Scripts referenced old environment file paths
- **Resolution**: Updated all scripts to use `apps/web/.env`

### 3. Pandas SettingWithCopyWarning
- **Issue**: Warnings during TSV export (non-critical)
- **Impact**: None - exports completed successfully
- **Note**: Can be fixed by using `.copy()` explicitly on filtered DataFrames

## Next Steps

### For Analysis
1. Load TSV files into TensorFlow Projector
2. Analyze clusters in attribute labels:
   - Look for duplicate/similar labels
   - Identify case sensitivity issues
   - Find typos and encoding errors
3. Analyze description clusters:
   - Identify semantic groups
   - Find redundant descriptions
   - Discover normalization opportunities

### For Pipeline Maintenance
1. Consider adding batch processing for databases >10k embeddings
2. Add progress bars using `tqdm` library
3. Fix pandas copy warnings in export script
4. Consider caching UMAP models for incremental updates

## Files Modified/Created

### Created
- `00_discover_database.py` - Database discovery tool
- `05_export_by_type.py` - Filtered TSV export by data type
- All TSV exports in `tsv_export/` directory

### Modified
- `01_extract_embeddings.py` - Updated environment path
- `03_update_database.py` - Updated environment path

### Unchanged
- `02_reduce_with_umap.py` - Already correct
- `04_export_tsv.py` - Not used (replaced by 05_export_by_type.py)

## Database Connection

- **Project**: still-snow-60472291
- **Database**: neondb
- **Table**: embedding_cache
- **Connection**: PostgreSQL via asyncpg
- **Environment**: `apps/web/.env`

## Generated Files

### Intermediate Files (in `data/`)
- `embeddings_1536d.npy` - Raw embeddings (20.36 MB)
- `metadata.csv` - Metadata for all embeddings
- `umap_2d.npy` - 2D coordinates
- `umap_3d.npy` - 3D coordinates
- `umap_2d_with_metadata.csv` - Combined 2D data
- `umap_3d_with_metadata.csv` - Combined 3D data

### Final Exports (in `tsv_export/`)
- See "Export Structure" section above

## Conclusion

Successfully updated the UMAP pipeline to:
- ✓ Process ALL 3,474 embeddings (not just 452)
- ✓ Update database with UMAP coordinates for every row
- ✓ Create separate TSV exports for attribute_labels and descriptions
- ✓ Organize exports in clear directory structure
- ✓ Generate comprehensive README files for each export
- ✓ Complete in under 3 minutes total execution time

The visualizations are now ready for analysis in TensorFlow Projector, with clear separation between attribute labels and descriptions for focused exploration.
