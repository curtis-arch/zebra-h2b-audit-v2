# Schema Proposal: Zebra Attribute Properties

## Executive Summary

This document proposes a **hybrid wide-table + EAV** schema design for storing Zebra-provided attribute properties from Excel data (260 attributes × 22 properties). The design uses medallion architecture principles (Bronze/Silver/Gold) with complete Excel traceability.

### Key Design Decisions

1. **Hybrid Storage Model**: Wide table for core properties (>40% populated) + EAV for sparse properties (<40%)
2. **Excel Traceability**: All data tracks back to exact Excel coordinates (row numbers, column letters)
3. **Value Preservation**: Original values stored as TEXT, normalized values in typed columns
4. **Prefixing**: All tables use `zebra_provided_` prefix for namespace isolation
5. **Type Safety**: Drizzle ORM with full TypeScript inference

### Column Analysis

**Wide Table Candidates (≥40% populated)**:
- Column C: `Hardware` (57% populated)
- Column E: `Supplies` (38% populated - borderline)
- Column H: `Data Source (Hardware)` (95% populated)
- Column I: `Effort (Hardware)` (94% populated)
- Column J: `Data Source (SSS)` (96% populated)
- Column K: `Effort (SSS)` (97% populated)
- Column Q: `Model or SKU` (38% populated - borderline)
- Column R: `Description` (49% populated)

**EAV Table Candidates (<40% populated)**:
- Columns B, D, F, G, L, M, N, O, P, S, U, V (12 columns)
- Column T: `Configurable` (0% populated - completely empty)

---

## Schema Design

### Table 1: `zebra_provided_attributes` (Core/Wide Table)

**Purpose**: Store attribute names and frequently-populated properties in wide-table format.

**Drizzle Schema**:

```typescript
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Zebra-Provided Attributes - Core attribute data with wide columns
 *
 * Stores 260 attributes from attribute-comparison-by-type.xlsx with
 * frequently-populated properties in columnar format. Each row represents
 * one attribute with its core metadata.
 *
 * CRITICAL: attribute_name MUST preserve exact Excel values (no normalization).
 * This is the golden source for attribute name matching across systems.
 */
export const zebraProvidedAttributes = pgTable(
  "zebra_provided_attributes",
  {
    // Primary key
    id: serial("id").primaryKey(),

    // Excel traceability - Column A
    attributeName: text("attribute_name").notNull(),
    excelRowNumber: integer("excel_row_number").notNull(),

    // Category flags (wide columns) - Columns C, E
    // These are boolean "X" marks indicating which product types use this attribute
    isHardware: boolean("is_hardware").default(false),
    isSupplies: boolean("is_supplies").default(false),

    // Data source tracking (wide columns) - Columns H, J
    // Where the attribute data originates (e.g., "PIM", "AEM", "Manual")
    dataSourceHardware: text("data_source_hardware"),
    dataSourceSss: text("data_source_sss"), // SSS = Supplies, Services, Software

    // Effort tracking (wide columns) - Columns I, K
    // Implementation complexity (e.g., "Low", "Medium", "High")
    effortHardware: text("effort_hardware"),
    effortSss: text("effort_sss"),

    // Documentation (wide columns) - Columns Q, R
    modelOrSku: text("model_or_sku"), // Example SKU or model number
    description: text("description"), // Human-readable description

    // Metadata
    importedAt: timestamp("imported_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    importedFrom: text("imported_from").notNull(), // Source file path
    importSourceHash: varchar("import_source_hash", { length: 64 }), // SHA-256 of source file
  },
  (table) => ({
    // CRITICAL: Unique index on exact attribute name for lookups
    uqAttributeName: uniqueIndex("uq_zebra_attr_name").on(table.attributeName),

    // Index for Excel traceability queries
    idxExcelRow: index("idx_zebra_attr_excel_row").on(table.excelRowNumber),

    // Indexes for category filtering
    idxIsHardware: index("idx_zebra_attr_hardware").on(table.isHardware),
    idxIsSupplies: index("idx_zebra_attr_supplies").on(table.isSupplies),

    // Index for data source queries
    idxDataSourceHw: index("idx_zebra_attr_ds_hw").on(table.dataSourceHardware),
    idxDataSourceSss: index("idx_zebra_attr_ds_sss").on(table.dataSourceSss),
  })
);

/**
 * Type inference for TypeScript
 */
export type ZebraProvidedAttribute = typeof zebraProvidedAttributes.$inferSelect;
export type NewZebraProvidedAttribute = typeof zebraProvidedAttributes.$inferInsert;
```

