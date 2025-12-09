# Bug Fix: Embedding Cache Unique Key Update

**Ticket:** zebra-h2b-audit-v2-09o
**Date:** 2025-12-09
**Status:** ✅ Complete

## Problem

The `embedding_cache` table used `value_hash` alone as the unique key, causing collisions when the same text value existed in multiple source columns.

### Specific Issue
- "Additional Features" exists in both:
  - `config_position.attribute_label`
  - `htb_attribute_mapping_zebra_provided.attribute_name_for_htb`
- Same hash = only one entry cached
- Result: 13 `attribute_label` values missing embeddings (170/183 cached)

### Collision Count
13 overlapping values between source columns:
- Additional Features
- Battery Capacity
- Camera
- Color
- Display
- Environment
- Form Factor
- Illumination
- Memory
- Operating System
- Power Supply
- Print Resolution
- Print Width

## Solution

Changed unique key from `value_hash` to composite key: `(value_hash, source_table, source_column)`

### Changes Made

#### 1. Database Schema Update
```sql
-- Drop old constraint
ALTER TABLE embedding_cache
DROP CONSTRAINT IF EXISTS embedding_cache_value_hash_key;

-- Add new composite constraint
ALTER TABLE embedding_cache
ADD CONSTRAINT embedding_cache_unique_key
UNIQUE (value_hash, source_table, source_column);
```

#### 2. Sync Script Update
**File:** `/Users/johncurtis/projects/zebra-h2b-audit-v2/scripts/embeddings/sync-embeddings.ts`

**Change:** Updated `ON CONFLICT` clause from:
```sql
ON CONFLICT (value_hash) DO UPDATE SET ...
```

To:
```sql
ON CONFLICT (value_hash, source_table, source_column) DO UPDATE SET ...
```

Also removed `source_table` and `source_column` from the UPDATE clause since they're now part of the unique key.

#### 3. Re-ran Sync
```bash
bun run sync-embeddings.ts
```

**Results:**
- Added 19 new embeddings total
- 13 for `attribute_label` (the missing overlapping values)
- 6 for `description` (unrelated new values)

## Verification

### Final Counts
| Source Column | Count | Expected | Status |
|--------------|-------|----------|--------|
| `config_option.description` | 1,026 | 1,026 | ✅ |
| `config_position.attribute_label` | 183 | 183 | ✅ |
| `htb_attribute_mapping_zebra_provided.attribute_name_for_htb` | 86 | 86 | ✅ |
| **TOTAL** | **1,295** | **1,295** | ✅ |

### Overlapping Values Check
All 13 overlapping values now have exactly 2 entries each (one per source_column):

```
✅ Additional Features       - 2 entries
✅ Battery Capacity          - 2 entries
✅ Camera                    - 2 entries
✅ Color                     - 2 entries
✅ Display                   - 2 entries
✅ Environment               - 2 entries
✅ Form Factor               - 2 entries
✅ Illumination              - 2 entries
✅ Memory                    - 2 entries
✅ Operating System          - 2 entries
✅ Power Supply              - 2 entries
✅ Print Resolution          - 2 entries
✅ Print Width               - 2 entries
```

### Example: "Additional Features"
```
value_hash: 7c51c8126422013273317d9d7eeb1922fbd6f67416cc3f840c1e08be8eb174d5

Entry 1:
- source_table: config_position
- source_column: attribute_label

Entry 2:
- source_table: htb_attribute_mapping_zebra_provided
- source_column: attribute_name_for_htb
```

## Impact

- **Before:** 170/183 attribute_labels had embeddings (92.9%)
- **After:** 183/183 attribute_labels have embeddings (100%)
- **Data integrity:** Values from different source columns now maintain separate embeddings
- **Semantic correctness:** Same text in different contexts can now have distinct embeddings if needed

## Files Modified

1. `/Users/johncurtis/projects/zebra-h2b-audit-v2/scripts/embeddings/sync-embeddings.ts`
   - Updated ON CONFLICT clause to use composite unique key

2. Database schema (via SQL):
   - Changed unique constraint from `value_hash` to `(value_hash, source_table, source_column)`

## Verification Script

Created `/Users/johncurtis/projects/zebra-h2b-audit-v2/scripts/embeddings/verify-fix.ts` for future verification of overlapping values.

## No Issues Encountered

The fix was applied cleanly with no errors or unexpected behavior.
