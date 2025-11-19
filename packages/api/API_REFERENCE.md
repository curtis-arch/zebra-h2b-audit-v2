# tRPC API Reference

## Base Router Structure

```typescript
import { trpc } from '@/utils/trpc';

// All endpoints available under:
trpc.dashboard.*
trpc.products.*
trpc.cohorts.*
```

---

## Dashboard Router (`trpc.dashboard.*`)

### `getKPIMetrics()`
Returns key performance indicators for dashboard cards.

**Returns:**
```typescript
{
  totalProducts: number;      // 289 files in database
  gapCount: number;            // 11 missing files
  uniqueAttributes: number;    // Distinct normalized labels
  totalCohorts: number;        // 198 cohorts
}
```

**Example:**
```typescript
const { data } = trpc.dashboard.getKPIMetrics.useQuery();
```

---

### `getFieldPopulationStats()`
Returns coverage statistics for 10 key fields.

**Returns:**
```typescript
Array<{
  field: FieldName;           // e.g., "Memory", "Series", "Interface"
  filesWithData: number;      // Count of files with this field
  coverage: number;           // Percentage (0-100)
  filesMissing: number;       // Files without this field
  uniqueValues: number;       // Distinct option codes
}>
```

**Example:**
```typescript
const { data: stats } = trpc.dashboard.getFieldPopulationStats.useQuery();
stats?.map(s => `${s.field}: ${s.coverage}%`);
```

---

### `getGapAnalysis()`
Returns breakdown of missing files by category.

**Returns:**
```typescript
{
  totalSourceFiles: 300;
  totalIngested: 289;
  gap: 11;
  missingFiles: {
    supplies: string[];          // 2 files
    filenameIssues: string[];    // 2 files
    parserFailures: string[];    // 7 files
  }
}
```

---

### `getProductsMissingField(input)`
Returns products that don't have a specific field.

**Input:**
```typescript
{
  field: "Memory" | "Series" | "Family" | ...  // One of 10 key fields
}
```

**Returns:**
```typescript
Array<{
  id: number;
  baseModel: string;
  sourcePath: string;
  cohortId: number;
}>
```

**Example:**
```typescript
const { data } = trpc.dashboard.getProductsMissingField.useQuery({
  field: "Memory"
});
```

---

## Products Router (`trpc.products.*`)

### `getAll(input)`
Get paginated list of products with search and filters.

**Input:**
```typescript
{
  page?: number;              // Default: 1
  limit?: number;             // Default: 50, Max: 100
  search?: string;            // Search baseModel or sourcePath
  baseModel?: string;         // Filter by exact base model
  sortBy?: "baseModel" | "sourcePath" | "positionCount";
  sortOrder?: "asc" | "desc"; // Default: "asc"
}
```

**Returns:**
```typescript
{
  products: Array<{
    id: number;
    baseModel: string;
    productCode: string | null;
    specStyle: string;
    cohortId: number;
    sourcePath: string;
    sourceHash: string | null;
    importedAt: Date;
    positionCount: number;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }
}
```

**Example:**
```typescript
const { data } = trpc.products.getAll.useQuery({
  page: 1,
  limit: 20,
  search: "MC3300",
  sortBy: "baseModel"
});
```

---

### `getById(input)`
Get single product with all positions and options.

**Input:**
```typescript
{
  id: number;  // Product ID
}
```

**Returns:**
```typescript
{
  id: number;
  baseModel: string;
  productCode: string | null;
  specStyle: string;
  cohortId: number;
  sourcePath: string;
  sourceHash: string | null;
  importedAt: Date;
  rawMetadata: any;
  signatureHash: string;
  signatureJson: any;
  positions: Array<{
    id: number;
    positionIndex: number;
    attributeLabel: string;
    normalizedLabel: string;
    sectionOrder: number;
    notes: string | null;
    optionCount: number;
  }>;
} | null
```

**Example:**
```typescript
const { data: product } = trpc.products.getById.useQuery({ id: 42 });
```

---

### `getByBaseModel(input)`
Get all products for a specific base model.

**Input:**
```typescript
{
  baseModel: string;  // e.g., "MC3300", "TC52"
}
```

**Returns:**
```typescript
Array<{
  id: number;
  baseModel: string;
  productCode: string | null;
  specStyle: string;
  cohortId: number;
  sourcePath: string;
  importedAt: Date;
}>
```

---

### `getUniqueBaseModels()`
Get list of all unique base models (for filters).

**Returns:**
```typescript
string[]  // e.g., ["MC3300", "TC52", "ZT411", ...]
```

**Example:**
```typescript
const { data: models } = trpc.products.getUniqueBaseModels.useQuery();
// Use in <select> dropdown
```

---

### `getOptionsForPosition(input)`
Get all options for a specific position.

**Input:**
```typescript
{
  positionId: number;
}
```