---

### Table 2: `zebra_provided_properties_catalog` (Metadata Registry)

**Purpose**: Catalog of all 22 properties from Excel with their metadata and Excel coordinates.

**Drizzle Schema**:

```typescript
/**
 * Zebra-Provided Properties Catalog - Property metadata registry
 *
 * Defines all 22 properties from the Excel spreadsheet with complete
 * traceability to source coordinates. Each property gets a normalized
 * name and tracks its Excel column position.
 *
 * Property names formatted as: "{normalized_name} ({excel_column})"
 * Example: "hardware (C)", "data_source_hardware (H)"
 */
export const zebraProvidedPropertiesCatalog = pgTable(
  "zebra_provided_properties_catalog",
  {
    // Primary key
    id: serial("id").primaryKey(),

    // Property identification
    propertyName: varchar("property_name", { length: 255 }).notNull(),
    propertySlug: varchar("property_slug", { length: 255 }).notNull(), // normalized_snake_case

    // Excel traceability
    excelColumnLetter: varchar("excel_column_letter", { length: 2 }).notNull(), // A, B, AA, etc.
    excelColumnPosition: integer("excel_column_position").notNull(), // 0-based index
    excelHeaderValue: text("excel_header_value").notNull(), // Original header text

    // Property metadata
    dataType: varchar("data_type", { length: 50 }).notNull(), // 'boolean', 'text', 'categorical', 'number'
    storageStrategy: varchar("storage_strategy", { length: 20 }).notNull(), // 'wide' or 'eav'
    populationPercent: integer("population_percent").notNull(), // 0-100

    // Storage mapping
    wideColumnName: varchar("wide_column_name", { length: 255 }), // Column name in zebra_provided_attributes (if wide)
    eavPropertyKey: varchar("eav_property_key", { length: 255 }), // Key in zebra_provided_attribute_values (if EAV)

    // Documentation
    description: text("description"),
    exampleValues: text("example_values"), // JSON array of sample values

    // Metadata
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Unique constraints
    uqPropertySlug: uniqueIndex("uq_zebra_prop_slug").on(table.propertySlug),
    uqExcelColumn: uniqueIndex("uq_zebra_prop_excel_col").on(
      table.excelColumnLetter
    ),
    uqExcelPosition: uniqueIndex("uq_zebra_prop_excel_pos").on(
      table.excelColumnPosition
    ),

    // Indexes for queries
    idxStorageStrategy: index("idx_zebra_prop_storage").on(
      table.storageStrategy
    ),
    idxDataType: index("idx_zebra_prop_datatype").on(table.dataType),
  })
);

export type ZebraProvidedPropertyCatalog = typeof zebraProvidedPropertiesCatalog.$inferSelect;
export type NewZebraProvidedPropertyCatalog = typeof zebraProvidedPropertiesCatalog.$inferInsert;
```

---

### Table 3: `zebra_provided_attribute_values` (EAV/Sparse Properties)

**Purpose**: Store sparse properties (<40% populated) in EAV format with type-safe columns and original value preservation.

**Drizzle Schema**:

