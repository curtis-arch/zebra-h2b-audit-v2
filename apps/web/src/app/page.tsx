"use client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Layers, Package, Tags } from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export default function Home() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());
  const kpiMetrics = useQuery(trpc.dashboard.getKPIMetrics.queryOptions());

  const isLoading = kpiMetrics.isLoading;
  const isError = kpiMetrics.isError;
  const data = kpiMetrics.data;

  // Calculate coverage percentage
  const totalSourceFiles = 300; // From GAP_ANALYSIS constant
  const coveragePercent = data?.totalProducts
    ? ((data.totalProducts / totalSourceFiles) * 100).toFixed(1)
    : "0.0";

  return (
    <div>
      <DashboardHeader
        description="Overview of Zebra configuration data"
        title="Dashboard"
      />

      {/* Error State */}
      {isError && (
        <Card className="mb-8 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-100">
              Failed to load dashboard data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 text-sm dark:text-red-300">
              {kpiMetrics.error?.message ||
                "An error occurred while fetching KPI metrics"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Products */}
        <Link
          className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
          href="/products"
        >
          <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Total Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="mb-2 h-8 w-20" />
                  <Skeleton className="mb-2 h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                </>
              ) : (
                <>
                  <div className="font-bold text-2xl">
                    {data?.totalProducts ?? 0}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {coveragePercent}% of source files
                  </p>
                  <Badge className="mt-2 bg-green-600" variant="default">
                    Success
                  </Badge>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Coverage Gap */}
        <Link
          className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
          href="/gap-analysis"
        >
          <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Coverage Gap</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="mb-2 h-8 w-20" />
                  <Skeleton className="mb-2 h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                </>
              ) : (
                <>
                  <div className="font-bold text-2xl">
                    {data?.gapCount ?? 0} files
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Missing from database
                  </p>
                  <Badge className="mt-2 bg-amber-600" variant="default">
                    Warning
                  </Badge>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Unique Attributes */}
        <Link
          className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
          href="/field-population"
        >
          <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Unique Attributes
              </CardTitle>
              <Tags className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="mb-2 h-8 w-20" />
                  <Skeleton className="mb-2 h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                </>
              ) : (
                <>
                  <div className="font-bold text-2xl">
                    {data?.uniqueAttributes ?? 0}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Distinct attribute labels
                  </p>
                  <Badge className="mt-2 bg-blue-600" variant="default">
                    Info
                  </Badge>
                </>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Grammar Cohorts */}
        <Link
          className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl"
          href="/cohorts"
        >
          <Card className="h-full cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                Grammar Cohorts
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <>
                  <Skeleton className="mb-2 h-8 w-20" />
                  <Skeleton className="mb-2 h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                </>
              ) : (
                <>
                  <div className="font-bold text-2xl">
                    {data?.totalCohorts ?? 0}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Unique SKU structures
                  </p>
                  <Badge className="mt-2 bg-purple-600" variant="default">
                    Info
                  </Badge>
                </>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm">
              API:{" "}
              {healthCheck.isLoading
                ? "Checking..."
                : healthCheck.data
                  ? "Connected"
                  : "Disconnected"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
