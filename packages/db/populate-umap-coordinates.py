#!/usr/bin/env python3
"""
UMAP Coordinate Population Script for embedding_cache Table

This script:
1. Fetches all embeddings from the embedding_cache table
2. Computes UMAP 2D and 3D projections from embedding_small (1536d)
3. Updates the database with the computed coordinates

Requirements:
    pip install psycopg2-binary numpy umap-learn tqdm

Usage:
    python populate-umap-coordinates.py

Environment:
    Set DATABASE_URL or edit the connection string below
"""

import os
import sys
from typing import List, Tuple

import numpy as np
import psycopg2
from tqdm import tqdm
from umap import UMAP

# ========================================================================
# CONFIGURATION
# ========================================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_a73OJxNiqFTn@"
    "ep-snowy-breeze-a4hj1358-pooler.us-east-1.aws.neon.tech/"
    "neondb?sslmode=require",
)

UMAP_2D_PARAMS = {
    "n_components": 2,
    "n_neighbors": 15,
    "min_dist": 0.1,
    "metric": "cosine",
    "random_state": 42,
    "n_jobs": -1,  # Use all CPU cores
}

UMAP_3D_PARAMS = {
    "n_components": 3,
    "n_neighbors": 15,
    "min_dist": 0.1,
    "metric": "cosine",
    "random_state": 42,
    "n_jobs": -1,
}

BATCH_SIZE = 100  # Update database in batches of 100 rows


# ========================================================================
# DATABASE FUNCTIONS
# ========================================================================


def fetch_embeddings(
    conn: psycopg2.extensions.connection,
) -> Tuple[List[int], List[str], np.ndarray]:
    """
    Fetch all embeddings that need UMAP coordinates.

    Returns:
        (ids, labels, embeddings): Row IDs, text labels, and embedding vectors
    """
    cur = conn.cursor()

    # Only fetch rows without UMAP coordinates
    cur.execute(
        """
        SELECT
            id,
            value,
            embedding_small
        FROM embedding_cache
        WHERE umap_x_2d IS NULL
        ORDER BY id
    """
    )

    rows = cur.fetchall()
    cur.close()

    if not rows:
        print("No embeddings found that need UMAP coordinates.")
        return [], [], np.array([])

    ids = [row[0] for row in rows]
    labels = [row[1] for row in rows]
    embeddings = np.array([row[2] for row in rows], dtype=np.float32)

    print(f"Fetched {len(ids)} embeddings to process")
    print(f"Embedding dimensions: {embeddings.shape}")

    return ids, labels, embeddings


def update_umap_coordinates(
    conn: psycopg2.extensions.connection,
    ids: List[int],
    coords_2d: np.ndarray,
    coords_3d: np.ndarray,
) -> int:
    """
    Update database with UMAP coordinates in batches.

    Args:
        conn: Database connection
        ids: List of row IDs
        coords_2d: 2D UMAP coordinates (N x 2)
        coords_3d: 3D UMAP coordinates (N x 3)

    Returns:
        Number of rows updated
    """
    cur = conn.cursor()

    update_query = """
        UPDATE embedding_cache
        SET
            umap_x_2d = %s,
            umap_y_2d = %s,
            umap_x_3d = %s,
            umap_y_3d = %s,
            umap_z_3d = %s
        WHERE id = %s
    """

    total_updated = 0

    # Batch updates for better performance
    for i in tqdm(range(0, len(ids), BATCH_SIZE), desc="Updating database"):
        batch_end = min(i + BATCH_SIZE, len(ids))
        batch_data = [
            (
                float(coords_2d[j, 0]),  # umap_x_2d
                float(coords_2d[j, 1]),  # umap_y_2d
                float(coords_3d[j, 0]),  # umap_x_3d
                float(coords_3d[j, 1]),  # umap_y_3d
                float(coords_3d[j, 2]),  # umap_z_3d
                ids[j],
            )
            for j in range(i, batch_end)
        ]

        cur.executemany(update_query, batch_data)
        conn.commit()
        total_updated += len(batch_data)

    cur.close()
    return total_updated


