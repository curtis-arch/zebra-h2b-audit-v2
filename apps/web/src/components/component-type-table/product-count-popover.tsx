"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";

interface ProductCountPopoverProps {
  componentType: string;
  count: number;
}

export function ProductCountPopover({
  componentType,
  count,
}: ProductCountPopoverProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    ...trpc.components.getProductsByComponentType.queryOptions({
      componentType,
      limit: 50,
    }),
    enabled: open, // Only fetch when popover opens
  });

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          className="h-auto p-1 font-medium hover:bg-accent hover:text-accent-foreground"
          variant="ghost"
        >
          {count}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <div>
            <h4 className="font-medium text-sm">
              Products using "{componentType}"
            </h4>
            <p className="text-muted-foreground text-xs">
              {data?.totalCount ?? count} total products
            </p>
          </div>
          <ScrollArea className="h-[200px] w-full rounded-md border">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : data?.products && data.products.length > 0 ? (
              <div className="space-y-1 p-2">
                {data.products.map((product) => (
                  <Link
                    className="block rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    href={`/products/${product.fileId}`}
                    key={product.fileId}
                  >
                    <span className="font-medium">{product.baseModel}</span>
                    {product.productCode && (
                      <span className="text-muted-foreground">
                        {" "}
                        - {product.productCode}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No products found
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
