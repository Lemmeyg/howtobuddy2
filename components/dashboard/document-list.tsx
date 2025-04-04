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
import { FileText, Clock, AlertCircle } from "lucide-react";
import { DocumentActions } from "@/components/document/document-actions";
import { DocumentFilters } from "@/components/document/document-filters";

interface Document {
  id: string;
  title: string;
  status: "processing" | "completed" | "error";
  created_at: string;
  updated_at: string;
  content?: string;
}

interface DocumentListProps {
  documents: Document[];
  isLoading?: boolean;
}

type SortBy = "created_at" | "title" | "video_title";
type SortOrder = "asc" | "desc";

export function DocumentList({ documents: initialDocuments, isLoading = false }: DocumentListProps) {
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
        const data = await response.json();

        if (response.ok) {
          setDocuments(page === 1 ? data.documents : [...documents, ...data.documents]);
          setHasMore(data.documents.length === 10);
        }
      } catch (error) {
        logInfo("Error fetching documents", { error });
      } finally {
        setIsLoadingMore(false);
      }
    };

    fetchDocuments();
  }, [debouncedSearch, filter, sortBy, sortOrder, page, dateRange]);

  useEffect(() => {
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
      <div className="text-center py-12 border rounded-lg">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No documents</h3>
        <p className="text-sm text-muted-foreground">
          Get started by creating your first document
        </p>
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
          <div
            key={document.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/dashboard/documents/${document.id}`}
                className="block hover:underline font-medium truncate"
              >
                {document.title}
              </Link>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>
                  Updated {formatDistanceToNow(new Date(document.updated_at), { addSuffix: true })}
                </span>
                <StatusBadge status={document.status} />
              </div>
            </div>
            <div className="ml-4">
              <DocumentActions document={document} />
            </div>
          </div>
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