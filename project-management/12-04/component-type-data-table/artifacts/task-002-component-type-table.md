# Task 002: ComponentTypeTable Component

## What
Create a TanStack Table component that displays component types with all required columns and supports horizontal scrolling.

## Why
Need a reusable, well-structured table component following existing patterns in the codebase. Horizontal scroll is essential since we have 7 columns.

## Files to Touch
- `apps/web/src/components/component-type-table/index.tsx` - Main component
- `apps/web/src/components/component-type-table/columns.tsx` - Column definitions

## Implementation Details

### Column Definitions
```typescript
const columns: ColumnDef<ComponentTypeRow>[] = [
  { accessorKey: 'componentType', header: 'Component Type' },
  { accessorKey: 'similarCount', header: '# Similar' },
  { accessorKey: 'similarValues', header: 'Similar Values', cell: /* array join */ },
  { accessorKey: 'productCount', header: '# Products' },
  { accessorKey: 'positionCount', header: '# Positions' },
  { accessorKey: 'positions', header: 'Positions', cell: /* array join */ },
  { accessorKey: 'zebraMatch', header: 'Zebra Match', cell: /* badge component */ },
]
```

### Horizontal Scroll Container
```tsx
<div className="overflow-x-auto">
  <Table className="min-w-[1000px]">
    ...
  </Table>
</div>
```

### Zebra Match Cell Styling
- `yes` - Green badge
- `partial` - Yellow/amber badge
- `no` - Gray badge

## Acceptance Criteria
- [ ] Table renders all 7 columns
- [ ] Horizontal scroll works on narrow viewports
- [ ] Array columns display comma-separated values
- [ ] Zebra match shows colored badge
- [ ] Sorting works on numeric columns

## Dependencies
- Task 001 (needs data shape from tRPC endpoint)
