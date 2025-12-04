# Data Taxonomy & Normalization Research

**Date**: 2025-12-04
**Author**: Context Researcher Agent
**Status**: Complete

## Executive Summary

Recommended **hybrid approach** combining traditional relational tables for core entities with EAV-style property storage for sparse, dynamic attributes. Implement column position tracking for full Excel traceability.

---

## 1. Value Type Mappings

### Boolean Indicators

| Excel Value | Normalized DB Value | Type |
|-------------|---------------------|------|
| "X", "x", "✓" | `true` | BOOLEAN |
| Empty cell | `null` | NULL |
| Whitespace only | `null` | NULL |

### Null/Absence Indicators

| Excel Value | Normalized DB Value | Semantic Meaning |
|-------------|---------------------|------------------|
| "N/A", "n/a" | `null` | Not applicable |
| "-" | `null` | Dash as placeholder |
| "" (empty) | `null` | No data entered |

### Storage Strategy
- Store both `original_value` (TEXT) and typed column (`boolean_value`, `text_value`)
- Add `is_normalized` flag to track transformation status
- Enables re-processing and auditing

---

## 2. Traceability Pattern

### Naming Convention
**Pattern**: `{normalized_name} ({excel_column_letter})`

**Examples**:
- `hardware (C)` - Hardware property from column C
- `priority (L)` - Priority property from column L
- `aem_page (P)` - AEM Page property from column P

### Database Columns for Traceability
```
properties table:
- excel_column_letter VARCHAR(10)  -- "A", "B", "AA", etc.
- excel_column_position INT        -- 1, 2, 27, etc.

attributes table:
- excel_row_number INT             -- Row in source Excel

values table:
- excel_cell_ref VARCHAR(20)       -- "B42", "L15", etc.
```

---

## 3. Database Design: Hybrid Model (RECOMMENDED)

### Why Hybrid?
| Pure EAV | Hybrid Model |
|----------|--------------|
| ❌ Complex 5-table JOINs | ✅ Simple queries on core data |
| ❌ 500ms-2s query time | ✅ 10-50ms core, 50-200ms extended |
| ❌ BI tools struggle | ✅ BI tools work naturally |

### Property Categorization Rule
- **>40% populated** → Core wide table (fast queries)
- **10-40% populated** → Extended EAV (indexed)
- **<10% populated** → Sparse EAV (minimal indexing)

### Architecture
```
Bronze Layer → Raw Excel import (audit trail)
Silver Layer → Core table (wide) + Extended table (EAV)
Gold Layer → Materialized views (analytics)
```

---

## 4. Key Recommendations

1. **Preserve original values** - Always store `original_value` as TEXT
2. **Type-specific columns** - Use `boolean_value`, `text_value`, `categorical_value` (not generic JSONB)
3. **Excel coordinates** - Track column letter, position, and row for every piece of data
4. **Property naming** - Include Excel column in property names for instant traceability
5. **Analyze before splitting** - Profile data population rates to decide wide vs EAV

---

## 5. Value Normalization Functions

```sql
-- Boolean normalization
CASE
  WHEN UPPER(TRIM(value)) IN ('X', '✓', 'TRUE', 'YES', '1') THEN true
  WHEN UPPER(TRIM(value)) IN ('', 'N/A', '-', 'NULL', 'FALSE', 'NO', '0') THEN false
  ELSE NULL
END

-- Categorical detection (column has <10 unique values with >5% frequency each)
-- Free text: everything else
```

---

## References
- Entity-Attribute-Value Model patterns
- Data Mapping Techniques (Flatfile, The CTO Club)
- Excel to Database Migration Strategies
- Data Lineage and Audit Trails best practices
