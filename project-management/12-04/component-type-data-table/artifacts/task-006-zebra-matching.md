# Task 006: Zebra Attribute Matching

## What
Implement the 3-tier matching logic for component types against Zebra provided attributes with visual indicators.

## Why
Users need to see which component types align with official Zebra attributes for data quality assessment.

## Files to Touch
- `packages/api/src/routers/components.ts` - Matching logic in query
- `apps/web/src/components/component-type-table/columns.tsx` - Badge rendering

## Implementation Details

### Matching Logic (SQL)
```sql
CASE
  WHEN EXISTS (
    SELECT 1 FROM zebra_provided_attributes
    WHERE attribute_name = ct.component_type
  ) THEN 'yes'
  WHEN EXISTS (
    SELECT 1 FROM zebra_provided_attributes
    WHERE LOWER(attribute_name) = LOWER(ct.component_type)
  ) THEN 'partial'
  ELSE 'no'
END as zebra_match
```

### Badge Component
```tsx
function ZebraMatchBadge({ match }: { match: 'yes' | 'partial' | 'no' }) {
  const styles = {
    yes: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    no: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  };

  return (
    <span className={cn('px-2 py-1 rounded text-xs font-medium', styles[match])}>
      {match}
    </span>
  );
}
```

### Column Definition
```tsx
{
  accessorKey: 'zebraMatch',
  header: 'Zebra Match',
  cell: ({ row }) => <ZebraMatchBadge match={row.original.zebraMatch} />,
}
```

### Edge Cases
- Empty zebra_provided_attributes table → all "no"
- NULL component_type → should be filtered out in Task 001
- Case variations: "Printer" vs "PRINTER" vs "printer" → partial if lowercase match

## Acceptance Criteria
- [ ] Exact matches show green "yes" badge
- [ ] Case-insensitive matches show yellow "partial" badge
- [ ] Non-matches show gray "no" badge
- [ ] Badges have appropriate dark mode styling
- [ ] Sorting by this column works correctly

## Dependencies
- Task 001 (query implementation)
- Task 002 (column definitions)
