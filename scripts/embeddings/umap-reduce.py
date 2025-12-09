#!/usr/bin/env python3
"""
UMAP Dimensionality Reduction and TSV Export

Fetches embedding_small (1536d) vectors from embedding_cache,
reduces to 2D and 3D using UMAP, updates database, and exports TSV files.

Usage:
    uv run umap-reduce.py
"""

import json
import os
import sys
from pathlib import Path

import numpy as np
import psycopg2
from dotenv import load_dotenv
from umap import UMAP

# UMAP parameters
UMAP_PARAMS = {
    "n_neighbors": 20,
    "min_dist": 0.1,
    "metric": "cosine",
    "random_state": 42,
}

# Output directory
TSV_EXPORT_DIR = Path(__file__).parent / "tsv_export"


def load_env():
    """Load environment variables from .env.local"""
    env_path = Path(__file__).parent.parent.parent / ".env.local"
    if not env_path.exists():
        print(f"❌ Error: .env.local not found at {env_path}")
        sys.exit(1)

    load_dotenv(env_path)
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("❌ Error: DATABASE_URL not found in .env.local")
        sys.exit(1)

    return database_url


def connect_db(database_url):
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(database_url)
        print("✅ Connected to Neon PostgreSQL")
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)


def fetch_embeddings(conn):
    """Fetch all embeddings from embedding_cache"""
    print("\n📊 Fetching embeddings from database...")

    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            value_hash,
            value,
            embedding_small,
            source_table,
            source_column,
            usage_count
        FROM embedding_cache
        WHERE embedding_small IS NOT NULL
        ORDER BY value_hash
    """)

    rows = cursor.fetchall()
    cursor.close()

    if not rows:
        print("❌ No embeddings found in database")
        sys.exit(1)

    print(f"   Found {len(rows)} embeddings")

    # Parse embeddings (stored as PostgreSQL vector type)
    data = []
    for row in rows:
        value_hash, value, embedding_str, source_table, source_column, usage_count = row

        # Parse vector format: "[1.0, 2.0, ...]"
        embedding_str = str(embedding_str)
        if embedding_str.startswith('[') and embedding_str.endswith(']'):
            embedding = json.loads(embedding_str)
        else:
            # Handle plain vector format without brackets
            embedding = [float(x) for x in embedding_str.split(',')]

        data.append({
            'value_hash': value_hash,
            'value': value,
            'embedding': np.array(embedding, dtype=np.float32),
            'source_table': source_table,
            'source_column': source_column,
            'usage_count': usage_count,
        })

    return data


def add_umap_columns(conn):
    """Add UMAP coordinate columns to embedding_cache if they don't exist"""
    print("\n🔧 Checking database schema...")

    cursor = conn.cursor()

    # Check if UMAP columns exist
    cursor.execute("""
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'embedding_cache'
        AND column_name IN ('umap_x_2d', 'umap_y_2d', 'umap_x_3d', 'umap_y_3d', 'umap_z_3d')
    """)

    existing_columns = {row[0] for row in cursor.fetchall()}

    columns_to_add = []
    if 'umap_x_2d' not in existing_columns:
        columns_to_add.extend(['umap_x_2d', 'umap_y_2d'])
    if 'umap_x_3d' not in existing_columns:
        columns_to_add.extend(['umap_x_3d', 'umap_y_3d', 'umap_z_3d'])

    if columns_to_add:
        print(f"   Adding columns: {', '.join(columns_to_add)}")

        for col in columns_to_add:
            cursor.execute(f"""
                ALTER TABLE embedding_cache
                ADD COLUMN IF NOT EXISTS {col} DOUBLE PRECISION
            """)

        conn.commit()
        print("   ✅ Schema updated")
    else:
        print("   ✅ UMAP columns already exist")

    cursor.close()


def run_umap(data):
    """Run UMAP dimensionality reduction"""
    print("\n🔄 Running UMAP dimensionality reduction...")

    # Extract embeddings as matrix
    embeddings = np.vstack([d['embedding'] for d in data])
    print(f"   Input shape: {embeddings.shape}")

    # Run UMAP for 2D
    print(f"   Computing 2D projection (n_neighbors={UMAP_PARAMS['n_neighbors']}, min_dist={UMAP_PARAMS['min_dist']})...")
    umap_2d = UMAP(n_components=2, **UMAP_PARAMS)
    coords_2d = umap_2d.fit_transform(embeddings)

    # Run UMAP for 3D
    print(f"   Computing 3D projection (n_neighbors={UMAP_PARAMS['n_neighbors']}, min_dist={UMAP_PARAMS['min_dist']})...")
    umap_3d = UMAP(n_components=3, **UMAP_PARAMS)
    coords_3d = umap_3d.fit_transform(embeddings)

    print("   ✅ UMAP complete")

    # Add coordinates to data
    for i, d in enumerate(data):
        d['umap_2d'] = coords_2d[i]
        d['umap_3d'] = coords_3d[i]

    return data


