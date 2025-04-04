import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Document } from "@/types/documents";
import { ArrowLeft, Download, Share2, MoreVertical, FileText, FileCode, FileJson } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatDuration } from "@/lib/utils";

interface DocumentHeaderProps {
  document: Document;
  onExport: (format: "text" | "markdown" | "json") => void;
}

export function DocumentHeader({ document, onExport }: DocumentHeaderProps) {
  return (
    <Card className="border-b rounded-none">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{document.title}</h1>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span>Created: {new Date(document.createdAt).toLocaleDateString()}</span>
              {document.metadata?.duration && (
                <span>Duration: {formatDuration(document.metadata.duration)}</span>
              )}
              {document.metadata?.wordCount && (
                <span>Words: {document.metadata.wordCount}</span>
              )}
              {document.metadata?.confidence && (
                <span>Confidence: {Math.round(document.metadata.confidence * 100)}%</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport("text")}>
                <FileText className="mr-2 h-4 w-4" />
                Export as Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("markdown")}>
                <FileCode className="mr-2 h-4 w-4" />
                Export as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("json")}>
                <FileJson className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Title</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500">Delete Document</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
} 