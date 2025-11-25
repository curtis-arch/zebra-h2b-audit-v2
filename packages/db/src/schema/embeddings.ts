import {
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";

/**
 * Embedding Cache - Stores OpenAI embeddings for text values with UMAP visualizations
 *
 * This table caches embeddings to avoid redundant API calls and stores
 * pre-computed UMAP dimensionality reductions for 2D and 3D visualization.
 *
 * The embeddings are generated from text values (like attribute labels)
 * and the UMAP coordinates are computed offline by a Python script.
 */
export const embeddingCache = pgTable(
  "embedding_cache",
  {
    id: serial("id").primaryKey(),

    // Original text value and its hash for deduplication
    value: text("value").notNull(),
    valueHash: text("value_hash").notNull(),

    // OpenAI embeddings at different dimensions
    // embedding_small: text-embedding-3-small (1536 dimensions)
    // embedding_large: text-embedding-3-large (3072 dimensions)
    embeddingSmall: vector("embedding_small", { dimensions: 1536 }).notNull(),
    embeddingLarge: vector("embedding_large", { dimensions: 3072 }).notNull(),

    // UMAP 2D coordinates (derived from embedding_small)
    // Used for 2D scatter plots and visualization dashboards
    // Initially NULL, populated by Python UMAP script
    umapX2d: real("umap_x_2d"),
    umapY2d: real("umap_y_2d"),

    // UMAP 3D coordinates (derived from embedding_small)
    // Used for interactive 3D visualizations
    // Initially NULL, populated by Python UMAP script
    umapX3d: real("umap_x_3d"),
    umapY3d: real("umap_y_3d"),
    umapZ3d: real("umap_z_3d"),

    // Metadata about the source of this embedding
    sourceTable: text("source_table"),
    sourceColumn: text("source_column"),

    // Usage tracking and audit
    usageCount: integer("usage_count").default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // Unique constraint: one cache entry per unique text value
    uqEmbeddingValueHash: uniqueIndex("uq_embedding_value_hash").on(
      table.valueHash
    ),
    // Index for source lookups
    idxEmbeddingSource: index("idx_embedding_source").on(
      table.sourceTable,
      table.sourceColumn
    ),
    // Index for finding records that need UMAP computation
    idxEmbeddingUmap2d: index("idx_embedding_umap_2d").on(
      table.umapX2d,
      table.umapY2d
    ),
    idxEmbeddingUmap3d: index("idx_embedding_umap_3d").on(
      table.umapX3d,
      table.umapY3d,
      table.umapZ3d
    ),
  })
);

export type EmbeddingCache = typeof embeddingCache.$inferSelect;
export type NewEmbeddingCache = typeof embeddingCache.$inferInsert;