```typescript
/**
 * Zebra-Provided Attribute Values - EAV table for sparse properties
 *
 * Stores properties with <40% population rate in Entity-Attribute-Value format.
 * Each row represents one property value for one attribute.
 *
 * VALUE PRESERVATION STRATEGY:
 * - original_value: Always stored as TEXT (raw Excel value)
 * - typed columns (boolean_value, text_value, etc.): Normalized/parsed values
 * - is_normalized: Flag indicating if normalization was applied
 *
 * This dual-storage approach enables:
 * 1. Auditing: Compare original vs normalized values
 * 2. Re-normalization: Reprocess original values with improved logic
 * 3. Type safety: Query typed columns with proper NULL semantics
 */
export const zebraProvidedAttributeValues = pgTable(
  "zebra_provided_attribute_values",
  {
    // Primary key
    id: serial("id").primaryKey(),

    // Foreign keys
    attributeId: integer("attribute_id")
      .notNull()
      .references(() => zebraProvidedAttributes.id, { onDelete: "cascade" }),
    propertyId: integer("property_id")
      .notNull()
      .references(() => zebraProvidedPropertiesCatalog.id, {
        onDelete: "restrict",
      }),

    // Excel traceability (for debugging)
    excelCellRef: varchar("excel_cell_ref", { length: 10 }).notNull(), // e.g., "C42"

    // Original value (always preserved)
    originalValue: text("original_value").notNull(), // Raw Excel cell value as TEXT

    // Typed/normalized values (only one should be populated per row)
    booleanValue: boolean("boolean_value"), // For "X", "Yes", "No" → boolean
    textValue: text("text_value"), // For free text
    categoricalValue: varchar("categorical_value", { length: 255 }), // For controlled vocabulary
    numericValue: integer("numeric_value"), // For numbers

    // Normalization metadata
    isNormalized: boolean("is_normalized").default(false).notNull(), // true if original → typed conversion applied
    normalizationNote: text("normalization_note"), // Explanation of transformation

    // Metadata
    importedAt: timestamp("imported_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Unique constraint: one value per (attribute, property) pair
    uqAttributeProperty: uniqueIndex("uq_zebra_attr_prop_value").on(
      table.attributeId,
      table.propertyId
    ),

    // Foreign key indexes (for joins)
    idxAttributeId: index("idx_zebra_value_attr").on(table.attributeId),
    idxPropertyId: index("idx_zebra_value_prop").on(table.propertyId),

    // Index for Excel traceability
    idxExcelCellRef: index("idx_zebra_value_cell_ref").on(table.excelCellRef),

    // Indexes for typed value queries
    idxBooleanValue: index("idx_zebra_value_bool").on(table.booleanValue),
    idxCategoricalValue: index("idx_zebra_value_cat").on(
      table.categoricalValue
    ),

    // Composite index for common query pattern
    idxAttrProp: index("idx_zebra_value_attr_prop").on(
      table.attributeId,
      table.propertyId
    ),
  })
);

export type ZebraProvidedAttributeValue = typeof zebraProvidedAttributeValues.$inferSelect;
export type NewZebraProvidedAttributeValue = typeof zebraProvidedAttributeValues.$inferInsert;
```

---

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  zebra_provided_properties_catalog                          │
│  ─────────────────────────────────────────────────────────  │
│  • id [PK]                                                  │
│  • property_name ("hardware (C)")                           │
│  • property_slug ("hardware")                               │
│  • excel_column_letter ("C")                                │
│  • excel_column_position (2)                                │
│  • storage_strategy ('wide' | 'eav')                        │
│  • population_percent (57)                                  │
│  • wide_column_name ("is_hardware")  ← Maps to wide col    │
│  • eav_property_key ("core")         ← Maps to EAV key     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Referenced by (FK)
                              ▼
┌──────────────────────────────────────────┐         ┌────────────────────────────────────────┐
│  zebra_provided_attributes               │         │  zebra_provided_attribute_values       │
│  ────────────────────────────────────    │         │  ──────────────────────────────────    │
│  • id [PK]                               │◄────────│  • id [PK]                             │
│  • attribute_name [UNIQUE]               │   1:N   │  • attribute_id [FK]                   │
│  • excel_row_number                      │         │  • property_id [FK] ────────────┐      │
│                                          │         │  • excel_cell_ref ("B42")       │      │
│  WIDE COLUMNS (≥40% populated):          │         │                                 │      │
│  • is_hardware (C)                       │         │  VALUE STORAGE:                 │      │
│  • is_supplies (E)                       │         │  • original_value [TEXT]        │      │
│  • data_source_hardware (H)              │         │  • boolean_value                │      │
│  • data_source_sss (J)                   │         │  • text_value                   │      │
│  • effort_hardware (I)                   │         │  • categorical_value            │      │
│  • effort_sss (K)                        │         │  • numeric_value                │      │
│  • model_or_sku (Q)                      │         │  • is_normalized (flag)         │      │
│  • description (R)                       │         │                                 │      │
│                                          │         │  UNIQUE: (attribute_id, property_id)   │
│  • imported_at                           │         └────────────────────────────────────────┘
│  • import_source_hash                    │                          │
└──────────────────────────────────────────┘                          │
                                                                      │
                                              Maps back to catalog ────┘
                                              to get Excel coordinates


