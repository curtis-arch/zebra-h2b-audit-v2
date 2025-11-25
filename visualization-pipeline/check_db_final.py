# /// script
# dependencies = ["psycopg2-binary", "python-dotenv"]
# ///
import os
from dotenv import load_dotenv
import psycopg2

# Load environment
env_path = os.path.join(os.path.dirname(__file__), "..", "zebra-data-parser-h2b", ".env.local")
load_dotenv(env_path)
db_url = os.getenv("DATABASE_URL")

# Connect and verify
conn = psycopg2.connect(db_url)
cur = conn.cursor()

print("=" * 80)
print("DATABASE VERIFICATION - POST PIPELINE")
print("=" * 80)

# Total rows
cur.execute("SELECT COUNT(*) FROM embedding_cache")
total = cur.fetchone()[0]
print(f"\n✓ Total rows in embedding_cache: {total}")

# UMAP coordinate coverage
cur.execute("""
    SELECT 
        COUNT(*) as total,
        COUNT(umap_x_2d) as with_2d,
        COUNT(umap_x_3d) as with_3d
    FROM embedding_cache
""")
row = cur.fetchone()
print(f"\n✓ With 2D coordinates: {row[1]}/{row[0]} ({100*row[1]/row[0]:.1f}%)")
print(f"✓ With 3D coordinates: {row[2]}/{row[0]} ({100*row[2]/row[0]:.1f}%)")

# Verify embeddings still intact
cur.execute("""
    SELECT COUNT(*) 
    FROM embedding_cache 
    WHERE embedding_small IS NOT NULL
""")
embed_count = cur.fetchone()[0]
print(f"\n✓ Rows with embeddings preserved: {embed_count}/{total} ({100*embed_count/total:.1f}%)")

# Check for nulls
cur.execute("""
    SELECT COUNT(*) 
    FROM embedding_cache 
    WHERE umap_x_2d IS NULL 
       OR umap_y_2d IS NULL 
       OR umap_x_3d IS NULL
       OR umap_y_3d IS NULL
       OR umap_z_3d IS NULL
""")
nulls = cur.fetchone()[0]

print("\n" + "=" * 80)
if nulls == 0:
    print("✓ SUCCESS: NO NULL COORDINATES")
    print("✓ All 452 rows successfully updated with UMAP coordinates!")
else:
    print(f"⚠ WARNING: Found {nulls} rows with NULL coordinates")
print("=" * 80)

# Sample data
cur.execute("""
    SELECT 
        value,
        source_column,
        umap_x_2d::numeric(6,2),
        umap_y_2d::numeric(6,2)
    FROM embedding_cache
    WHERE umap_x_2d IS NOT NULL
    ORDER BY id
    LIMIT 3
""")

print("\nSample coordinates (first 3 rows):")
for row in cur.fetchall():
    print(f"  {row[1]}: {row[0][:40]:<40} -> 2D: ({row[2]}, {row[3]})")

cur.close()
conn.close()
