/**
 * Export utilities for table data
 * Supports CSV, JSON, and Markdown formats
 */

/**
 * Escape CSV field value
 * - Wrap in quotes if contains comma, quote, or newline
 * - Escape internal quotes by doubling them
 */
function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);

  // Check if field needs quoting
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    // Escape internal quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Convert data to CSV and download
 * @param data Array of objects to export
 * @param filename Output filename (without extension)
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string
): void {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  // Get column headers from first row
  const headers = Object.keys(data[0]);

  // Build CSV content
  const csvRows: string[] = [];

  // Add header row
  csvRows.push(headers.map(escapeCSVField).join(","));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => escapeCSVField(row[header]));
    csvRows.push(values.join(","));
  }

  const csvContent = csvRows.join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Convert data to JSON and download
 * @param data Array of objects to export
 * @param filename Output filename (without extension)
 */
export function exportToJSON(
  data: Record<string, unknown>[],
  filename: string
): void {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  // Pretty-print JSON with 2-space indentation
  const jsonContent = JSON.stringify(data, null, 2);

  // Create blob and download
  const blob = new Blob([jsonContent], {
    type: "application/json;charset=utf-8;",
  });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Convert data to Markdown table and download
 * @param data Array of objects to export
 * @param filename Output filename (without extension)
 */
export function exportToMarkdown(
  data: Record<string, unknown>[],
  filename: string
): void {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  // Get column headers from first row
  const headers = Object.keys(data[0]);

  // Build markdown content
  const mdRows: string[] = [];

  // Add header row
  mdRows.push(`| ${headers.join(" | ")} |`);

  // Add separator row
  mdRows.push(`| ${headers.map(() => "---").join(" | ")} |`);

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape pipe characters and convert to string
      return String(value ?? "").replace(/\|/g, "\\|");
    });
    mdRows.push(`| ${values.join(" | ")} |`);
  }

  const mdContent = mdRows.join("\n");

  // Create blob and download
  const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
  downloadBlob(blob, `${filename}.md`);
}

/**
 * Helper function to trigger file download
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format data for export by converting complex types
 * Useful for preparing table data before export
 */
export function prepareDataForExport<T extends Record<string, unknown>>(
  data: T[]
): Record<string, unknown>[] {
  return data.map((row) => {
    const cleanRow: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
      // Convert Date objects to ISO strings
      if (value instanceof Date) {
        cleanRow[key] = value.toISOString();
      }
      // Convert objects/arrays to JSON strings
      else if (typeof value === "object" && value !== null) {
        cleanRow[key] = JSON.stringify(value);
      }
      // Keep primitives as-is
      else {
        cleanRow[key] = value;
      }
    }

    return cleanRow;
  });
}
