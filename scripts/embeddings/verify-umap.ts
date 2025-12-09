#!/usr/bin/env bun
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const result = await sql`
  SELECT COUNT(*) as count
  FROM embedding_cache
  WHERE umap_x_2d IS NOT NULL
`;

console.log("UMAP coordinates in database:", result[0].count);

// Show sample records
const samples = await sql`
  SELECT value, umap_x_2d, umap_y_2d, umap_x_3d, umap_y_3d, umap_z_3d
  FROM embedding_cache
  WHERE umap_x_2d IS NOT NULL
  LIMIT 5
`;

console.log("\nSample UMAP coordinates:");
for (const row of samples) {
  console.log(`  ${row.value}`);
  console.log(`    2D: (${row.umap_x_2d}, ${row.umap_y_2d})`);
  console.log(`    3D: (${row.umap_x_3d}, ${row.umap_y_3d}, ${row.umap_z_3d})`);
}
