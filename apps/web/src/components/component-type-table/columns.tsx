import type { ColumnDef, RowData } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCountPopover } from "./product-count-popover";
import { ZebraMatchBadge } from "./zebra-match-badge";

// Extend TanStack Table's TableMeta to include our custom callback
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    onComponentTypeClick?: (componentType: string) => void;
  }
}

export interface ComponentTypeRow {
  componentType: string;
  similarCount: number;
  similarValues: string[];
  productCount: number;
  positionCount: number;
  positions: string[];
  zebraMatch: "yes" | "partial" | "no";
}

export const columns: ColumnDef<ComponentTypeRow>[] = [
  {
    id: "componentType",
    accessorKey: "componentType",
    header: ({ column }) => (
      <Button
        className="h-8 px-2 hover:bg-muted/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        variant="ghost"
      >
        Component Type
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row, table }) => {
      const componentType = row.getValue("componentType") as string;
      const onClick = table.options.meta?.onComponentTypeClick;

      if (onClick) {
        return (
          <button
            className="rounded text-left font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={() => onClick(componentType)}
          >
            {componentType}
          </button>
        );
      }

      return <div className="font-medium">{componentType}</div>;
    },
  },
  {
    id: "similarCount",
    accessorKey: "similarCount",
    header: ({ column }) => (
      <Button
        className="h-8 px-2 hover:bg-muted/50"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        variant="ghost"
      >
        # Similar
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {row.getValue("similarCount")}
      </div>
    ),
  },
  {
    id: "similarValues",
    accessorKey: "similarValues",
    header: "Similar Values",
    cell: ({ row }) => {
      const values = row.getValue("similarValues") as string[];
      return (
        <div className="max-w-xs truncate text-muted-foreground text-sm">
          {values.join(", ") || "-"}
        </div>
      );
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
        # Products
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const count = row.getValue("productCount") as number;
      const componentType = row.getValue("componentType") as string;

      return (
        <div className="text-center">
          <ProductCountPopover componentType={componentType} count={count} />
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
        # Positions
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {row.getValue("positionCount")}
      </div>
    ),
  },
  {
    id: "positions",
    accessorKey: "positions",
    header: "Positions",
    cell: ({ row }) => {
      const positions = row.getValue("positions") as string[];
      return (
        <div className="max-w-xs truncate text-muted-foreground text-sm">
          {positions.join(", ") || "-"}
        </div>
      );
    },
  },
  {
    id: "zebraMatch",
    accessorKey: "zebraMatch",
    header: "Zebra Match",
    cell: ({ row }) => {
      const match = row.getValue("zebraMatch") as "yes" | "partial" | "no";
      return <ZebraMatchBadge match={match} />;
    },
  },
];
