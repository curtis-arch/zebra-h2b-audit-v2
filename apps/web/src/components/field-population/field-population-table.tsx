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
import { ArrowUpDown, Columns, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
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

type ProductFieldStatus = {
  id: number;
  baseModel: string | null;
  sourcePath: string;
  cohortId: number | null;
  hasField: boolean;
  positionIndex: number | null;
};

interface FieldPopulationTableProps {
  products: ProductFieldStatus[];
  fieldName: string;
  filterTab: "all" | "has" | "missing";
}

export function FieldPopulationTable({
  products,
  fieldName,
  filterTab,
}: FieldPopulationTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const columns: ColumnDef<ProductFieldStatus>[] = [
    {
      id: "id",
      accessorKey: "id",
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-xs">{row.getValue("id")}</div>
      ),
    },
    {
      id: "baseModel",
      accessorKey: "baseModel",
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Base Model
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const model = row.getValue("baseModel") as string | null;
        return model ? (
          <Badge className="font-mono" variant="outline">
            {model}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">N/A</span>
        );
      },
    },
    {
      id: "sourcePath",
      accessorKey: "sourcePath",
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Source File
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const path = row.getValue("sourcePath") as string;
        const fileName = path.split("/").pop() || path;

        return (
          <div className="max-w-md" title={path}>
            <div className="truncate text-sm">{fileName}</div>
            <div className="truncate text-muted-foreground text-xs">
              {path.replace(fileName, "...")}
            </div>
          </div>
        );
      },
    },
    {
      id: "positionIndex",
      accessorKey: "positionIndex",
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Position
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const position = row.getValue("positionIndex") as number | null;
        return position !== null ? (
          <Badge className="font-mono" variant="secondary">
            {position}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">N/A</span>
        );
      },
    },
    {
      id: "hasField",
      accessorKey: "hasField",
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Has {fieldName}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const hasField = row.getValue("hasField") as boolean;
        return hasField ? (
          <Badge className="bg-green-600 hover:bg-green-700" variant="default">
            Yes
          </Badge>
        ) : (
          <Badge
            className="bg-red-600/10 text-red-700 dark:text-red-400"
            variant="secondary"
          >
            No
          </Badge>
        );
      },
    },
    {
      id: "cohortId",
      accessorKey: "cohortId",
      header: "Cohort",
      cell: ({ row }) => {
        const cohortId = row.getValue("cohortId") as number | null;
        return cohortId ? (
          <div className="font-mono text-muted-foreground text-xs">
            #{cohortId}
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        );
      },
    },
  ];

  // Filter data based on tab selection
  const filteredData = React.useMemo(() => {
    if (filterTab === "all") return products;
    if (filterTab === "has") return products.filter((p) => p.hasField);
    if (filterTab === "missing") return products.filter((p) => !p.hasField);
    return products;
  }, [products, filterTab]);

  const table = useReactTable({
    data: filteredData,
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
              placeholder="Search by model or file path..."
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
          {filteredData.length} products
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
                  {column.id === "hasField" ? `Has ${fieldName}` : column.id}
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
                <TableRow
                  className="cursor-pointer transition-colors hover:bg-muted/80"
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                  onClick={() =>
                    window.open(
                      `/products/${row.original.id}`,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
