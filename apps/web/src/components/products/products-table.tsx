"use client";

import { useQuery } from "@tanstack/react-query";
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
import {
  ArrowUpDown,
  Columns,
  Download,
  FileText,
  Search,
  X,
} from "lucide-react";
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
import {
  exportToCSV,
  exportToJSON,
  exportToMarkdown,
  prepareDataForExport,
} from "@/lib/export-utils";
import { trpc } from "@/utils/trpc";
import { MultiSelectFilter } from "./multi-select-filter";
import { SourceDataModal } from "./source-data-modal";

type Product = {
  id: number;
  baseModel: string | null;
  productCode: string | null;
  specStyle: string;
  cohortId: number | null;
  sourcePath: string;
  sourceHash: string | null;
  importedAt: Date;
  positionCount: number;
};

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);

  // Source data modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedFileId, setSelectedFileId] = React.useState<number | null>(
    null
  );

  // Fetch file blob when modal is opened
  const { data: fileBlobData, isLoading: isLoadingBlob } = useQuery({
    ...trpc.products.getFileBlob.queryOptions({ fileId: selectedFileId! }),
    enabled: modalOpen && selectedFileId !== null,
  });

  // Get unique base models for filter dropdown
  const uniqueBaseModels = React.useMemo(() => {
    const models = new Set<string>();
    products.forEach((p) => {
      if (p.baseModel) models.add(p.baseModel);
    });
    return Array.from(models).sort();
  }, [products]);

  const columns: ColumnDef<Product>[] = [
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
      filterFn: (row, id, filterValue: string[]) => {
        // If no filters selected, show all
        if (!filterValue || filterValue.length === 0) return true;
        // Check if row's baseModel is in the selected models
        const baseModel = row.getValue(id) as string | null;
        return baseModel ? filterValue.includes(baseModel) : false;
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

        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation(); // Prevent row click navigation
          setSelectedFileId(row.original.id);
          setModalOpen(true);
        };

        return (
          <button
            className="group max-w-md text-left"
            onClick={handleClick}
            title={path}
          >
            <div className="cursor-pointer truncate text-blue-600 text-sm group-hover:underline dark:text-blue-400">
              {fileName}
            </div>
            <div className="truncate text-muted-foreground text-xs">
              {path.replace(fileName, "...")}
            </div>
          </button>
        );
      },
    },
    {
      id: "specStyle",
      accessorKey: "specStyle",
      header: "Spec Style",
      cell: ({ row }) => {
        const style = row.getValue("specStyle") as string;
        return (
          <Badge className="text-xs" variant="secondary">
            {style}
          </Badge>
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
    {
      id: "actions",
      header: "Actions",
      enableHiding: false, // Always show actions column
      cell: ({ row }) => {
        const handleViewSource = (e: React.MouseEvent) => {
          e.stopPropagation(); // Prevent row click navigation
          setSelectedFileId(row.original.id);
          setModalOpen(true);
        };

        return (
          <Button
            aria-label="View source file"
            className="h-8 w-8 p-0"
            onClick={handleViewSource}
            size="sm"
            variant="ghost"
          >
            <FileText className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  // Sync selectedModels with columnFilters
  React.useEffect(() => {
    if (selectedModels.length > 0) {
      setColumnFilters((filters) => [
        ...filters.filter((f) => f.id !== "baseModel"),
        { id: "baseModel", value: selectedModels },
      ]);
    } else {
      setColumnFilters((filters) =>
        filters.filter((f) => f.id !== "baseModel")
      );
    }
  }, [selectedModels]);

  const table = useReactTable({
    data: products,
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
    setSelectedModels([]);
    setColumnFilters([]);
  };

  const activeFilterCount =
    (globalFilter ? 1 : 0) + (selectedModels.length > 0 ? 1 : 0);

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

      const exportData = prepareDataForExport(
        filteredRows.map((row) => row.original)
      );

      exportToCSV(
        exportData,
        `products-export-${new Date().toISOString().split("T")[0]}`
      );
      toast.success("CSV exported successfully", {
        description: `Exported ${filteredRows.length} products`,
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

      const exportData = prepareDataForExport(
        filteredRows.map((row) => row.original)
      );

      exportToJSON(
        exportData,
        `products-export-${new Date().toISOString().split("T")[0]}`
      );
      toast.success("JSON exported successfully", {
        description: `Exported ${filteredRows.length} products`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleExportMarkdown = () => {
    try {
      const filteredRows = table.getFilteredRowModel().rows;
      if (filteredRows.length === 0) {
        toast.error("No data to export", {
          description: "The current filter returns no results.",
        });
        return;
      }

      const exportData = prepareDataForExport(
        filteredRows.map((row) => row.original)
      );

      exportToMarkdown(
        exportData,
        `products-export-${new Date().toISOString().split("T")[0]}`
      );
      toast.success("Markdown exported successfully", {
        description: `Exported ${filteredRows.length} products`,
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
              placeholder="Search by model or file path..."
              value={globalFilter}
            />
          </div>

          <MultiSelectFilter
            onSelectedChange={setSelectedModels}
            options={uniqueBaseModels}
            placeholder="All Models"
            searchPlaceholder="Search models..."
            selected={selectedModels}
            title="Models"
          />

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
          Showing {table.getFilteredRowModel().rows.length} of {products.length}{" "}
          products
          {selectedModels.length > 0 && (
            <span className="ml-1">
              ({selectedModels.length}{" "}
              {selectedModels.length === 1 ? "model" : "models"} selected)
            </span>
          )}
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
            <DropdownMenuItem onClick={handleExportMarkdown}>
              Download Markdown
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
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                  onClick={() => router.push(`/products/${row.original.id}`)}
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

      {/* Source Data Modal */}
      <SourceDataModal
        fileContent={isLoadingBlob ? null : (fileBlobData?.textContent ?? null)}
        fileName={
          isLoadingBlob ? "Loading..." : (fileBlobData?.fileName ?? "Unknown")
        }
        mimeType={
          isLoadingBlob
            ? "text/plain"
            : (fileBlobData?.mimeType ?? "text/plain")
        }
        onOpenChange={setModalOpen}
        open={modalOpen}
      />
    </div>
  );
}
