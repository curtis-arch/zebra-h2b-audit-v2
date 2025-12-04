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
import { useRouter } from "next/navigation";
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

type Cohort = {
  id: number;
  signatureHash: string;
  signatureJson?: unknown;
  description: string | null;
  createdAt: string | null;
  productCount: number;
  positionCount: number;
  representativeModel: string;
};

interface CohortsTableProps {
  cohorts: Cohort[];
}

export function CohortsTable({ cohorts }: CohortsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "productCount", desc: true }, // Default sort by product count descending
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const columns: ColumnDef<Cohort>[] = [
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
        <div className="font-mono text-xs">#{row.getValue("id")}</div>
      ),
    },
    {
      id: "signatureHash",
      accessorKey: "signatureHash",
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Signature Hash
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const hash = row.getValue("signatureHash") as string;
        const truncated = hash.substring(0, 12) + "...";
        return (
          <div className="font-mono text-muted-foreground text-xs" title={hash}>
            {truncated}
          </div>
        );
      },
    },
    {
      id: "positionCount",
      accessorKey: "positionCount",
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Positions
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const count = row.getValue("positionCount") as number;
        return <div className="text-center font-medium">{count}</div>;
      },
    },
    {
      id: "productCount",
      accessorKey: "productCount",
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
        const count = row.getValue("productCount") as number;
        return (
          <div className="text-center">
            <Badge variant={count > 1 ? "default" : "secondary"}>{count}</Badge>
          </div>
        );
      },
    },
    {
      id: "representativeModel",
      accessorKey: "representativeModel",
      header: ({ column }) => (
        <Button
          className="h-8 px-2 hover:bg-muted/50"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          variant="ghost"
        >
          Representative Model
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const model = row.getValue("representativeModel") as string;
        return (
          <Badge className="font-mono" variant="outline">
            {model}
          </Badge>
        );
      },
    },
  ];

  const table = useReactTable({
    data: cohorts,
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
        id: row.original.id,
        signatureHash: row.original.signatureHash,
        positionCount: row.original.positionCount,
        productCount: row.original.productCount,
        representativeModel: row.original.representativeModel,
        createdAt: row.original.createdAt ?? "",
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
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `cohorts-export-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV exported successfully", {
        description: `Exported ${filteredRows.length} cohorts`,
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

      const exportData = filteredRows.map((row) => row.original);
      const jsonContent = JSON.stringify(exportData, null, 2);

      const blob = new Blob([jsonContent], { type: "application/json" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `cohorts-export-${new Date().toISOString().split("T")[0]}.json`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("JSON exported successfully", {
        description: `Exported ${filteredRows.length} cohorts`,
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
              placeholder="Search by model or signature..."
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
          Showing {table.getFilteredRowModel().rows.length} of {cohorts.length}{" "}
          cohorts
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
                <TableRow
                  className="cursor-pointer transition-colors hover:bg-muted/80"
                  key={row.id}
                  onClick={() =>
                    router.push(`/cohorts/${row.original.id}` as any)
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
                  No cohorts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
