"use client";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ComponentBreakdownTable } from "@/components/field-population/component-breakdown-table";
import { FieldPopulationTable } from "@/components/field-population/field-population-table";
import { DashboardHeader } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";

export default function FieldPopulationPage() {
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "has" | "missing">("all");
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null
  );
  const detailsSectionRef = useRef<HTMLDivElement>(null);
  const fieldPopulation = useQuery(
    trpc.dashboard.getFieldPopulationStats.queryOptions()
  );

  const isLoading = fieldPopulation.isLoading;
  const isError = fieldPopulation.isError;
  const fieldData = fieldPopulation.data ?? [];

  // Query for drill-down data (only when a field is selected)
  const productDetails = useQuery({
    ...trpc.dashboard.getProductsMissingField.queryOptions({
      field: selectedField as any,
    }),
    enabled: selectedField !== null,
  });

  // Query for component breakdown (only when a field is selected)
  const componentBreakdown = useQuery({
    ...trpc.dashboard.getComponentBreakdownForField.queryOptions({
      field: selectedField as any,
    }),
    enabled: selectedField !== null,
  });

  // Query for products with selected component (only when both field and component are selected)
  const componentProducts = useQuery({
    ...trpc.dashboard.getProductsByComponentValue.queryOptions({
      field: selectedField as any,
      componentValue: selectedComponent as string,
    }),
    enabled: selectedField !== null && selectedComponent !== null,
  });

  // Scroll to details section when a field is selected
  useEffect(() => {
    if (selectedField && detailsSectionRef.current) {
      detailsSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedField]);

  const handleFieldClick = (fieldName: string) => {
    setSelectedField(fieldName);
    setActiveTab("has"); // Default to "has" tab to show products with the attribute
    setSelectedComponent(null); // Reset component filter
  };

  const handleClearSelection = () => {
    setSelectedField(null);
    setActiveTab("all");
    setSelectedComponent(null);
  };

  const handleComponentClick = (rawValue: string) => {
    if (selectedComponent === rawValue) {
      setSelectedComponent(null); // Toggle off if clicking the same component
    } else {
      setSelectedComponent(rawValue);
      setActiveTab("has"); // Switch to "has" tab to show filtered products
    }
  };

  const handleClearComponentFilter = () => {
    setSelectedComponent(null);
  };

  // Combine product data from both arrays with hasField flag
  const combinedProducts = useMemo(() => {
    if (!productDetails.data) return [];

    const withField = productDetails.data.productsWithField.map((p) => ({
      ...p,
      hasField: true,
      positionIndex: p.positionIndex ?? null,
    }));

    const missingField = productDetails.data.productsMissingField.map((p) => ({
      ...p,
      hasField: false,
      positionIndex: null,
    }));

    const allProducts = [...withField, ...missingField];

    // Filter by selected component if one is chosen
    if (selectedComponent && componentProducts.data) {
      const componentProductIds = new Set(
        componentProducts.data.map((p) => p.id)
      );
      return allProducts.filter((p) => componentProductIds.has(p.id));
    }

    return allProducts;
  }, [productDetails.data, selectedComponent, componentProducts.data]);

  return (
    <div>
      <DashboardHeader
        description="Attribute coverage and data quality metrics"
        title="Field Population Analysis"
      />

      {/* Error State */}
      {isError && (
        <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-100">
              Failed to load field population data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 text-sm dark:text-red-300">
              {fieldPopulation.error?.message ||
                "An error occurred while fetching field population statistics"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Field Coverage Grid */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? // Loading skeletons
            Array.from({ length: 10 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex items-baseline justify-between">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <Skeleton className="mb-1 h-4 w-32" />
                  <Skeleton className="mb-2 h-3 w-24" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))
          : // Real data
            fieldData.map((field) => {
              const coverageColor =
                field.coverage >= 50
                  ? "bg-green-600"
                  : field.coverage >= 20
                    ? "bg-amber-600"
                    : "bg-red-600";

              const totalProducts = field.filesWithData + field.filesMissing;

              return (
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedField === field.field ? "ring-2 ring-primary" : ""
                  }`}
                  key={field.field}
                  onClick={() => handleFieldClick(field.field)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-medium text-sm">
                      {field.field}
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="font-bold text-2xl">
                      {field.coverage}%
                    </div>
                    <p className="mt-2 text-muted-foreground text-sm">
                      {field.filesWithData} of {totalProducts} products have this
                      attribute
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {field.uniqueValues} unique values
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {field.uniquePositions}{" "}
                      {field.uniquePositions === 1 ? "position" : "positions"}
                    </p>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${coverageColor}`}
                        style={{ width: `${field.coverage}%` }}
                      />
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${
                          field.uniquePositions === 1
                            ? "bg-green-600"
                            : field.uniquePositions === 2
                              ? "bg-amber-600"
                              : "bg-red-600"
                        }`}
                        style={{ width: "100%" }}
                      />
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs">
                      Position distribution
                    </p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Attribute Mapping Details - Drill-down Section */}
      <div ref={detailsSectionRef}>
        {selectedField ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedField} - Product Details</CardTitle>
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
                {productDetails.isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : productDetails.isError ? (
                  <div className="py-8 text-center text-red-600">
                    <p>Failed to load product details</p>
                    <p className="mt-2 text-muted-foreground text-sm">
                      {productDetails.error?.message}
                    </p>
                  </div>
                ) : (
                  <Tabs
                    className="w-full"
                    onValueChange={(v) =>
                      setActiveTab(v as "all" | "has" | "missing")
                    }
                    value={activeTab}
                  >
                    <div className="space-y-4">
                      {selectedComponent && (
                        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className="text-sm" variant="default">
                                Filtered by: {selectedComponent}
                              </Badge>
                              <span className="text-muted-foreground text-sm">
                                Showing {combinedProducts.length} products with
                                this component
                              </span>
                            </div>
                            <Button
                              className="gap-2"
                              onClick={handleClearComponentFilter}
                              size="sm"
                              variant="ghost"
                            >
                              <X className="h-4 w-4" />
                              Clear Filter
                            </Button>
                          </div>
                        </div>
                      )}

                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all">
                          All Products ({combinedProducts.length})
                        </TabsTrigger>
                        <TabsTrigger value="has">
                          Has {selectedField} (
                          {productDetails.data?.productsWithField.length ?? 0})
                        </TabsTrigger>
                        <TabsTrigger value="missing">
                          Missing {selectedField} (
                          {productDetails.data?.productsMissingField.length ??
                            0}
                          )
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent className="mt-4" value="all">
                      <FieldPopulationTable
                        fieldName={selectedField}
                        filterTab="all"
                        products={combinedProducts}
                      />
                    </TabsContent>

                    <TabsContent className="mt-4" value="has">
                      <FieldPopulationTable
                        fieldName={selectedField}
                        filterTab="has"
                        products={combinedProducts}
                      />
                    </TabsContent>

                    <TabsContent className="mt-4" value="missing">
                      <FieldPopulationTable
                        fieldName={selectedField}
                        filterTab="missing"
                        products={combinedProducts}
                      />
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
            {selectedField &&
              componentBreakdown.data &&
              componentBreakdown.data.components.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>
                      Component Variants for {selectedField}
                    </CardTitle>
                    <p className="mt-2 text-muted-foreground text-sm">
                      Breakdown of component values extracted from product
                      configurations
                    </p>
                  </CardHeader>
                  <CardContent>
                    {componentBreakdown.isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-64 w-full" />
                      </div>
                    ) : componentBreakdown.isError ? (
                      <div className="py-8 text-center text-red-600">
                        <p>Failed to load component breakdown</p>
                        <p className="mt-2 text-muted-foreground text-sm">
                          {componentBreakdown.error?.message}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid gap-4 md:grid-cols-3">
                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="font-medium text-muted-foreground text-sm">
                                Total Unique Variants
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="font-bold text-2xl">
                                {componentBreakdown.data.components.length}
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="font-medium text-muted-foreground text-sm">
                                Most Common Variant
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div
                                className="truncate font-bold text-lg"
                                title={
                                  componentBreakdown.data.components[0]
                                    ?.rawValue
                                }
                              >
                                {componentBreakdown.data.components[0]
                                  ?.rawValue || "N/A"}
                              </div>
                              <p className="mt-1 text-muted-foreground text-xs">
                                {componentBreakdown.data.components[0]
                                  ?.frequency || 0}{" "}
                                occurrences
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-2">
                              <CardTitle className="font-medium text-muted-foreground text-sm">
                                Products Coverage
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="font-bold text-2xl">
                                {componentBreakdown.data.coverage.coveragePercent.toFixed(
                                  0
                                )}
                                %
                              </div>
                              <p className="mt-1 text-muted-foreground text-xs">
                                {
                                  componentBreakdown.data.coverage
                                    .productsWithComponents
                                }{" "}
                                of{" "}
                                {
                                  componentBreakdown.data.coverage
                                    .totalProductsWithField
                                }{" "}
                                products
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Component Variants Table */}
                        <ComponentBreakdownTable
                          components={componentBreakdown.data.components}
                          fieldName={selectedField}
                          onComponentClick={handleComponentClick}
                          selectedComponent={selectedComponent}
                          totalProducts={
                            componentBreakdown.data.totalProductsGlobal
                          }
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Attribute Mapping Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p className="font-medium text-lg">
                  Select a field to view details
                </p>
                <p className="mt-2 text-sm">
                  Click any field card above to see which products have or are
                  missing that attribute
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
