import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZebraMatchBadge } from "./zebra-match-badge";

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
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("componentType")}</div>
    ),
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
    cell: ({ row }) => (
      <div className="text-center font-medium">
        {row.getValue("productCount")}
      </div>
    ),
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
