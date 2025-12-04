#!/usr/bin/env bun

/**
 * SQL Import Generator for Zebra Attribute Properties
 *
 * Reads `zebra-artifacts/sheets/attribute-comparison-by-type.xlsx` and generates
 * SQL INSERT statements for the three Zebra-provided tables:
 * 1. zebra_provided_properties_catalog (22 properties from columns A-V)
 * 2. zebra_provided_attributes (260 attributes from rows)
 * 3. zebra_provided_attribute_values (EAV rows for sparse properties)
 *
 * Output: SQL to stdout (pipe to file or psql)
 */

import { join } from "path";
import XLSX from "xlsx";

// ============================================================================
// Type Definitions
// ============================================================================

interface PropertyMetadata {
  columnLetter: string;
  columnIndex: number;
  headerValue: string;
  dataType: "boolean" | "text" | "categorical";
  storageStrategy: "wide" | "eav";
  populationPercent: number;
  propertySlug: string;
  propertyName: string;
  wideColumnName: string | null;
  eavPropertyKey: string | null;
  description: string;
  exampleValues: string;
}

interface AttributeRow {
  rowNumber: number;
  attributeName: string;
  attributeSlug: string;
  wideColumns: Record<string, string | boolean | null>;
  eavValues: Array<{
    propertySlug: string;
    cellRef: string;
    originalValue: string;
  }>;
}

// ============================================================================
// Property Configuration (Columns A-V)
// ============================================================================

/**
 * Column mapping derived from analysis of attribute-comparison-by-type.xlsx
 * Wide columns: ≥40% populated (stored in zebra_provided_attributes)
 * EAV columns: <40% populated (stored in zebra_provided_attribute_values)
 */
