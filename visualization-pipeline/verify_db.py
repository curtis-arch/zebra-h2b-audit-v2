#!/usr/bin/env -S uv run
"""Quick verification that database has UMAP coordinates."""
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "asyncpg>=0.29.0",
#     "python-dotenv>=1.0.0",
# ]
# ///
import asyncio
import asyncpg
from pathlib import Path
from dotenv import load_dotenv
import os

async def verify():
    # Load environment
    env_path = Path(__file__).parent.parent.parent / "zebra-data-parser-h2b" / ".env.local"
    load_dotenv(env_path)
    db_url = os.getenv("DATABASE_URL")
    
    # Connect
    conn = await asyncpg.connect(db_url)
    
    # Count total rows
    total = await conn.fetchval("SELECT COUNT(*) FROM embedding_cache")
    print(f"Total embeddings: {total}")
    
    # Count rows with 2D coordinates
    with_2d = await conn.fetchval(
        "SELECT COUNT(*) FROM embedding_cache WHERE umap_x_2d IS NOT NULL AND umap_y_2d IS NOT NULL"
    )
    print(f"With 2D coordinates: {with_2d}")
    
    # Count rows with 3D coordinates
    with_3d = await conn.fetchval(
        "SELECT COUNT(*) FROM embedding_cache WHERE umap_x_3d IS NOT NULL AND umap_y_3d IS NOT NULL AND umap_z_3d IS NOT NULL"
    )
    print(f"With 3D coordinates: {with_3d}")
    
    # Sample a few rows
    print("\nSample data:")
    rows = await conn.fetch(
        "SELECT id, value, source_column, umap_x_2d, umap_y_2d, umap_x_3d, umap_y_3d, umap_z_3d FROM embedding_cache LIMIT 5"
    )
    for row in rows:
        print(f"  ID {row['id']}: {row['value'][:30]}...")
        print(f"    2D: ({row['umap_x_2d']:.3f}, {row['umap_y_2d']:.3f})")
        print(f"    3D: ({row['umap_x_3d']:.3f}, {row['umap_y_3d']:.3f}, {row['umap_z_3d']:.3f})")
    
    await conn.close()
    print("\n✓ Database verification complete!")

asyncio.run(verify())
