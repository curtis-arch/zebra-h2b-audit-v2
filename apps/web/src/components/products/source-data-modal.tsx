"use client";

import { Copy, Download, FileText, Loader2 } from "lucide-react";
import * as React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SourceDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileContent: string | null;
  fileName: string;
  mimeType: string;
}

export function SourceDataModal({
  open,
  onOpenChange,
  fileContent,
  fileName,
  mimeType,
}: SourceDataModalProps) {
  const [copying, setCopying] = React.useState(false);

  const isLoading = fileName === "Loading...";
  const isBinaryFile =
    mimeType.includes("spreadsheet") || mimeType.includes("excel");
  const isCSV = mimeType.includes("csv") || mimeType.includes("text");

  const handleCopy = async () => {
    if (!fileContent) return;

    setCopying(true);
    try {
      await navigator.clipboard.writeText(fileContent);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
      console.error("Copy failed:", error);
    } finally {
      setCopying(false);
    }
  };

  const handleDownload = () => {
    if (!fileContent) {
      toast.error("No content available to download");
      return;
    }

    try {
      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("File downloaded");
    } catch (error) {
      toast.error("Failed to download file");
      console.error("Download failed:", error);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="!max-w-5xl flex max-h-[85vh] flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Source Data: {fileName}
          </DialogTitle>
          <DialogDescription>
            View and download the original configuration file content
          </DialogDescription>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex gap-2 border-b pb-4">
          <Button
            disabled={!fileContent || isBinaryFile || copying}
            onClick={handleCopy}
            size="sm"
            variant="outline"
          >
            {copying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            Copy to Clipboard
          </Button>
          <Button
            disabled={!fileContent}
            onClick={handleDownload}
            size="sm"
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto rounded-md border bg-muted/30">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading file content...</p>
              </div>
            </div>
          ) : isBinaryFile ? (
            <div className="flex h-64 items-center justify-center p-8 text-center">
              <div>
                <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <p className="mb-2 font-medium text-lg">Binary file detected</p>
                <p className="mb-4 text-muted-foreground text-sm">
                  This is an Excel file (.xlsx/.xlsm). Download the file to view
                  its contents.
                </p>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download File
                </Button>
              </div>
            </div>
          ) : fileContent ? (
            <SyntaxHighlighter
              customStyle={{
                margin: 0,
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                lineHeight: "1.5",
              }}
              language="csv"
              showLineNumbers
              style={atomDark}
              wrapLines
              wrapLongLines
            >
              {fileContent}
            </SyntaxHighlighter>
          ) : (
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">No content available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
