#!/usr/bin/env -S uv run
"""
Update database with UMAP coordinates.

This script:
1. Creates new columns in embedding_cache table for UMAP coordinates
2. Updates each row with its 2D and 3D coordinates
3. Verifies the updates
"""

# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "asyncpg>=0.29.0",
#     "numpy>=1.26.0",
#     "pandas>=2.1.0",
#     "python-dotenv>=1.0.0",
# ]
# ///

import asyncio
import os
import sys
from pathlib import Path

import asyncpg
import numpy as np
import pandas as pd
from dotenv import load_dotenv


async def ensure_umap_columns(conn: asyncpg.Connection):
    """
    Ensure UMAP coordinate columns exist in embedding_cache table.

    Database uses these column names:
    - umap_x_2d, umap_y_2d (2D coordinates)
    - umap_x_3d, umap_y_3d, umap_z_3d (3D coordinates)
    """
    print("Checking for UMAP columns...")

    # Check if columns already exist
    check_query = """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'embedding_cache'
          AND column_name LIKE 'umap_%'
    """
    existing_columns = await conn.fetch(check_query)
    existing_column_names = {row['column_name'] for row in existing_columns}

    print(f"  Existing UMAP columns: {existing_column_names or 'none'}")

    # Add missing columns (database uses umap_x_2d format, not umap_2d_x)
    columns_to_add = [
        ('umap_x_2d', 'REAL'),
        ('umap_y_2d', 'REAL'),
        ('umap_x_3d', 'REAL'),
        ('umap_y_3d', 'REAL'),
        ('umap_z_3d', 'REAL'),
    ]

    for col_name, col_type in columns_to_add:
        if col_name not in existing_column_names:
            print(f"  Adding column: {col_name}")
            await conn.execute(f"""
                ALTER TABLE embedding_cache
                ADD COLUMN {col_name} {col_type}
            """)
        else:
            print(f"  Column exists: {col_name}")

    print("✓ UMAP columns ready")


async def update_umap_coordinates(
    conn: asyncpg.Connection,
    metadata: pd.DataFrame,
    umap_2d: np.ndarray,
    umap_3d: np.ndarray
):
    """
    Update database with UMAP coordinates.

    Args:
        conn: Database connection
        metadata: DataFrame with id column
        umap_2d: 2D coordinates (n_samples, 2)
        umap_3d: 3D coordinates (n_samples, 3)
    """
    print("Updating database with UMAP coordinates...")

    total = len(metadata)
    updated = 0
    failed = 0

    for idx in range(total):
        try:
            embedding_id = int(metadata.iloc[idx]['id'])
            x_2d = float(umap_2d[idx, 0])
            y_2d = float(umap_2d[idx, 1])
            x_3d = float(umap_3d[idx, 0])
            y_3d = float(umap_3d[idx, 1])
            z_3d = float(umap_3d[idx, 2])

            await conn.execute("""
                UPDATE embedding_cache
                SET
                    umap_x_2d = $1,
                    umap_y_2d = $2,
                    umap_x_3d = $3,
                    umap_y_3d = $4,
                    umap_z_3d = $5
                WHERE id = $6
            """, x_2d, y_2d, x_3d, y_3d, z_3d, embedding_id)

            updated += 1

            # Progress indicator
            if (idx + 1) % 50 == 0 or (idx + 1) == total:
                print(f"  Progress: {idx + 1}/{total} ({(idx + 1) / total * 100:.1f}%)", end='\r')

        except Exception as e:
            print(f"\n  Warning: Failed to update ID {embedding_id}: {e}")
            failed += 1

    print()  # New line after progress
    print(f"✓ Updated: {updated} rows")
    if failed > 0:
        print(f"⚠️  Failed: {failed} rows")


async def verify_updates(conn: asyncpg.Connection):
    """
    Verify that UMAP coordinates were stored correctly.
    """
    print("\nVerifying updates...")

    # Count rows with coordinates
    count_query = """
        SELECT
            COUNT(*) as total,
            COUNT(umap_x_2d) as with_2d,
            COUNT(umap_x_3d) as with_3d
        FROM embedding_cache
    """
    result = await conn.fetchrow(count_query)

    print(f"  Total rows: {result['total']}")
    print(f"  With 2D coordinates: {result['with_2d']}")
    print(f"  With 3D coordinates: {result['with_3d']}")

    # Sample coordinates
    sample_query = """
        SELECT
            id,
            value,
            umap_x_2d,
            umap_y_2d,
            umap_x_3d,
            umap_y_3d,
            umap_z_3d
        FROM embedding_cache
        WHERE umap_x_2d IS NOT NULL
        ORDER BY id
        LIMIT 5
    """
    samples = await conn.fetch(sample_query)

    if samples:
        print("\n  Sample coordinates:")
        for sample in samples:
            print(f"    ID {sample['id']} ({sample['value'][:30]}...):")
            print(f"      2D: ({sample['umap_x_2d']:.3f}, {sample['umap_y_2d']:.3f})")
            print(f"      3D: ({sample['umap_x_3d']:.3f}, {sample['umap_y_3d']:.3f}, {sample['umap_z_3d']:.3f})")

    print("\n✓ Verification complete")


async def main():
    """Main execution flow."""
    print("=" * 80)
    print("DATABASE UPDATE WITH UMAP COORDINATES")
    print("=" * 80)
    print()

    # Load environment variables
    env_path = Path(__file__).parent.parent / "apps" / "web" / ".env"
    if not env_path.exists():
        print(f"❌ Error: {env_path} not found")
        sys.exit(1)

    load_dotenv(env_path)
    print(f"✓ Loaded environment from: {env_path}")

    # Get database URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ Error: DATABASE_URL not found in .env.local")
        sys.exit(1)

    print(f"✓ Database URL loaded")
    print()

    # Load UMAP coordinates
    data_dir = Path(__file__).parent / "data"
    metadata_path = data_dir / "metadata.csv"
    umap_2d_path = data_dir / "umap_2d.npy"
    umap_3d_path = data_dir / "umap_3d.npy"

    if not all([metadata_path.exists(), umap_2d_path.exists(), umap_3d_path.exists()]):
        print("❌ Error: UMAP coordinate files not found")
        print("Please run 02_reduce_with_umap.py first")
        sys.exit(1)

    print("Loading UMAP coordinates...")
    metadata = pd.read_csv(metadata_path)
    umap_2d = np.load(umap_2d_path)
    umap_3d = np.load(umap_3d_path)

    print(f"✓ Loaded metadata: {metadata.shape}")
    print(f"✓ Loaded 2D coordinates: {umap_2d.shape}")
    print(f"✓ Loaded 3D coordinates: {umap_3d.shape}")
    print()

    # Verify shapes match
    if not (len(metadata) == len(umap_2d) == len(umap_3d)):
        print("❌ Error: Shape mismatch between metadata and coordinates")
        sys.exit(1)

    try:
        # Connect to database
        print("Connecting to database...")
        conn = await asyncpg.connect(database_url)

        try:
            # Ensure columns exist
            await ensure_umap_columns(conn)
            print()

            # Update coordinates
            await update_umap_coordinates(conn, metadata, umap_2d, umap_3d)
            print()

            # Verify updates
            await verify_updates(conn)

            print()
            print("=" * 80)
            print("✓ Database update complete!")
            print("=" * 80)
            print("\nNext step: Run 04_export_tsv.py to create TensorFlow Projector files")

        finally:
            await conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
