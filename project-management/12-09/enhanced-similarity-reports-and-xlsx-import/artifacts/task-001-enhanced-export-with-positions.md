# Task 001: Enhanced Similarity Reports with Match Scores and Positions

## What
Add TWO new export buttons to the /components page:
1. **"Export CSV Report"** - Enhanced CSV with match % and positions per similar value
2. **"Export JSON Report"** - Full structured JSON for advanced data analysis

Keep existing "Export CSV" button unchanged for backward compatibility.

## Why
Current export only shows similar value names without context. Users need:
- Match percentage to understand similarity strength (85% vs 99%)
- Position data to see where in the SKU structure each match appears
- JSON format for programmatic analysis and data viz tools

## Files to Touch
| File | Action |
|------|--------|
| `/packages/api/src/routers/components.ts` | MODIFY - SQL query to include match scores |
| `/apps/web/src/components/component-type-table/columns.tsx` | MODIFY - Update interface |
| `/apps/web/src/components/component-type-table/csv-export.ts` | MODIFY - Add report exports |
| `/apps/web/src/components/component-type-table/index.tsx` | MODIFY - Add two new buttons |

## Design

### Updated Interface
```typescript
interface SimilarMatch {
  value: string;
  matchPercentage: number;  // 0-100, rounded to 1 decimal
  positions: string[];
}

interface ComponentTypeRow {
  componentType: string;
  similarCount: number;
  similarValues: string[];           // KEEP for backward compatibility
  similarMatches: SimilarMatch[];    // NEW for enhanced exports
  productCount: number;
  positionCount: number;
  positions: string[];  // Source positions
  zebraMatch: "yes" | "partial" | "no";
}
```

### SQL Changes (similar_groups CTE)
```sql
similar_groups AS (
  SELECT
    ct.component_type,
    COUNT(DISTINCT ec2.value) as similar_count,
    array_agg(DISTINCT ec2.value ORDER BY ec2.value) as similar_values,
    jsonb_agg(
      jsonb_build_object(
        'value', ec2.value,
        'matchPercentage', ROUND((1 - (ec.embedding_small <=> ec2.embedding_small)) * 100, 1),
        'positions', COALESCE(
          (SELECT array_agg(DISTINCT sequence_position::text ORDER BY sequence_position::text)
           FROM config_option_component
           WHERE component_type = ec2.value),
          ARRAY[]::text[]
        )
      ) ORDER BY (1 - (ec.embedding_small <=> ec2.embedding_small)) DESC
    ) FILTER (WHERE ec2.value IS NOT NULL) as similar_matches
  FROM ...
)
```

### CSV Report Format
```csv
# Similarity Report
# Exported: 2025-12-09T15:30:00Z
# Threshold: 85%
# Total Component Types: 145
Component Type,Source Positions,# Similar,Similar 1,Match 1 %,Match 1 Positions,Similar 2,Match 2 %,Match 2 Positions,...
Camera,"5;12",2,Imaging,92.5,"5;8",Photo,87.3,"12"
```

### JSON Report Format
```json
{
  "exportMetadata": {
    "exportedAt": "2025-12-09T15:30:00.000Z",
    "similarityThreshold": 0.85,
    "totalComponentTypes": 145,
    "schemaVersion": "1.0"
  },
  "data": [
    {
      "componentType": "Camera",
      "sourcePositions": ["5", "12"],
      "similarMatches": [
        { "value": "Imaging", "matchPercentage": 92.5, "positions": ["5", "8"] }
      ],
      "productCount": 15,
      "zebraMatch": "partial"
    }
  ]
}
```

### UI Changes
Add two new buttons next to existing "Export CSV":
- Button: "Export CSV Report" -> downloads enhanced CSV
- Button: "Export JSON Report" -> downloads JSON file

## Suggested Tools

| Tool | Purpose |
|------|---------|
| mcp__filesystem-with-morph__edit_file | Edit all four files |
| mcp__Neon__run_sql | Test SQL query changes |
| chrome-devtools MCP | Verify buttons render and exports work |

## Acceptance Criteria & Proof

| Criterion (WHAT) | Proof (HOW) | Expected |
|------------------|-------------|----------|
| Two new buttons visible | Navigate to /components | "Export CSV Report" + "Export JSON Report" buttons |
| CSV Report downloads | Click button | File downloads with metadata header |
| CSV has match % | Open CSV | Per-match percentage columns |
| CSV has positions | Open CSV | Per-match position columns |
| JSON Report downloads | Click button | .json file downloads |
| JSON has metadata | Open JSON | exportMetadata object present |
| JSON has nested matches | Check structure | similarMatches array with objects |
| Original export unchanged | Click "Export CSV" | Same format as before |
| Backward compatible | Load page | No errors, table renders |

## Dependencies
- None (standalone enhancement)