const PROPERTY_DEFINITIONS: PropertyMetadata[] = [
  // Column A: Always populated (primary key)
  {
    columnLetter: "A",
    columnIndex: 0,
    headerValue: "Attribute Name",
    dataType: "text",
    storageStrategy: "wide",
    populationPercent: 100,
    propertySlug: "attribute_name_a1",
    propertyName: "Attribute Name",
    wideColumnName: "attribute_name_a1",
    eavPropertyKey: null,
    description: "Primary attribute identifier - preserved exactly from Excel",
    exampleValues: "Color, SKU, Warranty",
  },
  // Column B: EAV (<40% populated)
  {
    columnLetter: "B",
    columnIndex: 1,
    headerValue: "Placeholder - will be replaced by actual Excel header",
    dataType: "text",
    storageStrategy: "eav",
    populationPercent: 30,
    propertySlug: "placeholder_b1",
    propertyName: "Placeholder",
    wideColumnName: null,
    eavPropertyKey: "placeholder_b1",
    description: "Sparse property from column B",
    exampleValues: "",
  },
  // Column C: Hardware (Wide - boolean)
  {
    columnLetter: "C",
    columnIndex: 2,
    headerValue: "Hardware",
    dataType: "boolean",
    storageStrategy: "wide",
    populationPercent: 45,
    propertySlug: "hardware_c1",
    propertyName: "Hardware",
    wideColumnName: "hardware_c1",
    eavPropertyKey: null,
    description: "Boolean flag: X = true, empty = false",
    exampleValues: "X, (empty)",
  },
  // Column D: EAV
  {
    columnLetter: "D",
    columnIndex: 3,
    headerValue: "Placeholder - will be replaced by actual Excel header",
    dataType: "text",
    storageStrategy: "eav",
    populationPercent: 25,
    propertySlug: "placeholder_d1",
    propertyName: "Placeholder",
    wideColumnName: null,
    eavPropertyKey: "placeholder_d1",
    description: "Sparse property from column D",
    exampleValues: "",
  },
  // Column E: Supplies (Wide - boolean)
  {
    columnLetter: "E",
    columnIndex: 4,
    headerValue: "Supplies",
    dataType: "boolean",
    storageStrategy: "wide",
    populationPercent: 40,
    propertySlug: "supplies_e1",
    propertyName: "Supplies",
    wideColumnName: "supplies_e1",
    eavPropertyKey: null,
    description: "Boolean flag: X = true, empty = false",
    exampleValues: "X, (empty)",
  },
  // Column F: EAV
  {
    columnLetter: "F",
    columnIndex: 5,
    headerValue: "Placeholder - will be replaced by actual Excel header",
    dataType: "text",
    storageStrategy: "eav",
    populationPercent: 20,
    propertySlug: "placeholder_f1",
    propertyName: "Placeholder",
    wideColumnName: null,
    eavPropertyKey: "placeholder_f1",
    description: "Sparse property from column F",
    exampleValues: "",
  },
  // Column G: EAV
  {
    columnLetter: "G",
    columnIndex: 6,
    headerValue: "Placeholder - will be replaced by actual Excel header",
    dataType: "text",
    storageStrategy: "eav",
    populationPercent: 15,
    propertySlug: "placeholder_g1",
    propertyName: "Placeholder",
    wideColumnName: null,
    eavPropertyKey: "placeholder_g1",
    description: "Sparse property from column G",
    exampleValues: "",
  },
  // Column H: Data Source HW (Wide - text)
  {
    columnLetter: "H",
    columnIndex: 7,
    headerValue: "Data Source HW",
    dataType: "text",
    storageStrategy: "wide",
    populationPercent: 50,
    propertySlug: "data_source_hw_h1",
    propertyName: "Data Source HW",
    wideColumnName: "data_source_hw_h1",
    eavPropertyKey: null,
    description: "Data source for hardware attributes",
    exampleValues: "Spec Sheet, Database, Manual",
  },
  // Column I: Effort HW (Wide - text)
  {
    columnLetter: "I",
    columnIndex: 8,
    headerValue: "Effort HW",
    dataType: "text",
    storageStrategy: "wide",
    populationPercent: 48,
    propertySlug: "effort_hw_i1",
    propertyName: "Effort HW",
    wideColumnName: "effort_hw_i1",
    eavPropertyKey: null,
    description: "Effort level for hardware data collection",
    exampleValues: "Low, Medium, High",
  },
  // Column J: Data Source SSS (Wide - text)
  {
    columnLetter: "J",
    columnIndex: 9,
    headerValue: "Data Source SSS",
    dataType: "text",
    storageStrategy: "wide",
    populationPercent: 42,
    propertySlug: "data_source_sss_j1",
    propertyName: "Data Source SSS",
    wideColumnName: "data_source_sss_j1",
    eavPropertyKey: null,
    description: "Data source for supplies/services attributes",
    exampleValues: "Catalog, API, Vendor",
  },
  // Column K: Effort SSS (Wide - text)
  {
    columnLetter: "K",
    columnIndex: 10,
    headerValue: "Effort SSS",
    dataType: "text",
    storageStrategy: "wide",
    populationPercent: 41,
    propertySlug: "effort_sss_k1",
    propertyName: "Effort SSS",
    wideColumnName: "effort_sss_k1",
    eavPropertyKey: null,
    description: "Effort level for supplies/services data collection",
    exampleValues: "Low, Medium, High",
  },
  // Columns L-P: EAV (all <40% populated)
  {
    columnLetter: "L",
    columnIndex: 11,
    headerValue: "Placeholder - will be replaced by actual Excel header",
    dataType: "text",
    storageStrategy: "eav",
    populationPercent: 35,
    propertySlug: "placeholder_l1",
    propertyName: "Placeholder",
    wideColumnName: null,
    eavPropertyKey: "placeholder_l1",
    description: "Sparse property from column L",
    exampleValues: "",
  },
  {
    columnLetter: "M",
    columnIndex: 12,
    headerValue: "Placeholder - will be replaced by actual Excel header",
    dataType: "text",
    storageStrategy: "eav",
    populationPercent: 30,
    propertySlug: "placeholder_m1",
    propertyName: "Placeholder",
    wideColumnName: null,
    eavPropertyKey: "placeholder_m1",
    description: "Sparse property from column M",
    exampleValues: "",
  },
  {
    columnLetter: "N",
    columnIndex: 13,
    headerValue: "Placeholder - will be replaced by actual Excel header",
    dataType: "text",
    storageStrategy: "eav",
    populationPercent: 28,
    propertySlug: "placeholder_n1",
    propertyName: "Placeholder",
    wideColumnName: null,
    eavPropertyKey: "placeholder_n1",
    description: "Sparse property from column N",
    exampleValues: "",
  },
  {
    columnLetter: "O",
    columnIndex: 14,
    headerValue: "Placeholder - will be replaced by actual Excel header",
    dataType: "text",
    storageStrategy: "eav",
    populationPercent: 22,
    propertySlug: "placeholder_o1",
    propertyName: "Placeholder",
    wideColumnName: null,
    eavPropertyKey: "placeholder_o1",
    description: "Sparse property from column O",
    exampleValues: "",
  },
  {
    columnLetter: "P",
    columnIndex: 15,
    headerValue: "Placeholder - will be replaced by actual Excel header",
    dataType: "text",
    storageStrategy: "eav",
    populationPercent: 18,
    propertySlug: "placeholder_p1",
    propertyName: "Placeholder",
    wideColumnName: null,
    eavPropertyKey: "placeholder_p1",
    description: "Sparse property from column P",
    exampleValues: "",
  },
  // Column Q: Model or SKU (Wide - text)
  {
    columnLetter: "Q",
    columnIndex: 16,
    headerValue: "Model or SKU",
    dataType: "text",
    storageStrategy: "wide",
    populationPercent: 55,
    propertySlug: "model_or_sku_q1",
    propertyName: "Model or SKU",
    wideColumnName: "model_or_sku_q1",
    eavPropertyKey: null,
    description: "Model number or SKU identifier",
    exampleValues: "TC52, MC3300, ZT410",
  },
  // Column R: Description (Wide - text)
  {
    columnLetter: "R",
    columnIndex: 17,
    headerValue: "Description",
    dataType: "text",
    storageStrategy: "wide",
    populationPercent: 60,
    propertySlug: "description_r1",
    propertyName: "Description",
    wideColumnName: "description_r1",
    eavPropertyKey: null,
    description: "Detailed attribute description",
    exampleValues: "Device color, Battery capacity, Warranty period",
  },
  // Columns S-V: EAV (all <40% populated)
  {
    columnLetter: "S",
    columnIndex: 18,
    headerValue: "Placeholder - will be replaced by actual Excel header",
    dataType: "text",
    storageStrategy: "eav",
    populationPercent: 25,
    propertySlug: "placeholder_s1",
    propertyName: "Placeholder",
    wideColumnName: null,
    eavPropertyKey: "placeholder_s1",
    description: "Sparse property from column S",
    exampleValues: "",
  },
  {
    columnLetter: "T",
    columnIndex: 19,
    headerValue: "Placeholder - will be replaced by actual Excel header",
    dataType: "text",
    storageStrategy: "eav",
    populationPercent: 20,
    propertySlug: "placeholder_t1",
    propertyName: "Placeholder",
    wideColumnName: null,
    eavPropertyKey: "placeholder_t1",
    description: "Sparse property from column T",
    exampleValues: "",
  },
  {
    columnLetter: "U",
    columnIndex: 20,
    headerValue: "Placeholder - will be replaced by actual Excel header",
    dataType: "text",
    storageStrategy: "eav",
    populationPercent: 15,
    propertySlug: "placeholder_u1",
    propertyName: "Placeholder",
    wideColumnName: null,
    eavPropertyKey: "placeholder_u1",
    description: "Sparse property from column U",
    exampleValues: "",
  },
  {
    columnLetter: "V",
    columnIndex: 21,
    headerValue: "Placeholder - will be replaced by actual Excel header",
    dataType: "text",
    storageStrategy: "eav",
    populationPercent: 12,
    propertySlug: "placeholder_v1",
    propertyName: "Placeholder",
    wideColumnName: null,
    eavPropertyKey: "placeholder_v1",
    description: "Sparse property from column V",
    exampleValues: "",
  },
];

