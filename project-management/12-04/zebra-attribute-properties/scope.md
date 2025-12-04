# Feature: Zebra Attribute Properties

## Overview
Import and store Zebra-provided attribute property data from Excel spreadsheets. This data defines metadata about each attribute (e.g., "Camera" is "Hardware", has certain priorities, AEM page mappings, etc.).

## Status: Research Complete ✅

---

## Source Data Analysis

**File**: `zebra-artifacts/sheets/attribute-comparison-by-type.xlsx`

| Metric | Value |
|--------|-------|
| Total Rows | 261 (260 data + 1 header) |
| Total Columns | 22 (A-V) |
| Unique Attributes | 260 |
| Sheet Name | Sheet2 |

### Column Population Analysis

**High Population (≥40%) → Wide Table**:
- Data Source HW (H): 95%
- Data Source SSS (J): 96%
- Effort HW (I): 94%
- Effort SSS (K): 97%
- Hardware (C): 57%
- Description (R): 49%
- Supplies (E): 38%
- Model/SKU (Q): 38%

**Low Population (<40%) → EAV Table**:
- Core (B): 15%
- Services (F): 19%
- Priority (L): 18%
- Notes (S): 12%
- And 8 others...

---

## Schema Design Decision

**Approach**: Hybrid Wide Table + EAV

### Three Tables (all prefixed `zebra_provided_`)

1. **`zebra_provided_attributes`** - Wide table
   - 260 rows (one per attribute)
   - 8 columns for frequently-populated properties
   - Primary lookup by exact attribute name

2. **`zebra_provided_properties_catalog`** - Metadata registry
   - 22 rows (one per Excel column)
   - Maps properties to Excel coordinates
   - Defines storage strategy (wide vs EAV)

3. **`zebra_provided_attribute_values`** - EAV for sparse data
   - ~2,800 rows
   - Stores both original and normalized values
   - Full Excel cell traceability

### Storage Estimate: ~1.7 MB total

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Hybrid wide + EAV | Balance performance with flexibility |
| 40% population threshold | Data-driven split from actual analysis |
| Preserve original values | Enable re-normalization and auditing |
| `zebra_provided_` prefix | Namespace isolation in shared DB |
| Excel coordinate tracking | Complete traceability for debugging |
| Type-safe EAV columns | Use `boolean_value`, `text_value` not JSONB |

---

## Value Normalization Rules

| Excel Value | Normalized | Type |
|-------------|------------|------|
| "X", "x", "✓" | `true` | boolean |
| Empty, "N/A", "-" | `null` | null |
| Free text | as-is | text |

---

## Traceability

**Property Naming**: `{normalized_name} ({excel_column})`
- Example: `hardware (C)`, `priority (L)`

**Tracking Columns**:
- Attributes: `excel_row_number`
- Properties: `excel_column_letter`, `excel_column_position`
- Values: `excel_cell_ref` (e.g., "C42")

---

## Deliverables

### Research Documents (Complete ✅)
- [x] `agent-research/excel-parser-design.md` - SheetJS API research
- [x] `agent-research/parser-summary.md` - Excel analysis results
- [x] `agent-research/taxonomy-research.md` - Normalization patterns
- [x] `agent-research/schema-proposal.md` - Full Drizzle schema
- [x] `agent-research/schema-proposal-summary.md` - Quick reference

### Scripts (Complete ✅)
- [x] `scripts/attribute-analysis/parse-xlsx.ts` - Excel parser
- [x] `scripts/attribute-analysis/package.json` - Dependencies
- [x] `scripts/attribute-analysis/README.md` - Usage docs
- [x] `scripts/attribute-analysis/EXAMPLES.md` - jq query examples

### Implementation (Pending)
- [ ] Add schema to `packages/db/src/schema/zebra.ts`
- [ ] Run `bun run db:generate` for migration
- [ ] Run `bun run db:migrate` to apply
- [ ] Create import script
- [ ] Seed properties catalog (22 rows)
- [ ] Import attributes (260 + ~2800 rows)

---

## Next Steps

1. **Review** this proposal
2. **Approve** schema design
3. **Execute** implementation phase (separate feature work)
