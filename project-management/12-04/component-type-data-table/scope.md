# Feature: Component Type Data Table

## Overview
Add a data table to the `/components` page that displays all component types with similarity grouping, product counts, position information, and Zebra attribute matching status.

## Goals
- Display component types in a compact, scrollable TanStack Table
- Group similar values using trigram similarity (pg_trgm) with adjustable threshold
- Show product and position counts for each component type
- Match component types against Zebra provided attributes (exact/partial/none)
- Support CSV export with threshold metadata

## Non-Goals
- Full-text search across component values
- Editing component types from this table
- Real-time updates (standard query refresh is sufficient)

## Technical Approach

### Similarity Grouping
- Use PostgreSQL `pg_trgm` extension for trigram similarity
- `similarity(a, b)` returns 0-1 score
- Default threshold: 0.85 (85% similarity)
- User-adjustable via slider (debounced 300ms)

### Database Query Strategy
- Single tRPC endpoint with threshold parameter
- CTE-based query to compute:
  1. Normalized component types
  2. Similarity groups using self-join with threshold
  3. Product counts per type
  4. Position counts and list per type
  5. Zebra attribute match status

### Zebra Attribute Matching
- **exact**: `component_type = attribute_name` (case-sensitive)
- **partial**: `LOWER(component_type) = LOWER(attribute_name)`
- **none**: No match found

### UI Components
- TanStack Table with horizontal scroll
- Radix UI Slider for threshold adjustment
- CSV export button in table header

## Success Criteria
- [ ] Table renders all component types with correct counts
- [ ] Similarity grouping updates when threshold changes
- [ ] CSV export includes all columns + threshold value
- [ ] Zebra matching shows correct yes/partial/no status
- [ ] Table scrolls horizontally on narrow screens
- [ ] No performance regression on page load
