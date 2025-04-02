"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { Database } from "@/lib/supabase";

type Document = Database["public"]["Tables"]["documents"]["Row"];

export function DocumentsList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    async function fetchDocuments() {
      try {
        const response = await fetch("/api/documents");
        if (!response.ok) throw new Error("Failed to fetch documents");
        const data = await response.json();
        setDocuments(data.documents);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please sign in to view your documents.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No documents yet. Upload a video to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <h3 className="font-medium">{doc.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {doc.video_title}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant={
                    doc.status === "completed"
                      ? "success"
                      : doc.status === "failed"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {doc.status}
                </Badge>
                {doc.status === "processing" && (
                  <Progress value={33} className="w-24" />
                )}
                <Button
                  variant="outline"
                  onClick={() => router.push(`/documents/${doc.id}`)}
                >
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 