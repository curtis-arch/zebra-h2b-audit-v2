---
query_date: 2025-12-09 20:02:30 UTC
library: /websites/tanstack_table
topic: table meta context passing data to cell renderers
tokens: unknown
project: zebra-h2b-audit-v2
tool: mcp__context7__get-library-docs
---

# Context7 Query: table meta context passing data to cell renderers

### Render Angular TemplateRef in Table Cells

Source: https://tanstack.com/table/latest/docs/framework/angular/angular-table

Demonstrates rendering an Angular TemplateRef in table cells using the `*flexRender` directive. It shows how to pass cell context data and render simple strings or HTML strings within the template. This approach is useful for custom cell content.

```html
<ng-container
  *flexRender="
              cell.column.columnDef.cell;
              props: cell.getContext();
              let cell
            "
>
  <!-- if you want to render a simple string -->
  {{ cell }}
  <!-- if you want to render an html string -->
  <div [innerHTML]="cell"></div>
</ng-container>

<ng-template #myCell let-context>
  <!-- render something with context -->
</ng-template>
```

```typescript
import type {
  CellContext,
  ColumnDef,
  HeaderContext,
} from '@tanstack/angular-table'
import {Component, TemplateRef, viewChild} from '@angular/core'

@Component({
  template: `
    <tbody>
      @for (row of table.getRowModel().rows; track row.id) {
        <tr>
          @for (cell of row.getVisibleCells(); track cell.id) {
            <td>
              <ng-container
                *flexRender="
                  cell.column.columnDef.cell;
                  props: cell.getContext(); // Data given to the TemplateRef
                  let cell
                "
              >
                <!-- if you want to render a simple string -->
                {{ cell }}
                <!-- if you want to render an html string -->
                <div [innerHTML]="cell"></div>
              </ng-container>
            </td>
          }
        </tr>
      }
    </tbody>

    <ng-template #customHeader let-context>
      {{ context.getValue() }}
    </ng-template>
    <ng-template #customCell let-context>
      {{ context.getValue() }}
    </ng-template>
  `,
})
class AppComponent {
  customHeader = 
    viewChild.required<TemplateRef<{ $implicit: HeaderContext<any, any> }>>(
      'customHeader'
    )
  customCell = 
    viewChild.required<TemplateRef<{ $implicit: CellContext<any, any> }>>(
      'customCell'
    )

  columns: ColumnDef<unknown>[] = [
    {
      id: 'customCell',
      header: () => this.customHeader(),
      cell: () => this.customCell(),
    },
  ]
}
```

--------------------------------

### Cell Rendering Context with flexRender

Source: https://tanstack.com/table/latest/docs/api/core/cell

The `getContext` function returns the rendering context (props) for cell components. This context, along with the `flexRender` utility, allows for flexible rendering of cell content using custom templates.

```typescript
getContext: () => {
  table: Table<TData>
  column: Column<TData, TValue>
  row: Row<TData>
  cell: Cell<TData, TValue>
  getValue: <TTValue = TValue,>() => TTValue
  renderValue: <TTValue = TValue,>() => TTValue | null
}
```

```typescript
flexRender(cell.column.columnDef.cell, cell.getContext())
```

--------------------------------

### React: Default Column Cell Renderer with Editing

Source: https://tanstack.com/table/latest/docs/framework/react/examples/editable-data

This code defines a default column renderer for TanStack Table that enables inline editing of cell values. It uses React's useState and useEffect hooks to manage the cell's value and updates the table data via a meta function when the input loses focus. Dependencies include React and TanStack Table.

```javascript
const defaultColumn: Partial<ColumnDef<Person>> = {
  cell: ({ getValue, row: { index }, column: { id }, table }) => {
    const initialValue = getValue()
    // We need to keep and update the state of the cell normally
    const [value, setValue] = React.useState(initialValue)

    // When the input is blurred, we'll call our table meta's updateData function
    const onBlur = () => {
      table.options.meta?.updateData(index, id, value)
    }

    // If the initialValue is changed external, sync it up with our state
    React.useEffect(() => {
      setValue(initialValue)
    }, [initialValue])

    return (
      <input
        value={value as string}
        onChange={e => setValue(e.target.value)}
        onBlur={onBlur}
      />
    )
  },
}
```

--------------------------------

### Render Table Cells with flexRender