DATA FLOW:
==========
1. Import parses Excel → creates catalog entries (22 rows)
2. For each attribute (260 rows):
   a. Create row in zebra_provided_attributes (wide columns)
   b. Create rows in zebra_provided_attribute_values (sparse/EAV)
3. Queries join tables using property_id to trace back to Excel coords
```

---

## Index Strategy

### Performance Considerations

1. **Attribute Lookup by Name** (Most Common)
   - Unique index: `zebra_provided_attributes.attribute_name`
   - Expected: <1ms for exact match

2. **Property Catalog Lookups**
   - Unique indexes on: `property_slug`, `excel_column_letter`, `excel_column_position`
   - Expected: <1ms for metadata queries

3. **EAV Queries** (Potential N+1 Risk)
   - Composite index: `(attribute_id, property_id)`
   - Single-attribute queries: <5ms with proper joins
   - Bulk queries: Use batch fetching or CTEs

4. **Excel Traceability**
   - Index: `zebra_provided_attribute_values.excel_cell_ref`
   - Used for debugging/auditing: "What was in cell B42?"

5. **Category Filtering**
   - Indexes on: `is_hardware`, `is_supplies`
   - Expected: Fast bitmap scans for boolean columns

### Index Maintenance

- All indexes are B-tree (PostgreSQL default)
- No partial indexes needed (small dataset: 260 rows + ~3000 EAV rows)
- VACUUM ANALYZE recommended after bulk imports

---

## Migration Notes

### Phase 1: Schema Creation (This Proposal)

```bash
# Add schema to packages/db/src/schema/zebra.ts
# Run migration generation
cd packages/db
bun run db:generate

# Review generated SQL in drizzle/migrations/
# Verify table names, indexes, constraints

# Apply to database
bun run db:migrate
```

### Phase 2: Catalog Seeding

```typescript
// Import script: scripts/attribute-analysis/seed-catalog.ts
// Populates zebra_provided_properties_catalog with 22 property definitions

const PROPERTY_DEFINITIONS = [
  {
    propertyName: "attribute (A)",
    propertySlug: "attribute",
    excelColumnLetter: "A",
    excelColumnPosition: 0,
    excelHeaderValue: "Attribute",
    dataType: "text",
    storageStrategy: "wide", // Primary key column
    populationPercent: 100,
    wideColumnName: "attribute_name",
  },
  {
    propertyName: "hardware (C)",
    propertySlug: "hardware",
    excelColumnLetter: "C",
    excelColumnPosition: 2,
    excelHeaderValue: "Hardware",
    dataType: "boolean",
    storageStrategy: "wide",
    populationPercent: 57,
    wideColumnName: "is_hardware",
  },
  // ... 20 more definitions
];

// Insert into database
await db.insert(zebraProvidedPropertiesCatalog).values(PROPERTY_DEFINITIONS);
```

### Phase 3: Attribute Import

```typescript
// Import script: scripts/attribute-analysis/import-attributes.ts
// Parses Excel → populates both wide and EAV tables

import { parse } from 'xlsx';
import { db } from '@zebra-h2b-audit-v2/db';

const workbook = readFile('zebra-artifacts/sheets/attribute-comparison-by-type.xlsx');
const sheet = workbook.Sheets['Sheet2'];
const data = utils.sheet_to_json(sheet, { header: 1, defval: undefined });