def update_database(conn, data):
    """Update embedding_cache with UMAP coordinates"""
    print("\n💾 Updating database with UMAP coordinates...")

    cursor = conn.cursor()

    for i, d in enumerate(data):
        cursor.execute("""
            UPDATE embedding_cache
            SET
                umap_x_2d = %s,
                umap_y_2d = %s,
                umap_x_3d = %s,
                umap_y_3d = %s,
                umap_z_3d = %s
            WHERE value_hash = %s
        """, (
            float(d['umap_2d'][0]),
            float(d['umap_2d'][1]),
            float(d['umap_3d'][0]),
            float(d['umap_3d'][1]),
            float(d['umap_3d'][2]),
            d['value_hash'],
        ))

        if (i + 1) % 100 == 0:
            print(f"   Updated {i + 1}/{len(data)} rows...")

    conn.commit()
    cursor.close()

    print(f"   ✅ Updated {len(data)} rows")


def export_tsv(data):
    """Export UMAP coordinates and metadata to TSV files"""
    print("\n📤 Exporting TSV files...")

    # Create export directory
    TSV_EXPORT_DIR.mkdir(exist_ok=True)

    # Export 2D embeddings
    embeddings_2d_path = TSV_EXPORT_DIR / "embeddings_2d.tsv"
    with open(embeddings_2d_path, 'w') as f:
        for d in data:
            f.write(f"{d['umap_2d'][0]:.6f}\t{d['umap_2d'][1]:.6f}\n")
    print(f"   ✅ Exported 2D embeddings: {embeddings_2d_path}")

    # Export 3D embeddings
    embeddings_3d_path = TSV_EXPORT_DIR / "embeddings_3d.tsv"
    with open(embeddings_3d_path, 'w') as f:
        for d in data:
            f.write(f"{d['umap_3d'][0]:.6f}\t{d['umap_3d'][1]:.6f}\t{d['umap_3d'][2]:.6f}\n")
    print(f"   ✅ Exported 3D embeddings: {embeddings_3d_path}")

    # Export metadata
    metadata_path = TSV_EXPORT_DIR / "metadata.tsv"
    with open(metadata_path, 'w') as f:
        # Header
        f.write("value\tsource_table\tsource_column\tusage_count\n")

        # Data rows
        for d in data:
            # Escape tabs and newlines in value
            value = d['value'].replace('\t', ' ').replace('\n', ' ').replace('\r', ' ')
            f.write(f"{value}\t{d['source_table']}\t{d['source_column']}\t{d['usage_count']}\n")

    print(f"   ✅ Exported metadata: {metadata_path}")


def verify_update(conn):
    """Verify UMAP coordinates were written to database"""
    print("\n✅ Verifying database update...")

    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*)
        FROM embedding_cache
        WHERE umap_x_2d IS NOT NULL
    """)

    count = cursor.fetchone()[0]
    cursor.close()

    print(f"   Records with UMAP coordinates: {count}")

    return count


def main():
    """Main execution"""
    print("=" * 60)
    print("UMAP Dimensionality Reduction and TSV Export")
    print("=" * 60)

    # Load environment and connect
    database_url = load_env()
    conn = connect_db(database_url)

    try:
        # Add UMAP columns if needed
        add_umap_columns(conn)

        # Fetch embeddings
        data = fetch_embeddings(conn)

        # Run UMAP
        data = run_umap(data)

        # Update database
        update_database(conn, data)

        # Verify
        count = verify_update(conn)

        # Export TSV
        export_tsv(data)

        # Final report
        print("\n" + "=" * 60)
        print("✅ UMAP PROCESSING COMPLETE")
        print("=" * 60)
        print(f"BEADS_ID: zebra-h2b-audit-v2-wxr.7")
        print(f"STATUS: completed")
        print(f"UMAP_COORDS_GENERATED: {count}")
        print(f"TSV_FILES: [")
        print(f"  '{TSV_EXPORT_DIR / 'embeddings_2d.tsv'}',")
        print(f"  '{TSV_EXPORT_DIR / 'embeddings_3d.tsv'}',")
        print(f"  '{TSV_EXPORT_DIR / 'metadata.tsv'}")
        print(f"]")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
