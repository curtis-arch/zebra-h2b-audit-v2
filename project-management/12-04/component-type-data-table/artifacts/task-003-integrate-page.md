# Task 003: Integrate Table into /components Page

## What
Add the ComponentTypeTable to the /components page, positioned below the DashboardHeader and above existing content.

## Why
User wants this table as the primary view at the top of the page, with existing drill-down content below.

## Files to Touch
- `apps/web/src/app/(authenticated)/components/page.tsx` - Add table section

## Implementation Details

### Page Structure (After)
```tsx
<>
  <DashboardHeader />

  {/* NEW: Component Type Overview Section */}
  <section className="mb-8">
    <h2>Component Type Overview</h2>
    <ComponentTypeTable
      threshold={threshold}
      onThresholdChange={setThreshold}
    />
  </section>

  {/* EXISTING: Detailed exploration */}
  <section>
    {/* existing KPI cards, selectors, etc */}
  </section>
</>
```

### State Management
- Add `threshold` state at page level
- Pass down to table component
- Threshold changes trigger refetch via React Query

### Data Fetching
```tsx
const { data, isLoading } = api.components.getComponentTypesWithSimilarity.useQuery({
  similarityThreshold: threshold,
}, {
  keepPreviousData: true, // Smooth transitions
});
```

## Acceptance Criteria
- [ ] Table appears below header, above existing content
- [ ] Loading state shown during data fetch
- [ ] Threshold state managed at page level
- [ ] Existing page functionality unchanged

## Dependencies
- Task 001 (tRPC endpoint)
- Task 002 (table component)
