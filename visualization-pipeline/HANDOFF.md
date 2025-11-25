# UMAP Visualization Pipeline - Complete Handoff

**Date:** November 24, 2025
**Status:** ✅ READY TO RUN
**Verification:** ✅ ALL CHECKS PASSED

---

## Quick Start (TL;DR)

```bash
cd /Users/johncurtis/projects/zebra-h2b-audit-v2/visualization-pipeline

# Verify setup
uv run verify_setup.py

# Run complete pipeline
uv run run_pipeline.py

# Expected time: 2-5 minutes
```

**After completion:**
1. Upload `tsv_export/vectors_2d.tsv` and `tsv_export/metadata.tsv` to https://projector.tensorflow.org/
2. Explore visualization to identify similar labels
3. Query database with UMAP coordinates

---

## What Was Built

### Complete UMAP Pipeline

A 4-step Python pipeline that:
1. Extracts 452 embeddings (1536d) from Neon PostgreSQL
2. Applies UMAP reduction to create 2D and 3D coordinates
3. Stores coordinates back in the database
4. Exports TSV files for TensorFlow Projector

### Files Created

```
visualization-pipeline/
├── 01_extract_embeddings.py       ✓ Extract from database
├── 02_reduce_with_umap.py         ✓ Apply UMAP reduction
├── 03_update_database.py          ✓ Store coordinates in DB
├── 04_export_tsv.py               ✓ Export for TensorFlow Projector
├── run_pipeline.py                ✓ Master orchestration
├── verify_setup.py                ✓ Pre-flight checks
├── pyproject.toml                 ✓ Dependencies
├── README.md                      ✓ Full documentation
├── IMPLEMENTATION_REPORT.md       ✓ Technical details
├── HANDOFF.md                     ✓ This file
└── .gitignore                     ✓ Ignore data/output
```

---

## Database Schema

### Existing Columns (Verified)

```sql
Table: embedding_cache

Columns:
- id                  INTEGER (primary key)
- value               TEXT (the label/text)
- value_hash          TEXT (SHA-256 hash)
- embedding_large     VECTOR(3072)
- embedding_small     VECTOR(1536)
- source_table        TEXT
- source_column       TEXT
- usage_count         INTEGER
- created_at          TIMESTAMPTZ
```

### UMAP Columns (Already Exist)

```sql
-- The database already has UMAP columns!
- umap_x_2d           REAL
- umap_y_2d           REAL
- umap_x_3d           REAL
- umap_y_3d           REAL
- umap_z_3d           REAL
```

**Note:** These columns exist but may have NULL values. The pipeline will populate them.

---

## UMAP Parameters (From Research)

Based on VISUALIZATION_RESEARCH.md:

```python
n_neighbors = 20       # Balance local vs global structure
min_dist = 0.1         # Minimum distance between points
metric = 'cosine'      # Best for embeddings
random_state = 42      # Reproducibility
```

**Rationale:**
- `n_neighbors=20`: Good balance for 452 points
- `min_dist=0.1`: Allows clusters to form without over-crowding
- `metric='cosine'`: Standard for semantic embeddings
- `random_state=42`: Ensures reproducible results

---

## Step-by-Step Execution

### Pre-Flight Check

```bash
cd /Users/johncurtis/projects/zebra-h2b-audit-v2/visualization-pipeline
uv run verify_setup.py
```

**Expected output:**
```
✓ ALL CHECKS PASSED

You're ready to run the pipeline!
```

### Run Complete Pipeline (Recommended)

```bash
uv run run_pipeline.py
```

**What it does:**
- Runs all 4 steps sequentially
- Shows progress for each step
- Handles errors gracefully
- Reports timing and outputs

**Expected duration:** 2-5 minutes

**Output directories:**
```
data/                           (intermediate files)
├── embeddings_1536d.npy
├── metadata.csv
├── umap_2d.npy
├── umap_3d.npy
├── umap_2d_with_metadata.csv
└── umap_3d_with_metadata.csv

tsv_export/                     (TensorFlow Projector files)
├── vectors_2d.tsv
├── vectors_3d.tsv
├── metadata.tsv
└── README.md
```

### Run Individual Steps (Advanced)

```bash
# Step 1: Extract embeddings (5-10 seconds)
uv run 01_extract_embeddings.py

# Step 2: Apply UMAP (30-120 seconds)
uv run 02_reduce_with_umap.py

# Step 3: Update database (10-20 seconds)
uv run 03_update_database.py

# Step 4: Export TSV (1-2 seconds)
uv run 04_export_tsv.py
```

---

## Using the Visualization

### TensorFlow Projector (Online)

1. **Open:** https://projector.tensorflow.org/
2. **Load Data:**
   - Click "Load" button (top-left)
   - Select `tsv_export/vectors_2d.tsv`
