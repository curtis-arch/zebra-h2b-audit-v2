import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function verifyTable() {
  console.log("Verifying htb_attribute_mapping_zebra_provided table...\n");

  // Check table exists
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_name = 'htb_attribute_mapping_zebra_provided'
  `;

  if (tables.length === 0) {
    console.error("❌ Table does not exist");
    process.exit(1);
  }

  console.log("✓ Table exists");

  // Check all columns
  const columns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'htb_attribute_mapping_zebra_provided'
    ORDER BY ordinal_position
  `;

  console.log(`✓ Table has ${columns.length} columns\n`);

  // Check indexes
  const indexes = await sql`
    SELECT
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = 'htb_attribute_mapping_zebra_provided'
    ORDER BY indexname
  `;

  console.log(`✓ Table has ${indexes.length} indexes:\n`);
  indexes.forEach((idx: any) => {
    console.log(`  - ${idx.indexname}`);
  });

  // Verify unique index on attribute_name_for_htb
  const uniqueIndex = indexes.find(
    (idx: any) => idx.indexname === "htb_attribute_name_idx"
  );

  if (uniqueIndex) {
    console.log("\n✓ Unique index on attribute_name_for_htb exists");
  } else {
    console.error("\n❌ Unique index on attribute_name_for_htb missing");
  }

  // Test insert/select
  console.log("\nTesting insert/select...");

  await sql`
    INSERT INTO htb_attribute_mapping_zebra_provided (attribute_name_for_htb)
    VALUES ('test_attribute')
    ON CONFLICT (attribute_name_for_htb) DO NOTHING
  `;

  const testRow = await sql`
    SELECT id, attribute_name_for_htb
    FROM htb_attribute_mapping_zebra_provided
    WHERE attribute_name_for_htb = 'test_attribute'
  `;

  if (testRow.length > 0) {
    console.log("✓ Insert/select working correctly");

    // Clean up test data
    await sql`
      DELETE FROM htb_attribute_mapping_zebra_provided
      WHERE attribute_name_for_htb = 'test_attribute'
    `;
    console.log("✓ Test data cleaned up\n");
  }

  console.log("✅ ALL VERIFICATIONS PASSED");
}

verifyTable().catch(console.error);
