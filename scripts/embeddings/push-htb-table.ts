import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function pushHtbTable() {
  console.log("Creating htb_attribute_mapping_zebra_provided table...");

  await sql`
    CREATE TABLE IF NOT EXISTS htb_attribute_mapping_zebra_provided (
      id SERIAL PRIMARY KEY,
      attribute_name_for_htb TEXT NOT NULL,
      pim_attribute TEXT,
      pim_data_type TEXT,
      length_validation_in_pim TEXT,
      other_validation_in_pim TEXT,
      aem_cf_attribute_name TEXT,
      aem_cf_label TEXT,
      aem_cf_data_type TEXT,
      aem_length_validation TEXT,
      note TEXT,
      original_source TEXT,
      synonym TEXT,
      required TEXT,
      product_category TEXT,
      luisa_check_pim_attributes TEXT,
      michelle_check_pim_attributes TEXT,
      length TEXT,
      attribute_family TEXT,
      where_cf_used TEXT,
      where_data_used TEXT,
      notes TEXT,
      cleanup_action TEXT,
      review_by TEXT,
      content_type TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    );
  `;

  console.log("Creating indexes...");

  await sql`CREATE UNIQUE INDEX IF NOT EXISTS htb_attribute_name_idx ON htb_attribute_mapping_zebra_provided(attribute_name_for_htb)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_htb_pim_attribute ON htb_attribute_mapping_zebra_provided(pim_attribute)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_htb_aem_cf_attribute ON htb_attribute_mapping_zebra_provided(aem_cf_attribute_name)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_htb_product_category ON htb_attribute_mapping_zebra_provided(product_category)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_htb_content_type ON htb_attribute_mapping_zebra_provided(content_type)`;

  console.log("✓ Table and indexes created successfully");

  // Verify
  const result = await sql`
    SELECT
      table_name,
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_name = 'htb_attribute_mapping_zebra_provided'
    ORDER BY ordinal_position
  `;

  console.log(`\n✓ Verified ${result.length} columns in table`);
  console.log("\nFirst 5 columns:");
  result.slice(0, 5).forEach((col: any) => {
    console.log(`  - ${col.column_name}: ${col.data_type}`);
  });
}

pushHtbTable().catch(console.error);