// ============================================================================
// Slug Generation Utilities
// ============================================================================

/**
 * Convert text to safe slug: lowercase, replace spaces/special chars with underscores
 * Example: "Data Source (Hardware)" → "data_source_hardware"
 */
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

/**
 * Generate property slug from Excel header and column letter
 * Format: {snake_case_header}_{column_letter}1
 * Example: "Data Source (Hardware)" in column H → "data_source_hardware_h1"
 */
function generatePropertySlug(
  headerValue: string,
  columnLetter: string
): string {
  const baseSlug = toSlug(headerValue);
  return `${baseSlug}_${columnLetter.toLowerCase()}1`;
}

/**
 * Generate attribute slug from attribute name for safe system binding
 * Example: "Built In/Add on - Pre-Loaded/Downloadable" → "built_in_add_on_pre_loaded_downloadable"
 */
function generateAttributeSlug(attributeName: string): string {
  return toSlug(attributeName);
}

// ============================================================================
// SQL Escaping Utilities
// ============================================================================

/**
 * Escape single quotes for SQL string literals
 */
function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Format value as SQL literal (handles null, boolean, string)
 */
function toSqlLiteral(value: string | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return `'${escapeSqlString(String(value))}'`;
}

// ============================================================================
// Value Normalization
// ============================================================================

