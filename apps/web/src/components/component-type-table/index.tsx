"use client";

import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Download, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ComponentTypeRow, columns } from "./columns";
import { exportToCsv } from "./csv-export";
import { ThresholdSlider } from "./threshold-slider";

type ComponentTypeTableProps = {
  data: ComponentTypeRow[];
  threshold?: number;
  onThresholdChange?: (value: number) => void;
  onComponentTypeClick?: (componentType: string) => void;
  isLoading?: boolean;
  queryTimeMs?: number | null;
};

export function ComponentTypeTable({
  data,
  threshold = 0.85,
  onThresholdChange,
  onComponentTypeClick,
  isLoading = false,
  queryTimeMs = null,
}: ComponentTypeTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showTimingFeedback, setShowTimingFeedback] = useState(false);

  // Show timing feedback for 3 seconds after query completes
  useEffect(() => {
    if (!isLoading && queryTimeMs !== null) {
      setShowTimingFeedback(true);
      const timer = setTimeout(() => {
        setShowTimingFeedback(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, queryTimeMs]);

  const table = useReactTable({
    data,
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
    meta: {
      onComponentTypeClick,
    },
  });

  return (
    <div className="space-y-4">
      {/* Header with threshold slider */}
      {onThresholdChange && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <ThresholdSlider onChange={onThresholdChange} value={threshold} />
            
            {/* Query status indicator */}
            <div className="flex items-center gap-2 text-sm">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : showTimingFeedback && queryTimeMs !== null ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Updated in {queryTimeMs < 1000 ? `${queryTimeMs}ms` : `${(queryTimeMs / 1000).toFixed(2)}s`}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <Button
              onClick={() => exportToCsv(data, threshold)}
              size="sm"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      )}

      {/* Table with horizontal scroll */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table className="min-w-[1200px]">
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
                    className="transition-colors hover:bg-muted/50"
                    data-state={row.getIsSelected() && "selected"}
                    key={row.id}
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
                    No component types found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Row count footer */}
      <div className="text-muted-foreground text-sm">
        Showing {table.getFilteredRowModel().rows.length} of {data.length}{" "}
        component types
      </div>
    </div>
  );
}

export type { ComponentTypeRow } from "./columns";
