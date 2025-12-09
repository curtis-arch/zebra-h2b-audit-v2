# Task 004: CSV Export Functionality

## What
Add a CSV export button that downloads all table data including the similarity threshold used.

## Why
User needs to export data for external analysis. Including threshold metadata ensures reproducibility.

## Files to Touch
- `apps/web/src/components/component-type-table/index.tsx` - Add export button
- `apps/web/src/components/component-type-table/csv-export.ts` - Export utility

## Implementation Details

### CSV Format
```csv
# Similarity Threshold: 0.85
# Exported: 2024-12-04T10:30:00Z
Component Type,# Similar,Similar Values,# Products,# Positions,Positions,Zebra Match
"Memory",2,"Memory,RAM",45,3,"1,2,5",yes
"Additional Feature",1,"Additional Feature",12,1,"3",partial
```

### Export Function
```typescript
function exportToCsv(data: ComponentTypeRow[], threshold: number) {
  const metadata = [
    `# Similarity Threshold: ${threshold}`,
    `# Exported: ${new Date().toISOString()}`,
  ].join('\n');

  const headers = ['Component Type', '# Similar', 'Similar Values', '# Products', '# Positions', 'Positions', 'Zebra Match'];
  const rows = data.map(row => [
    row.componentType,
    row.similarCount,
    row.similarValues.join(';'), // Use semicolon for array values
    row.productCount,
    row.positionCount,
    row.positions.join(';'),
    row.zebraMatch,
  ]);

  // ... generate and download
}
```

### Button Placement
- Top-right of table section
- Icon button with download icon
- Tooltip: "Export to CSV"

## Acceptance Criteria
- [ ] Export button visible in table header
- [ ] CSV includes metadata header with threshold
- [ ] All columns exported correctly
- [ ] Array values properly escaped/delimited
- [ ] File downloads with meaningful name (component-types-YYYY-MM-DD.csv)

## Dependencies
- Task 002 (table component to add button to)
- Task 003 (page integration for threshold access)