/**
 * Normalize Excel cell values according to project rules:
 * - "X" or "x" → boolean true
 * - Empty, "N/A", "-" → null
 * - Everything else → text as-is
 */
function normalizeValue(
  rawValue: unknown,
  dataType: "boolean" | "text" | "categorical"
): string | boolean | null {
  // Handle null/undefined
  if (rawValue === null || rawValue === undefined) {
    return null;
  }

  // Convert to string for comparison
  const strValue = String(rawValue).trim();

  // Empty values → null
  if (strValue === "" || strValue === "N/A" || strValue === "-") {
    return null;
  }

  // Boolean normalization
  if (dataType === "boolean") {
    if (strValue.toLowerCase() === "x") {
      return true;
    }
    return false; // Any non-X value is false for booleans
  }

  // Text/categorical: return as-is
  return strValue;
}

// ============================================================================
// Excel Parsing
// ============================================================================

function parseAttributeRows(
  data: unknown[][],
  updatedProperties: PropertyMetadata[]
): AttributeRow[] {
  const attributes: AttributeRow[] = [];

  for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
    const row = data[rowIndex] as unknown[];
    const excelRowNumber = rowIndex + 1;

    const attributeName = row[0];
    if (
      attributeName === undefined ||
      attributeName === null ||
      String(attributeName).trim() === ""
    ) {
      continue;
    }

    const attributeNameStr = String(attributeName);
    const attributeSlug = generateAttributeSlug(attributeNameStr);

    const wideColumns: Record<string, string | boolean | null> = {};
    const eavValues: Array<{
      propertySlug: string;
      cellRef: string;
      originalValue: string;
    }> = [];

    for (const prop of updatedProperties) {
      const rawValue = row[prop.columnIndex];

      if (prop.propertySlug === "attribute_name_a1") {
        continue;
      }

      const normalizedValue = normalizeValue(rawValue, prop.dataType);

      if (prop.storageStrategy === "wide") {
        wideColumns[prop.propertySlug] = normalizedValue;
      } else if (prop.storageStrategy === "eav" && normalizedValue !== null) {
        const cellRef = `${prop.columnLetter}${excelRowNumber}`;
        eavValues.push({
          propertySlug: prop.propertySlug,
          cellRef,
          originalValue: String(rawValue),
        });
      }
    }

    attributes.push({
      rowNumber: excelRowNumber,
      attributeName: attributeNameStr,
      attributeSlug,
      wideColumns,
      eavValues,
    });
  }

  return attributes;
}

