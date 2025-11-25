-- =====================================================================
-- UMAP Visualization Queries for embedding_cache Table
-- =====================================================================
-- Created: 2025-11-24
-- Purpose: Common queries for working with UMAP-reduced embeddings
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. GET ALL 2D COORDINATES FOR SCATTER PLOT
-- ---------------------------------------------------------------------
-- Returns all embeddings with 2D UMAP coordinates
-- Use for: Initial scatter plot rendering
-- Expected rows: 452 (after UMAP population)

SELECT
    id,
    value AS label,
    umap_x_2d AS x,
    umap_y_2d AS y,
    source_table,
    source_column,
    usage_count
FROM embedding_cache
WHERE umap_x_2d IS NOT NULL
    AND umap_y_2d IS NOT NULL
ORDER BY id;

-- ---------------------------------------------------------------------
-- 2. GET ALL 3D COORDINATES FOR INTERACTIVE VISUALIZATION
-- ---------------------------------------------------------------------
-- Returns all embeddings with 3D UMAP coordinates in JSON format
-- Use for: Three.js or D3.js 3D scatter plots

SELECT
    id,
    value AS label,
    json_build_object(
        'x', umap_x_3d,
        'y', umap_y_3d,
        'z', umap_z_3d
    ) AS position,
    source_table,
    source_column
FROM embedding_cache
WHERE umap_x_3d IS NOT NULL
    AND umap_y_3d IS NOT NULL
    AND umap_z_3d IS NOT NULL
ORDER BY id;

-- ---------------------------------------------------------------------
-- 3. FIND NEAREST NEIGHBORS IN 2D SPACE
-- ---------------------------------------------------------------------
-- Find embeddings closest to a target point in 2D UMAP space
-- Use for: Exploring similar embeddings in visualization

SELECT
    id,
    value,
    umap_x_2d,
    umap_y_2d,
    sqrt(
        power(umap_x_2d - :target_x, 2) +
        power(umap_y_2d - :target_y, 2)
    ) AS distance
FROM embedding_cache
WHERE umap_x_2d IS NOT NULL
ORDER BY distance
LIMIT 20;

-- Example with actual coordinates:
-- Replace :target_x with actual value, e.g., -2.5
-- Replace :target_y with actual value, e.g., 1.3

-- ---------------------------------------------------------------------
-- 4. FIND EMBEDDINGS IN 2D BOUNDING BOX
-- ---------------------------------------------------------------------
-- Filter embeddings within a rectangular region
-- Use for: Zoom/pan interactions in scatter plot

SELECT
    id,
    value,
    umap_x_2d AS x,
    umap_y_2d AS y,
    source_table
FROM embedding_cache
WHERE umap_x_2d BETWEEN :x_min AND :x_max
    AND umap_y_2d BETWEEN :y_min AND :y_max
ORDER BY umap_x_2d, umap_y_2d;

-- Example with actual bounds:
-- WHERE umap_x_2d BETWEEN -5.0 AND 0.0
--   AND umap_y_2d BETWEEN -3.0 AND 3.0

-- ---------------------------------------------------------------------
-- 5. FIND EMBEDDINGS IN 3D BOUNDING BOX
-- ---------------------------------------------------------------------
-- Filter embeddings within a 3D cubic region
-- Use for: 3D selection/filtering tools

SELECT
    id,
    value,
    umap_x_3d AS x,
    umap_y_3d AS y,
    umap_z_3d AS z
FROM embedding_cache
WHERE umap_x_3d BETWEEN :x_min AND :x_max
    AND umap_y_3d BETWEEN :y_min AND :y_max
    AND umap_z_3d BETWEEN :z_min AND :z_max;

-- ---------------------------------------------------------------------
-- 6. GROUP BY SOURCE TABLE (FOR COLOR CODING)
-- ---------------------------------------------------------------------
-- Get 2D coordinates grouped by source table
-- Use for: Color-coding points by data source

SELECT
    source_table,
    json_agg(
        json_build_object(
            'id', id,
            'label', value,
            'x', umap_x_2d,
            'y', umap_y_2d
        )
    ) AS points
FROM embedding_cache
WHERE umap_x_2d IS NOT NULL
GROUP BY source_table;

-- ---------------------------------------------------------------------
-- 7. GET COORDINATE BOUNDS (FOR AXIS SCALING)
-- ---------------------------------------------------------------------
-- Calculate min/max for each dimension
-- Use for: Setting up chart axes and initial view

SELECT
    'x_2d' AS dimension,
    MIN(umap_x_2d) AS min_val,
    MAX(umap_x_2d) AS max_val,
    AVG(umap_x_2d) AS avg_val,
    STDDEV(umap_x_2d) AS stddev_val
FROM embedding_cache
WHERE umap_x_2d IS NOT NULL

UNION ALL

SELECT
    'y_2d',
    MIN(umap_y_2d),
    MAX(umap_y_2d),
    AVG(umap_y_2d),
    STDDEV(umap_y_2d)
FROM embedding_cache
WHERE umap_y_2d IS NOT NULL

UNION ALL

SELECT
    'x_3d',
    MIN(umap_x_3d),
    MAX(umap_x_3d),
    AVG(umap_x_3d),
    STDDEV(umap_x_3d)
FROM embedding_cache
WHERE umap_x_3d IS NOT NULL

UNION ALL

SELECT
    'y_3d',
    MIN(umap_y_3d),
    MAX(umap_y_3d),
    AVG(umap_y_3d),
    STDDEV(umap_y_3d)
FROM embedding_cache
WHERE umap_y_3d IS NOT NULL

UNION ALL

SELECT
    'z_3d',
    MIN(umap_z_3d),
    MAX(umap_z_3d),
    AVG(umap_z_3d),
    STDDEV(umap_z_3d)
