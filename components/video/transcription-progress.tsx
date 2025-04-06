"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Loader2 } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface TranscriptionProgressProps {
  documentId: string;
  onComplete?: () => void;
}

interface ProcessingJob {
  id: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  status_message: string;
  error_message?: string;
  created_at: string;
}

interface Document {
  id: string;
  title: string;
  video_url: string;
  status: "pending" | "processing" | "completed" | "error";
  metadata: {
    videoInfo?: {
      title: string;
      channelTitle: string;
      duration: number;
    };
  };
}

export function TranscriptionProgress({ documentId, onComplete }: TranscriptionProgressProps) {
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch document details
        const { data: doc, error: docError } = await supabase
          .from("documents")
          .select("*")
          .eq("id", documentId)
          .single();

        if (docError) throw docError;
        setDocument(doc);

        // Fetch processing job
        const { data: jobs, error: jobError } = await supabase
          .from("processing_jobs")
          .select("*")
          .eq("document_id", documentId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (jobError) throw jobError;
        setJob(jobs);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to fetch progress");
      }
    };

    fetchData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`processing_jobs:${documentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "processing_jobs",
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          setJob(payload.new as ProcessingJob);
          if (payload.new.status === "completed") {
            onComplete?.();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId, supabase, onComplete]);

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-red-500">{error}</div>
      </Card>
    );
  }

  if (!job || !document) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  const videoInfo = document.metadata?.videoInfo;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <h3 className="font-medium">Processing Video</h3>
          {videoInfo && (
            <p className="text-sm text-muted-foreground">
              {videoInfo.title} ({formatDuration(videoInfo.duration)})
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{job.status_message}</span>
            <span>{job.progress}%</span>
          </div>
          <Progress value={job.progress} />
        </div>

        {job.status === "error" && (
          <div className="text-sm text-red-500">
            {job.error_message || "An error occurred during processing"}
          </div>
        )}

        {job.status === "completed" && (
          <div className="text-sm text-green-500">
            Processing completed successfully
          </div>
        )}
      </div>
    </Card>
  );
} 