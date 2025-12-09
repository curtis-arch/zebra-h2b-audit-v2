"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ComponentTypeRow } from "./columns";

interface SimilarValuePopoverProps {
  pillValue: string; // The similar value text (e.g., "Additional Features")
  matchPercentage: number; // The percentage shown on the pill
  allRows: ComponentTypeRow[]; // All rows from table to lookup HTB data
  badgeClassName: string; // Badge styling to preserve
}

export function SimilarValuePopover({
  pillValue,
  matchPercentage,
  allRows,
  badgeClassName,
}: SimilarValuePopoverProps) {
  const [open, setOpen] = useState(false);

  // Create O(1) lookup map for row data
  const rowMap = useMemo(() => {
    const map = new Map<string, ComponentTypeRow>();
    for (const row of allRows) {
      map.set(row.componentType, row);
    }
    return map;
  }, [allRows]);

  // Find the row matching this similar value
  const targetRow = rowMap.get(pillValue);
  const htbMatches = targetRow?.htbSimilarMatches ?? [];

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          className="transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          type="button"
        >
          <Badge className={badgeClassName} variant="secondary">
            {pillValue} {matchPercentage}%
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <div>
            <h4 className="font-medium text-sm">
              HTB Matches for "{pillValue}"
            </h4>
            <p className="text-muted-foreground text-xs">
              {htbMatches.length > 0
                ? `${htbMatches.length} similar ${htbMatches.length === 1 ? "match" : "matches"} found`
                : "No HTB matches"}
            </p>
          </div>
          <ScrollArea className="h-[200px] w-full rounded-md border">
            {htbMatches.length > 0 ? (
              <div className="space-y-1 p-2">
                {htbMatches.map((match, index) => (
                  <div
                    className="rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                    key={`${match.value}-${index}`}
                  >
                    <span className="font-medium">{match.value}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      - {match.matchPercentage}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No HTB matches found
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
