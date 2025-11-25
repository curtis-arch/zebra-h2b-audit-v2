#!/usr/bin/env -S uv run
"""
Master pipeline script to run all visualization steps.

This script orchestrates the entire UMAP visualization pipeline:
1. Extract embeddings from database
2. Reduce dimensions with UMAP
3. Update database with coordinates
4. Export TSV files for TensorFlow Projector
"""

# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "asyncpg>=0.29.0",
#     "numpy>=1.26.0",
#     "pandas>=2.1.0",
#     "python-dotenv>=1.0.0",
#     "umap-learn>=0.5.5",
#     "scikit-learn>=1.4.0",
# ]
# ///

import subprocess
import sys
import time
from pathlib import Path


def run_script(script_path: Path, description: str) -> bool:
    """
    Run a Python script and report results.

    Args:
        script_path: Path to the script
        description: Human-readable description

    Returns:
        True if successful, False otherwise
    """
    print("=" * 80)
    print(f"STEP: {description}")
    print("=" * 80)
    print(f"Running: {script_path.name}")
    print()

    start_time = time.time()

    try:
        # Run script with uv
        result = subprocess.run(
            ["uv", "run", str(script_path)],
            cwd=script_path.parent,
            check=True,
            text=True,
            capture_output=False
        )

        elapsed = time.time() - start_time
        print()
        print(f"✓ Completed in {elapsed:.2f}s")
        print()
        return True

    except subprocess.CalledProcessError as e:
        elapsed = time.time() - start_time
        print()
        print(f"❌ Failed after {elapsed:.2f}s")
        print(f"Exit code: {e.returncode}")
        return False
    except Exception as e:
        print()
        print(f"❌ Error: {e}")
        return False


def main():
    """Main execution flow."""
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 78 + "║")
    print("║" + "  ZEBRA H2B EMBEDDING VISUALIZATION PIPELINE".center(78) + "║")
    print("║" + " " * 78 + "║")
    print("╚" + "=" * 78 + "╝")
    print()

    pipeline_dir = Path(__file__).parent

    # Define pipeline steps
    steps = [
        (pipeline_dir / "01_extract_embeddings.py", "Extract embeddings from database"),
        (pipeline_dir / "02_reduce_with_umap.py", "Reduce dimensions with UMAP"),
        (pipeline_dir / "03_update_database.py", "Update database with coordinates"),
        (pipeline_dir / "04_export_tsv.py", "Export TSV files for TensorFlow Projector"),
    ]

    # Verify all scripts exist
    print("Checking pipeline scripts...")
    for script_path, description in steps:
        if not script_path.exists():
            print(f"❌ Missing: {script_path.name}")
            sys.exit(1)
        print(f"✓ Found: {script_path.name}")
    print()

    # Run pipeline
    start_time = time.time()
    successful_steps = 0

    for idx, (script_path, description) in enumerate(steps, 1):
        print(f"\n[Step {idx}/{len(steps)}]\n")

        success = run_script(script_path, description)

        if not success:
            print()
            print("=" * 80)
            print("PIPELINE FAILED")
            print("=" * 80)
            print(f"Failed at step {idx}: {description}")
            print()
            print("To retry from this step, run:")
            print(f"  uv run {script_path.name}")
            sys.exit(1)

        successful_steps += 1
        time.sleep(1)  # Brief pause between steps

    # Success!
    total_time = time.time() - start_time

    print()
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 78 + "║")
    print("║" + "  PIPELINE COMPLETE!".center(78) + "║")
    print("║" + " " * 78 + "║")
    print("╚" + "=" * 78 + "╝")
    print()

    print(f"Successfully completed {successful_steps}/{len(steps)} steps")
    print(f"Total time: {total_time:.2f}s ({total_time / 60:.1f} minutes)")
    print()

    # Show outputs
    print("=" * 80)
    print("OUTPUTS")
    print("=" * 80)
    print()

    data_dir = pipeline_dir / "data"
    tsv_dir = pipeline_dir / "tsv_export"

    print("Generated files:")
    print()
    print("Data files (intermediate):")
    for file in sorted(data_dir.glob("*")):
        size = file.stat().st_size / 1024
        print(f"  - {file.name} ({size:.1f} KB)")
    print()

    print("TSV export (for TensorFlow Projector):")
    for file in sorted(tsv_dir.glob("*.tsv")):
        size = file.stat().st_size / 1024
        print(f"  - {file.name} ({size:.1f} KB)")
    print()

    print("=" * 80)
    print("NEXT STEPS")
    print("=" * 80)
    print()
    print("1. View the visualization:")
    print("   - Open https://projector.tensorflow.org/")
    print("   - Upload vectors_2d.tsv (or vectors_3d.tsv)")
    print("   - Upload metadata.tsv")
    print()
    print("2. Database is now updated with UMAP coordinates:")
    print("   - Columns: umap_2d_x, umap_2d_y, umap_3d_x, umap_3d_y, umap_3d_z")
    print("   - Query example:")
    print("     SELECT value, umap_2d_x, umap_2d_y")
    print("     FROM embedding_cache")
    print("     WHERE source_column = 'attribute_label'")
    print()
    print("3. Use the visualization to identify:")
    print("   - Clusters of similar labels")
    print("   - Case sensitivity issues (BATTERY vs Battery)")
    print("   - Typos and encoding errors")
    print("   - Labels that should be normalized")
    print()


if __name__ == "__main__":
    main()
