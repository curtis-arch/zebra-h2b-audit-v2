import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ZebraMatchBadgeProps {
  match: "yes" | "partial" | "no";
  className?: string;
}

export function ZebraMatchBadge({ match, className }: ZebraMatchBadgeProps) {
  const variants = {
    yes: "bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400",
    partial:
      "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
    no: "bg-gray-500/10 text-gray-700 border-gray-500/20 dark:text-gray-400",
  };

  const labels = {
    yes: "Yes",
    partial: "Partial",
    no: "No",
  };

  const badge = (
    <Badge className={cn(variants[match], className)} variant="outline">
      {labels[match]}
    </Badge>
  );

  // Only show tooltip for partial matches
  if (match === "partial") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p>Partial match - case insensitive</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
