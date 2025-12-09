# Card/Table View Toggle - Implementation Plan

**Date:** 2024-12-04
**Page:** `/apps/web/src/app/field-population/page.tsx`

---

## Scope

Add a toggle to switch between card grid view and TanStack Table view for field population stats.

---

## Implementation

### 1. State
- Add `useState<"cards" | "table">("cards")` to page.tsx

### 2. Toggle UI
- Use existing Tabs component styled as toggle
- Icons: `LayoutGrid` (cards) + `Table2` (table) from lucide-react
- Place near header

### 3. Views
- Extract existing card grid to `field-cards-view.tsx`
- Create new `field-table-view.tsx` using existing TanStack Table patterns
- Same data, same click handler (`handleFieldClick`), different display

---

## Files

| File | Action |
|------|--------|
| `page.tsx` | Add view state, toggle UI, conditional render |
| `field-cards-view.tsx` | NEW - move existing card grid here |
| `field-table-view.tsx` | NEW - TanStack table for field stats |

---

## Table Columns

| Column | Data |
|--------|------|
| Field Name | `field` |
| Coverage | `coverage` (%) |
| Files With Data | `filesWithData` |
| Files Missing | `filesMissing` |
| Unique Values | `uniqueValues` |
| Unique Positions | `uniquePositions` |

---

## Existing Patterns to Follow

- `/components/field-population/field-population-table.tsx` - clickable rows
- `/components/products/products-table.tsx` - sortable headers, search
- Use existing `@tanstack/react-table` setup (already installed)

---

**Status:** Ready for implementation
