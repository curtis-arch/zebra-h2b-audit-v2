# Task 004: Import HTB Data to Database

## What
Create script to import parsed HTB XLSX data into the `htb_attribute_mapping_zebra_provided` table.

## Why
Populate the database with HTB attribute mappings so they can be:
1. Referenced in the UI
2. Embedded for similarity matching
3. Cross-referenced with existing component types

## Files to Touch
| File | Action |
|------|--------|
| `/scripts/htb-import/import-htb-data.ts` | CREATE |

## Design

### Script Pattern
Follow `/scripts/attribute-analysis/import-to-db.ts`:

```typescript
#!/usr/bin/env bun
import { neon } from "@neondatabase/serverless";
import { join } from "path";
import XLSX from "xlsx";
import { createHash } from "crypto";

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);

async function main() {
  const filepath = join(import.meta.dir, "..", "..", "HTB-attribute-mapping-zebra-provided.xlsx");

  // Calculate source hash for deduplication
  const fileBuffer = await Bun.file(filepath).arrayBuffer();
  const sourceHash = createHash("sha256")
    .update(Buffer.from(fileBuffer))
    .digest("hex")
    .substring(0, 64);

  // Check if already imported
  const existing = await sql`
    SELECT COUNT(*) as cnt FROM htb_attribute_mapping_zebra_provided
    WHERE import_source_hash = ${sourceHash}
  `;

  if (Number(existing[0]?.cnt) > 0) {
    console.log("File already imported with this hash. Use --force to reimport.");
    return;
  }

  // Parse and import
  const workbook = XLSX.readFile(filepath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]!]!;
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

  let imported = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const attributeName = row["Attribute Name for HTB"];

    if (!attributeName || String(attributeName).trim() === "") continue;

    await sql`
      INSERT INTO htb_attribute_mapping_zebra_provided (
        attribute_name_for_htb,
        pim_attribute,
        pim_data_type,
        -- ... other columns
        excel_row_number,
        imported_from,
        import_source_hash
      ) VALUES (
        ${String(attributeName)},
        ${row["PIM Attribute"] ? String(row["PIM Attribute"]) : null},
        ${row["PIM Data Type"] ? String(row["PIM Data Type"]) : null},
        -- ... other values
        ${i + 2},  -- Excel row (1-indexed + header)
        ${filepath},
        ${sourceHash}
      )
      ON CONFLICT (attribute_name_for_htb) DO UPDATE SET
        pim_attribute = EXCLUDED.pim_attribute,
        imported_at = NOW()
    `;

    imported++;
    if (imported % 20 === 0) console.log(`  ${imported} rows...`);
  }

  console.log(`✓ Imported ${imported} HTB attribute mappings`);
}

main().catch(console.error);
```

## Suggested Tools

| Tool | Purpose |
|------|---------|
| mcp__filesystem-with-morph__edit_file | Create import script |
| Bash | Run `bun run import` |
| mcp__Neon__run_sql | Verify data with `SELECT COUNT(*) FROM htb_attribute_mapping_zebra_provided` |

## Acceptance Criteria & Proof

| Criterion (WHAT) | Proof (HOW) | Expected |
|------------------|-------------|----------|
| Script runs | `cd scripts/htb-import && bun run import` | Completes without error |
| All rows imported | `SELECT COUNT(*) FROM htb_attribute_mapping_zebra_provided` | ~100+ rows |
| Column A populated | `SELECT attribute_name_for_htb FROM htb_attribute_mapping_zebra_provided LIMIT 5` | Values present |
| Source hash tracked | Query `import_source_hash` column | 64-char hex hash |
| Idempotent | Re-run script | Reports "already imported" |
| Row numbers match | Compare to Excel | `excel_row_number` matches |

## Dependencies
- Task 002 (parser script for reference)
- Task 003 (table schema pushed to DB)