def verify_population(conn: psycopg2.extensions.connection) -> None:
    """Print statistics about UMAP coordinate population."""
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            COUNT(*) as total,
            COUNT(umap_x_2d) as populated_2d,
            COUNT(umap_x_3d) as populated_3d,
            MIN(umap_x_2d) as min_x_2d,
            MAX(umap_x_2d) as max_x_2d,
            MIN(umap_y_2d) as min_y_2d,
            MAX(umap_y_2d) as max_y_2d,
            MIN(umap_x_3d) as min_x_3d,
            MAX(umap_x_3d) as max_x_3d,
            MIN(umap_y_3d) as min_y_3d,
            MAX(umap_y_3d) as max_y_3d,
            MIN(umap_z_3d) as min_z_3d,
            MAX(umap_z_3d) as max_z_3d
        FROM embedding_cache
    """
    )

    stats = cur.fetchone()
    cur.close()

    print("\n" + "=" * 60)
    print("UMAP Population Statistics")
    print("=" * 60)
    print(f"Total embeddings:      {stats[0]}")
    print(f"Populated 2D:          {stats[1]} ({100*stats[1]/stats[0]:.1f}%)")
    print(f"Populated 3D:          {stats[2]} ({100*stats[2]/stats[0]:.1f}%)")
    print(f"\n2D Coordinate Ranges:")
    print(f"  X: [{stats[3]:.2f}, {stats[4]:.2f}]")
    print(f"  Y: [{stats[5]:.2f}, {stats[6]:.2f}]")
    print(f"\n3D Coordinate Ranges:")
    print(f"  X: [{stats[7]:.2f}, {stats[8]:.2f}]")
    print(f"  Y: [{stats[9]:.2f}, {stats[10]:.2f}]")
    print(f"  Z: [{stats[11]:.2f}, {stats[12]:.2f}]")
    print("=" * 60 + "\n")


# ========================================================================
# UMAP COMPUTATION
# ========================================================================


def compute_umap_projections(
    embeddings: np.ndarray,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Compute 2D and 3D UMAP projections.

    Args:
        embeddings: Input embeddings (N x 1536)

    Returns:
        (coords_2d, coords_3d): 2D and 3D UMAP coordinates
    """
    print("\nComputing 2D UMAP projection...")
    umap_2d = UMAP(**UMAP_2D_PARAMS)
    coords_2d = umap_2d.fit_transform(embeddings)
    print(f"2D coordinates shape: {coords_2d.shape}")

    print("\nComputing 3D UMAP projection...")
    umap_3d = UMAP(**UMAP_3D_PARAMS)
    coords_3d = umap_3d.fit_transform(embeddings)
    print(f"3D coordinates shape: {coords_3d.shape}")

    return coords_2d, coords_3d


# ========================================================================
# MAIN SCRIPT
# ========================================================================


def main():
    """Main execution function."""
    print("=" * 60)
    print("UMAP Coordinate Population Script")
    print("=" * 60)
    print(f"\nConnecting to database...")

    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("Connected successfully!")

        # Step 1: Fetch embeddings
        print("\nStep 1: Fetching embeddings from database...")
        ids, labels, embeddings = fetch_embeddings(conn)

        if len(ids) == 0:
            print("\nAll embeddings already have UMAP coordinates. Exiting.")
            conn.close()
            return

        # Step 2: Compute UMAP projections
        print("\nStep 2: Computing UMAP projections...")
        coords_2d, coords_3d = compute_umap_projections(embeddings)

        # Step 3: Update database
        print("\nStep 3: Updating database with UMAP coordinates...")
        rows_updated = update_umap_coordinates(conn, ids, coords_2d, coords_3d)
        print(f"Updated {rows_updated} rows")

        # Step 4: Verify
        print("\nStep 4: Verifying population...")
        verify_population(conn)

        conn.close()
        print("✅ Success! UMAP coordinates populated.")

    except psycopg2.Error as e:
        print(f"\n❌ Database error: {e}")
        sys.exit(1)

    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
