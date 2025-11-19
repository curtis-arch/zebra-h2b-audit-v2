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
import { ArrowUpDown, Columns, Download, Eye, Search, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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

type Component = {
  rawValue: string;
  frequency: number;
  optionCount: number;
};

interface ComponentsTableProps {
  components: Component[];
  componentType: string;
  onViewProducts: (rawValue: string) => void;
}

export function ComponentsTable({
  components,
  componentType,
  onViewProducts,
}: ComponentsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "frequency", desc: true }, // Default sort by frequency descending
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const columns: ColumnDef<Component>[] = [
    {
      id: "rawValue",
      accessorKey: "rawValue",
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Raw Value
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue("rawValue") as string;
        return (
          <div className="max-w-xs truncate font-medium" title={value}>
            {value}
          </div>
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
        const count = row.getValue("frequency") as number;
        return (
          <div className="text-center">
            <Badge variant="default">{count}</Badge>
          </div>
        );
      },
    },
    {
      id: "optionCount",
      accessorKey: "optionCount",
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Products Count
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const count = row.getValue("optionCount") as number;
        return (
          <div className="text-center">
            <Badge variant="secondary">{count}</Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="text-center">
          <Button
            className="h-8 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onViewProducts(row.original.rawValue);
            }}
            size="sm"
            variant="ghost"
          >
            <Eye className="h-4 w-4" />
            View Products
          </Button>
        </div>
      ),
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

  const activeFilterCount = globalFilter ? 1 : 0;

  // Export handlers
  const handleExportCSV = () => {
    try {
      const filteredRows = table.getFilteredRowModel().rows;
      if (filteredRows.length === 0) {
        toast.error("No data to export", {
          description: "The current filter returns no results.",
        });
        return;
      }

      // Prepare data for export
      const exportData = filteredRows.map((row) => ({
        componentType,
        rawValue: row.original.rawValue,
        frequency: row.original.frequency,
        optionCount: row.original.optionCount,
      }));

      // Generate CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              const value = row[header as keyof typeof row];
              return typeof value === "string" && value.includes(",")
                ? `"${value}"`
                : value;
            })
            .join(",")
        ),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${componentType}-components-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV exported successfully", {
        description: `Exported ${filteredRows.length} components`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleExportJSON = () => {
    try {
      const filteredRows = table.getFilteredRowModel().rows;
      if (filteredRows.length === 0) {
        toast.error("No data to export", {
          description: "The current filter returns no results.",
        });
        return;
      }

      const exportData = filteredRows.map((row) => ({
        componentType,
        ...row.original,
      }));
      const jsonContent = JSON.stringify(exportData, null, 2);

      const blob = new Blob([jsonContent], { type: "application/json" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${componentType}-components-${new Date().toISOString().split("T")[0]}.json`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("JSON exported successfully", {
        description: `Exported ${filteredRows.length} components`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

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
              placeholder="Search components..."
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
          {components.length} components
        </div>
      </div>

      {/* Export and Column Controls Row */}
      <div className="flex gap-2">
        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-9" size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Export Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportCSV}>
              Download CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportJSON}>
              Download JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
              table.getFilteredRowModel().rows.map((row) => (
                <TableRow className="hover:bg-muted/50" key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  No components found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
