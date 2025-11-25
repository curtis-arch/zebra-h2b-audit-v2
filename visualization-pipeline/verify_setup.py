#!/usr/bin/env -S uv run
"""
Verify pipeline setup and prerequisites.

This script checks:
1. Environment file exists
2. Database connection works
3. Embeddings exist in database
4. All required scripts are present
"""

# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "asyncpg>=0.29.0",
#     "python-dotenv>=1.0.0",
# ]
# ///

import asyncio
import os
import sys
from pathlib import Path

import asyncpg
from dotenv import load_dotenv


async def check_database_connection(database_url: str) -> tuple[bool, str]:
    """Test database connection."""
    try:
        conn = await asyncpg.connect(database_url, timeout=10)
        await conn.close()
        return True, "✓ Database connection successful"
    except Exception as e:
        return False, f"✗ Database connection failed: {e}"


async def check_embeddings_exist(database_url: str) -> tuple[bool, str]:
    """Check if embeddings exist in database."""
    try:
        conn = await asyncpg.connect(database_url, timeout=10)
        try:
            # Check if table exists
            table_exists = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'embedding_cache'
                )
            """)

            if not table_exists:
                return False, "✗ embedding_cache table does not exist"

            # Count embeddings
            count = await conn.fetchval("""
                SELECT COUNT(*)
                FROM embedding_cache
                WHERE embedding_small IS NOT NULL
            """)

            if count == 0:
                return False, "✗ No embeddings found in database"

            return True, f"✓ Found {count} embeddings in database"

        finally:
            await conn.close()
    except Exception as e:
        return False, f"✗ Error checking embeddings: {e}"


async def main():
    """Main verification flow."""
    print("=" * 80)
    print("PIPELINE SETUP VERIFICATION")
    print("=" * 80)
    print()

    all_checks_passed = True

    # Check 1: Pipeline directory
    print("1. Checking pipeline directory...")
    pipeline_dir = Path(__file__).parent
    print(f"   Location: {pipeline_dir}")
    print(f"   ✓ Pipeline directory exists")
    print()

    # Check 2: Required scripts
    print("2. Checking required scripts...")
    required_scripts = [
        "01_extract_embeddings.py",
        "02_reduce_with_umap.py",
        "03_update_database.py",
        "04_export_tsv.py",
        "run_pipeline.py",
    ]

    for script in required_scripts:
        script_path = pipeline_dir / script
        if script_path.exists():
            print(f"   ✓ {script}")
        else:
            print(f"   ✗ {script} (missing)")
            all_checks_passed = False
    print()

    # Check 3: Environment file
    print("3. Checking environment file...")
    env_path = Path("/Users/johncurtis/projects/zebra-data-parser-h2b/.env.local")

    if not env_path.exists():
        print(f"   ✗ {env_path} not found")
        all_checks_passed = False
    else:
        print(f"   ✓ Found: {env_path}")
        load_dotenv(env_path)

        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print(f"   ✗ DATABASE_URL not set in .env.local")
            all_checks_passed = False
        else:
            print(f"   ✓ DATABASE_URL is set")
    print()

    # Check 4: Database connection
    if database_url:
        print("4. Testing database connection...")
        success, message = await check_database_connection(database_url)
        print(f"   {message}")
        if not success:
            all_checks_passed = False
        print()

        # Check 5: Embeddings exist
        if success:
            print("5. Checking for embeddings...")
            success, message = await check_embeddings_exist(database_url)
            print(f"   {message}")
            if not success:
                all_checks_passed = False
            print()

    # Summary
    print("=" * 80)
    if all_checks_passed:
        print("✓ ALL CHECKS PASSED")
        print("=" * 80)
        print()
        print("You're ready to run the pipeline!")
        print()
        print("Run the complete pipeline:")
        print("  uv run run_pipeline.py")
        print()
        print("Or run individual steps:")
        print("  uv run 01_extract_embeddings.py")
        print("  uv run 02_reduce_with_umap.py")
        print("  uv run 03_update_database.py")
        print("  uv run 04_export_tsv.py")
    else:
        print("✗ SOME CHECKS FAILED")
        print("=" * 80)
        print()
        print("Please resolve the issues above before running the pipeline.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
