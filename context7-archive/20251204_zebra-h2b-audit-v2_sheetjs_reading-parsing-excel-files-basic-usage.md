---
query_date: 2025-12-04 16:34:00 UTC
library: /websites/sheetjs
topic: reading parsing excel files basic usage
tokens: unknown
project: zebra-h2b-audit-v2
tool: mcp__context7__get-library-docs
---

# Context7 Query: reading parsing excel files basic usage

### Read Excel with Parsing Options using DanfoJS

Source: https://docs.sheetjs.com/docs/demos/math/danfojs

Reads an Excel file from a URL and creates a DanfoJS DataFrame, applying parsing options to limit the number of rows read. The 'sheetRows' option is passed via 'parsingOptions' to the SheetJS read method.

```javascript
const first_three_rows =await dfd.readExcel(url,{parsingOptions:{sheetRows:4}});
```

--------------------------------

### Reading Local Files with SheetJS in NativeScript

Source: https://docs.sheetjs.com/docs/demos/mobile/nativescript

This JavaScript snippet demonstrates how to read a local Excel file in a NativeScript application using SheetJS. It first obtains the file's URL, reads its content as an ArrayBuffer using `getFileAccess().readBufferAsync`, and then parses it into a workbook object with the SheetJS `read` function.

```javascript
import{ getFileAccess }from'@nativescript/core';
import{ read }from'xlsx';
  
/* find appropriate path */
const url =get_url_for_filename("SheetJSNS.xls");
  
/* get data */
const ab: ArrayBuffer =awaitgetFileAccess().readBufferAsync(url);
  
/* read workbook */
const wb =read(ab);

```

--------------------------------

### Parse Excel File (JavaScript)

Source: https://docs.sheetjs.com/docs/demos/extensions/osa

Parses an Excel file using the SheetJS library after loading it. The file is read as a binary string.

```JavaScript
var file = get_bstr("./pres.numbers");
var wb = XLSX.read(file);
```

--------------------------------

### SheetJS Parse Options: Formulae Handling

Source: https://docs.sheetjs.com/docs/api/parse-options

Details the `cellFormula` option for extracting formulae and the `xlfn` option for preserving prefixed future Excel functions.

```APIDOC
Formulae:
  - Description: Controls the extraction and handling of cell formulae.
  - Options:
    - `cellFormula`: Must be explicitly enabled to ensure formulae are extracted for some file formats.
    - `xlfn`: Preserves newer Excel functions serialized with the `_xlfn.` prefix. SheetJS normally strips this prefix.
  - Related Docs: [Formulae](https://docs.sheetjs.com/docs/csf/features/formulae#prefixed-future-functions)
```

--------------------------------

### Read File using File API

Source: https://docs.sheetjs.com/docs/demos/local/file

Reads a file selected via an input element using the File API. It retrieves the first file from the event's target, reads its content as an ArrayBuffer, and then uses XLSX.read to parse the workbook.

```javascript
asyncfunctionhandleFileAsync(e){
/* get first file */
const file = e.target.files[0];
/* get raw data */
const data =await file.arrayBuffer();
/* data is an ArrayBuffer */
const workbook =XLSX.read(data);
/* do something with the workbook here */
console.log(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
}
input_dom_element.addEventListener("change", handleFileAsync,false);
```

--------------------------------

### Reading Excel Files with SheetJS in ExtendScript

Source: https://docs.sheetjs.com/docs/demos/extensions/extendscript

Demonstrates how to use the `getFileForOpening` method to select an Excel file and the SheetJS `read` method to parse its content into an ArrayBuffer. This is useful for importing data into Adobe applications.

```javascript
/* show file picker (single file, no folders) */  
const file =await ufs.getFileForOpening({types:["xlsx","xls","xlsb"]});  
/* read data into an ArrayBuffer */  
const ab =await file.read({format: storage.formats.binary});  
/* parse with SheetJS */  
const wb =XLSX.read(ab);
```

--------------------------------

### Parse pres.xlsx in TxikiJS

Source: https://docs.sheetjs.com/docs/demos/cli/txiki

This snippet demonstrates how to read an Excel file (`pres.xlsx`) using txiki.js's `tjs.readFile` and then parse the data into a SheetJS workbook object using `XLSX.read`. It assumes the file is in the current directory.

```javascript
/* read data from pres.xlsx into a Uint8Array */  
const data =await tjs.readFile("pres.xlsx");  
  
/* parse data and generate a SheetJS workbook object */  
const wb =XLSX.read(data);
```

--------------------------------

### Read Local File with XLSX.readFile

Source: https://docs.sheetjs.com/docs/api/parse-options

Reads a specified local file using its filename and generates a SheetJS workbook object. This helper method is platform-dependent and does not function in web browsers. Additional setup may be required for non-standard NodeJS usage.

```javascript
var wb =XLSX.readFile(filename, opts);
```

--------------------------------

### Fetch and Read Excel File in NativeScript

Source: https://docs.sheetjs.com/docs/demos/mobile/nativescript

This TypeScript code snippet demonstrates how to fetch an Excel file from a URL using NativeScript's http module, read it using SheetJS, and parse its content into a list of items. It handles temporary file storage and state updates.

```typescript
import{ read, utils  }from'xlsx';  
import{ Injectable, signal, effect }from'@angular/core'  
import{ knownFolders, path, getFileAccess }from'@nativescript/core';  
import{ getFile }from'@nativescript/core/http';  
import{ Item }from'./item'  
  
interfaceIPresident{ Name:string; Index:number};
  
@Injectable({ providedIn:'root'})
exportclassItemService{
  items =signal<Item[]>([]);
constructor(){effect(()=>{(async()=>{  
/* fetch https://docs.sheetjs.com/pres.xlsx */  
const temp:string= path.join(knownFolders.temp().path,"pres.xlsx");  
const ab =awaitgetFile("https://docs.sheetjs.com/pres.xlsx", temp)  
/* read the temporary file */  
const wb =read(awaitgetFileAccess().readBufferAsync(ab.path));  
/* translate the first worksheet to the required Item type */  
const data = utils.sheet_to_json<IPresident>(wb.Sheets[wb.SheetNames[0]]);  
/* update state */  
this.items.set(data.map((pres, id)=>({id, name: pres.Name, role:""+pres.Index}as Item)));  
})();});}
  
getItem(id:number): Item {
returnthis.items().find((item)=> item.id === id)
}
}
```

--------------------------------

### Parse Excel from URL using Fetch (Node.js)

Source: https://docs.sheetjs.com/docs/demos/net/network

Demonstrates parsing an Excel file directly from a URL using the native `fetch` API in Node.js. Requires Node.js v16.15.0 or later. The function fetches the file as an ArrayBuffer and then parses it with XLSX.read.

```javascript
var XLSX = require("xlsx");

async function parse_from_url(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch failed");
  const ab = await res.arrayBuffer();
  const workbook = XLSX.read(ab);
  return workbook;
}

(async () => {
  const wb = await parse_from_url('https://docs.sheetjs.com/pres.numbers');
  /* print the first worksheet to console */
  var ws = wb.Sheets[wb.SheetNames[0]];
  console.log(XLSX.utils.sheet_to_csv(ws));
})();
```
