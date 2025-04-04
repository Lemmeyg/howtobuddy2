"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { formatDistanceToNow } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { logInfo } from "@/lib/logger";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { FileText, Clock, AlertCircle, Plus } from "lucide-react";
import { DocumentActions } from "@/components/document/document-actions";
import { DocumentFilters } from "@/components/document/document-filters";
import { Document } from "@/types/documents";
import { ProcessingStatus } from "./processing-status";

interface DocumentListProps {
  documents: Document[];
  isLoading?: boolean;
  emptyMessage?: string;
}

type SortBy = "created_at" | "title" | "video_title";
type SortOrder = "asc" | "desc";

export function DocumentList({ 
  documents: initialDocuments, 
  isLoading = false,
  emptyMessage = "Get started by creating your first document"
}: DocumentListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState(initialDocuments);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState<SortBy>(searchParams.get("sortBy") as SortBy || "created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>(searchParams.get("sortOrder") as SortOrder || "desc");
  const [filter, setFilter] = useState<"all" | "processing" | "completed" | "error">(
    (searchParams.get("status") as any) || "all"
  );
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoadingMore(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "10",
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(filter !== "all" && { status: filter }),
          sortBy,
          sortOrder,
          ...(dateRange.from && { from: dateRange.from.toISOString() }),
          ...(dateRange.to && { to: dateRange.to.toISOString() }),
        });

        const response = await fetch(`/api/documents?${params}`);
        const result = await response.json();

        if (response.ok && result.data) {
          const newDocuments = result.data.documents || [];
          setDocuments(page === 1 ? newDocuments : [...documents, ...newDocuments]);
          setHasMore(result.data.hasMore);
        } else {
          console.error('Error fetching documents:', result.error);
        }
      } catch (error) {
        console.error("Error fetching documents", error);
      } finally {
        setIsLoadingMore(false);
      }
    };

    // Only fetch if we're on the documents page
    if (window.location.pathname.includes('/documents')) {
      fetchDocuments();
    } else {
      // If we're on the dashboard, just use the initial documents
      setDocuments(initialDocuments);
    }
  }, [debouncedSearch, filter, sortBy, sortOrder, page, dateRange, initialDocuments]);

  useEffect(() => {
    // Only update URL if we're on the documents page
    if (!window.location.pathname.includes('/documents')) {
      return;
    }

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filter !== "all") params.set("status", filter);
    if (sortBy !== "created_at") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
    if (dateRange.from) params.set("from", dateRange.from.toISOString());
    if (dateRange.to) params.set("to", dateRange.to.toISOString());

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(`/dashboard/documents${newUrl}`);
  }, [search, filter, sortBy, sortOrder, dateRange, router]);

  const handleDocumentClick = (documentId: string) => {
    logInfo("Document clicked", { documentId });
    router.push(`/dashboard/documents/${documentId}`);
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!documents?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4">{emptyMessage}</p>
        <Button asChild>
          <Link href="/documents/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Document
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DocumentFilters
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        sortBy={sortBy}
        onSortByChange={(value: SortBy) => {
          setSortBy(value);
          setPage(1);
        }}
        sortOrder={sortOrder}
        onSortOrderChange={(value) => {
          setSortOrder(value);
          setPage(1);
        }}
        status={filter}
        onStatusChange={(value: "all" | "processing" | "completed" | "error") => {
          setFilter(value);
          setPage(1);
        }}
        dateRange={dateRange}
        onDateRangeChange={(range) => {
          setDateRange(range);
          setPage(1);
        }}
      />

      <div className="space-y-4">
        {documents.map((document) => (
          <Card key={document.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-medium">{document.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(document.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/documents/${document.id}`}>View</Link>
              </Button>
            </div>
            <ProcessingStatus
              status={document.status}
              progress={document.status === "processing" ? 50 : undefined}
              errorMessage={document.error_message}
              className="mt-4"
            />
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Document["status"] }) {
  switch (status) {
    case "processing":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Processing
        </Badge>
      );
    case "error":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    default:
      return (
        <Badge variant="default" className="gap-1">
          <FileText className="h-3 w-3" />
          Completed
        </Badge>
      );
  }
} 