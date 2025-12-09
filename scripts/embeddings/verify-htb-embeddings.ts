#!/usr/bin/env bun
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

const result = await sql`
  SELECT COUNT(*) as count
  FROM embedding_cache
  WHERE source_table = 'htb_attribute_mapping_zebra_provided'
`;
console.log("HTB Embeddings Count:", result[0].count);

const sample = await sql`
  SELECT value, source_column, created_at,
         vector_dims(embedding_large) as large_dims,
         vector_dims(embedding_small) as small_dims
  FROM embedding_cache
  WHERE source_table = 'htb_attribute_mapping_zebra_provided'
  LIMIT 5
`;
console.log("\nSample HTB Embeddings:");
sample.forEach((row) => {
  console.log("  -", row.value);
  console.log("    Large dims:", row.large_dims, "Small dims:", row.small_dims);
});
