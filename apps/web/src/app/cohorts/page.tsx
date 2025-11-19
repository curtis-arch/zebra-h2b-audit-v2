"use client";

import { useQuery } from "@tanstack/react-query";
import { Database, TrendingUp, Users } from "lucide-react";
import { CohortsTable } from "@/components/cohorts/cohorts-table";
import { DashboardHeader } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export default function CohortsPage() {
  // Fetch cohort statistics
  const statsQuery = useQuery(trpc.cohorts.getStats.queryOptions());

  // Fetch all cohorts (high limit for now, pagination can be added later if needed)
  const cohortsQuery = useQuery(
    trpc.cohorts.getAll.queryOptions({
      page: 1,
      limit: 500,
      sortBy: "productCount",
      sortOrder: "desc",
    })
  );

  const isLoadingStats = statsQuery.isLoading;
  const isLoadingCohorts = cohortsQuery.isLoading;
  const isError = statsQuery.isError || cohortsQuery.isError;
  const stats = statsQuery.data;
  const cohorts = cohortsQuery.data?.cohorts ?? [];

  return (
    <div>
      <DashboardHeader
        description="Explore products grouped by SKU grammar structure"
        title="Grammar Cohorts"
      />

      {/* Error State */}
      {isError && (
        <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-100">
              Failed to load cohort data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 text-sm dark:text-red-300">
              {statsQuery.error?.message ||
                cohortsQuery.error?.message ||
                "An error occurred while fetching cohort data"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {/* Total Cohorts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Cohorts</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
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
                  {stats?.totalCohorts ?? 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  Unique SKU structures
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Avg Products/Cohort */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Avg Products/Cohort
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
                  {stats?.avgProductsPerCohort.toFixed(1) ?? "0.0"}
                </div>
                <p className="text-muted-foreground text-xs">
                  Products per grammar
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Largest Cohort */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Largest Cohort
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
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
                  {stats?.largestCohortProductCount ?? 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  Products in largest group
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cohorts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Cohorts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCohorts ? (
            <div className="space-y-4">
              {/* Table loading skeleton */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-9 w-32" />
              </div>
              <div className="rounded-md border">
                <div className="space-y-3 p-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton className="h-12 w-full" key={i} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <CohortsTable cohorts={cohorts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
