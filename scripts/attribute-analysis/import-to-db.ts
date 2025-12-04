#!/usr/bin/env bun

/**
 * Direct DB importer - inserts records one at a time
 */

import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_a73OJxNiqFTn@ep-snowy-breeze-a4hj1358-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

import { join } from "path";
import XLSX from "xlsx";

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function generatePropertySlug(
  headerValue: string,
  columnLetter: string
): string {
  return `${toSlug(headerValue)}_${columnLetter.toLowerCase()}1`;
}

async function main() {
  const projectRoot = join(import.meta.dir, "..", "..");
  const excelPath = join(
    projectRoot,
    "zebra-artifacts",
    "sheets",
    "attribute-comparison-by-type.xlsx"
  );

  console.log("Reading Excel...");
  const workbook = XLSX.readFile(excelPath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]!]!;
  const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: undefined,
    raw: true,
  });

  const headerRow = data[0] as unknown[];

  // Property definitions
  const PROPS = [
    { col: "A", idx: 0, type: "text", storage: "wide", pop: 100 },
    { col: "B", idx: 1, type: "text", storage: "eav", pop: 30 },
    { col: "C", idx: 2, type: "boolean", storage: "wide", pop: 45 },
    { col: "D", idx: 3, type: "text", storage: "eav", pop: 25 },
    { col: "E", idx: 4, type: "boolean", storage: "wide", pop: 40 },
    { col: "F", idx: 5, type: "text", storage: "eav", pop: 20 },
    { col: "G", idx: 6, type: "text", storage: "eav", pop: 15 },
    { col: "H", idx: 7, type: "text", storage: "wide", pop: 50 },
    { col: "I", idx: 8, type: "text", storage: "wide", pop: 48 },
    { col: "J", idx: 9, type: "text", storage: "wide", pop: 42 },
    { col: "K", idx: 10, type: "text", storage: "wide", pop: 41 },
    { col: "L", idx: 11, type: "text", storage: "eav", pop: 35 },
    { col: "M", idx: 12, type: "text", storage: "eav", pop: 30 },
    { col: "N", idx: 13, type: "text", storage: "eav", pop: 28 },
    { col: "O", idx: 14, type: "text", storage: "eav", pop: 22 },
    { col: "P", idx: 15, type: "text", storage: "eav", pop: 18 },
    { col: "Q", idx: 16, type: "text", storage: "wide", pop: 55 },
    { col: "R", idx: 17, type: "text", storage: "wide", pop: 60 },
    { col: "S", idx: 18, type: "text", storage: "eav", pop: 25 },
    { col: "T", idx: 19, type: "text", storage: "eav", pop: 20 },
    { col: "U", idx: 20, type: "text", storage: "eav", pop: 15 },
    { col: "V", idx: 21, type: "text", storage: "eav", pop: 12 },
  ];

  // Build property metadata with actual headers
  const properties = PROPS.map((p) => {
    const header = headerRow[p.idx]
      ? String(headerRow[p.idx])
      : `Column ${p.col}`;
    const slug =
      p.col === "A" ? "attribute_name_a1" : generatePropertySlug(header, p.col);
    return {
      ...p,
      header,
      slug,
      wideCol: p.storage === "wide" ? slug : null,
      eavKey: p.storage === "eav" ? slug : null,
    };
  });

  // Check if properties already exist
  const existingProps =
    await sql`SELECT COUNT(*) as cnt FROM zebra_provided_properties_catalog`;
  if (Number(existingProps[0]?.cnt) === 0) {
    console.log("Inserting 22 properties...");
    for (const p of properties) {
      await sql`INSERT INTO zebra_provided_properties_catalog
        (property_name, property_slug, excel_column_letter, excel_column_position, excel_header_value, data_type, storage_strategy, population_percent, wide_column_name, eav_property_key, description, example_values)
        VALUES (${p.header}, ${p.slug}, ${p.col}, ${p.idx}, ${p.header}, ${p.type}, ${p.storage}, ${p.pop}, ${p.wideCol}, ${p.eavKey}, ${`Property from column ${p.col}`}, '')`;
    }
    console.log("✓ Properties inserted");
  } else {
    console.log("Properties already exist, skipping...");
  }

  // Get property ID map
  const propRows =
    await sql`SELECT id, property_slug FROM zebra_provided_properties_catalog`;
  const propIdMap = new Map(propRows.map((r) => [r.property_slug, r.id]));

  // Insert attributes one by one
  console.log("Inserting attributes...");
  let attrCount = 0;
  let eavCount = 0;

  for (let rowIdx = 1; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx] as unknown[];
    const attrName = row[0];
    if (!attrName || String(attrName).trim() === "") continue;

    const attrNameStr = String(attrName);
    const attrSlug = toSlug(attrNameStr);
    const excelRow = rowIdx + 1;

    // Normalize values
    const normalize = (val: unknown, type: string) => {
      if (val === null || val === undefined) return null;
      const s = String(val).trim();
      if (s === "" || s === "N/A" || s === "-") return null;
      if (type === "boolean") return s.toLowerCase() === "x";
      return s;
    };

    const isHardware = normalize(row[2], "boolean") === true;
    const isSupplies = normalize(row[4], "boolean") === true;
    const dataSourceHw = normalize(row[7], "text") as string | null;
    const dataSourceSss = normalize(row[9], "text") as string | null;
    const effortHw = normalize(row[8], "text") as string | null;
    const effortSss = normalize(row[10], "text") as string | null;
    const modelOrSku = normalize(row[16], "text") as string | null;
    const description = normalize(row[17], "text") as string | null;

    // Insert attribute
    const attrResult = await sql`INSERT INTO zebra_provided_attributes
      (attribute_name, attribute_slug, excel_row_number, is_hardware, is_supplies, data_source_hardware, data_source_sss, effort_hardware, effort_sss, model_or_sku, description, imported_from)
      VALUES (${attrNameStr}, ${attrSlug}, ${excelRow}, ${isHardware}, ${isSupplies}, ${dataSourceHw}, ${dataSourceSss}, ${effortHw}, ${effortSss}, ${modelOrSku}, ${description}, ${excelPath})
      RETURNING id`;

    const attrId = attrResult[0]?.id;
    attrCount++;

    // Insert EAV values for sparse columns
    for (const p of properties) {
      if (p.storage !== "eav") continue;
      const val = normalize(row[p.idx], p.type);
      if (val === null) continue;

      const propId = propIdMap.get(p.slug);
      const cellRef = `${p.col}${excelRow}`;

      await sql`INSERT INTO zebra_provided_attribute_values
        (attribute_id, property_id, excel_cell_ref, original_value, is_normalized)
        VALUES (${attrId}, ${propId}, ${cellRef}, ${String(row[p.idx])}, false)`;
      eavCount++;
    }

    if (attrCount % 50 === 0) console.log(`  ${attrCount} attributes...`);
  }

  console.log(`✓ Inserted ${attrCount} attributes, ${eavCount} EAV values`);

  // Verify Camera
  const camera =
    await sql`SELECT attribute_name, is_hardware FROM zebra_provided_attributes WHERE attribute_name = 'Camera'`;
  console.log("Camera check:", camera[0]);
}

main().catch(console.error);
