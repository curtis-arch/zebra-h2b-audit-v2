#!/usr/bin/env -S uv run
"""
Discover the current state of embeddings in the database.

This script queries the database to:
1. Count total embeddings
2. Breakdown by source_table and source_column
3. Identify different data types (attribute labels, descriptions, etc.)
"""

# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "asyncpg>=0.29.0",
#     "python-dotenv>=1.0.0",
#     "pandas>=2.1.0",
# ]
# ///

import asyncio
import os
import sys
from pathlib import Path

import asyncpg
import pandas as pd
from dotenv import load_dotenv


async def discover_database_state(database_url: str):
    """
    Discover and analyze the current database state.

    Args:
        database_url: PostgreSQL connection string
    """
    print(f"Connecting to database...")
    conn = await asyncpg.connect(database_url)

    try:
        # Total count
        print("\n" + "=" * 80)
        print("TOTAL EMBEDDINGS")
        print("=" * 80)

        query = """
            SELECT
                COUNT(*) as total_rows,
                COUNT(embedding_small) as embeddings_small,
                COUNT(embedding_large) as embeddings_large,
                COUNT(umap_x_2d) as has_umap_2d,
                COUNT(umap_x_3d) as has_umap_3d
            FROM embedding_cache
        """

        row = await conn.fetchrow(query)
        print(f"Total rows in table: {row['total_rows']}")
        print(f"Rows with embedding_small (1536d): {row['embeddings_small']}")
        print(f"Rows with embedding_large (3072d): {row['embeddings_large']}")
        print(f"Rows with UMAP 2D coordinates: {row['has_umap_2d']}")
        print(f"Rows with UMAP 3D coordinates: {row['has_umap_3d']}")

        # Breakdown by source
        print("\n" + "=" * 80)
        print("BREAKDOWN BY SOURCE")
        print("=" * 80)

        query = """
            SELECT
                source_table,
                source_column,
                COUNT(*) as count,
                COUNT(embedding_small) as with_embedding,
                COUNT(umap_x_2d) as with_umap
            FROM embedding_cache
            GROUP BY source_table, source_column
            ORDER BY count DESC
        """

        rows = await conn.fetch(query)

        df = pd.DataFrame([dict(r) for r in rows])
        print(df.to_string(index=False))

        # Identify specific data types
        print("\n" + "=" * 80)
        print("DATA TYPE IDENTIFICATION")
        print("=" * 80)

        # Attribute Labels
        query = """
            SELECT COUNT(*) as count
            FROM embedding_cache
            WHERE source_table = 'config_position'
                AND source_column = 'attribute_label'
                AND embedding_small IS NOT NULL
        """
        attr_count = await conn.fetchval(query)
        print(f"\nAttribute Labels (config_position.attribute_label):")
        print(f"  Count: {attr_count}")

        # Descriptions
        query = """
            SELECT
                source_table,
                COUNT(*) as count
            FROM embedding_cache
            WHERE source_column = 'description'
                AND embedding_small IS NOT NULL
            GROUP BY source_table
            ORDER BY count DESC
        """
        desc_rows = await conn.fetch(query)
        print(f"\nDescriptions (*.description):")
        for row in desc_rows:
            print(f"  {row['source_table']}: {row['count']}")
        total_desc = sum(r['count'] for r in desc_rows)
        print(f"  Total: {total_desc}")

        # Other data types
        query = """
            SELECT
                source_table,
                source_column,
                COUNT(*) as count
            FROM embedding_cache
            WHERE embedding_small IS NOT NULL
                AND NOT (source_table = 'config_position' AND source_column = 'attribute_label')
                AND NOT (source_column = 'description')
            GROUP BY source_table, source_column
            ORDER BY count DESC
        """
        other_rows = await conn.fetch(query)
        if other_rows:
            print(f"\nOther data types:")
            for row in other_rows:
                print(f"  {row['source_table']}.{row['source_column']}: {row['count']}")

        # Sample data from each type
        print("\n" + "=" * 80)
        print("SAMPLE DATA")
        print("=" * 80)

        # Sample attribute labels
        print("\nAttribute Labels (first 5):")
        query = """
            SELECT value, usage_count
            FROM embedding_cache
            WHERE source_table = 'config_position'
                AND source_column = 'attribute_label'
                AND embedding_small IS NOT NULL
            ORDER BY usage_count DESC
            LIMIT 5
        """
        samples = await conn.fetch(query)
        for i, row in enumerate(samples, 1):
            print(f"  {i}. {row['value']} (used {row['usage_count']} times)")

        # Sample descriptions
        print("\nDescriptions (first 5):")
        query = """
            SELECT value, source_table, usage_count
            FROM embedding_cache
            WHERE source_column = 'description'
                AND embedding_small IS NOT NULL
            ORDER BY usage_count DESC
            LIMIT 5
        """
        samples = await conn.fetch(query)
        for i, row in enumerate(samples, 1):
            value_preview = row['value'][:80] + "..." if len(row['value']) > 80 else row['value']
            print(f"  {i}. [{row['source_table']}] {value_preview}")

        # Summary for processing
        print("\n" + "=" * 80)
        print("PROCESSING SUMMARY")
        print("=" * 80)

        total_to_process = await conn.fetchval(
            "SELECT COUNT(*) FROM embedding_cache WHERE embedding_small IS NOT NULL"
        )
        need_umap = await conn.fetchval(
            "SELECT COUNT(*) FROM embedding_cache WHERE embedding_small IS NOT NULL AND umap_x_2d IS NULL"
        )

        print(f"\nTotal embeddings to process: {total_to_process}")
        print(f"Embeddings needing UMAP: {need_umap}")

        if need_umap > 0:
            print(f"\n⚠️  {need_umap} embeddings are missing UMAP coordinates")
        else:
            print(f"\n✓ All embeddings have UMAP coordinates")

        print(f"\nRecommended actions:")
        print(f"  1. Run UMAP on all {total_to_process} embeddings")
        print(f"  2. Export {attr_count} attribute labels to tsv_export/attribute_labels/")
        print(f"  3. Export {total_desc} descriptions to tsv_export/descriptions/")

    finally:
        await conn.close()


async def main():
    """Main execution flow."""
    print("=" * 80)
    print("DATABASE DISCOVERY")
    print("=" * 80)

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
        print("❌ Error: DATABASE_URL not found in .env")
        sys.exit(1)

    print(f"✓ Database URL loaded")

    try:
        await discover_database_state(database_url)
        print("\n✓ Discovery complete!")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
