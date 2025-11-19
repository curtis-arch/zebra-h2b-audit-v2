"use client";

import { useQuery } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@zebra-h2b-audit-v2/api/routers/index";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Fingerprint,
  Hash,
  Package,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useState } from "react";
import { DashboardHeader } from "@/components/layout";
import { SourceDataModal } from "@/components/products/source-data-modal";
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

export default function ProductDetailPage({ params }: PageProps) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const productId = Number(unwrappedParams.id);

  // Source data modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedPositions, setExpandedPositions] = useState<Set<number>>(
    new Set()
  );

  // Store fetched options in state (keyed by position ID)
  const [optionsData, setOptionsData] = useState<Record<number, any[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Set<number>>(new Set());

  // tRPC client for manual fetching
  const trpcClient = React.useMemo(
    () =>
      createTRPCClient<AppRouter>({
        links: [
          httpBatchLink({
            url: "/api/trpc",
            fetch(url, options) {
              return fetch(url, {
                ...options,
                credentials: "include",
              });
            },
          }),
        ],
      }),
    []
  );

  // Fetch product details
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    ...trpc.products.getById.queryOptions({ id: productId }),
    enabled: !isNaN(productId),
  });

  // Fetch file blob for source data modal
  const { data: fileBlobData, isLoading: isLoadingBlob } = useQuery({
    ...trpc.products.getFileBlob.queryOptions({ fileId: productId }),
    enabled: modalOpen && !isNaN(productId),
  });

  // Toggle position expansion and fetch options when needed
  const togglePosition = async (positionId: number) => {
    if (expandedPositions.has(positionId)) {
      // Collapse
      setExpandedPositions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(positionId);
        return newSet;
      });
    } else {
      // Expand
      setExpandedPositions((prev) => new Set(prev).add(positionId));

      // Fetch options if not already loaded
      if (!optionsData[positionId]) {
        setLoadingOptions((prev) => new Set(prev).add(positionId));
        try {
          const data = await trpcClient.products.getOptionsForPosition.query({
            positionId,
          });
          setOptionsData((prev) => ({ ...prev, [positionId]: data }));
        } catch (err) {
          console.error(
            `Failed to fetch options for position ${positionId}:`,
            err
          );
          setOptionsData((prev) => ({ ...prev, [positionId]: [] }));
        } finally {
          setLoadingOptions((prev) => {
            const newSet = new Set(prev);
            newSet.delete(positionId);
            return newSet;
          });
        }
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <DashboardHeader
          description="Fetching product details"
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
              {Array.from({ length: 5 }).map((_, i) => (
                <div className="flex justify-between" key={i}>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Positions Skeleton */}
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
  if (error || !product) {
    return (
      <div>
        <DashboardHeader description="Failed to load product" title="Error" />
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-100">
              Product Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-red-700 text-sm dark:text-red-300">
              {error?.message || "The requested product could not be found."}
            </p>
            <Button onClick={() => router.push("/products")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
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
  // No need to parse - just use it directly
  const signatureData = product.signatureJson || null;

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
          href="/products"
        >
          Products
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">
          {product.baseModel || "Unknown"}
        </span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <DashboardHeader
          description={`Product configuration from ${product.sourcePath.split("/").pop()}`}
          title={product.baseModel || "Unknown Model"}
        />
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => router.push("/products")}
            size="sm"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            variant="outline"
          >
            <FileText className="mr-2 h-4 w-4" />
            View Source Data
          </Button>
        </div>
      </div>

      {/* Product Header Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="mb-2 flex items-center gap-3 text-2xl">
                <Package className="h-6 w-6 text-primary" />
                {product.baseModel || "Unknown Model"}
              </CardTitle>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.productCode && (
                  <Badge className="font-mono" variant="outline">
                    Code: {product.productCode}
                  </Badge>
                )}
                <Badge variant="secondary">{product.specStyle}</Badge>
                {product.cohortId && (
                  <Badge variant="outline">Cohort #{product.cohortId}</Badge>
                )}
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
              <FileText className="mt-1 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium text-muted-foreground text-sm">
                  Source Path
                </div>
                <div className="break-all font-mono text-sm">
                  {product.sourcePath}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Fingerprint className="mt-1 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium text-muted-foreground text-sm">
                  Source Hash
                </div>
                <div
                  className="truncate font-mono text-sm"
                  title={product.sourceHash || "N/A"}
                >
                  {product.sourceHash
                    ? `${product.sourceHash.substring(0, 16)}...`
                    : "N/A"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium text-muted-foreground text-sm">
                  Import Date
                </div>
                <div className="text-sm">{formatDate(product.importedAt)}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Hash className="mt-1 h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium text-muted-foreground text-sm">
                  Grammar Signature
                </div>
                <div
                  className="truncate font-mono text-sm"
                  title={product.signatureHash || "N/A"}
                >
                  {product.signatureHash
                    ? `${product.signatureHash.substring(0, 16)}...`
                    : "N/A"}
                </div>
              </div>
            </div>
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

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Positions ({product.positions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead>Index</TableHead>
                  <TableHead>Attribute Label</TableHead>
                  <TableHead className="text-center">Options</TableHead>
                  <TableHead>Section</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.positions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      className="h-24 text-center text-muted-foreground"
                      colSpan={5}
                    >
                      No positions found
                    </TableCell>
                  </TableRow>
                ) : (
                  product.positions.map((position) => {
                    const isExpanded = expandedPositions.has(position.id);
                    const isLoadingPositionOptions = loadingOptions.has(
                      position.id
                    );
                    const positionOptions = optionsData[position.id] || [];

                    return (
                      <React.Fragment key={position.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => togglePosition(position.id)}
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium font-mono">
                            {position.positionIndex}
                          </TableCell>
                          <TableCell>{position.attributeLabel}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {position.optionCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {position.sectionOrder || "-"}
                          </TableCell>
                        </TableRow>

                        {/* Expanded Options */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell className="bg-muted/30 p-0" colSpan={5}>
                              <div className="p-4">
                                {isLoadingPositionOptions ? (
                                  <div className="space-y-2">
                                    <Skeleton className="h-8 w-full" />
                                    <Skeleton className="h-8 w-full" />
                                    <Skeleton className="h-8 w-full" />
                                  </div>
                                ) : positionOptions.length > 0 ? (
                                  <div className="space-y-2">
                                    <div className="mb-3 font-medium text-sm">
                                      Options ({positionOptions.length})
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                                      {positionOptions.map((option) => (
                                        <div
                                          className="rounded-md border bg-background p-3"
                                          key={option.id}
                                        >
                                          <div className="mb-1 font-mono font-semibold text-sm">
                                            {option.code}
                                          </div>
                                          <div className="text-muted-foreground text-xs">
                                            {option.description}
                                          </div>
                                          {(option.rawCode !== option.code ||
                                            option.rawDescription !==
                                              option.description) && (
                                            <div className="mt-2 border-t pt-2 text-muted-foreground text-xs">
                                              <div>Raw: {option.rawCode}</div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="py-4 text-center text-muted-foreground text-sm">
                                    No options available
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Source Data Modal */}
      <SourceDataModal
        fileContent={isLoadingBlob ? null : (fileBlobData?.textContent ?? null)}
        fileName={
          isLoadingBlob ? "Loading..." : (fileBlobData?.fileName ?? "Unknown")
        }
        mimeType={
          isLoadingBlob
            ? "text/plain"
            : (fileBlobData?.mimeType ?? "text/plain")
        }
        onOpenChange={setModalOpen}
        open={modalOpen}
      />
    </div>
  );
}
