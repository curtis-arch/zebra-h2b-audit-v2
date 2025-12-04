---
query_date: 2025-12-04 16:34:01 UTC
library: /websites/sheetjs
topic: cell addresses column letters row numbers
tokens: unknown
project: zebra-h2b-audit-v2
tool: mcp__context7__get-library-docs
---

# Context7 Query: cell addresses column letters row numbers

### SheetJS Cell Address Object

Source: https://docs.sheetjs.com/docs/csf/general

Represents a cell address as an object with 0-indexed column (c) and row (r) numbers. For example, 'B5' is {c:1, r:4}.

```APIDOC
Cell Address Object:
  {c: number, r: number}
  - c: 0-indexed column number
  - r: 0-indexed row number
```

--------------------------------

### A1-Style Cell Address

Source: https://docs.sheetjs.com/docs/csf/general

Explains the A1-style cell addressing convention used in spreadsheet applications and how it's formed by concatenating column labels and row numbers.

```javascript
// In spreadsheet applications, a cell address is formed by combining the column label and row number.
// For example, the cell in the third column ('C') and fourth row ('4') is addressed as 'C4'.

// SheetJS internally uses 0-based indexing for both rows and columns.
// To convert between A1-style and SheetJS indices, you would typically use helper functions.

// Example conceptual conversion (actual implementation may vary):
// function getSheetJSCellIndex(a1Address) {
//   const match = a1Address.match(/^([A-Z]+)([1-9][0-9]*)$/);
//   if (!match) return null;
//   const colLabel = match[1];
//   const rowNum = parseInt(match[2], 10);
//
//   let colIndex = 0;
//   for (let i = 0; i < colLabel.length; i++) {
//     colIndex = colIndex * 26 + (colLabel.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
//   }
//   const rowIndex = rowNum - 1;
//   return { row: rowIndex, col: colIndex - 1 }; // Adjusting for 0-based column index
// }

```

--------------------------------

### Decode Cell Address to Object

Source: https://docs.sheetjs.com/docs/csf/general

Converts an A1-style cell address string (e.g., 'A2') into its SheetJS cell address object format {c:column, r:row}.

```javascript
var address = XLSX.utils.decode_cell("A2");
```

--------------------------------

### Encode Cell Object to Address

Source: https://docs.sheetjs.com/docs/csf/general

Converts a SheetJS cell address object {c:column, r:row} into its A1-style address string.

```javascript
var a1_addr = XLSX.utils.encode_cell({r:1,c:0});
```

--------------------------------

### Decode Row Name to Index

Source: https://docs.sheetjs.com/docs/csf/general

Converts an A1-style row name (e.g., '4') into its 0-indexed SheetJS row number.

```javascript
var row_index = XLSX.utils.decode_row("4");
```

--------------------------------

### Decode Column Name to Index

Source: https://docs.sheetjs.com/docs/csf/general

Converts an A1-style column name (e.g., 'D') into its 0-indexed SheetJS column number.

```javascript
var col_index = XLSX.utils.decode_col("D");
```

--------------------------------

### Encode Column Index to Name

Source: https://docs.sheetjs.com/docs/csf/general

Converts a 0-indexed SheetJS column number into its A1-style column name (e.g., 3 becomes 'D').

```javascript
var col_name = XLSX.utils.encode_col(3);
```

--------------------------------

### SheetJS Column and Row Range Objects

Source: https://docs.sheetjs.com/docs/csf/general

Represents column or row ranges using the SheetJS range object format. Column ranges span all rows (0 to 1048575), and row ranges span all columns (0 to 16383).

```APIDOC
Column Range (e.g., A:A):
  {s:{c:0,r:0},e:{c:0,r:1048575}}
Column Range (e.g., B:C):
  {s:{c:1,r:0},e:{c:2,r:1048575}}
Row Range (e.g., 1:1):
  {s:{c:0,r:0},e:{c:16383,r:0}}
Row Range (e.g., 2:3):
  {s:{c:0,r:1},e:{c:16383,r:2}}
```

--------------------------------

### Cell and Cell Address Manipulation

Source: https://docs.sheetjs.com/docs/api

Functions for converting between different representations of rows, columns, cells, and ranges. These utilities are essential for precise cell referencing and manipulation within a worksheet.

```javascript
XLSX.utils.encode_row(r: number): string
XLSX.utils.decode_row(rr: string): number
XLSX.utils.encode_col(c: number): string
XLSX.utils.decode_col(rc: string): number
XLSX.utils.encode_cell(cell: {r: number, c: number}): string
XLSX.utils.decode_cell(rrcc: string): {r: number, c: number}
XLSX.utils.encode_range(range: {s: {r: number, c: number}, e: {r: number, c: number}}): string
XLSX.utils.decode_range(r: string): {s: {r: number, c: number}, e: {r: number, c: number}}
```

--------------------------------

### Encode Row Index to Name

Source: https://docs.sheetjs.com/docs/csf/general

Converts a 0-indexed SheetJS row number into its A1-style row name (e.g., 3 becomes '4').

```javascript
var row_name = XLSX.utils.encode_row(3);
```
