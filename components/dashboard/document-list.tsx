"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { logInfo } from "@/lib/logger";
import { useDebounce } from "@/hooks/use-debounce";

interface Document {
  id: string;
  title: string;
  status: "processing" | "completed" | "error";
  created_at: string;
  video_title?: string;
  video_duration?: number;
  error_message?: string;
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
  }, [debouncedSearch, filter, sortBy, sortOrder, page]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filter !== "all") params.set("status", filter);
    if (sortBy !== "created_at") params.set("sortBy", sortBy);
    if (sortOrder !== "desc") params.set("sortOrder", sortOrder);

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.push(`/dashboard/documents${newUrl}`);
  }, [search, filter, sortBy, sortOrder, router]);

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
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80%]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />
          <Select
            value={sortBy}
            onValueChange={(value: SortBy) => {
              setSortBy(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="video_title">Video Title</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={filter === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => {
              setFilter("all");
              setPage(1);
            }}
          >
            All
          </Badge>
          <Badge
            variant={filter === "processing" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => {
              setFilter("processing");
              setPage(1);
            }}
          >
            Processing
          </Badge>
          <Badge
            variant={filter === "completed" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => {
              setFilter("completed");
              setPage(1);
            }}
          >
            Completed
          </Badge>
          <Badge
            variant={filter === "error" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => {
              setFilter("error");
              setPage(1);
            }}
          >
            Error
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <Card
            key={doc.id}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => handleDocumentClick(doc.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{doc.title}</CardTitle>
                <Badge
                  variant={
                    doc.status === "completed"
                      ? "default"
                      : doc.status === "error"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {doc.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {doc.video_title && (
                  <p className="text-sm text-muted-foreground">
                    Video: {doc.video_title}
                  </p>
                )}
                {doc.video_duration && (
                  <p className="text-sm text-muted-foreground">
                    Duration: {Math.floor(doc.video_duration / 60)}m{" "}
                    {doc.video_duration % 60}s
                  </p>
                )}
                {doc.error_message && (
                  <p className="text-sm text-destructive">{doc.error_message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Created{" "}
                  {formatDistanceToNow(new Date(doc.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </CardContent>
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