import type { ColumnDef, RowData } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCountPopover } from "./product-count-popover";
import { SimilarValuePopover } from "./similar-value-popover";
import { ZebraMatchBadge } from "./zebra-match-badge";

// Extend TanStack Table's TableMeta to include our custom callback and allRows
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    onComponentTypeClick?: (componentType: string) => void;
    allRows?: TData[];
  }
}

export interface SimilarMatch {
  value: string;
  matchPercentage: number; // 0-100, rounded to 1 decimal
  positions: string[];
}

export interface ComponentTypeRow {
  componentType: string;
  similarCount: number;
  similarValues: string[]; // KEEP for backward compatibility
  similarMatches: SimilarMatch[]; // NEW for enhanced exports
  productCount: number;
  positionCount: number;
  positions: string[];
  zebraMatch: "yes" | "partial" | "no";
  htbMatch: "yes" | "no";
  htbSimilarMatches: Array<{ value: string; matchPercentage: number }>;
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
              className={getBadgeColor(index)}
              key={`${value}-${index}`}
              variant="secondary"
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
              className={getBadgeColor(index)}
              key={`${position}-${index}`}
              variant="secondary"
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
  {
    id: "htbMatch",
    accessorKey: "htbMatch",
    header: "HTB Match",
    cell: ({ row }) => {
      const match = row.getValue("htbMatch") as "yes" | "no";
      return (
        <Badge
          className={
            match === "yes"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
          }
          variant="secondary"
        >
          {match}
        </Badge>
      );
    },
  },
  {
    id: "htbSimilarMatches",
    accessorKey: "htbSimilarMatches",
    header: "HTB Distance",
    cell: ({ row, table }) => {
      const matches = row.getValue("htbSimilarMatches") as Array<{
        value: string;
        matchPercentage: number;
      }>;
      const allRows = table.options.meta?.allRows as ComponentTypeRow[];

      if (!matches || matches.length === 0) {
        return <span className="text-muted-foreground">-</span>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {matches.slice(0, 3).map((match, index) => (
            <SimilarValuePopover
              key={`${match.value}-${index}`}
              pillValue={match.value}
              matchPercentage={match.matchPercentage}
              allRows={allRows}
              badgeClassName={getBadgeColor(index)}
            />
          ))}
        </div>
      );
    },
  },
];
