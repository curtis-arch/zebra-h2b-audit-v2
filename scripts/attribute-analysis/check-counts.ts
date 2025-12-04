#!/usr/bin/env bun
import { neon } from "@neondatabase/serverless";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_a73OJxNiqFTn@ep-snowy-breeze-a4hj1358-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function main() {
  const props =
    await sql`SELECT COUNT(*) as cnt FROM zebra_provided_properties_catalog`;
  const attrs =
    await sql`SELECT COUNT(*) as cnt FROM zebra_provided_attributes`;
  const eav =
    await sql`SELECT COUNT(*) as cnt FROM zebra_provided_attribute_values`;

  console.log("Properties:", props[0]?.cnt);
  console.log("Attributes:", attrs[0]?.cnt);
  console.log("EAV Values:", eav[0]?.cnt);

  // Check Camera
  const camera =
    await sql`SELECT attribute_name, is_hardware, attribute_slug FROM zebra_provided_attributes WHERE attribute_name = 'Camera'`;
  console.log("\nCamera:", camera[0]);

  // Sample properties
  const sampleProps =
    await sql`SELECT property_name, property_slug FROM zebra_provided_properties_catalog LIMIT 5`;
  console.log("\nSample properties:");
  sampleProps.forEach((p) =>
    console.log(`  ${p.property_name} -> ${p.property_slug}`)
  );
}

main().catch(console.error);
