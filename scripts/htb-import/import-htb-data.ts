#!/usr/bin/env bun

/**
 * HTB Data Import Script
 *
 * Imports parsed HTB attribute mapping data into Neon PostgreSQL.
 * Uses ON CONFLICT to handle upserts on attribute_name_for_htb.
 *
 * Usage: bun run import-htb-data.ts
 */

import { neon } from "@neondatabase/serverless";
import { dirname, join } from "path";
import { parseHtbXlsx } from "./parse-htb-xlsx";

/**
 * Column mapping from Excel headers to database column names
 */
const COLUMN_MAP: Record<string, string> = {
  "Attribute Name for HTB": "attribute_name_for_htb",
  "PIM Attribute": "pim_attribute",
  "PIM Data Type": "pim_data_type",
  "Length validation in PIM": "length_validation_in_pim",
  "Other Validation in PIM": "other_validation_in_pim",
  "AEM_Content Fragment Attribute Name(backend)": "aem_cf_attribute_name",
  "AEM_CF Label": "aem_cf_label",
  "AEM_CF Data Type": "aem_cf_data_type",
  "AEM_Length validation in CF": "aem_length_validation",
  Note: "note",
  "Original Source": "original_source",
  Synonym: "synonym",
  Required: "required",
  "Product Category": "product_category",
  "Luisa Check PIM attributes": "luisa_check_pim_attributes",
  "Michelle Check PIM attributes": "michelle_check_pim_attributes",
  Length: "length",
  "Attribute Family": "attribute_family",
  "Where CF Used": "where_cf_used",
  "Where Data Used": "where_data_used",
  Notes: "notes",
  "Cleanup Action": "cleanup_action",
  "Review by": "review_by",
  "Content Type?": "content_type",
};

/**
 * Normalize cell value for database insertion
 */
function normalizeValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const str = String(value).trim();
  return str === "" ? null : str;
}

/**
 * Transform parsed row to database row
 */
function transformRow(
  excelRow: Record<string, unknown>
): Record<string, string | null> {
  const dbRow: Record<string, string | null> = {};

  for (const [excelHeader, dbColumn] of Object.entries(COLUMN_MAP)) {
    dbRow[dbColumn] = normalizeValue(excelRow[excelHeader]);
  }

  return dbRow;
}

/**
 * Main import function
 */
