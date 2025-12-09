#!/usr/bin/env bun
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

console.log("🔍 Detailed verification of overlapping values:\n");

const overlappingValues = [
  "Additional Features",
  "Battery Capacity",
  "Camera",
  "Color",
  "Display",
  "Environment",
  "Form Factor",
  "Illumination",
  "Memory",
  "Operating System",
  "Power Supply",
  "Print Resolution",
  "Print Width",
];

let allGood = true;

for (const val of overlappingValues) {
  const entries = await sql`
    SELECT COUNT(*) as cnt
    FROM embedding_cache
    WHERE value = ${val}
  `;

  const count = Number(entries[0].cnt);
  const status = count === 2 ? "✅" : "❌";
  if (count !== 2) allGood = false;

  console.log(`${status} ${val.padEnd(25)} - ${count} entries`);
}

console.log(
  `\n${allGood ? "✅ ALL VERIFIED" : "❌ ISSUES FOUND"}: All 13 overlapping values have exactly 2 entries each`
);
