---
query_date: 2025-12-09 20:02:32 UTC
library: /websites/tanstack_table
topic: table options meta configuration
tokens: unknown
project: zebra-h2b-audit-v2
tool: mcp__context7__get-library-docs
---

# Context7 Query: table options meta configuration

### Define Column Configuration with Filter Meta in TanStack Table

Source: https://tanstack.com/table/latest/docs/framework/lit/examples/filters

Configure table columns with accessor keys, headers, and custom meta properties to define filter variants. The ColumnMeta interface extends TanStack Table's column definition to support custom filterVariant options including 'text', 'range', and 'select' types.

```typescript
const columns = [
  {
    accessorKey: 'visits',
    header: () => html`<span>Visits</span>`,
    meta: {
      filterVariant: 'range',
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      filterVariant: 'select',
    },
  },
  {
    accessorKey: 'progress',
    header: 'Profile Progress',
    meta: {
      filterVariant: 'range',
    },
  },
]

declare module '@tanstack/lit-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: 'text' | 'range' | 'select'
  }
}
```

--------------------------------

### Table Options Reference

Source: https://tanstack.com/table/latest/docs/api/core/table

The `options` property provides read-only access to the table's current configuration. This property is primarily for internal use or by adapters. Adapters must use the `setOptions` function to update these options.

```tsx
options: TableOptions<TData>
```

--------------------------------

### Table Core Options: Metadata Object

Source: https://tanstack.com/table/latest/docs/api/core/table

The `meta` option accepts an arbitrary object that can be accessed globally within the table instance via `table.options.meta`. This is useful for passing contextual data or functions, such as locale objects or data update functions.

```typescript
meta?: TableMeta // This interface is extensible via declaration merging.
```

```typescript
declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    foo: string
  }
}
```

--------------------------------

### Table Options

Source: https://tanstack.com/table/latest/docs/api/features/expanding

Configuration options for controlling row expansion behavior.

```APIDOC
## Table Options for Expanding

### `manualExpanding`

```typescript
manualExpanding?: boolean
```

Enables manual row expansion. If this is set to `true`, `getExpandedRowModel` will not be used to expand rows and you would be expected to perform the expansion in your own data model. This is useful if you are doing server-side expansion.

### `onExpandedChange`

```typescript
onExpandedChange?: OnChangeFn<ExpandedState>
```

This function is called when the `expanded` table state changes. If a function is provided, you will be responsible for managing this state on your own. To pass the managed state back to the table, use the `tableOptions.state.expanded` option.

### `autoResetExpanded`

```typescript
autoResetExpanded?: boolean
```

Enable this setting to automatically reset the expanded state of the table when expanding state changes.

### `enableExpanding`

```typescript
enableExpanding?: boolean
```

Enable/disable expanding for all rows.

### `getExpandedRowModel`

```typescript
getExpandedRowModel?: (table: Table<TData>) => () => RowModel<TData>
```

This function is responsible for returning the expanded row model. If this function is not provided, the table will not expand rows. You can use the default exported `getExpandedRowModel` function to get the expanded row model or implement your own.

### `getIsRowExpanded`

```typescript
getIsRowExpanded?: (row: Row<TData>) => boolean
```

If provided, allows you to override the default behavior of determining whether a row is currently expanded.

### `getRowCanExpand`

```typescript
getRowCanExpand?: (row: Row<TData>) => boolean
```

If provided, allows you to override the default behavior of determining whether a row can be expanded.

### `paginateExpandedRows`

```typescript
paginateExpandedRows?: boolean
```

If `true` expanded rows will be paginated along with the rest of the table (which means expanded rows may span multiple pages).

If `false` expanded rows will not be considered for pagination (which means expanded rows will always render on their parents page. This also means more rows will be rendered than the set page size)
```

--------------------------------

### Table Core Options: Default Column Configuration

Source: https://tanstack.com/table/latest/docs/api/core/table

The `defaultColumn` option allows you to provide default configurations for all columns, such as default renderers for cells, headers, or footers, and default sorting, filtering, or grouping behaviors. These defaults are merged with individual column definitions.

