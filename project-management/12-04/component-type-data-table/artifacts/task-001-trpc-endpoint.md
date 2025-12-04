# Task 001: tRPC Endpoint for Component Types

## What
Create a tRPC procedure `getComponentTypesWithSimilarity` that fetches all component types with similarity grouping, product/position counts, and Zebra attribute matching.

## Why
The UI needs a single endpoint that returns all data for the table. Computing similarity server-side with pg_trgm is more efficient than client-side processing.

## Files to Touch
- `packages/api/src/routers/components.ts` - Add new procedure
- `packages/db/src/index.ts` - May need to export new types

## Implementation Details

### Input Schema
```typescript
z.object({
  similarityThreshold: z.number().min(0).max(1).default(0.85),
})
```

### Output Schema
```typescript
z.array(z.object({
  componentType: z.string(),
  similarCount: z.number(),
  similarValues: z.array(z.string()),
  productCount: z.number(),
  positionCount: z.number(),
  positions: z.array(z.string()),
  zebraMatch: z.enum(['yes', 'partial', 'no']),
}))
```

### SQL Query Strategy
1. First, ensure pg_trgm extension is enabled
2. Use CTE to get distinct component types with counts
3. Self-join with similarity() function for grouping
4. Left join to zebra_provided_attributes for matching

### Edge Cases
- Handle NULL component_type values (filter out)
- Handle empty positions array
- Handle case where no zebra attributes exist

## Acceptance Criteria
- [ ] Procedure accepts similarityThreshold parameter
- [ ] Returns all columns needed for table
- [ ] Similarity grouping respects threshold
- [ ] Zebra matching returns correct yes/partial/no
- [ ] Query performs acceptably (< 2s for typical dataset)

## Dependencies
- None (first task)