**Returns:**
```typescript
Array<{
  id: number;
  code: string;
  description: string;
  rawCode: string | null;
  rawDescription: string | null;
  sortOrder: number | null;
}>
```

**Example:**
```typescript
const { data: options } = trpc.products.getOptionsForPosition.useQuery({
  positionId: 123
});
```

---

### `getAllNormalizedLabels()`
Get list of all unique normalized labels (for filters).

**Returns:**
```typescript
string[]  // e.g., ["memory", "series", "interface", ...]
```

---

## Cohorts Router (`trpc.cohorts.*`)

### `getAll(input)`
Get paginated list of cohorts with product counts.

**Input:**
```typescript
{
  page?: number;                           // Default: 1
  limit?: number;                          // Default: 50, Max: 100
  sortBy?: "productCount" | "signatureHash";
  sortOrder?: "asc" | "desc";              // Default: "desc"
}
```

**Returns:**
```typescript
{
  cohorts: Array<{
    id: number;
    signatureHash: string;
    signatureJson: any;
    description: string | null;
    createdAt: Date;
    productCount: number;
    positionCount: number;
    representativeModel: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }
}
```

**Example:**
```typescript
const { data } = trpc.cohorts.getAll.useQuery({
  sortBy: "productCount",
  sortOrder: "desc"
});
```

---

### `getById(input)`
Get single cohort with all member files.

**Input:**
```typescript
{
  id: number;  // Cohort ID
}
```

**Returns:**
```typescript
{
  id: number;
  signatureHash: string;
  signatureJson: any;
  description: string | null;
  createdAt: Date;
  files: Array<{
    id: number;
    baseModel: string;
    productCode: string | null;
    sourcePath: string;
    specStyle: string;
    importedAt: Date;
  }>;
  productCount: number;
  positionCount: number;
} | null
```

**Example:**
```typescript
const { data: cohort } = trpc.cohorts.getById.useQuery({ id: 5 });
```

---

### `getStats()`
Get overall cohort statistics.

**Returns:**
```typescript
{
  totalCohorts: number;
  totalProducts: number;
  avgProductsPerCohort: number;
  largestCohortProductCount: number;
  smallestCohortProductCount: number;
  singletonCohorts: number;
  multiProductCohorts: number;
}
```

**Example:**
```typescript
const { data: stats } = trpc.cohorts.getStats.useQuery();
```

---

### `getByCohortSize(input)`
Get cohorts filtered by product count range.

**Input:**
```typescript
{
  minProducts?: number;  // Default: 1
  maxProducts?: number;  // Optional upper bound
}
```

**Returns:**
```typescript
Array<{
  id: number;
  signatureHash: string;
  signatureJson: any;
  description: string | null;
  productCount: number;
}>
```

**Example:**
```typescript
// Get cohorts with 5-10 products
const { data } = trpc.cohorts.getByCohortSize.useQuery({
  minProducts: 5,
  maxProducts: 10
});
```

---

## Field Mappings

The 10 key fields and their normalized label mappings:

1. **Memory** → `["memory", "memory / flash", "ram", "cpu/memory", ...]`
2. **Series** → `["series"]`
3. **Family** → `["family", "product family"]`
4. **Print Width** → `["print width"]`
5. **Character Set** → `["character set"]`
6. **Interface** → `["interface", "interface (connectivity)", ...]`
7. **Media Type** → `["media type", "media options"]`
8. **Label Sensor** → `["label sensor"]`
9. **Country Code** → `["country code", "country", "country/compliance", ...]`
10. **Channel Type** → `["channel type"]`

---

## Type Imports

```typescript
// Import types for type-safe usage
import type { AppRouter } from '@zebra-h2b-audit-v2/api';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

type RouterInput = inferRouterInputs<AppRouter>;
type RouterOutput = inferRouterOutputs<AppRouter>;

// Example: Type for getAll input
type ProductListInput = RouterInput['products']['getAll'];

// Example: Type for getAll output
type ProductListOutput = RouterOutput['products']['getAll'];
```

---

## Error Handling

All procedures may return tRPC errors:

```typescript
const { data, error, isError } = trpc.products.getById.useQuery({ id: 999 });

if (isError) {
  console.error(error.message);
  // Handle different error codes:
  // - UNAUTHORIZED: Authentication required
  // - NOT_FOUND: Resource not found
  // - BAD_REQUEST: Invalid input
  // - INTERNAL_SERVER_ERROR: Server error
}
```

---

## Performance Tips

1. **Use pagination** for large result sets
2. **Prefetch data** on server-side for SSR
3. **Cache strategically** with staleTime and gcTime
4. **Batch queries** with TanStack Query's query batching
5. **Use filters** to reduce payload size

---

## Next Steps

1. Set up tRPC client in web app (`apps/web/src/utils/trpc.ts`)
2. Create React components that consume these endpoints
3. Add caching strategies with TanStack Query
4. Implement optimistic updates for mutations (future)
5. Add more specialized queries as needed
