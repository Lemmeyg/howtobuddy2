"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TranscriptionProgressProps {
  documentId: string;
  onComplete?: () => void;
}

interface TranscriptionStatus {
  status: "processing" | "completed" | "error";
  progress: number;
  error?: string;
  metadata?: {
    audio_duration?: number;
    word_count?: number;
    confidence?: number;
  };
}

export function TranscriptionProgress({
  documentId,
  onComplete,
}: TranscriptionProgressProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<TranscriptionStatus>({
    status: "processing",
    progress: 0,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch status");
        }

        const newStatus: TranscriptionStatus = {
          status: data.status,
          progress: data.status === "completed" ? 100 : 50,
          error: data.error_message,
          metadata: data.metadata,
        };

        setStatus(newStatus);

        if (newStatus.status === "completed") {
          clearInterval(interval);
          toast({
            title: "Success",
            description: "Transcription completed successfully",
          });
          onComplete?.();
        } else if (newStatus.status === "error") {
          clearInterval(interval);
          toast({
            title: "Error",
            description: newStatus.error || "Transcription failed",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking status:", error);
        clearInterval(interval);
      }
    };

    interval = setInterval(checkStatus, 3000);
    checkStatus();

    return () => clearInterval(interval);
  }, [documentId, onComplete, toast]);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {status.status === "processing" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="font-medium">Processing video...</span>
              </>
            )}
            {status.status === "completed" && (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">Completed</span>
              </>
            )}
            {status.status === "error" && (
              <>
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-600">Failed</span>
              </>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {status.progress}%
          </span>
        </div>

        <Progress value={status.progress} className="h-2" />

        {status.metadata && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {status.metadata.audio_duration && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  Duration: {Math.round(status.metadata.audio_duration / 60)}m{" "}
                  {Math.round(status.metadata.audio_duration % 60)}s
                </span>
              </div>
            )}
            {status.metadata.word_count && (
              <div>
                Words: {status.metadata.word_count.toLocaleString()}
              </div>
            )}
            {status.metadata.confidence && (
              <div>
                Confidence: {Math.round(status.metadata.confidence * 100)}%
              </div>
            )}
          </div>
        )}

        {status.error && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{status.error}</span>
          </div>
        )}
      </div>
    </Card>
  );
} 