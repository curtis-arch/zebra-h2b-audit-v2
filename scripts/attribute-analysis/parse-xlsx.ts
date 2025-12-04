#!/usr/bin/env bun

/**
 * Excel Parser for Zebra Attribute Properties
 *
 * Parses `zebra-artifacts/sheets/attribute-comparison-by-type.xlsx` to extract:
 * - Column headers with their letter positions (A, B, C, etc.)
 * - All attribute names from Column A (preserved exactly as-is)
 * - Sample data from first 5 rows
 * - Basic statistics (row counts, empty cell counts)
 *
 * Outputs structured JSON to stdout for further analysis.
 */

import { join } from "path";
import XLSX from "xlsx";

// ============================================================================
// Type Definitions
// ============================================================================

interface ColumnInfo {
  index: number;
  letter: string;
  header: string;
  emptyCells: number;
}

interface ParsedExcelData {
  metadata: {
    filename: string;
    sheetName: string;
    totalRows: number;
    totalColumns: number;
    usedRange: string;
  };
  columns: ColumnInfo[];
  attributeNames: string[];
  sampleData: unknown[][];
  stats: {
    totalDataRows: number;
    completeRows: number;
    emptyRows: number;
  };
}

// ============================================================================
// Main Parser Function
// ============================================================================

function parseExcelFile(filepath: string): ParsedExcelData {
  // Read the Excel file
  const workbook = XLSX.readFile(filepath);

  // Get the first sheet (assuming single sheet or first sheet is target)
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Workbook has no sheets");
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  // Get the used range
  const range = worksheet["!ref"];
  if (!range) {
    throw new Error("Worksheet is empty (no !ref property)");
  }

  // Parse the range to get dimensions
  const decodedRange = XLSX.utils.decode_range(range);
  const totalRows = decodedRange.e.r + 1; // +1 because 0-indexed
  const totalColumns = decodedRange.e.c + 1;

  // Convert worksheet to array of arrays (preserves all data as-is)
  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: undefined, // Use undefined for empty cells
    raw: true, // Get raw values without formatting
  });

  // Extract column headers (Row 1, index 0)
  const headerRow = data[0] as unknown[];
  const columns: ColumnInfo[] = [];

  for (let colIndex = 0; colIndex < totalColumns; colIndex++) {
    const letter = XLSX.utils.encode_col(colIndex);
    const header = (headerRow[colIndex] as string) ?? "";

    // Count empty cells in this column (excluding header row)
    let emptyCells = 0;
    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex] as unknown[];
      if (
        row[colIndex] === undefined ||
        row[colIndex] === null ||
        row[colIndex] === ""
      ) {
        emptyCells++;
      }
    }

    columns.push({
      index: colIndex,
      letter,
      header,
      emptyCells,
    });
  }

  // Extract attribute names from Column A (excluding header)
  const attributeNames: string[] = [];
  for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex] as unknown[];
    const attrName = row[0]; // Column A is index 0

    // Preserve exactly as-is - including empty strings, undefined, etc.
    if (attrName !== undefined && attrName !== null) {
      attributeNames.push(String(attrName));
    }
  }

  // Get sample data (first 5 rows including header)
  const sampleData = data.slice(0, 5);

  // Calculate statistics
  const totalDataRows = data.length - 1; // Exclude header row
  let completeRows = 0;
  let emptyRows = 0;

  for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex] as unknown[];

    // Check if row is completely empty
    const isEmptyRow = row.every(
      (cell) => cell === undefined || cell === null || cell === ""
    );

    if (isEmptyRow) {
      emptyRows++;
      continue;
    }

    // Check if row is complete (no empty cells)
    const isCompleteRow = row
      .slice(0, totalColumns)
      .every((cell) => cell !== undefined && cell !== null && cell !== "");

    if (isCompleteRow) {
      completeRows++;
    }
  }

  return {
    metadata: {
      filename: filepath,
      sheetName,
      totalRows,
      totalColumns,
      usedRange: range,
    },
    columns,
    attributeNames,
    sampleData,
    stats: {
      totalDataRows,
      completeRows,
      emptyRows,
    },
  };
}

// ============================================================================
// CLI Entry Point
// ============================================================================

function main(): void {
  try {
    // Determine file path relative to project root
    const projectRoot = join(import.meta.dir, "..", "..");
    const excelPath = join(
      projectRoot,
      "zebra-artifacts",
      "sheets",
      "attribute-comparison-by-type.xlsx"
    );

    // Parse the Excel file
    const result = parseExcelFile(excelPath);

    // Output as formatted JSON
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error parsing Excel file:");

    if (error instanceof Error) {
      console.error(`  ${error.message}`);

      if (error.message.includes("ENOENT")) {
        console.error("\nFile not found. Expected location:");
        console.error(
          "  zebra-artifacts/sheets/attribute-comparison-by-type.xlsx"
        );
      }
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}

// Run the script
main();
