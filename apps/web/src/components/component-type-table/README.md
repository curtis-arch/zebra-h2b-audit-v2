# ComponentTypeTable

TanStack Table component for displaying component type analysis data with sorting and horizontal scrolling.

## Usage

```tsx
import { ComponentTypeTable } from "@/components/component-type-table";

const data = [
  {
    componentType: "Scanner",
    similarCount: 3,
    similarValues: ["Barcode", "QR", "RFID"],
    productCount: 45,
    positionCount: 12,
    positions: ["pos1", "pos2", "pos3"],
    zebraMatch: "yes",
  },
  {
    componentType: "Display",
    similarCount: 2,
    similarValues: ["LCD", "OLED"],
    productCount: 30,
    positionCount: 8,
    positions: ["pos4", "pos5"],
    zebraMatch: "partial",
  },
  {
    componentType: "Battery",
    similarCount: 1,
    similarValues: ["LiPo"],
    productCount: 15,
    positionCount: 5,
    positions: ["pos6"],
    zebraMatch: "no",
  },
];

export default function MyPage() {
  return <ComponentTypeTable data={data} />;
}
```

## Props

### ComponentTypeTable

| Prop | Type | Description |
|------|------|-------------|
| `data` | `ComponentTypeRow[]` | Array of component type data |

### ComponentTypeRow

```typescript
interface ComponentTypeRow {
  componentType: string;           // Name of the component type
  similarCount: number;             // Number of similar values
  similarValues: string[];          // Array of similar value names
  productCount: number;             // Number of products using this type
  positionCount: number;            // Number of positions
  positions: string[];              // Array of position names
  zebraMatch: "yes" | "partial" | "no";  // Match status with Zebra schema
}
```

## Features

- **Sortable columns**: Click column headers with arrow icons to sort (numeric columns)
- **Horizontal scroll**: Table scrolls horizontally on narrow viewports (min-width: 1200px)
- **Colored badges**: Zebra match status displayed with semantic colors:
  - `yes` = Green badge
  - `partial` = Amber/yellow badge
  - `no` = Gray badge
- **Compact design**: Optimized for displaying many rows
- **Responsive hover states**: Row highlight on hover

## Column Details

1. **Component Type** - Sortable, bold text
2. **# Similar** - Sortable, centered numeric display
3. **Similar Values** - Comma-separated list, truncated with max-width
4. **# Products** - Sortable, centered numeric display
5. **# Positions** - Sortable, centered numeric display
6. **Positions** - Comma-separated list, truncated with max-width
7. **Zebra Match** - Badge component with semantic colors

## File Structure

```
component-type-table/
├── index.tsx              # Main table component with TanStack Table setup
├── columns.tsx            # Column definitions and ComponentTypeRow interface
├── zebra-match-badge.tsx  # Reusable badge component for match status
└── README.md             # This file
```
