"use client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { DashboardHeader } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/utils/trpc";

export default function GapAnalysisPage() {
  const gapAnalysis = useQuery(trpc.dashboard.getGapAnalysis.queryOptions());

  const isLoading = gapAnalysis.isLoading;
  const isError = gapAnalysis.isError;
  const data = gapAnalysis.data;

  // Calculate coverage percentage
  const coveragePercent =
    data?.totalIngested && data.totalSourceFiles
      ? ((data.totalIngested / data.totalSourceFiles) * 100).toFixed(1)
      : "0.0";

  const suppliesFiles = data?.missingFiles.supplies ?? [];
  const filenameIssues = data?.missingFiles.filenameIssues ?? [];
  const parserFailures = data?.missingFiles.parserFailures ?? [];

  return (
    <div>
      <DashboardHeader
        description={`${data?.gap ?? 0} files from the source directory were not successfully ingested`}
        title="Data Ingestion Gap Analysis"
      />

      {/* Error State */}
      {isError && (
        <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-100">
              Failed to load gap analysis data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 text-sm dark:text-red-300">
              {gapAnalysis.error?.message ||
                "An error occurred while fetching gap analysis"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Card */}
      <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle>Coverage Gap Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="mb-2 h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="font-medium text-sm">Total Missing</p>
                <p className="font-bold text-2xl">{data?.gap ?? 0} files</p>
              </div>
              <div>
                <p className="font-medium text-sm">Coverage Rate</p>
                <p className="font-bold text-2xl">{coveragePercent}%</p>
              </div>
              <div>
                <p className="font-medium text-sm">Action Required</p>
                <p className="font-bold text-2xl text-red-600">
                  {parserFailures.length} files
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Missing Files Breakdown */}
      <div className="space-y-6">
        {/* Supplies Files */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                <CardTitle>Supplies Files (Non-Product Data)</CardTitle>
              </div>
              <Badge variant="secondary">Low Priority</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="mb-4 h-4 w-full" />
                <Skeleton className="mb-2 h-10 w-full" />
                <Skeleton className="mb-4 h-10 w-full" />
                <Skeleton className="h-6 w-32" />
              </>
            ) : (
              <>
                <p className="mb-4 text-muted-foreground text-sm">
                  These appear to be supply chain/materials files, not product
                  configurations
                </p>
                <ul className="space-y-2">
                  {suppliesFiles.map((file) => (
                    <li
                      className="rounded bg-muted p-2 font-mono text-sm"
                      key={file}
                    >
                      {file}
                    </li>
                  ))}
                </ul>
                <Badge className="mt-4" variant="outline">
                  <Info className="mr-1 h-3 w-3" />
                  May not require ingestion
                </Badge>
              </>
            )}
          </CardContent>
        </Card>

        {/* Filename Issues */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <CardTitle>Filename Issues</CardTitle>
              </div>
              <Badge
                className="bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100"
                variant="secondary"
              >
                Quick Fix
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="mb-4 h-4 w-full" />
                <Skeleton className="mb-2 h-10 w-full" />
                <Skeleton className="mb-4 h-10 w-full" />
                <Skeleton className="h-6 w-32" />
              </>
            ) : (
              <>
                <p className="mb-4 text-muted-foreground text-sm">
                  Files contain typo in filename ('congifuration' instead of
                  'configuration')
                </p>
                <ul className="space-y-2">
                  {filenameIssues.map((file) => (
                    <li
                      className="rounded bg-muted p-2 font-mono text-sm"
                      key={file}
                    >
                      {file}
                    </li>
                  ))}
                </ul>
                <Badge
                  className="mt-4 border-amber-600 text-amber-600"
                  variant="outline"
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Rename and re-ingest
                </Badge>
              </>
            )}
          </CardContent>
        </Card>

        {/* Parser Failures */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <CardTitle>Parser Failures</CardTitle>
              </div>
              <Badge variant="destructive">Action Required</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="mb-4 h-4 w-full" />
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton className="mb-2 h-10 w-full" key={i} />
                ))}
                <Skeleton className="mt-4 h-6 w-32" />
              </>
            ) : (
              <>
                <p className="mb-4 text-muted-foreground text-sm">
                  Legitimate product files that failed to parse
                </p>
                <ul className="space-y-2">
                  {parserFailures.map((file) => (
                    <li
                      className="rounded bg-muted p-2 font-mono text-sm"
                      key={file}
                    >
                      {file}
                    </li>
                  ))}
                </ul>
                <Badge
                  className="mt-4 border-red-600 text-red-600"
                  variant="outline"
                >
                  <XCircle className="mr-1 h-3 w-3" />
                  Investigate parser logic
                </Badge>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton className="h-6 w-full" key={i} />
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-red-600">🔴</span>
                <span>
                  Investigate parser failures for {parserFailures.length}{" "}
                  product files
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">⚠️</span>
                <span>
                  Rename and re-ingest {filenameIssues.length} files with typos
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">ℹ️</span>
                <span>Determine if supplies files need ingestion</span>
              </li>
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
