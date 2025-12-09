import type { ComponentTypeRow } from "./columns";

export function exportToCsv(data: ComponentTypeRow[], threshold?: number) {
  // Build metadata header
  const metadata = [
    threshold !== undefined ? `# Similarity Threshold: ${threshold}` : null,
    `# Exported: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  // CSV headers
  const headers = [
    "Component Type",
    "# Similar",
    "Similar Values",
    "# Products",
    "# Positions",
    "Positions",
    "Zebra Match",
  ];

  // Convert data to CSV rows
  const csvRows = data.map((row) => {
    return [
      escapeCSV(row.componentType),
      row.similarCount.toString(),
      escapeCSV(row.similarValues.join(";")), // Use semicolon for array values
      row.productCount.toString(),
      row.positionCount.toString(),
      escapeCSV(row.positions.join(";")), // Use semicolon for array values
      row.zebraMatch,
    ].join(",");
  });

  // Combine everything
  const csvContent = [metadata, headers.join(","), ...csvRows].join("\n");

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `component-types-${dateStr}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Escape CSV values that contain commas, quotes, or newlines
function escapeCSV(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Export enhanced CSV report with match scores and positions
 */
export function exportCsvReport(data: ComponentTypeRow[], threshold?: number) {
  // Build metadata header
  const metadata = [
    "# Similarity Report",
    `# Exported: ${new Date().toISOString()}`,
    threshold !== undefined
      ? `# Threshold: ${(threshold * 100).toFixed(0)}%`
      : null,
    `# Total Component Types: ${data.length}`,
  ]
    .filter(Boolean)
    .join("\n");

  // Find max number of similar matches to create dynamic columns
  const maxSimilar = Math.max(
    0,
    ...data.map((row) => row.similarMatches?.length || 0)
  );

  // Build dynamic headers
  const baseHeaders = ["Component Type", "Source Positions", "# Similar"];

  const similarHeaders: string[] = [];
  for (let i = 1; i <= maxSimilar; i++) {
    similarHeaders.push(`Similar ${i}`, `Match ${i} %`, `Match ${i} Positions`);
  }

  const headers = [...baseHeaders, ...similarHeaders];

  // Convert data to CSV rows
  const csvRows = data.map((row) => {
    const baseFields = [
      escapeCSV(row.componentType),
      escapeCSV(row.positions?.join(";") || ""),
      row.similarCount.toString(),
    ];

    const similarFields: string[] = [];
    for (let i = 0; i < maxSimilar; i++) {
      const match = row.similarMatches?.[i];
      if (match) {
        similarFields.push(
          escapeCSV(match.value),
          match.matchPercentage.toString(),
          escapeCSV(match.positions?.join(";") || "")
        );
      } else {
        similarFields.push("", "", "");
      }
    }

    return [...baseFields, ...similarFields].join(",");
  });

  // Combine everything
  const csvContent = [metadata, headers.join(","), ...csvRows].join("\n");

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `similarity-report-${dateStr}.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export JSON report with full structured data
 */
export function exportJsonReport(data: ComponentTypeRow[], threshold?: number) {
  const exportData = {
    exportMetadata: {
      exportedAt: new Date().toISOString(),
      similarityThreshold: threshold !== undefined ? threshold : 0.85,
      totalComponentTypes: data.length,
      schemaVersion: "1.0",
    },
    data: data.map((row) => ({
      componentType: row.componentType,
      sourcePositions: row.positions || [],
      similarMatches: row.similarMatches || [],
      productCount: row.productCount,
      zebraMatch: row.zebraMatch,
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `similarity-report-${dateStr}.json`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