for (let rowIdx = 1; rowIdx < data.length; rowIdx++) {
  const row = data[rowIdx];

  // Insert wide table row
  const [attr] = await db.insert(zebraProvidedAttributes).values({
    attributeName: row[0], // Column A - NEVER normalize
    excelRowNumber: rowIdx + 1, // Excel is 1-based
    isHardware: row[2] === 'X', // Column C
    isSupplies: row[4] === 'X', // Column E
    dataSourceHardware: row[7] || null, // Column H
    dataSourceSss: row[9] || null, // Column J
    effortHardware: row[8] || null, // Column I
    effortSss: row[10] || null, // Column K
    modelOrSku: row[16] || null, // Column Q
    description: row[17] || null, // Column R
    importedFrom: 'attribute-comparison-by-type.xlsx',
    importSourceHash: computeSHA256(fileContent),
  }).returning();

  // Insert EAV rows for sparse columns
  const sparseColumns = [
    { propId: 2, colIdx: 1, letter: 'B' },  // Core
    { propId: 4, colIdx: 3, letter: 'D' },  // Accessories
    { propId: 6, colIdx: 5, letter: 'F' },  // Services
    // ... etc
  ];

  for (const { propId, colIdx, letter } of sparseColumns) {
    const value = row[colIdx];
    if (value !== undefined && value !== null && value !== '') {
      await db.insert(zebraProvidedAttributeValues).values({
        attributeId: attr.id,
        propertyId: propId,
        excelCellRef: `${letter}${rowIdx + 1}`,
        originalValue: String(value),
        booleanValue: value === 'X' ? true : null,
        textValue: value !== 'X' ? String(value) : null,
        isNormalized: value === 'X', // "X" → boolean is normalized
      });
    }
  }
}
```

### Phase 4: Verification Queries

```sql
-- Check attribute count
SELECT COUNT(*) FROM zebra_provided_attributes; -- Expected: 260

-- Check catalog completeness
SELECT COUNT(*) FROM zebra_provided_properties_catalog; -- Expected: 22

-- Check EAV row count (approximate)
SELECT COUNT(*) FROM zebra_provided_attribute_values; -- Expected: ~2500-3000

-- Verify Excel traceability
SELECT
  a.attribute_name,
  a.excel_row_number,
  p.excel_column_letter,
  v.excel_cell_ref,
  v.original_value
FROM zebra_provided_attribute_values v
JOIN zebra_provided_attributes a ON v.attribute_id = a.id
JOIN zebra_provided_properties_catalog p ON v.property_id = p.id
WHERE a.attribute_name = 'Camera'
ORDER BY p.excel_column_position;
```

---

## Query Examples

### 1. Find Attribute by Exact Name

```typescript
import { eq } from 'drizzle-orm';
import { db } from '@zebra-h2b-audit-v2/db';

async function findAttributeByName(name: string) {
  const attr = await db.query.zebraProvidedAttributes.findFirst({
    where: eq(zebraProvidedAttributes.attributeName, name),
  });

  return attr;
}

// Usage
const camera = await findAttributeByName('Camera');
console.log(camera?.isHardware); // true/false
console.log(camera?.description); // "Device camera specifications"
```

### 2. Get All Properties for an Attribute (Hybrid Query)

```typescript
import { eq } from 'drizzle-orm';

async function getAllPropertiesForAttribute(attributeName: string) {
  // Step 1: Get base attribute with wide columns
  const attr = await db.query.zebraProvidedAttributes.findFirst({
    where: eq(zebraProvidedAttributes.attributeName, attributeName),
  });

  if (!attr) return null;

  // Step 2: Get EAV properties
  const eavProps = await db
    .select({
      propertyName: zebraProvidedPropertiesCatalog.propertyName,
      propertySlug: zebraProvidedPropertiesCatalog.propertySlug,
      excelColumn: zebraProvidedPropertiesCatalog.excelColumnLetter,
      originalValue: zebraProvidedAttributeValues.originalValue,
      booleanValue: zebraProvidedAttributeValues.booleanValue,
      textValue: zebraProvidedAttributeValues.textValue,
    })
    .from(zebraProvidedAttributeValues)
    .innerJoin(
      zebraProvidedPropertiesCatalog,
      eq(
        zebraProvidedAttributeValues.propertyId,
        zebraProvidedPropertiesCatalog.id
      )
    )
    .where(eq(zebraProvidedAttributeValues.attributeId, attr.id));

  // Step 3: Merge wide + EAV data
  return {
    attributeName: attr.attributeName,
    excelRow: attr.excelRowNumber,

    // Wide properties
    hardware: attr.isHardware,
    supplies: attr.isSupplies,
    dataSourceHardware: attr.dataSourceHardware,
    dataSourceSss: attr.dataSourceSss,
    effortHardware: attr.effortHardware,
    effortSss: attr.effortSss,
    modelOrSku: attr.modelOrSku,
    description: attr.description,

    // EAV properties (sparse)
    sparseProperties: eavProps.reduce((acc, prop) => {
      acc[prop.propertySlug] = {
        excelColumn: prop.excelColumn,
        value: prop.booleanValue ?? prop.textValue ?? prop.originalValue,
      };
      return acc;
    }, {} as Record<string, { excelColumn: string; value: unknown }>),
  };
}