3. **Load Metadata:**
   - Click "Load" button again
   - Select `tsv_export/metadata.tsv`
4. **Explore:**
   - Search for labels (e.g., "Memory")
   - Click points to see neighbors
   - Color by `source_column` or `usage_count`
   - Select clusters to identify normalization candidates

### What to Look For

**Clusters indicate similar labels:**
- Memory/RAM/Storage variations
- WiFi/Wireless/802.11 variations
- Battery/Power variations
- Display/Screen variations
- Case sensitivity issues (BATTERY vs Battery)

**Actions based on clusters:**
- **Tight clusters** (distance <0.5): Strong candidates for normalization
- **Loose clusters** (distance 0.5-1.0): Review manually
- **Isolated points**: Unique labels, keep as-is

---

## Database Queries

### Get All Embeddings with UMAP Coordinates

```sql
SELECT
    id,
    value,
    source_column,
    umap_x_2d,
    umap_y_2d,
    umap_x_3d,
    umap_y_3d,
    umap_z_3d
FROM embedding_cache
WHERE umap_x_2d IS NOT NULL
ORDER BY value;
```

### Find Nearest Neighbors in 2D Space

```sql
WITH target AS (
    SELECT umap_x_2d, umap_y_2d
    FROM embedding_cache
    WHERE value = 'Memory'
    LIMIT 1
)
SELECT
    e.value,
    SQRT(
        POW(e.umap_x_2d - t.umap_x_2d, 2) +
        POW(e.umap_y_2d - t.umap_y_2d, 2)
    ) AS distance
FROM embedding_cache e, target t
WHERE e.umap_x_2d IS NOT NULL
  AND e.value != 'Memory'
ORDER BY distance
LIMIT 10;
```

### Find All Embeddings in a Region

```sql
SELECT
    value,
    umap_x_2d,
    umap_y_2d
FROM embedding_cache
WHERE umap_x_2d IS NOT NULL
  AND umap_x_2d BETWEEN -2.0 AND -1.0
  AND umap_y_2d BETWEEN 3.0 AND 5.0
ORDER BY value;
```

---

## Dependencies

All dependencies use PEP 723 inline metadata. No separate installation needed with `uv run`.

**Core dependencies:**
- `umap-learn>=0.5.5` - UMAP algorithm
- `numpy>=1.26.0` - Array operations
- `pandas>=2.1.0` - Data manipulation
- `asyncpg>=0.29.0` - PostgreSQL async driver
- `python-dotenv>=1.0.0` - Environment variables
- `scikit-learn>=1.4.0` - ML utilities

**Total size:** ~50MB (installed automatically by uv)

---

## Troubleshooting

### Error: "DATABASE_URL not found"

**Cause:** Missing or incorrect `.env.local` file

**Solution:**
```bash
# Verify file exists
ls /Users/johncurtis/projects/zebra-data-parser-h2b/.env.local

# Should contain:
DATABASE_URL='postgresql://...'
```

### Error: "No embeddings found"

**Cause:** Database is empty or column name mismatch

**Solution:**
1. Verify embeddings exist:
   ```sql
   SELECT COUNT(*) FROM embedding_cache WHERE embedding_small IS NOT NULL;
   ```
2. If count is 0, run the embedding generation pipeline first

### UMAP is very slow (>2 minutes)

**Expected behavior:** UMAP can take 30-120 seconds for 452 points

**To speed up:** Reduce `n_neighbors` in `02_reduce_with_umap.py`:
```python
umap_params = {
    'n_neighbors': 15,    # Reduced from 20
    'min_dist': 0.1,
    'metric': 'cosine',
    'random_state': 42
}
```

### Module import errors

**Cause:** Not using `uv run`

**Solution:** Always use `uv run`:
```bash
# Wrong:
python 01_extract_embeddings.py

# Correct:
uv run 01_extract_embeddings.py
```

---

## Integration with Next.js Portal

### Phase 1: Static Visualization (Quick)

Place the generated HTML in the public directory:

```bash
# After running pipeline
cp tsv_export/README.md apps/web/public/embeddings-viz.html

# Create Next.js page
# apps/web/src/app/embeddings-viz/page.tsx
export default function EmbeddingsVizPage() {
  return (
    <iframe
      src="/embeddings-viz.html"
      className="w-full h-screen border-0"
      title="Embeddings Visualization"
    />
  );
}
```

### Phase 2: Dynamic Visualization (Future)

Create tRPC endpoint to fetch UMAP data:

