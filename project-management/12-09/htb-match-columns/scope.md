# Feature: HTB Match Columns

## Overview
Add two new columns to the /components page to show HTB (How-To-Buy) attribute matching:
1. **HTB Exact Match** - Shows "yes"/"no" if component_type exactly matches an `htb_attribute_mapping_zebra_provided.attribute_name_for_htb` value
2. **HTB Distance** - Shows nearest HTB attribute matches with similarity percentages using vector embeddings (format: "Value 31%")

## Goals
- Enable users to quickly identify which component types have exact matches in the HTB attribute mapping
- Show semantic similarity between component types and HTB attributes via embedding vectors
- Include both columns in all export formats (table CSV, report CSV, JSON)

## Non-Goals
- Modifying the HTB data itself
- Creating new embeddings (already exist: 86 HTB attributes embedded)
- Changing existing Zebra Match column behavior

## Technical Approach

### Database
- HTB table: `htb_attribute_mapping_zebra_provided` (86 rows)
- HTB embeddings: `embedding_cache` where `source_column='attribute_name_for_htb'` (86 embeddings)
- Vector similarity: Use `embedding_small <=>` cosine distance operator with HNSW index

### SQL Changes (components.ts)
1. Add `htb_exact_matches` CTE - simple LOWER() string comparison
2. Add `htb_distance_matches` CTE - vector similarity to HTB embeddings
3. Join new CTEs in final SELECT

### UI Changes (columns.tsx)
1. Add `htbMatch: 'yes' | 'no'` to ComponentTypeRow interface
2. Add `htbSimilarMatches: Array<{value: string, matchPercentage: number}>` to interface
3. Add "HTB Match" column with badge (similar to Zebra Match)
4. Add "HTB Distance" column with pills showing "Value 31%" format

### Export Changes (csv-export.ts)
1. Update `exportToCsv` - add HTB Match and HTB Distance columns
2. Update `exportCsvReport` - add dynamic columns for HTB matches
3. Update `exportJsonReport` - add htbMatch and htbSimilarMatches fields

## Success Criteria
- HTB Match column displays yes/no correctly based on exact case-insensitive match
- HTB Distance column shows top 3 nearest HTB matches with percentages
- All 3 export functions include new data
- Query performance remains under 3 seconds
- No TypeScript errors

## Key Risks
- Query performance with additional CTEs (mitigated: HTB table is small, HNSW indexed)
- Type safety across API -> UI -> Export (mitigated: update interface first)

## Files to Modify
- `/packages/api/src/routers/components.ts` - SQL query
- `/apps/web/src/components/component-type-table/columns.tsx` - Interface + columns
- `/apps/web/src/components/component-type-table/csv-export.ts` - Export functions
