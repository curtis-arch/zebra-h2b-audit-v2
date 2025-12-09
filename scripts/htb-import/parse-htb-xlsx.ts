#!/usr/bin/env bun

/**
 * HTB XLSX Parser Script
 *
 * Parses the HTB attribute mapping Excel file and extracts structured data.
 * Key column: Column A - "Attribute Name for HTB" (used for embeddings)
 *
 * Usage: bun run parse-htb-xlsx.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import * as XLSX from "xlsx";

interface ParsedHtbData {
  metadata: {
    filename: string;
    parsedAt: string;
    sheetName: string;
  };
  columns: string[];
  rows: Record<string, unknown>[];
  stats: {
    totalRows: number;
    uniqueAttributeNames: number;
  };
}

/**
 * Parse the HTB XLSX file and extract structured data
 */
function parseHtbXlsx(filePath: string): ParsedHtbData {
  console.log(`📄 Reading file: ${filePath}`);

  // Read the file
  const fileBuffer = readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });

  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  console.log(`📊 Processing sheet: "${sheetName}"`);

  // Convert to JSON with header row
  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  if (jsonData.length === 0) {
    throw new Error("No data found in the worksheet");
  }

  // First row contains column headers
  const columns = jsonData[0] as string[];
  console.log(`📋 Columns found: ${columns.length}`);
  console.log(`   ${columns.join(", ")}`);

  // Convert remaining rows to objects
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as unknown[];
    const rowObj: Record<string, unknown> = {};

    columns.forEach((col, idx) => {
      rowObj[col] = row[idx] !== undefined ? row[idx] : "";
    });

    rows.push(rowObj);
  }

  // Extract Column A values (Attribute Name for HTB)
  const attributeNameColumn = columns[0];
  const attributeNames = rows
    .map((row) => row[attributeNameColumn])
    .filter((val) => val && String(val).trim() !== "");

  const uniqueAttributeNames = new Set(attributeNames).size;

  // Build the result
  const result: ParsedHtbData = {
    metadata: {
      filename: filePath.split("/").pop() || filePath,
      parsedAt: new Date().toISOString(),
      sheetName,
    },
    columns,
    rows,
    stats: {
      totalRows: rows.length,
      uniqueAttributeNames,
    },
  };

  return result;
}

// Export for use by import script
export { parseHtbXlsx, type ParsedHtbData };

/**
 * Main execution
 */
function main() {
  console.log("🚀 HTB XLSX Parser\n");

  const scriptDir = dirname(Bun.main);
  const xlsxPath = join(
    scriptDir,
    "../../HTB-attribute-mapping-zebra-provided.xlsx"
  );

  try {
    const parsedData = parseHtbXlsx(xlsxPath);

    console.log("\n✅ Parse Results:");
    console.log("─".repeat(50));
    console.log(`📁 File: ${parsedData.metadata.filename}`);
    console.log(`📄 Sheet: ${parsedData.metadata.sheetName}`);
    console.log(`🕒 Parsed at: ${parsedData.metadata.parsedAt}`);
    console.log(`📊 Total columns: ${parsedData.columns.length}`);
    console.log(`📝 Total rows: ${parsedData.stats.totalRows}`);
    console.log(
      `🔤 Unique attribute names: ${parsedData.stats.uniqueAttributeNames}`
    );
    console.log("─".repeat(50));

    console.log("\n📋 Sample rows (first 3):");
    parsedData.rows.slice(0, 3).forEach((row, idx) => {
      console.log(`\nRow ${idx + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        if (value) {
          console.log(`  ${key}: ${value}`);
        }
      });
    });

    const columnAName = parsedData.columns[0];
    console.log(`\n🎯 Column A ("${columnAName}") - First 10 values:`);
    parsedData.rows.slice(0, 10).forEach((row, idx) => {
      const value = row[columnAName];
      if (value) {
        console.log(`  ${idx + 1}. ${value}`);
      }
    });

    const outputPath = join(scriptDir, "parsed-htb-data.json");
    writeFileSync(outputPath, JSON.stringify(parsedData, null, 2));
    console.log(`\n💾 Full data saved to: ${outputPath}`);
  } catch (error) {
    console.error("❌ Error parsing XLSX file:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}
