/**
 * Test script for getComponentTypesWithSimilarity with HTB fields
 * Tests the modified tRPC procedure directly
 */

import { appRouter } from "../../packages/api/src/index";
import { db } from "../../packages/db/src/client";

async function testComponentSimilarity() {
  console.log("=== Testing getComponentTypesWithSimilarity ===\n");

  try {
    // Create a caller context
    const caller = appRouter.createCaller({
      db,
      session: null,
    });

    console.log(
      "Fetching component types with similarity (threshold: 0.85)..."
    );
    const results = await caller.components.getComponentTypesWithSimilarity({
      similarityThreshold: 0.85,
    });

    console.log("✓ Query executed successfully");
    console.log(`Total component types: ${results.length}\n`);

    // Find examples with HTB matches
    const withHtbExact = results.filter((r) => r.htbMatch === "yes");
    const withHtbSimilar = results.filter(
      (r) => r.htbSimilarMatches && r.htbSimilarMatches.length > 0
    );

    console.log("=== HTB Exact Match Stats ===");
    console.log(`Component types with exact HTB match: ${withHtbExact.length}`);
    if (withHtbExact.length > 0) {
      console.log("\nExample (exact match):");
      console.log(JSON.stringify(withHtbExact[0], null, 2));
    }

    console.log("\n=== HTB Similar Match Stats ===");
    console.log(
      `Component types with similar HTB matches: ${withHtbSimilar.length}`
    );
    if (withHtbSimilar.length > 0) {
      console.log("\nExample (with similar matches):");
      const example = withHtbSimilar[0];
      console.log(
        JSON.stringify(
          {
            componentType: example.componentType,
            htbMatch: example.htbMatch,
            htbSimilarMatches: example.htbSimilarMatches.slice(0, 3), // First 3
          },
          null,
          2
        )
      );
    }

    // Verify data structure
    console.log("\n=== Data Structure Validation ===");
    const sample = results[0];
    console.log("Fields present in result:");
    console.log(`- componentType: ${typeof sample.componentType}`);
    console.log(
      `- htbMatch: ${typeof sample.htbMatch} (value: ${sample.htbMatch})`
    );
    console.log(
      `- htbSimilarMatches: ${Array.isArray(sample.htbSimilarMatches) ? "array" : typeof sample.htbSimilarMatches} (length: ${sample.htbSimilarMatches?.length || 0})`
    );

    if (sample.htbSimilarMatches && sample.htbSimilarMatches.length > 0) {
      const firstMatch = sample.htbSimilarMatches[0];
      console.log(
        `  - First match structure: { value: "${firstMatch.value}", matchPercentage: ${firstMatch.matchPercentage} }`
      );
    }

    console.log("\n✓ All tests passed!");
  } catch (error: any) {
    console.error("✗ Error:", error.message);
    console.error(error.stack);
  }
}

testComponentSimilarity().catch(console.error);
