# Task 002: Parse HTB XLSX File

## What
Create a script to parse `HTB-attribute-mapping-zebra-provided.xlsx` and extract all columns with focus on Column A (Attribute Name for HTB).

## Why
The HTB attribute mapping file contains ~100+ attribute names that need to be:
1. Stored in the database for reference
2. Embedded for semantic similarity matching with existing component types

## Files to Touch
| File | Action |
|------|--------|
| `/scripts/htb-import/package.json` | CREATE |
| `/scripts/htb-import/parse-htb-xlsx.ts` | CREATE |

## Design

### Directory Structure
```
scripts/
├── htb-import/
│   ├── package.json
│   ├── parse-htb-xlsx.ts      # This task
│   └── import-htb-data.ts     # Task 004
```

### package.json
```json
{
  "name": "@zebra-h2b-audit-v2/htb-import",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "parse": "bun run parse-htb-xlsx.ts",
    "import": "bun run import-htb-data.ts"
  },
  "dependencies": {
    "@neondatabase/serverless": "^1.0.2",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

### Parser Output Interface
```typescript
interface ParsedHtbData {
  metadata: {
    filename: string;
    sheetName: string;
    totalRows: number;
    totalColumns: number;
  };
  columns: Array<{
    index: number;
    letter: string;
    header: string;
  }>;
  rows: Array<{
    excelRowNumber: number;
    attributeNameForHtb: string;  // Column A
    rawData: Record<string, unknown>;  // All columns
  }>;
  stats: {
    uniqueAttributeNames: number;
    emptyRows: number;
  };
}
```

### Script Pattern
Follow `/scripts/attribute-analysis/parse-xlsx.ts`:
```typescript
#!/usr/bin/env bun
import XLSX from "xlsx";
import { join } from "path";

function parseHtbFile(): ParsedHtbData {
  const filepath = join(import.meta.dir, "..", "..", "HTB-attribute-mapping-zebra-provided.xlsx");
  const workbook = XLSX.readFile(filepath);
  // ... parsing logic
}
```

## Suggested Tools

| Tool | Purpose |
|------|---------|
| mcp__filesystem-with-morph__edit_file | Create package.json and parser script |
| Read | Reference existing parser at /scripts/attribute-analysis/parse-xlsx.ts |
| Bash | Run `bun install` and `bun run parse` to test |

## Acceptance Criteria & Proof

| Criterion (WHAT) | Proof (HOW) | Expected |
|------------------|-------------|----------|
| Script parses XLSX | `cd scripts/htb-import && bun run parse` | JSON output to stdout |
| All columns extracted | Check output | All ~20 columns present |
| Column A captured | Check `attributeNameForHtb` | Values like "3D Browser URL", "Accessory Guide" |
| Row numbers tracked | Check `excelRowNumber` | Matches Excel row numbers |
| Stats accurate | Check `uniqueAttributeNames` | ~100+ unique values |
| Empty rows handled | Check output | Not included in rows array |

## Dependencies
- XLSX file exists at `/Users/johncurtis/projects/zebra-h2b-audit-v2/HTB-attribute-mapping-zebra-provided.xlsx`