// Usage
const cameraProps = await getAllPropertiesForAttribute('Camera');
console.log(cameraProps.hardware); // true (from wide column)
console.log(cameraProps.sparseProperties.core); // { excelColumn: 'B', value: 'X' }
```

### 3. Trace Back to Excel Coordinates

```typescript
import { eq, and } from 'drizzle-orm';

async function traceValueToExcel(
  attributeName: string,
  propertySlug: string
) {
  // Find the attribute
  const attr = await db.query.zebraProvidedAttributes.findFirst({
    where: eq(zebraProvidedAttributes.attributeName, attributeName),
  });

  if (!attr) return null;

  // Find the property in catalog
  const prop = await db.query.zebraProvidedPropertiesCatalog.findFirst({
    where: eq(zebraProvidedPropertiesCatalog.propertySlug, propertySlug),
  });

  if (!prop) return null;

  // Check wide column first
  if (prop.storageStrategy === 'wide' && prop.wideColumnName) {
    const wideValue = attr[prop.wideColumnName as keyof typeof attr];
    return {
      excelCoordinate: `${prop.excelColumnLetter}${attr.excelRowNumber}`,
      value: wideValue,
      source: 'wide_table',
      columnName: prop.wideColumnName,
    };
  }

  // Check EAV table
  const eavValue = await db.query.zebraProvidedAttributeValues.findFirst({
    where: and(
      eq(zebraProvidedAttributeValues.attributeId, attr.id),
      eq(zebraProvidedAttributeValues.propertyId, prop.id)
    ),
  });

  if (eavValue) {
    return {
      excelCoordinate: eavValue.excelCellRef,
      value: eavValue.booleanValue ?? eavValue.textValue ?? eavValue.originalValue,
      originalValue: eavValue.originalValue,
      source: 'eav_table',
      normalized: eavValue.isNormalized,
    };
  }

  return {
    excelCoordinate: `${prop.excelColumnLetter}${attr.excelRowNumber}`,
    value: null,
    source: 'empty_cell',
  };
}

// Usage
const trace = await traceValueToExcel('Camera', 'hardware');
console.log(trace);
// {
//   excelCoordinate: 'C42',
//   value: true,
//   source: 'wide_table',
//   columnName: 'is_hardware'
// }
```

### 4. Find All Attributes with a Specific Property Value

```typescript
async function findAttributesByProperty(
  propertySlug: string,
  value: boolean | string
) {
  const prop = await db.query.zebraProvidedPropertiesCatalog.findFirst({
    where: eq(zebraProvidedPropertiesCatalog.propertySlug, propertySlug),
  });

  if (!prop) return [];

  // If wide column, query directly
  if (prop.storageStrategy === 'wide' && prop.wideColumnName) {
    const columnName = prop.wideColumnName as keyof typeof zebraProvidedAttributes;
    const results = await db
      .select()
      .from(zebraProvidedAttributes)
      .where(eq(zebraProvidedAttributes[columnName], value));

    return results;
  }

  // If EAV, join through values table
  const results = await db
    .select({
      attribute: zebraProvidedAttributes,
      value: zebraProvidedAttributeValues,
    })
    .from(zebraProvidedAttributeValues)
    .innerJoin(
      zebraProvidedAttributes,
      eq(zebraProvidedAttributeValues.attributeId, zebraProvidedAttributes.id)
    )
    .where(
      and(
        eq(zebraProvidedAttributeValues.propertyId, prop.id),
        typeof value === 'boolean'
          ? eq(zebraProvidedAttributeValues.booleanValue, value)
          : eq(zebraProvidedAttributeValues.textValue, value)
      )
    );

  return results.map((r) => r.attribute);
}

