# Products Components

## ProductsTable

A client-side data table component for displaying all 289 configuration products with advanced filtering, sorting, and search capabilities.

### Features

- **Client-side table with TanStack Table v8**
  - Handles all 289 products in memory (fast performance)
  - No server-side pagination needed

- **Global Search**
  - Searches across base model and source path columns
  - Real-time filtering as you type

- **Column Sorting**
  - Click any column header to sort
  - Visual indicators for sort direction
  - Sortable columns: ID, Base Model, Source File, Positions

- **Base Model Filter**
  - Dropdown with all unique base models
  - Extracted dynamically from product data
  - Clear filters button when active

- **Row Navigation**
  - Click any row to navigate to `/products/[id]`
  - Hover effects for better UX

- **Responsive Design**
  - Mobile-friendly with horizontal scroll
  - Zebra striping for better readability
  - Badge components for model/spec style

### Usage

```tsx
import { ProductsTable } from "@/components/products";

// Products data from tRPC query
const { data } = useQuery(trpc.products.getAll.queryOptions({
  page: 1,
  limit: 500
}));

<ProductsTable products={data.products} />
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `products` | `Product[]` | Array of product objects from database |

### Product Type

```typescript
type Product = {
  id: number;
  baseModel: string | null;
  productCode: string | null;
  specStyle: string;
  cohortId: number | null;
  sourcePath: string;
  sourceHash: string | null;
  importedAt: Date;
  positionCount: number;  // Aggregated count from JOIN
};
```

### Performance

- Renders 289 rows instantly (client-side)
- Filtering/sorting handled by TanStack Table (optimized)
- No API calls during interaction (all data loaded once)
- Typical render time: < 100ms

### Dependencies

- `@tanstack/react-table` - Table state management
- `lucide-react` - Icons
- `shadcn/ui` components - UI primitives
