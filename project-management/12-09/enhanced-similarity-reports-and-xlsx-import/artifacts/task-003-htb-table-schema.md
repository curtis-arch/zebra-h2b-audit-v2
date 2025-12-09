# Task 003: HTB Attribute Mapping Table Schema

## What
Add Drizzle schema for `htb_attribute_mapping_zebra_provided` table to store the imported HTB data.

## Why
Need a dedicated table to:
1. Store all columns from the HTB XLSX file
2. Enable foreign key relationships with embedding_cache
3. Track import metadata for auditing

## Files to Touch
| File | Action |
|------|--------|
| `/packages/db/src/schema/zebra.ts` | MODIFY - Add new table schema |

## Design

### Table Schema
```typescript
/**
 * HTB Attribute Mapping - Zebra Provided
 *
 * Stores attribute mappings from HTB-attribute-mapping-zebra-provided.xlsx
 * Column A (Attribute Name for HTB) is the primary semantic key.
 */
export const htbAttributeMappingZebraProvided = pgTable(
  "htb_attribute_mapping_zebra_provided",
  {
    id: serial("id").primaryKey(),

    // Column A - Primary attribute name (will be embedded)
    attributeNameForHtb: text("attribute_name_for_htb").notNull(),

    // Other key columns from XLSX
    pimAttribute: text("pim_attribute"),
    pimDataType: text("pim_data_type"),
    aemContentFragmentAttributeName: text("aem_content_fragment_attribute_name"),
    aemCfLabel: text("aem_cf_label"),
    aemCfDataType: text("aem_cf_data_type"),
    aemLengthValidation: text("aem_length_validation"),
    note: text("note"),
    originalSource: text("original_source"),
    synonym: text("synonym"),
    required: text("required"),
    productCategory: text("product_category"),
    attributeFamily: text("attribute_family"),
    whereCfUsed: text("where_cf_used"),
    whereDataUsed: text("where_data_used"),
    notes: text("notes"),
    cleanupAction: text("cleanup_action"),
    reviewBy: text("review_by"),
    contentType: text("content_type"),

    // Import tracking
    excelRowNumber: integer("excel_row_number").notNull(),
    importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow(),
    importedFrom: text("imported_from").notNull(),
    importSourceHash: varchar("import_source_hash", { length: 64 }),
  },
  (table) => ({
    uqHtbAttributeName: uniqueIndex("uq_htb_attr_name").on(table.attributeNameForHtb),
    idxHtbExcelRow: index("idx_htb_excel_row").on(table.excelRowNumber),
  })
);

// Type exports
export type HtbAttributeMapping = typeof htbAttributeMappingZebraProvided.$inferSelect;
export type NewHtbAttributeMapping = typeof htbAttributeMappingZebraProvided.$inferInsert;
```

### Migration
```bash
bun run db:push  # Push schema to Neon
```

## Suggested Tools

| Tool | Purpose |
|------|---------|
| mcp__filesystem-with-morph__edit_file | Add schema to zebra.ts |
| Bash | Run `bun run db:push` |
| mcp__Neon__describe_table_schema | Verify table created correctly |

## Acceptance Criteria & Proof

| Criterion (WHAT) | Proof (HOW) | Expected |
|------------------|-------------|----------|
| Schema added | Read zebra.ts | Contains `htbAttributeMappingZebraProvided` |
| Types exported | Check exports | `HtbAttributeMapping` type available |
| Unique index on name | Check schema definition | `uqHtbAttributeName` present |
| Schema pushes | `bun run db:push` | No errors |
| Table exists in Neon | `mcp__Neon__get_database_tables` | `htb_attribute_mapping_zebra_provided` in list |

## Dependencies
- Task 002 (to confirm exact column headers from XLSX)
