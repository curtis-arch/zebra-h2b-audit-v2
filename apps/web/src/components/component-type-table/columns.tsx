import type { ColumnDef, RowData } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

// Badge color rotation helper
const badgeColors = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
];

function getBadgeColor(index: number): string {
  return badgeColors[index % badgeColors.length];
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
      if (!values || values.length === 0) {
        return <div className="text-muted-foreground text-sm">-</div>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {values.map((value, index) => (
            <Badge
              key={`${value}-${index}`}
              variant="secondary"
              className={getBadgeColor(index)}
            >
              {value}
            </Badge>
          ))}
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
      if (!positions || positions.length === 0) {
        return <div className="text-muted-foreground text-sm">-</div>;
      }
      
      // If only 1 position, show as plain text
      if (positions.length === 1) {
        return <div className="text-sm">{positions[0]}</div>;
      }
      
      // If more than 1, show as colored badges
      return (
        <div className="flex flex-wrap gap-1">
          {positions.map((position, index) => (
            <Badge
              key={`${position}-${index}`}
              variant="secondary"
              className={getBadgeColor(index)}
            >
              {position}
            </Badge>
          ))}
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
