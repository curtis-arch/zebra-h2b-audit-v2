#!/usr/bin/env -S uv run
"""
Extract embeddings from Neon PostgreSQL database.

This script:
1. Connects to the Neon database
2. Extracts ALL embeddings (1536d vectors) from embedding_cache table
3. Saves embeddings and metadata to numpy files for further processing
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


async def extract_embeddings(database_url: str, dimension: int = 1536) -> tuple[np.ndarray, pd.DataFrame]:
    """
    Extract embeddings from the database.

    Args:
        database_url: PostgreSQL connection string
        dimension: Vector dimension (1536 or 3072)

    Returns:
        Tuple of (embeddings array, metadata DataFrame)
    """
    print(f"Connecting to database...")
    conn = await asyncpg.connect(database_url)

    try:
        # Determine which embedding column to use
        # Database uses embedding_small (1536d) and embedding_large (3072d)
        embedding_col = "embedding_small" if dimension == 1536 else "embedding_large"

        print(f"Extracting {embedding_col} embeddings...")

        # Query embeddings with metadata
        query = f"""
            SELECT
                id,
                value,
                value_hash,
                {embedding_col}::text as embedding_vector,
                source_table,
                source_column,
                usage_count,
                created_at
            FROM embedding_cache
            WHERE {embedding_col} IS NOT NULL
            ORDER BY id
        """

        rows = await conn.fetch(query)

        if not rows:
            print("❌ No embeddings found in database")
            return np.array([]), pd.DataFrame()

        print(f"✓ Found {len(rows)} embeddings")

        # Parse embeddings and metadata
        embeddings = []
        metadata_rows = []

        for row in rows:
            # Parse pgvector format: "[0.123,-0.456,...]"
            vector_str = row['embedding_vector']

            # Remove brackets and parse floats
            vector_str_clean = vector_str.strip('[]')
            vector = np.array([float(x) for x in vector_str_clean.split(',')], dtype=np.float32)

            embeddings.append(vector)

            metadata_rows.append({
                'id': row['id'],
                'label': row['value'],
                'value_hash': row['value_hash'],
                'source_table': row['source_table'],
                'source_column': row['source_column'],
                'usage_count': row['usage_count'],
                'created_at': row['created_at']
            })

        embeddings_array = np.array(embeddings, dtype=np.float32)
        metadata_df = pd.DataFrame(metadata_rows)

        print(f"✓ Embeddings shape: {embeddings_array.shape}")
        print(f"✓ Metadata shape: {metadata_df.shape}")

        return embeddings_array, metadata_df

    finally:
        await conn.close()


async def main():
    """Main execution flow."""
    print("=" * 80)
    print("EMBEDDING EXTRACTION")
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

    try:
        # Extract embeddings (1536d)
        print("Extracting 1536-dimensional embeddings...")
        embeddings, metadata = await extract_embeddings(database_url, dimension=1536)

        if len(embeddings) == 0:
            print("No embeddings to save")
            sys.exit(1)

        # Create output directory
        output_dir = Path(__file__).parent / "data"
        output_dir.mkdir(exist_ok=True)

        # Save to files
        print("\nSaving to files...")

        embeddings_path = output_dir / "embeddings_1536d.npy"
        metadata_path = output_dir / "metadata.csv"

        np.save(embeddings_path, embeddings)
        metadata.to_csv(metadata_path, index=False)

        print(f"✓ Saved embeddings to: {embeddings_path}")
        print(f"✓ Saved metadata to: {metadata_path}")
        print()

        # Summary
        print("=" * 80)
        print("SUMMARY")
        print("=" * 80)
        print(f"Total embeddings: {len(embeddings)}")
        print(f"Embedding dimension: {embeddings.shape[1]}")
        print(f"Memory size: {embeddings.nbytes / 1024 / 1024:.2f} MB")
        print()

        # Sample metadata
        print("Sample labels:")
        for idx in range(min(10, len(metadata))):
            label = metadata.iloc[idx]['label']
            source = metadata.iloc[idx]['source_column']
            print(f"  {idx+1}. {label} (from {source})")

        if len(metadata) > 10:
            print(f"  ... and {len(metadata) - 10} more")

        print()
        print("✓ Extraction complete!")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