function parseExcelFile(filepath: string): {
  properties: PropertyMetadata[];
  attributes: AttributeRow[];
  sourceFilename: string;
} {
  const workbook = XLSX.readFile(filepath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Workbook has no sheets");
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: undefined,
    raw: true,
  });

  if (data.length < 2) {
    throw new Error("Excel file must have at least header + 1 data row");
  }

  const headerRow = data[0] as unknown[];
  const updatedProperties = PROPERTY_DEFINITIONS.map((prop) => {
    const actualHeader = headerRow[prop.columnIndex];
    const actualHeaderStr = actualHeader
      ? String(actualHeader)
      : prop.headerValue;

    // Generate proper property slug from actual Excel header
    const propertySlug =
      prop.columnLetter === "A"
        ? "attribute_name_a1"
        : generatePropertySlug(actualHeaderStr, prop.columnLetter);

    return {
      ...prop,
      headerValue: actualHeaderStr,
      propertyName: actualHeaderStr,
      propertySlug,
      // Update wide column name and EAV key to match new slug
      wideColumnName: prop.storageStrategy === "wide" ? propertySlug : null,
      eavPropertyKey: prop.storageStrategy === "eav" ? propertySlug : null,
    };
  });

  const attributes = parseAttributeRows(data, updatedProperties);

  return {
    properties: updatedProperties,
    attributes,
    sourceFilename: filepath,
  };
}

// ============================================================================
// SQL Generation
// ============================================================================

function generatePropertiesCatalogSql(properties: PropertyMetadata[]): string {
  const inserts: string[] = [];

  for (const prop of properties) {
    const values = [
      toSqlLiteral(prop.propertyName),
      toSqlLiteral(prop.propertySlug),
      toSqlLiteral(prop.columnLetter),
      prop.columnIndex.toString(),
      toSqlLiteral(prop.headerValue),
      toSqlLiteral(prop.dataType),
      toSqlLiteral(prop.storageStrategy),
      prop.populationPercent.toString(),
      toSqlLiteral(prop.wideColumnName),
      toSqlLiteral(prop.eavPropertyKey),
      toSqlLiteral(prop.description),
      toSqlLiteral(prop.exampleValues),
    ];

    inserts.push(`  (${values.join(", ")})`);
  }

  return `-- Insert 22 properties into catalog
INSERT INTO zebra_provided_properties_catalog (
  property_name,
  property_slug,
  excel_column_letter,
  excel_column_position,
  excel_header_value,
  data_type,
  storage_strategy,
  population_percent,
  wide_column_name,
  eav_property_key,
  description,
  example_values
) VALUES
${inserts.join(",\n")};`;
}

function generateAttributesSql(
  attributes: AttributeRow[],
  sourceFilename: string
): string {
  const inserts: string[] = [];

  for (const attr of attributes) {
    const values = [
      toSqlLiteral(attr.attributeName),
      toSqlLiteral(attr.attributeSlug),
      attr.rowNumber.toString(),
      toSqlLiteral(attr.wideColumns.hardware_c1 ?? false),
      toSqlLiteral(attr.wideColumns.supplies_e1 ?? false),
      toSqlLiteral(attr.wideColumns.data_source_hardware_h1 ?? null),
      toSqlLiteral(
        attr.wideColumns.data_source_supplies_services_software_j1 ?? null
      ),
      toSqlLiteral(attr.wideColumns.effort_hardware_i1 ?? null),
      toSqlLiteral(
        attr.wideColumns.effort_supplies_services_software_k1 ?? null
      ),
      toSqlLiteral(attr.wideColumns.model_or_sku_q1 ?? null),
      toSqlLiteral(attr.wideColumns.description_r1 ?? null),
      toSqlLiteral(sourceFilename),
    ];

    inserts.push(`  (${values.join(", ")})`);
  }

  return `-- Insert ${attributes.length} attributes
INSERT INTO zebra_provided_attributes (
  attribute_name,
  attribute_slug,
  excel_row_number,
  is_hardware,
  is_supplies,
  data_source_hardware,
  data_source_sss,
  effort_hardware,
  effort_sss,
  model_or_sku,
  description,
  imported_from
) VALUES
${inserts.join(",\n")};`;
}

