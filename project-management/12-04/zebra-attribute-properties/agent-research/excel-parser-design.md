# Excel Parser Design Notes

## Research Summary

### SheetJS Library Selection

**Chosen Library**: `/websites/sheetjs` (SheetJS Community Edition)
- **Code Snippets**: 3,445 examples
- **Source Reputation**: High
- **License**: Open-source community edition

### Key API Findings

#### 1. Reading Excel Files
SheetJS provides `XLSX.readFile()` for Node.js/Bun environments:
```typescript
const workbook = XLSX.readFile(filename, options);
```

This returns a workbook object with:
- `wb.SheetNames`: Array of sheet names (ordered by tab position)
- `wb.Sheets`: Object mapping sheet name → worksheet object
- `wb.bookType`: Detected file format (xlsx, xlsb, xls, etc.)

#### 2. Worksheet Structure
Each worksheet is an object where keys are cell addresses (A1, B2, etc.):
```typescript
worksheet[address] = {
  v: any,           // Raw value
  w: string,        // Formatted text (if applicable)
  t: string,        // Type: 's'=string, 'n'=number, 'b'=boolean, 'd'=date, 'e'=error
  f: string,        // Formula (if present)
  r: string,        // Rich text HTML
  c: Comment[],     // Cell comments
  l: Hyperlink      // Hyperlink object
}
```

Special properties:
- `worksheet['!ref']`: Range of used cells (e.g., "A1:D10")
- `worksheet['!rows']`: Row properties
- `worksheet['!cols']`: Column properties

#### 3. Cell Address Utilities
SheetJS provides helper functions for A1-style addressing:

```typescript
// Convert column index (0-based) to letter
XLSX.utils.encode_col(0) // → "A"
XLSX.utils.encode_col(1) // → "B"
XLSX.utils.encode_col(25) // → "Z"
XLSX.utils.encode_col(26) // → "AA"

// Convert letter to column index
XLSX.utils.decode_col("A") // → 0
XLSX.utils.decode_col("B") // → 1

// Convert cell object to A1 address
XLSX.utils.encode_cell({r: 0, c: 0}) // → "A1"
XLSX.utils.encode_cell({r: 4, c: 1}) // → "B5"

// Convert A1 address to cell object
XLSX.utils.decode_cell("A1") // → {r: 0, c: 0}
XLSX.utils.decode_cell("B5") // → {r: 4, c: 1}

// Parse range string
XLSX.utils.decode_range("A1:D10") // → {s: {r:0, c:0}, e: {r:9, c:3}}
```

#### 4. Data Extraction Utilities
```typescript
// Convert worksheet to array of arrays
XLSX.utils.sheet_to_json(worksheet, {header: 1})
// → [[cell_A1, cell_B1, ...], [cell_A2, cell_B2, ...], ...]

// Convert worksheet to array of objects (using row 1 as keys)
XLSX.utils.sheet_to_json(worksheet)
// → [{col_A: val_A2, col_B: val_B2}, {col_A: val_A3, col_B: val_B3}, ...]
```

## Design Decisions

### 1. Preserve Exact Attribute Names
- **Requirement**: Do NOT normalize Column A values
- **Implementation**: Read raw cell values without trimming or transforming
- **Reason**: Research/analysis phase - need exact data as-is

### 2. Column Position Tracking
- **Requirement**: Capture column letters (A, B, C, etc.) for traceability
- **Implementation**: Use `XLSX.utils.encode_col(index)` to generate letters
- **Output Format**:
  ```json
  {
    "columns": [
      {"index": 0, "letter": "A", "header": "Attribute Name"},
      {"index": 1, "letter": "B", "header": "Type"},
      ...
    ]
  }
  ```

### 3. Empty Cell Detection
- **Requirement**: Count empty cells per column
- **Implementation**: Check for `undefined` values in parsed data
- **Use Case**: Understand data completeness/quality

### 4. Sample Data
- **Requirement**: Show first 5 rows for structure validation
- **Implementation**: Use `sheet_to_json` with `header: 1` option
- **Format**: Array of arrays preserving raw structure

## Implementation Plan

### Input
- File: `zebra-artifacts/sheets/attribute-comparison-by-type.xlsx`
- Expected to be in project root directory

### Output Structure
```typescript
{
  "metadata": {
    "filename": string,
    "sheetName": string,
    "totalRows": number,
    "totalColumns": number,
    "usedRange": string  // e.g., "A1:D100"
  },
  "columns": [
    {
      "index": number,      // 0-based
      "letter": string,     // "A", "B", "C", etc.
      "header": string,     // Value from Row 1
      "emptyCells": number  // Count of empty cells in this column
    }
  ],
  "attributeNames": string[],  // All values from Column A (excluding header)
  "sampleData": any[][],       // First 5 rows as array of arrays
  "stats": {
    "totalDataRows": number,   // Rows excluding header
    "completeRows": number,     // Rows with no empty cells
    "emptyRows": number         // Rows where all cells are empty
  }
}
```

### Script Location
`scripts/attribute-analysis/parse-xlsx.ts`

### Dependencies
- `xlsx` (SheetJS Community Edition)
- Bun runtime (already installed in project)

## Interesting Findings

### 1. SheetJS Cell Type System
SheetJS uses single-character type codes:
- `'s'` = string
- `'n'` = number
- `'b'` = boolean
- `'d'` = date
- `'e'` = error
- `'z'` = stub (empty cell that has style/format)

This is more compact than TypeScript's verbose type names and suitable for JSON serialization.

### 2. Column Letter Encoding
The `encode_col` function handles Excel's base-26 system with a quirk:
- A-Z = 0-25 (26 letters)
- AA-AZ = 26-51
- BA-BZ = 52-77
- etc.

This is NOT standard base-26 (there's no "zero" letter), which makes the math interesting.

### 3. Range Format
The `!ref` property uses Excel's range notation (e.g., "A1:D10") but can be:
- Missing entirely (empty worksheet)
- Single cell (e.g., "A1")
- Multiple cells (e.g., "A1:D10")

Our parser will handle all three cases.

### 4. Performance Considerations
SheetJS loads the entire workbook into memory. For large files:
- Use `sheetRows` option to limit rows read
- Process one worksheet at a time
- Stream processing for very large files (not needed for this analysis)

For our use case (analyzing attribute metadata), the file size should be manageable.

## Error Handling

The script will handle:
1. **File not found**: Exit with clear error message
2. **Invalid Excel format**: Catch XLSX.readFile exceptions
3. **Empty worksheet**: Handle missing `!ref` property
4. **Missing columns**: Handle sparse data (columns without headers)

## Testing Strategy

Manual verification:
1. Run script on target file
2. Verify column count matches Excel
3. Check that Row 1 headers are correct
4. Confirm attribute names (Column A) are preserved exactly
5. Validate empty cell counts by spot-checking in Excel
6. Compare sample data output to actual Excel rows

## Future Enhancements

If this proves useful:
1. Add support for multiple sheets
2. Add data type detection/validation
3. Generate TypeScript interfaces from headers
4. Create CSV/JSON export options
5. Add data quality reporting (duplicates, inconsistencies, etc.)