```typescript
defaultColumn?: Partial<ColumnDef<TData>>
```

--------------------------------

### React: TanStack Table Initialization and Configuration

Source: https://tanstack.com/table/latest/docs/framework/react/examples/editable-data

This code snippet demonstrates the initialization of the TanStack Table using the `useReactTable` hook. It includes defining column definitions, managing table data state, applying default column configurations, and setting up various table features like filtering and pagination. The `meta` option is used to provide a custom `updateData` function for modifying table rows.

```javascript
function App() {
  const rerender = React.useReducer(() => ({}), {})[1]

  const columns = React.useMemo<ColumnDef<Person>[]>(
    () => [
      {
        header: 'Name',
        footer: props => props.column.id,
        columns: [
          {
            accessorKey: 'firstName',
            footer: props => props.column.id,
          },
          {
            accessorFn: row => row.lastName,
            id: 'lastName',
            header: () => <span>Last Name</span>,
            footer: props => props.column.id,
          },
        ],
      },
      {
        header: 'Info',
        footer: props => props.column.id,
        columns: [
          {
            accessorKey: 'age',
            header: () => 'Age',
            footer: props => props.column.id,
          },
          {
            header: 'More Info',
            columns: [
              {
                accessorKey: 'visits',
                header: () => <span>Visits</span>,
                footer: props => props.column.id,
              },
              {
                accessorKey: 'status',
                header: 'Status',
                footer: props => props.column.id,
              },
              {
                accessorKey: 'progress',
                header: 'Profile Progress',
                footer: props => props.column.id,
              },
            ],
          },
        ],
      },
    ],
    []
  )

  const [data, setData] = React.useState(() => makeData(1000))
  const refreshData = () => setData(() => makeData(1000))

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper()

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex,
    // Provide our updateData function to our table meta
    meta: {
      updateData: (rowIndex, columnId, value) => {
        // Skip page index reset until after next rerender
        skipAutoResetPageIndex()
        setData(old =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex]!,
                [columnId]: value,
              }
            }
            return row
          })
        )
      },
    },
    debugTable: true,
  })

  return (
    <div className="p-2">
      <div className="h-2" />
      <table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanFilter() ? (
                          <div>
                            <Filter column={header.column} table={table} />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => {
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => {
                  return (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

--------------------------------

### Table Core Options: Initial State Configuration

Source: https://tanstack.com/table/latest/docs/api/core/table

The `initialState` option allows you to set the initial state for various table features, including visibility, column order, pinning, filters, sorting, expansion, grouping, sizing, pagination, and row selection. This state is used when resetting table states.

```typescript
initialState?: Partial<
  VisibilityTableState &
  ColumnOrderTableState &
  ColumnPinningTableState &
  FiltersTableState &
  SortingTableState &
  ExpandedTableState &
  GroupingTableState &
  ColumnSizingTableState &
  PaginationTableState &
  RowSelectionTableState
>
```

--------------------------------

### Configure enableColumnPinning Table Option - TypeScript

Source: https://tanstack.com/table/latest/docs/api/features/column-pinning

Table option to enable or disable column pinning globally for all columns. When set to false, prevents any columns from being pinned regardless of individual column settings.

```typescript
enableColumnPinning?: boolean
```

--------------------------------

### Column Meta Data Definition and Extension (TypeScript)

Source: https://tanstack.com/table/latest/docs/api/core/column-def

The `meta` option allows associating custom metadata with a column, accessible via `column.columnDef.meta`. This interface can be extended globally for custom properties.

```typescript
meta?: ColumnMeta // This interface is extensible via declaration merging. See below!

import '@tanstack/react-table' //or vue, svelte, solid, qwik, etc.

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    foo: string
  }
}
```

--------------------------------

### Set Table Options

Source: https://tanstack.com/table/latest/docs/api/core/table

Updates the table options. Primarily intended for use by adapters, direct usage is discouraged to maintain adapter strategy integrity. Accepts an Updater function for type-safe option updates.

```typescript
setOptions: (newOptions: Updater<TableOptions<TData>>) => void
```