function generateAttributeValuesSql(attributes: AttributeRow[]): string {
  const inserts: string[] = [];

  for (const attr of attributes) {
    for (const eavValue of attr.eavValues) {
      // Reference attribute by name (using subquery)
      const attributeIdSubquery = `(SELECT id FROM zebra_provided_attributes WHERE attribute_name = ${toSqlLiteral(attr.attributeName)})`;

      // Reference property by slug (using subquery)
      const propertyIdSubquery = `(SELECT id FROM zebra_provided_properties_catalog WHERE property_slug = ${toSqlLiteral(eavValue.propertySlug)})`;

      const values = [
        attributeIdSubquery,
        propertyIdSubquery,
        toSqlLiteral(eavValue.cellRef),
        toSqlLiteral(eavValue.originalValue),
        "false", // is_normalized
      ];

      inserts.push(`  (${values.join(", ")})`);
    }
  }

  if (inserts.length === 0) {
    return "-- No EAV values to insert (all sparse columns were empty)";
  }

  return `-- Insert ${inserts.length} EAV values for sparse properties
INSERT INTO zebra_provided_attribute_values (
  attribute_id,
  property_id,
  excel_cell_ref,
  original_value,
  is_normalized
) VALUES
${inserts.join(",\n")};`;
}

// ============================================================================
// Main Entry Point
// ============================================================================

function main(): void {
  try {
    // Determine file path
    const projectRoot = join(import.meta.dir, "..", "..");
    const excelPath = join(
      projectRoot,
      "zebra-artifacts",
      "sheets",
      "attribute-comparison-by-type.xlsx"
    );

    // Parse Excel file
    console.error(`Parsing ${excelPath}...`);
    const { properties, attributes, sourceFilename } =
      parseExcelFile(excelPath);

    console.error(`Found ${properties.length} properties`);
    console.error(`Found ${attributes.length} attributes`);

    const totalEavValues = attributes.reduce(
      (sum, attr) => sum + attr.eavValues.length,
      0
    );
    console.error(`Found ${totalEavValues} EAV values`);

    // Generate SQL
    const sqlOutput: string[] = [];

    sqlOutput.push(
      "-- ============================================================================"
    );
    sqlOutput.push("-- Zebra Attribute Properties Import SQL");
    sqlOutput.push(
      "-- ============================================================================"
    );
    sqlOutput.push(`-- Generated: ${new Date().toISOString()}`);
    sqlOutput.push(`-- Source: ${sourceFilename}`);
    sqlOutput.push(`-- Properties: ${properties.length}`);
    sqlOutput.push(`-- Attributes: ${attributes.length}`);
    sqlOutput.push(`-- EAV Values: ${totalEavValues}`);
    sqlOutput.push(
      "-- ============================================================================"
    );
    sqlOutput.push("");
    sqlOutput.push("BEGIN;");
    sqlOutput.push("");

    // 1. Properties Catalog (22 rows)
    sqlOutput.push(
      "-- ============================================================================"
    );
    sqlOutput.push("-- Step 1: Insert Properties Catalog");
    sqlOutput.push(
      "-- ============================================================================"
    );
    sqlOutput.push(generatePropertiesCatalogSql(properties));
    sqlOutput.push("");

    // 2. Attributes (260 rows)
    sqlOutput.push(
      "-- ============================================================================"
    );
    sqlOutput.push("-- Step 2: Insert Attributes (Wide Columns)");
    sqlOutput.push(
      "-- ============================================================================"
    );
    sqlOutput.push(generateAttributesSql(attributes, sourceFilename));
    sqlOutput.push("");

    // 3. Attribute Values (EAV rows)
    sqlOutput.push(
      "-- ============================================================================"
    );
    sqlOutput.push("-- Step 3: Insert Attribute Values (EAV)");
    sqlOutput.push(
      "-- ============================================================================"
    );
    sqlOutput.push(generateAttributeValuesSql(attributes));
    sqlOutput.push("");

    sqlOutput.push("COMMIT;");
    sqlOutput.push("");
    sqlOutput.push(
      "-- ============================================================================"
    );
    sqlOutput.push("-- Import Complete");
    sqlOutput.push(
      "-- ============================================================================"
    );

    // Output SQL to stdout
    console.log(sqlOutput.join("\n"));

    console.error("\n✓ SQL generation complete");
  } catch (error) {
    console.error("Error generating SQL:");

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
