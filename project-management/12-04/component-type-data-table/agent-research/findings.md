# Research Findings: Component Type Data Table

## Codebase Analysis

### Current /components Page
- Location: `apps/web/src/app/(authenticated)/components/page.tsx`
- Uses tRPC for data fetching
- Has existing TanStack Table implementation
- DashboardHeader at top, KPI cards, then component exploration

### Database Schema (packages/db/src/schema/zebra.ts)

**config_option_component**
- `id`, `config_option_id`, `raw_value`, `normalized_value`
- `component_type`, `position`, `is_parsed`
- Links to config_options via `config_option_id`

**config_position**
- `id`, `position_index`, `label`, `description`
- Links to config_file

**zebra_provided_attributes**
- `id`, `attribute_name`, `attribute_type`
- Contains official Zebra attribute names for matching

### Existing TanStack Table Patterns
- Used in multiple places (files table, options table)
- Standard column definitions with accessorKey
- Sorting and filtering built-in
- CSV export pattern exists in some tables

### pg_trgm Extension
- Need to verify if enabled on Neon database
- If not, can enable with: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- Provides `similarity(text, text)` function returning 0-1

## Data Query Strategy

```sql
-- Pseudocode for the main query
WITH component_types AS (
  SELECT DISTINCT component_type,
         COUNT(DISTINCT config_option_id) as product_count,
         COUNT(DISTINCT position) as position_count,
         array_agg(DISTINCT position) as positions
  FROM config_option_component
  WHERE component_type IS NOT NULL
  GROUP BY component_type
),
similarity_groups AS (
  SELECT c1.component_type,
         array_agg(DISTINCT c2.component_type) FILTER (
           WHERE similarity(c1.component_type, c2.component_type) >= :threshold
         ) as similar_values
  FROM component_types c1
  CROSS JOIN component_types c2
  GROUP BY c1.component_type
),
zebra_matches AS (
  SELECT ct.component_type,
         CASE
           WHEN EXISTS (SELECT 1 FROM zebra_provided_attributes WHERE attribute_name = ct.component_type) THEN 'yes'
           WHEN EXISTS (SELECT 1 FROM zebra_provided_attributes WHERE LOWER(attribute_name) = LOWER(ct.component_type)) THEN 'partial'
           ELSE 'no'
         END as zebra_match
  FROM component_types ct
)
SELECT * FROM component_types
JOIN similarity_groups USING (component_type)
JOIN zebra_matches USING (component_type);
```

## UI Component Structure

```
ComponentTypeDataTable/
├── index.tsx           # Main export
├── columns.tsx         # TanStack column definitions
├── threshold-slider.tsx # Similarity threshold control
└── csv-export.tsx      # Export functionality
```

## Performance Considerations
- Similarity computation can be expensive on large datasets
- Consider server-side pagination if > 1000 types
- Debounce threshold changes (300ms recommended)
- Cache query results with React Query
