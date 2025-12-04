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
