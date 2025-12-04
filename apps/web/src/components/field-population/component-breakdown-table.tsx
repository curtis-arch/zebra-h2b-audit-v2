"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, Columns, Download, Search, X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ComponentVariant = {
  rawValue: string;
  componentType: string;
  frequency: number;
  uniqueProducts: number;
};

interface ComponentBreakdownTableProps {
  components: ComponentVariant[];
  fieldName: string;
  totalProducts: number;
  onComponentClick?: (rawValue: string) => void;
  selectedComponent?: string | null;
}

export function ComponentBreakdownTable({
  components,
  fieldName,
  totalProducts,
  onComponentClick,
  selectedComponent,
}: ComponentBreakdownTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "frequency", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const columns: ColumnDef<ComponentVariant>[] = [
    {
      id: "rawValue",
      accessorKey: "rawValue",
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Component Value
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue("rawValue") as string;
        const isSelected = selectedComponent === value;

        return (
          <div className={`font-medium ${isSelected ? "text-primary" : ""}`}>
            {value}
          </div>
        );
      },
    },
    {
      id: "componentType",
      accessorKey: "componentType",
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const type = row.getValue("componentType") as string;
        return (
          <Badge className="capitalize" variant="outline">
            {type}
          </Badge>
        );
      },
    },
    {
      id: "frequency",
      accessorKey: "frequency",
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Frequency
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const frequency = row.getValue("frequency") as number;
        return <div className="font-mono text-sm">{frequency}</div>;
      },
    },
    {
      id: "uniqueProducts",
      accessorKey: "uniqueProducts",
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Products
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const products = row.getValue("uniqueProducts") as number;
        return <div className="font-mono text-sm">{products}</div>;
      },
    },
    {
      id: "percentage",
      accessorFn: (row) => (row.uniqueProducts / totalProducts) * 100,
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          % of All Products
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const percentage = row.getValue("percentage") as number;
        const products = row.getValue("uniqueProducts") as number;
        return (
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-sm"
              title={`${products} of ${totalProducts} products`}
            >
              {percentage.toFixed(1)}%
            </span>
            <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: components,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
  });

  const handleClearFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
  };

  const handleExportCSV = () => {
    const headers = [
      "Component Value",
      "Type",
      "Frequency",
      "Products",
      "% of Total",
    ];
    const rows = components.map((c) => [
      c.rawValue,
      c.componentType,
      c.frequency.toString(),
      c.uniqueProducts.toString(),
      ((c.uniqueProducts / totalProducts) * 100).toFixed(1) + "%",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fieldName}-component-breakdown.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = components.map((c) => ({
      ...c,
      percentageOfTotal: ((c.uniqueProducts / totalProducts) * 100).toFixed(1),
    }));

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fieldName}-component-breakdown.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilterCount = globalFilter ? 1 : 0;

  return (
    <div className="space-y-4">
      {/* Top Filters Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search component values..."
              value={globalFilter}
            />
          </div>

          {activeFilterCount > 0 && (
            <Button
              className="h-9 px-2 lg:px-3"
              onClick={handleClearFilters}
              variant="ghost"
            >
              Clear
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="whitespace-nowrap text-muted-foreground text-sm">
          Showing {table.getFilteredRowModel().rows.length} of{" "}
          {components.length} variants
        </div>
      </div>

      {/* Column Controls Row */}
      <div className="flex gap-2">
        {/* Column Visibility Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-9" size="sm" variant="outline">
              <Columns className="mr-2 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  checked={column.getIsVisible()}
                  className="capitalize"
                  key={column.id}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-9" size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem onClick={handleExportCSV}>
              CSV
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem onClick={handleExportJSON}>
              JSON
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getFilteredRowModel().rows?.length ? (
              table.getFilteredRowModel().rows.map((row) => {
                const isSelected = selectedComponent === row.original.rawValue;
                return (
                  <TableRow
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/10 hover:bg-primary/20"
                        : "hover:bg-muted/80"
                    }`}
                    data-state={isSelected ? "selected" : undefined}
                    key={row.id}
                    onClick={() => onComponentClick?.(row.original.rawValue)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  No component variants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
