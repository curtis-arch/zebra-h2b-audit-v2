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
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ComponentTypeRow, columns } from "./columns";
import { ThresholdSlider } from "./threshold-slider";

type ComponentTypeTableProps = {
  data: ComponentTypeRow[];
  threshold?: number;
  onThresholdChange?: (value: number) => void;
};

export function ComponentTypeTable({
  data,
  threshold = 0.85,
  onThresholdChange,
}: ComponentTypeTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

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
  });

  return (
    <div className="space-y-4">
      {/* Header with threshold slider */}
      {onThresholdChange && (
        <div className="flex items-center justify-between gap-4">
          <ThresholdSlider onChange={onThresholdChange} value={threshold} />
          <div className="flex-shrink-0">
            {/* Export button can go here in the future */}
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
