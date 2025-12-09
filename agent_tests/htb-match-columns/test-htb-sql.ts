/**
 * Test script for HTB exact match and distance CTEs
 * Validates the SQL modifications made to getComponentTypesWithSimilarity
 */

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function testHTBQueries() {
  console.log("=== HTB SQL Query Tests ===\n");

  // Test 1: HTB exact matches
  console.log("Test 1: HTB Exact Match CTE");
  console.log("Expected: Returns 'yes' or 'no' for each component_type");
  try {
    const exactMatches = await sql`
      WITH htb_exact_matches AS (
        SELECT
          c.component_type,
          CASE
            WHEN EXISTS (
              SELECT 1 FROM htb_attribute_mapping_zebra_provided h
              WHERE LOWER(h.attribute_name_for_htb) = LOWER(c.component_type)
            ) THEN 'yes'
            ELSE 'no'
          END as htb_match
        FROM (SELECT DISTINCT component_type FROM config_option_component WHERE component_type IS NOT NULL LIMIT 5) c
      )
      SELECT * FROM htb_exact_matches;
    `;
    console.log("✓ Query executed successfully");
    console.log(
      "Sample results:",
      JSON.stringify(exactMatches.slice(0, 3), null, 2)
    );
    console.log(`Total results: ${exactMatches.length}\n`);
  } catch (error: any) {
    console.error("✗ Error:", error.message);
  }

  // Test 2: HTB distance matches with embeddings
  console.log("Test 2: HTB Distance Match CTE");
  console.log("Expected: Returns jsonb array with value + matchPercentage");
  try {
    const distanceMatches = await sql`
      WITH htb_distance_matches AS (
        SELECT
          ct.component_type,
          jsonb_agg(
            jsonb_build_object(
              'value', ec2.value,
              'matchPercentage', ROUND(((1 - (ec.embedding_small <=> ec2.embedding_small)) * 100)::numeric, 1)
            ) ORDER BY (1 - (ec.embedding_small <=> ec2.embedding_small)) DESC
          ) FILTER (WHERE ec2.value IS NOT NULL) as htb_similar_matches
        FROM (SELECT DISTINCT component_type FROM config_option_component WHERE component_type IS NOT NULL LIMIT 3) ct
        LEFT JOIN embedding_cache ec ON ec.value = ct.component_type AND ec.source_column = 'attribute_label'
        LEFT JOIN embedding_cache ec2
          ON ec2.source_column = 'attribute_name_for_htb'
          AND ec.embedding_small IS NOT NULL
          AND ec2.embedding_small IS NOT NULL
          AND (1 - (ec.embedding_small <=> ec2.embedding_small)) >= 0.3
        GROUP BY ct.component_type
      )
      SELECT * FROM htb_distance_matches;
    `;
    console.log("✓ Query executed successfully");
    console.log(
      "Sample results:",
      JSON.stringify(distanceMatches.slice(0, 2), null, 2)
    );
    console.log(`Total results: ${distanceMatches.length}\n`);
  } catch (error: any) {
    console.error("✗ Error:", error.message);
  }

  // Test 3: Full integrated query (simplified)
  console.log("Test 3: Full Integrated Query");
  console.log(
    "Expected: All fields including htb_match and htb_similar_matches"
  );
  try {
    const fullQuery = await sql`
      WITH component_stats AS (
        SELECT
          component_type,
          COUNT(DISTINCT option_id) as product_count,
          COUNT(DISTINCT sequence_position) as position_count,
          array_agg(DISTINCT sequence_position::text ORDER BY sequence_position::text) as positions
        FROM config_option_component
        WHERE component_type IS NOT NULL
        GROUP BY component_type
        LIMIT 5
      ),
      htb_exact_matches AS (
        SELECT
          c.component_type,
          CASE
            WHEN EXISTS (
              SELECT 1 FROM htb_attribute_mapping_zebra_provided h
              WHERE LOWER(h.attribute_name_for_htb) = LOWER(c.component_type)
            ) THEN 'yes'
            ELSE 'no'
          END as htb_match
        FROM (SELECT DISTINCT component_type FROM config_option_component WHERE component_type IS NOT NULL) c
      ),
      htb_distance_matches AS (
        SELECT
          ct.component_type,
          jsonb_agg(
            jsonb_build_object(
              'value', ec2.value,
              'matchPercentage', ROUND(((1 - (ec.embedding_small <=> ec2.embedding_small)) * 100)::numeric, 1)
            ) ORDER BY (1 - (ec.embedding_small <=> ec2.embedding_small)) DESC
          ) FILTER (WHERE ec2.value IS NOT NULL) as htb_similar_matches
        FROM (SELECT DISTINCT component_type FROM config_option_component WHERE component_type IS NOT NULL) ct
        LEFT JOIN embedding_cache ec ON ec.value = ct.component_type AND ec.source_column = 'attribute_label'
        LEFT JOIN embedding_cache ec2
          ON ec2.source_column = 'attribute_name_for_htb'
          AND ec.embedding_small IS NOT NULL
          AND ec2.embedding_small IS NOT NULL
          AND (1 - (ec.embedding_small <=> ec2.embedding_small)) >= 0.3
        GROUP BY ct.component_type
      )
      SELECT
        cs.component_type,
        cs.product_count,
        cs.position_count,
        hem.htb_match,
        COALESCE(hdm.htb_similar_matches, '[]'::jsonb) as htb_similar_matches
      FROM component_stats cs
      LEFT JOIN htb_exact_matches hem ON cs.component_type = hem.component_type
      LEFT JOIN htb_distance_matches hdm ON cs.component_type = hdm.component_type
      ORDER BY cs.component_type;
    `;
    console.log("✓ Query executed successfully");
    console.log(
      "Sample results:",
      JSON.stringify(fullQuery.slice(0, 2), null, 2)
    );
    console.log(`Total results: ${fullQuery.length}\n`);
  } catch (error: any) {
    console.error("✗ Error:", error.message);
  }

  // Test 4: Check data availability
  console.log("Test 4: Data Availability Check");
  try {
    const htbCount = await sql`
      SELECT COUNT(*) as count FROM htb_attribute_mapping_zebra_provided WHERE attribute_name_for_htb IS NOT NULL;
    `;
    console.log(`HTB attributes available: ${htbCount[0].count}`);

    const embeddingCount = await sql`
      SELECT COUNT(*) as count FROM embedding_cache WHERE source_column = 'attribute_name_for_htb' AND embedding_small IS NOT NULL;
    `;
    console.log(`HTB embeddings available: ${embeddingCount[0].count}`);

    const componentCount = await sql`
      SELECT COUNT(DISTINCT component_type) as count FROM config_option_component WHERE component_type IS NOT NULL;
    `;
    console.log(`Component types available: ${componentCount[0].count}\n`);
  } catch (error: any) {
    console.error("✗ Error:", error.message);
  }

  console.log("=== Tests Complete ===");
}

testHTBQueries().catch(console.error);
