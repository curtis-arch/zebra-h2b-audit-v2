"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronsUpDown,
  Package,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ComponentsTable } from "@/components/components/components-table";
import { DashboardHeader } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export default function ComponentsPage() {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<{
    type: string;
    value: string;
  } | null>(null);
  const detailsSectionRef = useRef<HTMLDivElement>(null);

  // Fetch component type statistics
  const componentTypesQuery = useQuery(
    trpc.components.getComponentTypes.queryOptions()
  );

  // Fetch components for the active type
  const componentsQuery = useQuery({
    ...trpc.components.getComponentsByType.queryOptions({
      componentType: activeType ?? "",
      limit: 1000,
      offset: 0,
    }),
    enabled: activeType !== null,
  });

  // Fetch component type stats for KPI cards
  const componentTypeStatsQuery = useQuery({
    ...trpc.components.getComponentTypeStats.queryOptions({
      componentType: activeType ?? "",
    }),
    enabled: activeType !== null,
  });

  // Fetch products for selected component
  const productsQuery = useQuery({
    ...trpc.components.getProductsForComponent.queryOptions({
      componentType: selectedComponent?.type ?? "",
      rawValue: selectedComponent?.value ?? "",
    }),
    enabled: selectedComponent !== null,
  });

  // Extract data from queries
  const isLoadingTypes = componentTypesQuery.isLoading;
  const isLoadingComponents = componentsQuery.isLoading;
  const isLoadingStats = componentTypeStatsQuery.isLoading;
  const isError =
    componentTypesQuery.isError ||
    componentsQuery.isError ||
    componentTypeStatsQuery.isError;

  const componentTypes = componentTypesQuery.data ?? [];
  const components = componentsQuery.data?.components ?? [];
  const stats = componentTypeStatsQuery.data;

  // Auto-select first component type when data loads
  useEffect(() => {
    if (componentTypes.length > 0 && !activeType) {
      setActiveType(componentTypes[0].componentType);
    }
  }, [componentTypes, activeType]);

  // Scroll to details section when a component is selected
  useEffect(() => {
    if (selectedComponent && detailsSectionRef.current) {
      detailsSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedComponent]);

  const handleViewProducts = (rawValue: string) => {
    setSelectedComponent({ type: activeType!, value: rawValue });
  };

  const handleClearSelection = () => {
    setSelectedComponent(null);
  };

  return (
    <div>
      <DashboardHeader
        description="Browse and analyze component variants across product configurations"
        title="Component Explorer"
      />

      {/* Error State */}
      {isError && (
        <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-100">
              Failed to load component data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 text-sm dark:text-red-300">
              {componentTypesQuery.error?.message ||
                componentsQuery.error?.message ||
                componentTypeStatsQuery.error?.message ||
                "An error occurred while fetching component data"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards for Active Tab */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {/* Total Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Instances
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <>
                <Skeleton className="mb-2 h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </>
            ) : (
              <>
                <div className="font-bold text-2xl">
                  {stats?.totalCount ?? 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  Component occurrences
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Unique Values */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Unique Values</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <>
                <Skeleton className="mb-2 h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </>
            ) : (
              <>
                <div className="font-bold text-2xl">
                  {stats?.uniqueValues ?? 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  Distinct component values
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Unique Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Unique Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <>
                <Skeleton className="mb-2 h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </>
            ) : (
              <>
                <div className="font-bold text-2xl">
                  {stats?.uniqueProducts ?? 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  Products using this component type
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Component Types Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Component Types</CardTitle>
          <CardDescription>
            Browse component variants by type ({componentTypes.length} types available)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Type Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Component Type</label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {activeType ? (
                      <div className="flex items-center justify-between flex-1">
                        <span>{activeType}</span>
                        {stats && (
                          <Badge variant="secondary" className="ml-2">
                            {stats.uniqueValues} variants
                          </Badge>
                        )}
                      </div>
                    ) : (
                      "Select component type..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search component types..." />
                    <CommandEmpty>No component type found.</CommandEmpty>
                    <CommandGroup className="max-h-72 overflow-auto">
                      {isLoadingTypes ? (
                        <div className="p-4 space-y-2">
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : (
                        componentTypes.map((type) => (
                          <CommandItem
                            key={type.componentType}
                            value={type.componentType}
                            onSelect={(value) => {
                              setActiveType(value);
                              setSelectedComponent(null);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                activeType === type.componentType ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex items-center justify-between flex-1">
                              <span className="font-medium">{type.componentType}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {type.totalCount} total
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {type.uniqueValues} variants
                                </Badge>
                              </div>
                            </div>
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Components Table */}
            {activeType ? (
              isLoadingComponents ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <ComponentsTable
                  components={components}
                  componentType={activeType}
                  onViewProducts={handleViewProducts}
                />
              )
            ) : (
              <div className="rounded-lg border border-dashed py-12 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground font-medium">
                  Select a component type to view variants
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Choose from {componentTypes.length} available types
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Details Section */}
      <div className="mt-6" ref={detailsSectionRef}>
        {selectedComponent ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Products Using: {selectedComponent.value}
                  </CardTitle>
                  <CardDescription>
                    Component Type: {selectedComponent.type}
                  </CardDescription>
                </div>
                <Button
                  className="gap-2"
                  onClick={handleClearSelection}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                  Clear Selection
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {productsQuery.isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : productsQuery.isError ? (
                <div className="py-8 text-center text-red-600">
                  <p>Failed to load product details</p>
                  <p className="mt-2 text-muted-foreground text-sm">
                    {productsQuery.error?.message}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <p className="text-muted-foreground text-sm">
                      Found {productsQuery.data?.totalProducts ?? 0} products
                      using this component
                    </p>
                  </div>
                  <ScrollArea className="h-[400px] rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Base Model</TableHead>
                          <TableHead>Product Code</TableHead>
                          <TableHead>Spec Style</TableHead>
                          <TableHead>Options Using Component</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productsQuery.data?.products.map((product) => (
                          <TableRow key={product.fileId}>
                            <TableCell className="font-medium">
                              <Badge className="font-mono" variant="outline">
                                {product.baseModel}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {product.productCode ?? "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {product.specStyle}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {product.options.map((opt, idx) => (
                                  <Badge
                                    className="text-xs"
                                    key={idx}
                                    title={`${opt.attributeLabel} (Pos ${opt.positionIndex}): ${opt.description}`}
                                    variant="default"
                                  >
                                    {opt.code}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                <Package className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p className="font-medium text-lg">
                  Select a component to view products
                </p>
                <p className="mt-2 text-sm">
                  Click &ldquo;View Products&rdquo; on any component in the
                  table above
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
