"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { logInfo } from "@/lib/logger";

interface DocumentDetailProps {
  document: {
    id: string;
    title: string;
    status: "processing" | "completed" | "error";
    created_at: string;
    video_title?: string;
    video_duration?: number;
    error_message?: string;
    transcript?: string;
    summary?: string;
    key_points?: string[];
    sentiment?: {
      sentiment: "positive" | "negative" | "neutral";
      confidence: number;
      keyPhrases: string[];
    };
    topics?: {
      mainTopics: string[];
      subtopics: Record<string, string[]>;
      confidence: number;
    };
  };
  isLoading?: boolean;
}

export function DocumentDetail({ document, isLoading = false }: DocumentDetailProps) {
  const [activeTab, setActiveTab] = useState("transcript");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (document.status === "processing") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{document.title}</CardTitle>
          <Badge variant="secondary">Processing</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your document is being processed. This may take a few minutes.
            </p>
            <Progress value={33} className="w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (document.status === "error") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{document.title}</CardTitle>
          <Badge variant="destructive">Error</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{document.error_message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{document.title}</CardTitle>
            <Badge variant="default">Completed</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {document.video_title && (
              <p className="text-sm text-muted-foreground">
                Video: {document.video_title}
              </p>
            )}
            {document.video_duration && (
              <p className="text-sm text-muted-foreground">
                Duration: {Math.floor(document.video_duration / 60)}m{" "}
                {document.video_duration % 60}s
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Created{" "}
              {formatDistanceToNow(new Date(document.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="transcript" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none">
                {document.transcript}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none">
                {document.summary}
              </div>
              {document.key_points && document.key_points.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Key Points</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {document.key_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {document.sentiment && (
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          document.sentiment.sentiment === "positive"
                            ? "default"
                            : document.sentiment.sentiment === "negative"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {document.sentiment.sentiment}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Confidence: {(document.sentiment.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Key Phrases</h4>
                      <div className="flex flex-wrap gap-1">
                        {document.sentiment.keyPhrases.map((phrase, index) => (
                          <Badge key={index} variant="outline">
                            {phrase}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {document.topics && (
              <Card>
                <CardHeader>
                  <CardTitle>Topic Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Main Topics</h4>
                      <div className="flex flex-wrap gap-1">
                        {document.topics.mainTopics.map((topic, index) => (
                          <Badge key={index} variant="default">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Subtopics</h4>
                      <div className="space-y-2">
                        {Object.entries(document.topics.subtopics).map(
                          ([topic, subtopics]) => (
                            <div key={topic}>
                              <p className="text-sm font-medium">{topic}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {subtopics.map((subtopic, index) => (
                                  <Badge key={index} variant="outline">
                                    {subtopic}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 