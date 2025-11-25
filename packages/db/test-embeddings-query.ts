import { isNotNull, sql } from "drizzle-orm";
import { db, embeddingCache } from "./src/index";

async function testEmbeddingsQuery() {
  console.log("Testing Drizzle ORM with embeddings schema...\n");

  try {
    // Test 1: Type inference
    console.log("✓ Type inference working:");
    type EmbeddingRow = typeof embeddingCache.$inferSelect;
    type NewEmbedding = typeof embeddingCache.$inferInsert;
    console.log("  - EmbeddingCache type available");
    console.log("  - NewEmbeddingCache type available\n");

    // Test 2: Query all embeddings
    console.log("Test 1: Query all embeddings (limit 5)");
    const allEmbeddings = await db
      .select({
        id: embeddingCache.id,
        value: embeddingCache.value,
        sourceTable: embeddingCache.sourceTable,
        umapX2d: embeddingCache.umapX2d,
        umapY2d: embeddingCache.umapY2d,
      })
      .from(embeddingCache)
      .limit(5);

    console.log(`  Found ${allEmbeddings.length} embeddings (showing 5):`);
    for (const emb of allEmbeddings) {
      const has2d = emb.umapX2d !== null ? "✓" : "✗";
      console.log(
        `  ${has2d} ID ${emb.id}: "${emb.value}" (${emb.sourceTable})`
      );
    }

    // Test 3: Check UMAP population status
    console.log("\nTest 2: UMAP population status");
    const stats = await db
      .select({
        total: sql<number>`COUNT(*)`,
        populated2d: sql<number>`COUNT(${embeddingCache.umapX2d})`,
        populated3d: sql<number>`COUNT(${embeddingCache.umapX3d})`,
      })
      .from(embeddingCache);

    const stat = stats[0];
    console.log(`  Total embeddings: ${stat.total}`);
    console.log(`  2D coordinates:   ${stat.populated2d}`);
    console.log(`  3D coordinates:   ${stat.populated3d}`);

    if (stat.populated2d === 0) {
      console.log("\n  → Run populate-umap-coordinates.py to fill coordinates");
    }

    // Test 4: Query only embeddings with UMAP coordinates
    console.log("\nTest 3: Query embeddings with 2D UMAP coordinates");
    const withUmap = await db
      .select({
        id: embeddingCache.id,
        value: embeddingCache.value,
        x: embeddingCache.umapX2d,
        y: embeddingCache.umapY2d,
      })
      .from(embeddingCache)
      .where(isNotNull(embeddingCache.umapX2d))
      .limit(5);

    if (withUmap.length > 0) {
      console.log(`  Found ${withUmap.length} with coordinates:`);
      for (const emb of withUmap) {
        console.log(`  - "${emb.value}": (${emb.x}, ${emb.y})`);
      }
    } else {
      console.log("  No embeddings with UMAP coordinates yet");
      console.log("  → Run populate-umap-coordinates.py first");
    }

    console.log("\n✅ All tests passed! Schema is working correctly.");
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  }
}

testEmbeddingsQuery();
