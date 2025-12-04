# Schema Proposal Summary

## Quick Reference

**Full Proposal**: See `schema-proposal.md` for complete design, code, and examples.

---

## Design at a Glance

### Three Tables

1. **`zebra_provided_attributes`** (Wide Table)
   - 260 rows (one per attribute)
   - 8 wide columns for frequently-populated properties (≥40%)
   - Primary lookup table by attribute name

2. **`zebra_provided_properties_catalog`** (Metadata Registry)
   - 22 rows (one per Excel column/property)
   - Maps properties to Excel coordinates
   - Defines storage strategy (wide vs EAV)

3. **`zebra_provided_attribute_values`** (EAV Table)
   - ~2,800 rows (sparse properties <40% populated)
   - Preserves original + normalized values
   - Full Excel cell traceability

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| **Hybrid wide + EAV** | Balance performance (wide) with flexibility (EAV) |
| **40% population threshold** | Data-driven split based on actual Excel analysis |
| **Preserve original values** | Enable re-normalization and auditing |
| **`zebra_provided_` prefix** | Namespace isolation in shared database |
| **Excel coordinate tracking** | Complete traceability for debugging |
| **Type-safe EAV** | Use typed columns (boolean_value, text_value) not JSONB |

---

## Column Storage Strategy

### Wide Table Columns (8 properties ≥40% populated)

| Property | Excel Col | Population | Type | DB Column |
|----------|-----------|------------|------|-----------|
| Hardware | C | 57% | boolean | `is_hardware` |
| Supplies | E | 38% | boolean | `is_supplies` |
| Data Source (HW) | H | 95% | text | `data_source_hardware` |
| Data Source (SSS) | J | 96% | text | `data_source_sss` |
| Effort (HW) | I | 94% | text | `effort_hardware` |
| Effort (SSS) | K | 97% | text | `effort_sss` |
| Model or SKU | Q | 38% | text | `model_or_sku` |
| Description | R | 49% | text | `description` |

### EAV Table Properties (12 properties <40% populated)

Columns: B (Core), D (Accessories), F (Services), G (Software), L (Priority), M (Translation Required), N (Data Source Accessories), O (Effort Accessories), P (AKA), S (Notes), U (Origin), V (Exclude?), T (Configurable - 0%)

---

## Critical Indexes

```sql
-- Attribute lookup (most common query)
CREATE UNIQUE INDEX uq_zebra_attr_name ON zebra_provided_attributes(attribute_name);

-- EAV join optimization
CREATE INDEX idx_zebra_value_attr_prop ON zebra_provided_attribute_values(attribute_id, property_id);

-- Excel traceability
CREATE INDEX idx_zebra_attr_excel_row ON zebra_provided_attributes(excel_row_number);
CREATE INDEX idx_zebra_value_cell_ref ON zebra_provided_attribute_values(excel_cell_ref);
```

---

## Query Patterns

### 1. Find by Attribute Name
```typescript
const attr = await db.query.zebraProvidedAttributes.findFirst({
  where: eq(zebraProvidedAttributes.attributeName, 'Camera')
});
// Returns: { isHardware: true, dataSourceHardware: 'PIM', ... }
```

### 2. Get All Properties (Wide + EAV)
```typescript
const allProps = await getAllPropertiesForAttribute('Camera');
// Returns: { hardware: true, supplies: false, sparseProperties: { core: 'X', ... } }
```

### 3. Trace to Excel Cell
```typescript
const trace = await traceValueToExcel('Camera', 'hardware');
// Returns: { excelCoordinate: 'C42', value: true, source: 'wide_table' }
```

---

## Storage Estimates

| Table | Rows | Size (with indexes) |
|-------|------|---------------------|
| `zebra_provided_attributes` | 260 | ~150 KB |
| `zebra_provided_properties_catalog` | 22 | ~10 KB |
| `zebra_provided_attribute_values` | ~2,800 | ~1.5 MB |
| **TOTAL** | | **~1.7 MB** |

**Conclusion**: Extremely lightweight, suitable for in-memory caching.

---

## Advantages

✅ **Fast queries**: Wide columns for common properties (57-97% populated)
✅ **Type-safe**: Drizzle generates TypeScript types, typed EAV columns
✅ **Traceable**: Every value maps to exact Excel cell (e.g., "C42")
✅ **Flexible**: Add new sparse properties without schema migration
✅ **Data integrity**: Original values preserved, foreign keys enforced
✅ **Namespace isolation**: `zebra_provided_` prefix prevents conflicts

---

## Implementation Phases

1. **Schema Creation** → Add to `packages/db/src/schema/zebra.ts`, run migrations
2. **Catalog Seeding** → Insert 22 property definitions with Excel coordinates
3. **Data Import** → Parse Excel, populate both wide and EAV tables
4. **Testing** → Verify traceability, benchmark queries, validate types
5. **Documentation** → API docs, query helpers, re-import procedures

---

## Copy-Paste Ready Code

Full Drizzle schema code is in `schema-proposal.md` section "Schema Design".

**Files to create**:
- Schema: `packages/db/src/schema/zebra.ts` (append to existing)
- Import: `scripts/attribute-analysis/import-attributes.ts`
- Seed: `scripts/attribute-analysis/seed-catalog.ts`

---

## Alternatives Rejected

- **Pure Wide Table** → Wastes storage on sparse columns
- **Pure EAV** → Poor query performance, no type safety
- **JSONB Blob** → No indexing, no type safety
- **22 Separate Tables** → Management nightmare

**Selected**: Hybrid balances performance, flexibility, maintainability.

---

## Next Actions

1. Review proposal with team
2. Approve schema design
3. Create migration (`bun run db:generate`)
4. Apply schema (`bun run db:migrate`)
5. Seed catalog (22 rows)
6. Import attributes (260 + ~2800 rows)
7. Test query helpers
8. Integrate with application

---

**Status**: Proposal Complete ✅
**Full Details**: `schema-proposal.md`
