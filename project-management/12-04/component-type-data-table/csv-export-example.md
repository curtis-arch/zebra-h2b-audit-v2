# CSV Export Implementation

## Files Created/Modified
- `apps/web/src/components/component-type-table/csv-export.ts` - New CSV export utility
- `apps/web/src/components/component-type-table/index.tsx` - Added export button and threshold prop

## Example CSV Output

```csv
# Similarity Threshold: 0.85
# Exported: 2024-12-04T18:30:00.000Z
Component Type,# Similar,Similar Values,# Products,# Positions,Positions,Zebra Match
"Memory",2,"Memory;RAM",45,3,"1;2;5",yes
"Storage",3,"Storage;HDD;SSD",32,2,"3;4",partial
"Processor",1,"CPU",28,1,"0",no
```

## Features
- ✅ Metadata header with similarity threshold (if provided)
- ✅ Timestamp in ISO format
- ✅ Semicolon-delimited array values (avoids CSV comma conflicts)
- ✅ Proper CSV escaping for special characters
- ✅ Download button with lucide-react Download icon
- ✅ Filename: `component-types-YYYY-MM-DD.csv`
- ✅ Small outline button style above table

## Usage
```tsx
<ComponentTypeTable
  data={componentTypeData}
  threshold={0.85} // Optional - includes in CSV metadata
/>
```

## TypeScript
- No type errors
- Props interface updated with optional `threshold?: number`
- Proper typing for ComponentTypeRow data structure
