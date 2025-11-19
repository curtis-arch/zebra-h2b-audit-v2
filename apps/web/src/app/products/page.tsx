"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/layout";
import { ProductsTable } from "@/components/products/products-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export default function ProductsPage() {
  // Fetch all products (289 total - client handles all)
  const { data, isLoading, error } = useQuery(
    trpc.products.getAll.queryOptions({
      page: 1,
      limit: 500, // Fetch all products at once
    })
  );

  return (
    <div>
      <DashboardHeader
        description="Browse and search all configuration products"
        title="Products"
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading
              ? "Loading Products..."
              : error
                ? "Error Loading Products"
                : `All Products (${data?.pagination.total || 0})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-10 max-w-sm flex-1" />
                <Skeleton className="h-10 w-[180px]" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton className="h-12 w-full" key={i} />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="font-medium text-destructive text-lg">
                Failed to load products
              </p>
              <p className="mt-2 text-muted-foreground text-sm">
                {error instanceof Error
                  ? error.message
                  : "Unknown error occurred"}
              </p>
            </div>
          ) : data?.products ? (
            <ProductsTable products={data.products} />
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
