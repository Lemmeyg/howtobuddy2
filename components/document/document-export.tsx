"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileCode, FileMarkdown, FilePdf, FileWord } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface DocumentExportProps {
  document: {
    id: string;
    title: string;
    content: string;
    generated_content: string;
    document_format: string;
  };
}

export function DocumentExport({ document }: DocumentExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: "html" | "markdown" | "plain" | "pdf" | "docx") => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/documents/${document.id}/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        throw new Error("Failed to export document");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${document.title}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Document exported successfully",
      });
    } catch (error) {
      console.error("Error exporting document:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export document",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("html")}>
          <FileCode className="mr-2 h-4 w-4" />
          HTML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("markdown")}>
          <FileMarkdown className="mr-2 h-4 w-4" />
          Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("plain")}>
          <FileText className="mr-2 h-4 w-4" />
          Plain Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FilePdf className="mr-2 h-4 w-4" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("docx")}>
          <FileWord className="mr-2 h-4 w-4" />
          DOCX
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 