Source: https://tanstack.com/table/latest/docs/framework/lit/lit-table

Illustrates the usage of the flexRender utility function from @tanstack/lit-table for dynamically rendering cell, header, and footer templates. It shows how to iterate through table rows and cells, and use flexRender with the cell's column definition and context.

```jsx
import { flexRender } from '@tanstack/lit-table'
//...
return html`
<tbody>
  ${table
    .getRowModel()
    .rows.slice(0, 10)
    .map(
      row => html`
        <tr>
          ${row
            .getVisibleCells()
            .map(
              cell => html`
                <td>
                  ${flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </td>
              `
            )}
        </tr>
      `
    )}
</tbody>
`
```

--------------------------------

### Render Table Cell Content with TanStack Table

Source: https://tanstack.com/table/latest/docs/framework/lit/examples/sorting

Renders the content of a table cell using the flexRender utility from TanStack Table. This function takes the cell's column definition and context to display the appropriate cell content. It's typically used within the table's row rendering logic.

```javascript
<td>
  ${flexRender(
    cell.column.columnDef.cell,
    cell.getContext()
  )}
</td>
```

--------------------------------

### Render Component Type in Table Column Definition

Source: https://tanstack.com/table/latest/docs/framework/angular/angular-table

Defines table columns by directly specifying component types for header and cell properties instead of using flexRenderComponent. The component types are passed to the flexRender directive along with context, which provides table, column, and header context properties to the rendered component.

```typescript
class AppComponent {
  columns: ColumnDef<Person>[] = [
    {
      id: 'select',
      header: () => TableHeadSelectionComponent<Person>,
      cell: () => TableRowSelectionComponent<Person>,
    },
  ]
}
```

--------------------------------

### Render Table Headers with Svelte Component in TanStack Table

Source: https://tanstack.com/table/latest/docs/framework/svelte/examples/column-ordering

Renders dynamic table headers using flexRender and svelte:component to display header content from column definitions. Uses getContext() to pass header context data for custom header rendering and supports placeholder handling.

```svelte
{#each $table.getHeaderGroups() as headerGroup}
  {#each headerGroup.headers as header}
    <th>
      {#if !header.isPlaceholder}
        <svelte:component
          this={flexRender(
            header.column.columnDef.header,
            header.getContext()
          )}
        />
      {/if}
    </th>
  {/each}
{/each}
```

--------------------------------

### Render Table Cells with flexRender

Source: https://tanstack.com/table/latest/docs/framework/qwik/qwik-table

Renders dynamic table cell, header, and footer templates using the `flexRender` utility. This function takes the template definition and context to display the correct content within table elements.

```jsx
import { flexRender } from '@tanstack/qwik-table'
//...
return (
  <tbody>
    {table.getRowModel().rows.map(row => {
      return (
        <tr key={row.id}>
          {row.getVisibleCells().map(cell => (
            <td key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      )
    })}
  </tbody>
);

```

--------------------------------

### Inject FlexRender Context in Angular Component

Source: https://tanstack.com/table/latest/docs/framework/angular/angular-table

Demonstrates accessing table cell or header/footer context within a custom component using the injectFlexRenderContext function. This allows components to retrieve context-specific data like row information, column metadata, and header details without explicit input passing.

```typescript
@Component({
  // ...
})
class CustomCellComponent {
  // context of a cell component
  readonly context = injectFlexRenderContext<CellContext<TData, TValue>>();
  // context of a header/footer component
  readonly context = injectFlexRenderContext<HeaderContext<TData, TValue>>();
}
```

--------------------------------

### Render Table Cells with FlexRender Component

Source: https://tanstack.com/table/latest/docs/framework/vue/vue-table

Demonstrates the usage of the `FlexRender` component from `@tanstack/vue-table` for rendering cell, header, and footer templates dynamically. It takes a `render` prop (the template function) and `props` (the context) to display cell content within a Vue template.

```vue
import { FlexRender } from '@tanstack/vue-table'

<template>
  <tbody>
    <tr v-for="row in table.getRowModel().rows" :key="row.id">
      <td v-for="cell in row.getVisibleCells()" :key="cell.id">
        <FlexRender
          :render="cell.column.columnDef.cell"
          :props="cell.getContext()"
        />
      </td>
    </tr>
  </tbody>
</template>
```
