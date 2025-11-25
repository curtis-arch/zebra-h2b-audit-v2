#!/usr/bin/env -S uv run
"""
Apply UMAP dimensionality reduction to embeddings.

This script:
1. Loads the extracted embeddings
2. Applies UMAP to create 2D and 3D coordinates
3. Saves the reduced coordinates for database storage and TSV export
"""

# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "umap-learn>=0.5.5",
#     "numpy>=1.26.0",
#     "pandas>=2.1.0",
#     "scikit-learn>=1.4.0",
# ]
# ///

import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
import umap


def reduce_embeddings(
    embeddings: np.ndarray,
    n_components: int,
    n_neighbors: int = 20,
    min_dist: float = 0.1,
    metric: str = 'cosine',
    random_state: int = 42
) -> np.ndarray:
    """
    Reduce embeddings using UMAP.

    Args:
        embeddings: High-dimensional vectors (n_samples, dimension)
        n_components: Target dimensions (2 or 3)
        n_neighbors: Balance local vs global structure
        min_dist: Minimum distance between points
        metric: Distance metric (cosine for embeddings)
        random_state: Random seed for reproducibility

    Returns:
        Reduced coordinates (n_samples, n_components)
    """
    print(f"Initializing UMAP (n_components={n_components}, n_neighbors={n_neighbors}, min_dist={min_dist}, metric={metric})...")

    reducer = umap.UMAP(
        n_components=n_components,
        n_neighbors=n_neighbors,
        min_dist=min_dist,
        metric=metric,
        random_state=random_state,
        verbose=True
    )

    print(f"Fitting UMAP on {embeddings.shape[0]} embeddings...")
    start_time = time.time()

    reduced = reducer.fit_transform(embeddings)

    elapsed = time.time() - start_time
    print(f"✓ UMAP reduction complete in {elapsed:.2f}s")
    print(f"✓ Reduced shape: {reduced.shape}")

    return reduced


def main():
    """Main execution flow."""
    print("=" * 80)
    print("UMAP DIMENSIONALITY REDUCTION")
    print("=" * 80)
    print()

    # Load embeddings
    data_dir = Path(__file__).parent / "data"
    embeddings_path = data_dir / "embeddings_1536d.npy"
    metadata_path = data_dir / "metadata.csv"

    if not embeddings_path.exists():
        print(f"❌ Error: {embeddings_path} not found")
        print("Please run 01_extract_embeddings.py first")
        sys.exit(1)

    print("Loading embeddings...")
    embeddings = np.load(embeddings_path)
    metadata = pd.read_csv(metadata_path)

    print(f"✓ Loaded embeddings: {embeddings.shape}")
    print(f"✓ Loaded metadata: {metadata.shape}")
    print()

    # UMAP parameters from research doc
    umap_params = {
        'n_neighbors': 20,
        'min_dist': 0.1,
        'metric': 'cosine',
        'random_state': 42
    }

    print("UMAP Parameters:")
    for key, value in umap_params.items():
        print(f"  {key}: {value}")
    print()

    # Reduce to 2D
    print("-" * 80)
    print("REDUCING TO 2D")
    print("-" * 80)
    reduced_2d = reduce_embeddings(embeddings, n_components=2, **umap_params)

    # Save 2D coordinates
    output_2d = data_dir / "umap_2d.npy"
    np.save(output_2d, reduced_2d)
    print(f"✓ Saved 2D coordinates to: {output_2d}")
    print()

    # Reduce to 3D
    print("-" * 80)
    print("REDUCING TO 3D")
    print("-" * 80)
    reduced_3d = reduce_embeddings(embeddings, n_components=3, **umap_params)

    # Save 3D coordinates
    output_3d = data_dir / "umap_3d.npy"
    np.save(output_3d, reduced_3d)
    print(f"✓ Saved 3D coordinates to: {output_3d}")
    print()

    # Create combined output with metadata
    print("Creating combined output files...")

    # 2D DataFrame
    df_2d = metadata.copy()
    df_2d['umap_x'] = reduced_2d[:, 0]
    df_2d['umap_y'] = reduced_2d[:, 1]
    output_2d_csv = data_dir / "umap_2d_with_metadata.csv"
    df_2d.to_csv(output_2d_csv, index=False)
    print(f"✓ Saved 2D with metadata to: {output_2d_csv}")

    # 3D DataFrame
    df_3d = metadata.copy()
    df_3d['umap_x'] = reduced_3d[:, 0]
    df_3d['umap_y'] = reduced_3d[:, 1]
    df_3d['umap_z'] = reduced_3d[:, 2]
    output_3d_csv = data_dir / "umap_3d_with_metadata.csv"
    df_3d.to_csv(output_3d_csv, index=False)
    print(f"✓ Saved 3D with metadata to: {output_3d_csv}")
    print()

    # Summary statistics
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Total embeddings processed: {len(embeddings)}")
    print(f"Original dimension: {embeddings.shape[1]}")
    print()

    print("2D Reduction:")
    print(f"  Shape: {reduced_2d.shape}")
    print(f"  X range: [{reduced_2d[:, 0].min():.3f}, {reduced_2d[:, 0].max():.3f}]")
    print(f"  Y range: [{reduced_2d[:, 1].min():.3f}, {reduced_2d[:, 1].max():.3f}]")
    print()

    print("3D Reduction:")
    print(f"  Shape: {reduced_3d.shape}")
    print(f"  X range: [{reduced_3d[:, 0].min():.3f}, {reduced_3d[:, 0].max():.3f}]")
    print(f"  Y range: [{reduced_3d[:, 1].min():.3f}, {reduced_3d[:, 1].max():.3f}]")
    print(f"  Z range: [{reduced_3d[:, 2].min():.3f}, {reduced_3d[:, 2].max():.3f}]")
    print()

    print("✓ UMAP reduction complete!")
    print("\nNext step: Run 03_update_database.py to store coordinates in the database")


if __name__ == "__main__":
    main()
