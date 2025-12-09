# Python Embedding Tools Analysis

## Source Projects
- `/Users/johncurtis/projects/zebra-data-parser-h2b/embedding_tools` - Regular embeddings
- `/Users/johncurtis/projects/zebra-data-parser-h2b/visualization_pipeline` - UMAP reduction

## Key Findings

### OpenAI Models
- **Dual model strategy**: text-embedding-3-large AND text-embedding-3-small
- Large: 3072 dimensions
- Small: 1536 dimensions (used for similarity and UMAP)
- Both are generated concurrently

### Batch Processing
- Batch size: 2048 texts per API call
- Retry attempts: 5 with exponential backoff
- Rate limiting handled internally

### UMAP Parameters
```python
UMAP_N_NEIGHBORS = 20
UMAP_MIN_DIST = 0.1
UMAP_METRIC = "cosine"
UMAP_RANDOM_STATE = 42
UMAP_COMPONENTS = [2, 3]  # Both 2D and 3D
```

### Database Caching
- Hash algorithm: SHA-256
- Cache table: `embedding_cache`
- Cache provides 40-250x speedup on hits

## Integration Recommendations

### For TypeScript/Bun Scripts
1. Use OpenAI Node SDK for embedding generation
2. Keep text-embedding-3-small for consistency with existing data
3. Consider generating embedding_large too for future flexibility
4. UMAP requires Python (umap-learn library) - can't easily port to TS

### UMAP Strategy
Since UMAP requires Python (scikit-learn + umap-learn), options:
1. **Keep Python script** - Run via `uv run` from scripts/
2. **Separate pipeline** - UMAP updates don't need to be real-time
3. **Skip UMAP for HTB** - May not need visualization for attribute matching

### Recommended Approach
For the HTB embeddings:
- Generate text-embedding-3-small only (matches existing HNSW index)
- Skip UMAP initially (can add later if visualization needed)
- Use Bun/TS for embedding sync script
- Keep existing Python pipeline for UMAP when needed

## Cost Analysis
- text-embedding-3-small: $0.02 / 1M tokens
- ~100 HTB attributes ≈ 500 tokens total
- Cost: < $0.01 for full HTB embedding run
