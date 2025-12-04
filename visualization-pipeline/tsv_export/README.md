# Zebra H2B Embeddings - TSV Exports

This directory contains embeddings exported by data type for visualization in TensorFlow Projector.

## Data Types

This export separates the embeddings into two distinct types:

### 1. Attribute Labels (452 embeddings)
**Location**: `attribute_labels/`

Labels from the `config_position.attribute_label` column, representing configuration attribute names like:
- Camera
- Color
- BCR
- Bluetooth
- Display

**Use Cases**:
- Identify duplicate/similar attribute names
- Find case sensitivity issues (e.g., "BATTERY" vs "Battery")
- Discover typos and encoding errors
- Group semantically related attributes

### 2. Descriptions (3,022 embeddings)
**Location**: `descriptions/`

Descriptions from the `config_option.description` column, representing detailed configuration descriptions like:
- "Multi-Operator, HSPA+/LTE (America's excluding US)"
- "FFC - 8MP_ RFC - 16MP With OIS_ Time Of Flight"
- "External Antenna Ready, 2.4 + 5 GHz"

**Use Cases**:
- Find redundant or near-duplicate descriptions
- Identify semantic groups for normalization
- Discover inconsistent formatting
- Detect abbreviation variations

## Directory Structure

```
tsv_export/
├── README.md                      (this file)
├── attribute_labels/
│   ├── vectors_2d.tsv            (452 2D coordinates)
│   ├── vectors_3d.tsv            (452 3D coordinates)
│   ├── metadata.tsv              (labels and attributes)
│   └── README.md                 (detailed usage guide)
└── descriptions/
    ├── vectors_2d.tsv            (3,022 2D coordinates)
    ├── vectors_3d.tsv            (3,022 3D coordinates)
    ├── metadata.tsv              (labels and attributes)
    └── README.md                 (detailed usage guide)
```

## Quick Start

### Visualize Attribute Labels

1. Open https://projector.tensorflow.org/
2. Click "Load"
3. Upload files:
   - **Load data**: `attribute_labels/vectors_2d.tsv`
   - **Load metadata**: `attribute_labels/metadata.tsv`
4. Explore the visualization

### Visualize Descriptions

1. Open https://projector.tensorflow.org/
2. Click "Load"
3. Upload files:
   - **Load data**: `descriptions/vectors_2d.tsv`
   - **Load metadata**: `descriptions/metadata.tsv`
4. Explore the visualization

## File Formats

### vectors_2d.tsv / vectors_3d.tsv
Tab-separated coordinates with no header:
```
-0.097278	-3.717260
-0.758524	-0.040604
```

### metadata.tsv
Tab-separated metadata with header:
```
label	source_table	source_column	usage_count
Camera	config_position	attribute_label	2
```

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
- **Total embeddings**: 3,474
  - Attribute labels: 452
  - Descriptions: 3,022

## Visualization Tips

### Finding Similar Items
1. Use the **Search** box to highlight specific labels
2. Click on a point to see its **nearest neighbors**
3. Similar items should cluster together spatially

### Coloring by Metadata
- Color by **usage_count** to see frequently used labels
- Color by **source_table** to distinguish data types
- Color by **source_column** for fine-grained filtering

### Isolating Clusters
1. Use the lasso tool to select multiple points
2. Click "Isolate selection" to focus on that cluster
3. Analyze labels within the cluster for patterns

### Expected Patterns

Look for these clustering patterns:

**Attribute Labels**:
- Memory/RAM/Storage variations should cluster
- WiFi/Wireless/802.11 variations should cluster
- Battery/Power variations should cluster
- Display/Screen variations should cluster

**Descriptions**:
- Similar hardware specs should cluster
- Carrier/network descriptions should cluster
- Regional variants should cluster
- Feature descriptions should cluster

## Why Separate Exports?

Attribute labels and descriptions serve different purposes:

- **Attribute labels** are short, standardized field names
- **Descriptions** are longer, more varied explanatory text

Mixing them in one visualization would:
- Make clusters harder to interpret
- Obscure type-specific patterns
- Reduce the effectiveness of analysis

By separating them, you can:
- Focus analysis on each data type independently
- Find patterns specific to labels vs descriptions
- Make better normalization decisions per type

## Analysis Goals

### For Attribute Labels
- [ ] Identify exact duplicates (different IDs, same text)
- [ ] Find case variations (CAMERA vs Camera vs camera)
- [ ] Discover typos and encoding issues
- [ ] Group semantically equivalent labels
- [ ] Standardize abbreviations

### For Descriptions
- [ ] Find redundant descriptions
- [ ] Identify inconsistent formatting
- [ ] Group similar hardware configurations
- [ ] Standardize carrier/network descriptions
- [ ] Normalize regional variants

## Regenerating Exports

To regenerate these exports after updating embeddings:

```bash
cd /Users/johncurtis/projects/zebra-h2b-audit-v2/visualization-pipeline

# Run full pipeline
uv run 01_extract_embeddings.py   # Extract from database
uv run 02_reduce_with_umap.py     # Run UMAP
uv run 03_update_database.py      # Update database
uv run 05_export_by_type.py       # Export by type

# Or discover current state
uv run 00_discover_database.py    # Check what's in database
```

## Additional Resources

- **TensorFlow Projector**: https://projector.tensorflow.org/
- **UMAP Documentation**: https://umap-learn.readthedocs.io/
- **Pipeline Summary**: See `PIPELINE_SUMMARY.md` in parent directory

## Support

Each subdirectory (`attribute_labels/`, `descriptions/`) contains its own `README.md` with detailed usage instructions specific to that data type.

---

Generated: 2025-11-24
Pipeline Version: 1.0
Total Embeddings: 3,474 (452 labels + 3,022 descriptions)
