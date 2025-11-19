"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Hash,
  Package,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { DashboardHeader } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/utils/trpc";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CohortDetailPage({ params }: PageProps) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const cohortId = Number(unwrappedParams.id);

  // Fetch cohort details
  const {
    data: cohort,
    isLoading,
    error,
  } = useQuery({
    ...trpc.cohorts.getById.queryOptions({ id: cohortId }),
    enabled: !isNaN(cohortId),
  });

  // Loading state
  if (isLoading) {
    return (
      <div>
        <DashboardHeader
          description="Fetching cohort details"
          title="Loading..."
        />
        <div className="space-y-6">
          {/* Header Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="mb-2 h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
          </Card>

          {/* Metadata Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="flex justify-between" key={i}>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Files Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !cohort) {
    return (
      <div>
        <DashboardHeader description="Failed to load cohort" title="Error" />
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-100">
              Cohort Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-red-700 text-sm dark:text-red-300">
              {error?.message || "The requested cohort could not be found."}
            </p>
            <Button onClick={() => router.push("/cohorts")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cohorts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format date
  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // signatureJson is already a JavaScript object (JSONB type from Drizzle)
  const signatureData = cohort.signatureJson || null;

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="mb-4 flex items-center gap-2 text-muted-foreground text-sm">
        <Link className="transition-colors hover:text-foreground" href="/">
          Home
        </Link>
        <span>/</span>
        <Link
          className="transition-colors hover:text-foreground"
          href="/cohorts"
        >
          Cohorts
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">#{cohort.id}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <DashboardHeader
          description={`Grammar cohort with ${cohort.productCount} product${cohort.productCount !== 1 ? "s" : ""}`}
          title={`Cohort #${cohort.id}`}
        />
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => router.push("/cohorts")}
            size="sm"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cohorts
          </Button>
        </div>
      </div>

      {/* Cohort Header Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="mb-2 flex items-center gap-3 text-2xl">
                <Users className="h-6 w-6 text-primary" />
                Cohort #{cohort.id}
              </CardTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="default">
                  <Package className="mr-1 h-3 w-3" />
                  {cohort.productCount} Product
                  {cohort.productCount !== 1 ? "s" : ""}
                </Badge>
                <Badge variant="secondary">
                  {cohort.positionCount} Position
                  {cohort.positionCount !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Metadata Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <Hash className="mt-1 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium text-muted-foreground text-sm">
                  Signature Hash
                </div>
                <div
                  className="break-all font-mono text-sm"
                  title={cohort.signatureHash}
                >
                  {cohort.signatureHash}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium text-muted-foreground text-sm">
                  Created At
                </div>
                <div className="text-sm">{formatDate(cohort.createdAt)}</div>
              </div>
            </div>

            {cohort.description && (
              <div className="flex items-start gap-3 md:col-span-2">
                <FileText className="mt-1 h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium text-muted-foreground text-sm">
                    Description
                  </div>
                  <div className="text-sm">{cohort.description}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grammar Signature Card */}
      {signatureData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Grammar Signature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto rounded-md bg-muted p-4 font-mono text-xs">
              <pre>{JSON.stringify(signatureData, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Products ({cohort.files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Base Model</TableHead>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Spec Style</TableHead>
                  <TableHead>Source Path</TableHead>
                  <TableHead>Imported At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohort.files.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="h-24 text-center text-muted-foreground"
                      colSpan={6}
                    >
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  cohort.files.map((file) => (
                    <TableRow
                      className="cursor-pointer transition-colors hover:bg-muted/80"
                      key={file.id}
                      onClick={() => router.push(`/products/${file.id}`)}
                    >
                      <TableCell className="font-mono text-sm">
                        #{file.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {file.baseModel}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {file.productCode || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{file.specStyle}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate font-mono text-xs text-muted-foreground">
                        {file.sourcePath.split("/").pop()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(file.importedAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