async function main() {
  console.log("🚀 HTB Data Import Script\n");

  // Verify DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL environment variable not set");
    console.error("   Set it in your .env file or export it in your shell");
    process.exit(1);
  }

  // Initialize Neon client
  const sql = neon(process.env.DATABASE_URL);
  console.log("✅ Connected to Neon database");

  // Parse the XLSX file
  const scriptDir = dirname(Bun.main);
  const xlsxPath = join(
    scriptDir,
    "../../HTB-attribute-mapping-zebra-provided.xlsx"
  );

  console.log(`📄 Parsing XLSX file: ${xlsxPath}\n`);
  const parsedData = parseHtbXlsx(xlsxPath);

  console.log("📊 Parse Results:");
  console.log(`   Total rows: ${parsedData.stats.totalRows}`);
  console.log(`   Columns: ${parsedData.columns.length}`);
  console.log(
    `   Unique attributes: ${parsedData.stats.uniqueAttributeNames}\n`
  );

  // Import data with progress tracking
  console.log("💾 Starting database import...\n");

  let insertedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  const errors: Array<{
    row: number;
    error: string;
    data: Record<string, unknown>;
  }> = [];

  for (let i = 0; i < parsedData.rows.length; i++) {
    const excelRow = parsedData.rows[i];
    const rowNumber = i + 2; // Excel row (header is row 1, data starts at row 2)

    try {
      // Transform the row
      const dbRow = transformRow(excelRow);

      // Skip rows without attribute_name_for_htb (required field)
      if (!dbRow.attribute_name_for_htb) {
        console.warn(
          `⚠️  Row ${rowNumber}: Skipping - no attribute_name_for_htb`
        );
        continue;
      }

      // Perform upsert with ON CONFLICT
      const result = await sql`
        INSERT INTO htb_attribute_mapping_zebra_provided (
          attribute_name_for_htb,
          pim_attribute,
          pim_data_type,
          length_validation_in_pim,
          other_validation_in_pim,
          aem_cf_attribute_name,
          aem_cf_label,
          aem_cf_data_type,
          aem_length_validation,
          note,
          original_source,
          synonym,
          required,
          product_category,
          luisa_check_pim_attributes,
          michelle_check_pim_attributes,
          length,
          attribute_family,
          where_cf_used,
          where_data_used,
          notes,
          cleanup_action,
          review_by,
          content_type,
          updated_at
        )
        VALUES (
          ${dbRow.attribute_name_for_htb},
          ${dbRow.pim_attribute},
          ${dbRow.pim_data_type},
          ${dbRow.length_validation_in_pim},
          ${dbRow.other_validation_in_pim},
          ${dbRow.aem_cf_attribute_name},
          ${dbRow.aem_cf_label},
          ${dbRow.aem_cf_data_type},
          ${dbRow.aem_length_validation},
          ${dbRow.note},
          ${dbRow.original_source},
          ${dbRow.synonym},
          ${dbRow.required},
          ${dbRow.product_category},
          ${dbRow.luisa_check_pim_attributes},
          ${dbRow.michelle_check_pim_attributes},
          ${dbRow.length},
          ${dbRow.attribute_family},
          ${dbRow.where_cf_used},
          ${dbRow.where_data_used},
          ${dbRow.notes},
          ${dbRow.cleanup_action},
          ${dbRow.review_by},
          ${dbRow.content_type},
          NOW()
        )
        ON CONFLICT (attribute_name_for_htb)
        DO UPDATE SET
          pim_attribute = EXCLUDED.pim_attribute,
          pim_data_type = EXCLUDED.pim_data_type,
          length_validation_in_pim = EXCLUDED.length_validation_in_pim,
          other_validation_in_pim = EXCLUDED.other_validation_in_pim,
          aem_cf_attribute_name = EXCLUDED.aem_cf_attribute_name,
          aem_cf_label = EXCLUDED.aem_cf_label,
          aem_cf_data_type = EXCLUDED.aem_cf_data_type,
          aem_length_validation = EXCLUDED.aem_length_validation,
          note = EXCLUDED.note,
          original_source = EXCLUDED.original_source,
          synonym = EXCLUDED.synonym,
          required = EXCLUDED.required,
          product_category = EXCLUDED.product_category,
          luisa_check_pim_attributes = EXCLUDED.luisa_check_pim_attributes,
          michelle_check_pim_attributes = EXCLUDED.michelle_check_pim_attributes,
          length = EXCLUDED.length,
          attribute_family = EXCLUDED.attribute_family,
          where_cf_used = EXCLUDED.where_cf_used,
          where_data_used = EXCLUDED.where_data_used,
          notes = EXCLUDED.notes,
          cleanup_action = EXCLUDED.cleanup_action,
          review_by = EXCLUDED.review_by,
          content_type = EXCLUDED.content_type,
          updated_at = NOW()
        RETURNING (xmax = 0) AS inserted
      `;

      // Track insert vs update
      if (result.length > 0 && result[0].inserted) {
        insertedCount++;
      } else {
        updatedCount++;
      }

      // Progress indicator
      if ((i + 1) % 10 === 0 || i === parsedData.rows.length - 1) {
        process.stdout.write(
          `\r   Processed: ${i + 1}/${parsedData.rows.length} rows`
        );
      }
    } catch (error) {
      errorCount++;
      errors.push({
        row: rowNumber,
        error: error instanceof Error ? error.message : String(error),
        data: excelRow,
      });
      console.error(`\n❌ Error at row ${rowNumber}: ${error}`);
    }
  }

  console.log("\n");
  console.log("─".repeat(60));
  console.log("✅ Import Complete\n");
  console.log("📊 Statistics:");
  console.log(`   Inserted: ${insertedCount} rows`);
  console.log(`   Updated: ${updatedCount} rows`);
  console.log(`   Errors: ${errorCount} rows`);
  console.log(`   Total processed: ${insertedCount + updatedCount} rows`);

  // Verify final count in database
  const countResult = await sql`
    SELECT COUNT(*) as count
    FROM htb_attribute_mapping_zebra_provided
  `;
  console.log(`   Database total: ${countResult[0].count} rows`);

  if (errors.length > 0) {
    console.log("\n⚠️  Errors encountered:");
    errors.forEach(({ row, error }) => {
      console.log(`   Row ${row}: ${error}`);
    });
  }

  console.log("─".repeat(60));

  // Sample query to verify data
  console.log("\n📋 Sample records (first 5):");
  const samples = await sql`
    SELECT
      attribute_name_for_htb,
      pim_attribute,
      product_category,
      content_type
    FROM htb_attribute_mapping_zebra_provided
    ORDER BY attribute_name_for_htb
    LIMIT 5
  `;

  samples.forEach((row, idx) => {
    console.log(`\n${idx + 1}. ${row.attribute_name_for_htb}`);
    console.log(`   PIM: ${row.pim_attribute || "N/A"}`);
    console.log(`   Category: ${row.product_category || "N/A"}`);
    console.log(`   Content Type: ${row.content_type || "N/A"}`);
  });

  console.log("\n✨ Import complete!");
}

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  });
}

export { main as importHtbData };
