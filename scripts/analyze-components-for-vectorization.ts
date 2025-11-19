/**
 * Analyze config_option_component for vectorization opportunities
 *
 * This script queries the database to find:
 * 1. Total count of unique raw_value entries per component_type
 * 2. Sample variations that look similar but aren't exact matches
 * 3. Focus areas: connectivity, memory_spec, region
 * 4. Overall scope for vector generation
 */

import { configOptionComponent, db } from "@zebra-h2b-audit-v2/db";
import { eq, isNotNull, sql } from "drizzle-orm";

interface ComponentStats {
  componentType: string;
  uniqueRawValues: number;
  totalComponents: number;
  sampleVariations: Array<{
    rawValue: string;
    count: number;
  }>;
}

async function analyzeComponents() {
  console.log("🔍 Analyzing config_option_component for vectorization...\n");

  // 1. Get overall statistics
  const totalCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(configOptionComponent);

  console.log(`Total components in database: ${totalCount[0]?.count || 0}`);

  // 2. Get unique raw_value count
  const uniqueRawValues = await db
    .select({ count: sql<number>`count(distinct raw_value)` })
    .from(configOptionComponent);

  console.log(`Unique raw_value entries: ${uniqueRawValues[0]?.count || 0}`);

  // 3. Analyze by component_type
  const componentTypes = await db
    .select({
      componentType: configOptionComponent.componentType,
      uniqueValues: sql<number>`count(distinct raw_value)`,
      totalCount: sql<number>`count(*)`,
    })
    .from(configOptionComponent)
    .where(isNotNull(configOptionComponent.componentType))
    .groupBy(configOptionComponent.componentType)
    .orderBy(sql`count(distinct raw_value) desc`);

  console.log("\n📊 Component Types Statistics:\n");
  console.log("Component Type          | Unique Values | Total Components");
  console.log("------------------------|---------------|------------------");

  for (const ct of componentTypes) {
    const type = ct.componentType || "null";
    const padded = type.padEnd(22);
    const unique = ct.uniqueValues.toString().padStart(13);
    const total = ct.totalCount.toString().padStart(16);
    console.log(`${padded} | ${unique} | ${total}`);
  }

  // 4. Focus on target component types
  const targetTypes = ["connectivity", "memory_spec", "region"];
  const results: ComponentStats[] = [];

  for (const targetType of targetTypes) {
    console.log(`\n\n🎯 Analyzing: ${targetType}\n`);
    console.log("=".repeat(60));

    // Get frequency distribution
    const variations = await db
      .select({
        rawValue: configOptionComponent.rawValue,
        count: sql<number>`count(*)`,
      })
      .from(configOptionComponent)
      .where(eq(configOptionComponent.componentType, targetType))
      .groupBy(configOptionComponent.rawValue)
      .orderBy(sql`count(*) desc`)
      .limit(50);

    // Get total unique count
    const uniqueCount = await db
      .select({ count: sql<number>`count(distinct raw_value)` })
      .from(configOptionComponent)
      .where(eq(configOptionComponent.componentType, targetType));

    // Get total components
    const totalComponents = await db
      .select({ count: sql<number>`count(*)` })
      .from(configOptionComponent)
      .where(eq(configOptionComponent.componentType, targetType));

    console.log(`Total unique values: ${uniqueCount[0]?.count || 0}`);
    console.log(`Total components: ${totalComponents[0]?.count || 0}`);
    console.log("\nTop 50 variations by frequency:\n");

    for (const v of variations) {
      console.log(`  ${v.count.toString().padStart(4)}x  "${v.rawValue}"`);
    }

    results.push({
      componentType: targetType,
      uniqueRawValues: uniqueCount[0]?.count || 0,
      totalComponents: totalComponents[0]?.count || 0,
      sampleVariations: variations.slice(0, 30).map((v) => ({
        rawValue: v.rawValue,
        count: Number(v.count),
      })),
    });
  }

  // 5. Find similar-looking variations (manual inspection patterns)
  console.log("\n\n🔍 Potential Normalization Opportunities:\n");
  console.log("=".repeat(60));

  for (const result of results) {
    console.log(`\n${result.componentType.toUpperCase()}:`);
    console.log("-".repeat(40));

    // Group similar patterns
    const patterns = new Map<string, string[]>();

    for (const variation of result.sampleVariations) {
      const normalized = variation.rawValue
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^\w]/g, "");

      if (!patterns.has(normalized)) {
        patterns.set(normalized, []);
      }
      patterns.get(normalized)?.push(variation.rawValue);
    }

    // Show groups with multiple variations
    for (const [normalized, values] of patterns) {
      if (values.length > 1) {
        console.log(`\nSimilar variations (normalized: "${normalized}"):`);
        for (const val of values) {
          console.log(`  - "${val}"`);
        }
      }
    }
  }

  // 6. Calculate scope
  const totalVectorsNeeded = uniqueRawValues[0]?.count || 0;
  const targetVectorsNeeded = results.reduce(
    (sum, r) => sum + r.uniqueRawValues,
    0
  );

  console.log("\n\n📈 VECTORIZATION SCOPE:\n");
  console.log("=".repeat(60));
  console.log(`Total unique values across ALL types: ${totalVectorsNeeded}`);
  console.log(`Total unique values in TARGET types: ${targetVectorsNeeded}`);
  console.log("\nTarget breakdown:");
  for (const result of results) {
    console.log(
      `  - ${result.componentType}: ${result.uniqueRawValues} vectors`
    );
  }

  return {
    totalComponents: totalCount[0]?.count || 0,
    totalUniqueValues: totalVectorsNeeded,
    componentTypeStats: componentTypes,
    targetAnalysis: results,
    scopeSummary: {
      totalVectorsNeeded,
      targetVectorsNeeded,
    },
  };
}

// Run the analysis
analyzeComponents()
  .then((results) => {
    console.log("\n✅ Analysis complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error during analysis:", error);
    process.exit(1);
  });
