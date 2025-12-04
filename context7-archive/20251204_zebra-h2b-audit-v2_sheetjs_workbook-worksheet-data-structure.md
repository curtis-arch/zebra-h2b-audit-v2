---
query_date: 2025-12-04 16:34:02 UTC
library: /websites/sheetjs
topic: workbook worksheet data structure
tokens: unknown
project: zebra-h2b-audit-v2
tool: mcp__context7__get-library-docs
---

# Context7 Query: workbook worksheet data structure

### SheetJS Workbook Object Structure

Source: https://docs.sheetjs.com/docs/csf/book

Explains the core components of a SheetJS workbook object, including sheet names, worksheet objects, and workbook-level attributes. This is fundamental for understanding how SheetJS organizes spreadsheet data.

```javascript
/*
wb.SheetNames: An ordered list of the sheets in the workbook.
wb.Sheets: An object where keys are worksheet names and values are worksheet objects.
wb.Workbook: Stores workbook-level attributes.
wb.bookType: The determined book type when reading a file.
*/
```

--------------------------------

### Create Worksheet from Array of Objects

Source: https://docs.sheetjs.com/docs/api/utilities

Creates a new SheetJS worksheet from an array of JavaScript objects. This is a common data packaging function for converting structured data.

```javascript
var ws =XLSX.utils.json_to_sheet(aoo, opts);
```

--------------------------------

### Handling Unstructured Data with Dedicated Worksheet

Source: https://docs.sheetjs.com/docs/demos/data

Demonstrates a technique for storing unstructured data, such as JSON objects with arbitrary schemas, in a dedicated worksheet. This approach maps nested keys to a flat structure in the worksheet.

```javascript
{
  "title":"SheetDB",
  "metadata":{
    "author":"SheetJS",
    "code":7262
  },
  "data":[
    {"Name":"Barack Obama","Index":44},
    {"Name":"Donald Trump","Index":45},
  ]
}
```

```text
XXX|        A        |    B    |
---+-----------------+---------+
 1 | Path            | Value   |
 2 | title           | SheetDB |
 3 | metadata.author | SheetJS |
 4 | metadata.code   |    7262 |
```

--------------------------------

### SheetJS Data Model Overview

Source: https://docs.sheetjs.com/docs/csf

The Common Spreadsheet Format (CSF) is the object model used by SheetJS. This section explains the structure of workbooks, worksheets, cells, and ranges within the SheetJS data model. It emphasizes that all structures are simple objects without classes or prototype methods, suitable for structured cloning and web workers.

```APIDOC
SheetJS Data Model (Common Spreadsheet Format - CSF):

The CSF is the object model used by SheetJS. All structures are simple objects, designed for compatibility with the structured clone algorithm (used in Web Workers) and do not preserve functions or prototypes.

Key Components:
- **Addresses and Ranges**: Defines how to represent cell locations and ranges.
- **Cell Objects**: Structure for individual cells, including value, formatting, formula, etc.
  - Example Cell Object:
    ```json
    {
      "v": "Hello",       // Value
      "t": "s",         // Type (s: string, n: number, b: boolean, d: date, e: error, z: skip)
      "f": "=CONCATENATE(A1, B1)", // Formula
      "w": "Hello",       // Formatted text
      "fmt": "General",   // Number format
      "r": "<a href=\"#\">Hello</a>", // Rich text
      "s": { ... },       // Style object
      "c": [ ... ],       // Comments array
      "l": { ... },       // Hyperlink object
      "z": true           // Skip cell
    }
    ```
- **Sheet Objects**: Represents a worksheet, containing cells, row/column properties, visibility, etc.
- **Workbook Object**: Represents the entire spreadsheet file, containing sheet names, metadata, etc.
- **Spreadsheet Features**: Details on specific features like Dates and Times, Formulae, Hyperlinks, Cell Comments, Defined Names, Number Formats, VBA and Macros, Row Properties, Column Properties, Sheet Visibility, Merged Cells, and File Properties.

Usage Context:
- Accessible by inspecting and modifying objects directly.
- Suitable for passing data between main thread and Web Workers via message passing due to the structured clone algorithm.
```

--------------------------------

### Append Worksheet

Source: https://docs.sheetjs.com/docs/solutions/processing

Appends a new worksheet to an existing workbook using the `book_append_sheet` utility function. This function takes the workbook, worksheet object, and the desired sheet name as arguments.

```javascript
XLSX.utils.book_append_sheet(workbook, worksheet, sheet_name);
```

--------------------------------

### SheetJS Data Model References

Source: https://docs.sheetjs.com/docs/demos/data/sqlite

References to SheetJS data model concepts, including "Sheet Objects" for representing worksheet data and "Workbook Objects" for representing the entire Excel file structure.

```javascript
// See "Sheet Objects" in "SheetJS Data Model"
// const sheetData = sheet.Sheets['Sheet1'];

// See "Workbook Objects" in "SheetJS Data Model"
// const workbook = XLSX.readFile('data.xlsx');
```

--------------------------------

### Create Worksheet or Workbook from HTML Table

Source: https://docs.sheetjs.com/docs/api/utilities

Creates a SheetJS worksheet or workbook directly from an HTML TABLE element. This is a convenient data packaging function for web-based data.

```javascript
var ws =XLSX.utils.table_to_sheet(elt, opts);
var wb =XLSX.utils.table_to_book(elt, opts);
```

--------------------------------

### Replace Worksheet

Source: https://docs.sheetjs.com/docs/solutions/processing

Replaces an existing worksheet within the workbook object by assigning a new worksheet object to its corresponding key in the Sheets property. This operation modifies the workbook in place.

```javascript
workbook.Sheets[sheet_name]= new_worksheet;
```

--------------------------------

### Access Worksheet Names

Source: https://docs.sheetjs.com/docs/solutions/processing

Retrieves a list of all worksheet names in a workbook in their tab order. This is useful for iterating through or referencing specific sheets.

```javascript
var wsnames = workbook.SheetNames;
```

--------------------------------

### Create Worksheet from Array of Arrays

Source: https://docs.sheetjs.com/docs/api/utilities

Creates a new SheetJS worksheet from an array of arrays. This is a data packaging function used to convert common JS data structures into a format SheetJS can process.

```javascript
var ws =XLSX.utils.aoa_to_sheet(aoa, opts);
```