```typescript
// packages/api/src/routers/embeddings.ts
import { publicProcedure, router } from '..';

export const embeddingsRouter = router({
  getUmapData: publicProcedure.query(async ({ ctx }) => {
    const embeddings = await ctx.db.query.embeddingCache.findMany({
      where: isNotNull(embeddingCache.umapX2d),
      columns: {
        id: true,
        value: true,
        umapX2d: true,
        umapY2d: true,
        sourceColumn: true,
        usageCount: true,
      },
    });

    return {
      coordinates: embeddings.map(e => [e.umapX2d, e.umapY2d]),
      metadata: embeddings.map(e => ({
        label: e.value,
        sourceColumn: e.sourceColumn,
        usageCount: e.usageCount,
      })),
    };
  }),
});
```

---

## Next Steps

### Immediate (After Running Pipeline)

1. ✅ **Run verification**: `uv run verify_setup.py`
2. ✅ **Run pipeline**: `uv run run_pipeline.py`
3. ✅ **Visualize**: Upload TSV files to TensorFlow Projector
4. ✅ **Explore**: Identify clusters of similar labels

### Short-Term (This Week)

1. **Document findings**
   - Screenshot interesting clusters
   - List normalization candidates
   - Share with team

2. **Query database**
   - Test UMAP coordinate queries
   - Find nearest neighbors for key labels

3. **Plan normalization**
   - Based on clustering results
   - Document consolidation strategy

### Medium-Term (Next Sprint)

1. **Integrate with Next.js**
   - Add static visualization page
   - Create tRPC endpoint for UMAP data

2. **Automate clustering**
   - Use DBSCAN for automatic grouping
   - Suggest normalization candidates

3. **Build normalization UI**
   - Interactive cluster merging
   - Preview impact on cohorts

---

## Success Metrics

The pipeline is successful when:

✅ **Technical Success:**
- All 452 embeddings extracted
- UMAP reduction completes without errors
- Database updated with coordinates
- TSV files generated and validated
- TensorFlow Projector displays visualization

✅ **Business Success:**
- Clusters are visible and interpretable
- Similar labels identified (e.g., Memory/RAM)
- Normalization candidates documented
- Data quality improvements quantified

---

## Support & Documentation

### Documentation Files

- **README.md** - Complete usage guide
- **IMPLEMENTATION_REPORT.md** - Technical deep dive
- **HANDOFF.md** - This file (quick reference)
- **tsv_export/README.md** - TensorFlow Projector guide

### Reference Documents

- **EMBEDDINGS_HANDOFF.md** - Embedding system overview
- **VISUALIZATION_RESEARCH.md** - UMAP parameters rationale

### Key Links

- TensorFlow Projector: https://projector.tensorflow.org/
- UMAP Documentation: https://umap-learn.readthedocs.io/
- PEP 723 (Inline Dependencies): https://peps.python.org/pep-0723/

---

## Known Limitations

1. **Single dimension only**
   - Currently processes `embedding_small` (1536d)
   - Can be adapted for `embedding_large` (3072d)

2. **No automatic clustering**
   - Manual interpretation required
   - Future: Add DBSCAN clustering script

3. **Static TSV export**
   - Files don't update automatically
   - Must re-run pipeline for new embeddings

4. **UMAP randomness**
   - Despite `random_state=42`, slight variations possible
   - Clustering patterns remain consistent

---

## Version History

- **v1.0** (Nov 24, 2025) - Initial implementation
  - 4-step pipeline
  - Database integration
  - TSV export for TensorFlow Projector
  - Comprehensive documentation

---

## Contact & Coordination

### Database Schema Changes

The pipeline uses existing UMAP columns in `embedding_cache`:
- `umap_x_2d`, `umap_y_2d` (2D coordinates)
- `umap_x_3d`, `umap_y_3d`, `umap_z_3d` (3D coordinates)

**No schema migration needed** - columns already exist.

### If Issues Arise

1. Check verification: `uv run verify_setup.py`
2. Review logs in console output
3. Check database connection in `.env.local`
4. Verify embeddings exist: `SELECT COUNT(*) FROM embedding_cache WHERE embedding_small IS NOT NULL`

---

## Final Checklist

Before running the pipeline:

- [ ] Verified `uv` is installed (`uv --version`)
- [ ] Confirmed `.env.local` exists with `DATABASE_URL`
- [ ] Ran `uv run verify_setup.py` successfully
- [ ] Have 2-5 minutes available for execution
- [ ] Ready to upload results to TensorFlow Projector

After running the pipeline:

- [ ] Verified `data/` directory created with numpy files
- [ ] Verified `tsv_export/` directory created with TSV files
- [ ] Database has UMAP coordinates populated
- [ ] Uploaded TSV files to TensorFlow Projector
- [ ] Explored visualization and identified clusters
- [ ] Documented findings and normalization candidates

---

**Status:** ✅ COMPLETE AND READY TO RUN

**Next Action:** Execute `uv run run_pipeline.py`

**Expected Result:** 452 embeddings reduced to 2D/3D, stored in database, and exported for visualization

---

**Prepared by:** Claude Code (Sonnet 4.5)
**Date:** November 24, 2025
**Version:** 1.0