FROM embedding_cache
WHERE umap_z_3d IS NOT NULL;

-- ---------------------------------------------------------------------
-- 8. SEARCH EMBEDDINGS BY LABEL
-- ---------------------------------------------------------------------
-- Find embeddings by text search on original value
-- Use for: Search/filter functionality in UI

SELECT
    id,
    value,
    umap_x_2d AS x,
    umap_y_2d AS y,
    source_table
FROM embedding_cache
WHERE value ILIKE :search_term
    AND umap_x_2d IS NOT NULL
ORDER BY value;

-- Example:
-- WHERE value ILIKE '%bluetooth%'

-- ---------------------------------------------------------------------
-- 9. CHECK UMAP POPULATION STATUS
-- ---------------------------------------------------------------------
-- Verify how many embeddings have UMAP coordinates populated
-- Use for: Migration verification and monitoring

SELECT
    COUNT(*) AS total_embeddings,
    COUNT(umap_x_2d) AS populated_2d,
    COUNT(umap_x_3d) AS populated_3d,
    COUNT(*) - COUNT(umap_x_2d) AS missing_2d,
    COUNT(*) - COUNT(umap_x_3d) AS missing_3d,
    ROUND(100.0 * COUNT(umap_x_2d) / COUNT(*), 2) AS pct_populated_2d,
    ROUND(100.0 * COUNT(umap_x_3d) / COUNT(*), 2) AS pct_populated_3d
FROM embedding_cache;

-- ---------------------------------------------------------------------
-- 10. DENSITY HEATMAP DATA (2D GRID)
-- ---------------------------------------------------------------------
-- Bin embeddings into grid cells for heatmap visualization
-- Use for: Showing density of embeddings in 2D space

WITH bounds AS (
    SELECT
        MIN(umap_x_2d) AS x_min,
        MAX(umap_x_2d) AS x_max,
        MIN(umap_y_2d) AS y_min,
        MAX(umap_y_2d) AS y_max
    FROM embedding_cache
    WHERE umap_x_2d IS NOT NULL
),
grid AS (
    SELECT
        id,
        value,
        umap_x_2d,
        umap_y_2d,
        FLOOR((umap_x_2d - b.x_min) / (b.x_max - b.x_min) * 20) AS x_bin,
        FLOOR((umap_y_2d - b.y_min) / (b.y_max - b.y_min) * 20) AS y_bin
    FROM embedding_cache
    CROSS JOIN bounds b
    WHERE umap_x_2d IS NOT NULL
)
SELECT
    x_bin,
    y_bin,
    COUNT(*) AS count,
    json_agg(value) AS labels
FROM grid
GROUP BY x_bin, y_bin
ORDER BY x_bin, y_bin;

-- ---------------------------------------------------------------------
-- 11. EXPORT FOR PYTHON/JUPYTER
-- ---------------------------------------------------------------------
-- Get all data in CSV-friendly format
-- Use for: Exporting to pandas, matplotlib, etc.

COPY (
    SELECT
        id,
        value,
        umap_x_2d,
        umap_y_2d,
        umap_x_3d,
        umap_y_3d,
        umap_z_3d,
        source_table,
        source_column
    FROM embedding_cache
    WHERE umap_x_2d IS NOT NULL
    ORDER BY id
) TO '/tmp/umap_coordinates.csv' WITH CSV HEADER;

-- Alternative: JSON format
SELECT json_agg(
    json_build_object(
        'id', id,
        'label', value,
        'x2d', umap_x_2d,
        'y2d', umap_y_2d,
        'x3d', umap_x_3d,
        'y3d', umap_y_3d,
        'z3d', umap_z_3d,
        'source', source_table
    )
) AS embeddings
FROM embedding_cache
WHERE umap_x_2d IS NOT NULL;

-- ---------------------------------------------------------------------
-- 12. IDENTIFY OUTLIERS (DBSCAN-LIKE)
-- ---------------------------------------------------------------------
-- Find embeddings far from all others in 2D space
-- Use for: Identifying unusual/unique attribute labels

WITH distances AS (
    SELECT
        e1.id,
        e1.value,
        e1.umap_x_2d,
        e1.umap_y_2d,
        MIN(
            sqrt(
                power(e1.umap_x_2d - e2.umap_x_2d, 2) +
                power(e1.umap_y_2d - e2.umap_y_2d, 2)
            )
        ) AS nearest_neighbor_distance
    FROM embedding_cache e1
    CROSS JOIN embedding_cache e2
    WHERE e1.id != e2.id
        AND e1.umap_x_2d IS NOT NULL
        AND e2.umap_x_2d IS NOT NULL
    GROUP BY e1.id, e1.value, e1.umap_x_2d, e1.umap_y_2d
)
SELECT
    id,
    value,
    umap_x_2d AS x,
    umap_y_2d AS y,
    nearest_neighbor_distance
FROM distances
WHERE nearest_neighbor_distance > :outlier_threshold
ORDER BY nearest_neighbor_distance DESC;

-- Example: outlier_threshold = 2.0 (adjust based on your data scale)

-- =====================================================================
-- MAINTENANCE QUERIES
-- =====================================================================

-- Verify indexes exist
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'embedding_cache'
    AND indexname LIKE '%umap%';

-- Check index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS times_used,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'embedding_cache'
    AND indexname LIKE '%umap%';

-- Get table size and index sizes
SELECT
    pg_size_pretty(pg_total_relation_size('embedding_cache')) AS total_size,
    pg_size_pretty(pg_relation_size('embedding_cache')) AS table_size,
    pg_size_pretty(pg_indexes_size('embedding_cache')) AS indexes_size;