// Usage
const hardwareAttrs = await findAttributesByProperty('hardware', true);
console.log(hardwareAttrs.length); // ~149 attributes
```

### 5. Get Property Catalog with Population Stats

```typescript
async function getPropertyCatalogSummary() {
  const catalog = await db
    .select({
      propertyName: zebraProvidedPropertiesCatalog.propertyName,
      excelColumn: zebraProvidedPropertiesCatalog.excelColumnLetter,
      storageStrategy: zebraProvidedPropertiesCatalog.storageStrategy,
      populationPercent: zebraProvidedPropertiesCatalog.populationPercent,
      dataType: zebraProvidedPropertiesCatalog.dataType,
    })
    .from(zebraProvidedPropertiesCatalog)
    .orderBy(zebraProvidedPropertiesCatalog.excelColumnPosition);

  return catalog;
}

// Usage
const catalog = await getPropertyCatalogSummary();
catalog.forEach((prop) => {
  console.log(
    `${prop.excelColumn}: ${prop.propertyName} (${prop.populationPercent}% populated, ${prop.storageStrategy})`
  );
});
```

---

## Data Type Mapping

| Excel Pattern | Drizzle Type | Storage Column | Example |
|---------------|--------------|----------------|---------|
| "X" (checkmark) | `boolean` | `boolean_value` | `true` |
| "N/A" | `null` | `NULL` | `null` |
| Free text | `text` | `text_value` | "See AEM page" |
| Controlled vocab | `varchar(255)` | `categorical_value` | "High", "Medium", "Low" |
| Numbers | `integer` | `numeric_value` | 42 |
| Empty cell | `null` | (no row created) | - |

**Normalization Rules**:
- "X" → `boolean_value = true`, `is_normalized = true`
- "N/A" → No row created (treated as NULL)
- Everything else → Stored in `original_value` + appropriate typed column

---

## Storage Estimates

### Table Sizes (Approximate)

**zebra_provided_attributes**:
- Rows: 260
- Size: ~50-80 KB (with indexes: ~150 KB)

**zebra_provided_properties_catalog**:
- Rows: 22
- Size: ~5 KB (with indexes: ~10 KB)

**zebra_provided_attribute_values**:
- Rows: ~2,800 (calculated from empty cell counts)
  - Total cells: 260 × 22 = 5,720
  - Empty cells: 2,920 (from parser data)
  - Populated cells: 2,800
- Size per row: ~200 bytes average
- Total size: ~560 KB (with indexes: ~1.5 MB)

**Total Database Footprint**: ~1.7 MB

**Conclusion**: Extremely lightweight schema suitable for in-memory caching if needed.

---

## Advantages of This Design

### 1. Excel Traceability
✅ Every value traces back to exact Excel cell (column letter + row number)
✅ Property catalog documents all 22 columns with metadata
✅ Easy to generate "Excel coordinate → database value" audit reports

### 2. Type Safety
✅ Wide columns leverage PostgreSQL's columnar storage for fast queries
✅ EAV table uses typed columns (not generic JSONB) for proper NULL semantics
✅ Drizzle generates full TypeScript types from schema

### 3. Query Performance
✅ Wide table for frequent queries (isHardware, dataSourceHardware, etc.)
✅ EAV table uses composite index (attribute_id, property_id) for fast joins
✅ No N+1 queries with proper `.with()` eager loading in Drizzle

### 4. Data Integrity
✅ Original values preserved in `original_value` TEXT column
✅ Normalized values in typed columns with `is_normalized` flag
✅ Foreign key constraints prevent orphaned data
✅ Unique constraints enforce data consistency

### 5. Flexibility
✅ Easy to add new sparse properties without schema migration (just add to catalog)
✅ Re-normalization possible by processing `original_value` column
✅ Can convert EAV → wide column if population rate increases

### 6. Namespace Isolation
✅ All tables prefixed with `zebra_provided_` to avoid conflicts
✅ Clear separation from application-generated data
✅ Easy to identify source system in queries

---

## Disadvantages & Mitigations

### 1. Hybrid Complexity
**Issue**: Developers must know which properties are wide vs. EAV

**Mitigation**:
- Property catalog table serves as single source of truth
- Helper functions abstract storage strategy (see query examples)
- TypeScript types guide usage

### 2. EAV Query Overhead
**Issue**: Joining EAV table for each sparse property adds latency

**Mitigation**:
- Only 12/22 properties are EAV (55%)
- Most common properties (hardware, data_source_*) are wide columns
- Batch queries with `db.batch()` to reduce round trips
- Consider materialized view for complex reports

### 3. Schema Evolution
**Issue**: Adding wide columns requires migration

**Mitigation**:
- Monitor property population rates in analytics
- Only promote properties to wide columns if >50% populated
- EAV handles ad-hoc properties without migration

---

## Alternative Designs Considered

### Alternative 1: Pure Wide Table (All 22 Columns)
**Pros**: Simplest schema, fastest queries
**Cons**: Wastes storage on 12 sparse columns (avg 15% populated), violates normalization

### Alternative 2: Pure EAV (All Properties)
**Pros**: Maximum flexibility, normalized
**Cons**: Slow queries, no type safety, complex joins

### Alternative 3: JSONB Blob
**Pros**: Schema-less, easy imports
**Cons**: No type safety, poor query performance, no indexing on nested properties

### Alternative 4: Separate Table Per Property
**Pros**: Maximum normalization
**Cons**: 22 tables, complex joins, management nightmare

**SELECTED: Hybrid Wide + EAV** balances performance, flexibility, and maintainability.

---

## Implementation Checklist

### Phase 1: Schema Setup
- [ ] Copy Drizzle schema to `packages/db/src/schema/zebra.ts`
- [ ] Export new tables from `packages/db/src/index.ts`
- [ ] Run `bun run db:generate` to create migration
- [ ] Review migration SQL for correctness
- [ ] Run `bun run db:migrate` to apply schema
- [ ] Verify tables exist in Drizzle Studio

### Phase 2: Catalog Seeding
- [ ] Create `scripts/attribute-analysis/seed-catalog.ts`
- [ ] Define 22 property definitions with Excel coordinates
- [ ] Insert into `zebra_provided_properties_catalog`
- [ ] Verify row count = 22

### Phase 3: Data Import
- [ ] Create `scripts/attribute-analysis/import-attributes.ts`
- [ ] Parse Excel file with `xlsx` library
- [ ] Insert into `zebra_provided_attributes` (260 rows)
- [ ] Insert into `zebra_provided_attribute_values` (~2800 rows)
- [ ] Calculate and store source file hash
- [ ] Verify row counts match expectations

### Phase 4: Testing
- [ ] Write unit tests for query helpers
- [ ] Test Excel traceability (coordinate → value lookups)
- [ ] Benchmark query performance (<10ms for single-attribute queries)
- [ ] Test all 5 query examples from this document
- [ ] Verify type inference in TypeScript

### Phase 5: Documentation
- [ ] Update `packages/db/README.md` with new tables
- [ ] Add JSDoc comments to schema definitions
- [ ] Create API documentation for query helpers
- [ ] Document re-import procedure for Excel updates

---

## Conclusion

This hybrid schema design provides:

1. **Complete Excel traceability** with column letters and row numbers
2. **Type-safe storage** using wide columns + typed EAV
3. **Fast query performance** with strategic indexing
4. **Data integrity** with original value preservation
5. **Namespace isolation** via `zebra_provided_` prefix

The schema is production-ready and optimized for the 260 × 22 dataset structure identified by the parser.

**Next Steps**:
1. Review this proposal with team
2. Approve schema design
3. Proceed to Phase 1 implementation (schema creation)
4. Iterate on query helpers based on actual usage patterns

---

**Document Version**: 1.0
**Created**: 2025-12-04
**Author**: Claude Code (Drizzle-Neon Expert Agent)
**Status**: Awaiting Review
