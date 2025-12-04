# Never Forget: Zebra Attribute Properties

Critical learnings and patterns discovered during this feature research.

---

## Good Patterns

### 1. Data-Driven Schema Design
- **Analyzed actual population rates** before deciding wide vs EAV split
- 40% threshold came from data, not guesswork
- Result: 8 wide columns, 12 EAV properties

### 2. Traceability by Design
- Every value traces back to exact Excel cell (e.g., "C42")
- Property names include Excel column: `hardware (C)`
- Enables debugging and re-import verification

### 3. Preserve Original Values
- Always store `original_value` as TEXT alongside normalized
- Enables re-normalization without re-importing Excel
- Critical for auditing

### 4. Hybrid Architecture
- Wide table for frequently-queried properties (fast)
- EAV for sparse properties (flexible)
- Best of both worlds

### 5. Self-Contained Scripts
- Parser scripts in `scripts/attribute-analysis/` (not in web app)
- Own `package.json` with xlsx dependency
- TypeScript + Bun, consistent with project

---

## Bad Patterns / Gotchas

### 1. Don't Normalize Attribute Names
- Column A values must be **exactly preserved**
- These are used for matching against other systems
- Any normalization breaks joins

### 2. Avoid Pure EAV
- Requires 5+ table JOINs for simple queries
- 500ms-2s query times at scale
- BI tools hate it

### 3. Avoid Generic JSONB
- No type safety
- No indexing on nested values
- Use typed columns instead: `boolean_value`, `text_value`

### 4. Don't Forget Table Prefixes
- This DB is shared with other systems
- All tables MUST use `zebra_provided_` prefix
- Prevents naming collisions

---

## Key Decisions

| Decision | Why |
|----------|-----|
| **Hybrid model** | Pure wide wastes space on sparse cols; pure EAV is slow |
| **40% threshold** | Based on actual Excel column population analysis |
| **Type-safe EAV** | Typed columns beat JSONB for indexing and safety |
| **Excel coords everywhere** | Debugging requires knowing source cell |
| **Bun + TypeScript scripts** | Consistent with project, no Python introduced |

---

## Numbers to Remember

- **260** unique attributes
- **22** properties (columns B-V)
- **8** wide table columns (≥40% populated)
- **12** EAV properties (<40% populated)
- **~2,800** EAV value rows
- **~1.7 MB** total storage

---

## Implementation Checklist

When implementing, remember:

1. [ ] Schema goes in `packages/db/src/schema/zebra.ts` (append, don't replace)
2. [ ] Use `serial("id")` for auto-increment (matches existing pattern)
3. [ ] Use `timestamp(...).defaultNow()` for created_at
4. [ ] Add `onDelete: "cascade"` to foreign keys
5. [ ] Create unique index on `attribute_name`
6. [ ] Seed properties catalog before importing attributes
7. [ ] Test exact-match queries on attribute names
