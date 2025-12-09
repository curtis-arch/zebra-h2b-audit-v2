"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ComponentTypeRow } from "./columns";

interface HTBDistancePopoverProps {
  htbValue: string; // The HTB value text (e.g., "XYZ123")
  matchPercentage: number; // The percentage shown on the pill
  allRows: ComponentTypeRow[]; // All rows from table to reverse lookup Component Types
  badgeClassName: string; // Badge styling to preserve
}

export function HTBDistancePopover({
  htbValue,
  matchPercentage,
  allRows,
  badgeClassName,
}: HTBDistancePopoverProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Reverse lookup: Find all Component Types that have this HTB value in their htbSimilarMatches
  const componentTypesWithThisHTB = useMemo(() => {
    const matches: Array<{ componentType: string; matchPercentage: number }> =
      [];

    for (const row of allRows) {
      // Check if this row's htbSimilarMatches contains our htbValue
      const htbMatch = row.htbSimilarMatches?.find(
        (match) => match.value === htbValue
      );

      if (htbMatch) {
        matches.push({
          componentType: row.componentType,
          matchPercentage: htbMatch.matchPercentage,
        });
      }
    }

    return matches;
  }, [allRows, htbValue]);

  // Filter matches based on search query
  const filteredMatches = useMemo(() => {
    if (!searchQuery.trim()) return componentTypesWithThisHTB;
    const query = searchQuery.toLowerCase();
    return componentTypesWithThisHTB.filter((match) =>
      match.componentType.toLowerCase().includes(query)
    );
  }, [componentTypesWithThisHTB, searchQuery]);

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          className="transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          type="button"
        >
          <Badge className={badgeClassName} variant="secondary">
            {htbValue} {matchPercentage}%
          </Badge>
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-80"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="space-y-2">
          <div>
            <h4 className="font-medium text-sm">
              Component Types matching "{htbValue}"
            </h4>
            <p className="text-muted-foreground text-xs">
              {componentTypesWithThisHTB.length > 0
                ? `${componentTypesWithThisHTB.length} component ${componentTypesWithThisHTB.length === 1 ? "type" : "types"} found`
                : "No component types match"}
            </p>
          </div>
          {componentTypesWithThisHTB.length > 0 && (
            <Input
              type="text"
              placeholder="Search component types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
          )}
          <ScrollArea className="h-[200px] w-full rounded-md border">
            {filteredMatches.length > 0 ? (
              <div className="space-y-1 p-2">
                {filteredMatches.map((match, index) => (
                  <div
                    className="rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                    key={`${match.componentType}-${index}`}
                  >
                    <span className="font-medium">{match.componentType}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      - {match.matchPercentage}%
                    </span>
                  </div>
                ))}
              </div>
            ) : componentTypesWithThisHTB.length > 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No matches found for "{searchQuery}"
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No component types found
              </div>
            )}
          </ScrollArea>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
