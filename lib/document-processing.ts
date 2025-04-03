import { createClient } from "@/lib/supabase/server";
import { submitTranscriptRequest, pollTranscriptStatus } from "@/lib/assemblyai";
import { generateSummary } from "@/lib/openai";
import { logInfo, logError } from "@/lib/logger";
import { withRetry } from "@/lib/error-handling";

interface ProcessDocumentOptions {
  documentId: string;
  videoUrl: string;
  onProgress?: (status: string, progress?: number) => void;
}

export async function processDocument({
  documentId,
  videoUrl,
  onProgress,
}: ProcessDocumentOptions) {
  const supabase = createClient();
  const startTime = Date.now();

  try {
    // Update document status to processing
    await supabase
      .from("documents")
      .update({ status: "processing" })
      .eq("id", documentId);

    onProgress?.("Starting transcription...");

    // Submit transcription request
    const transcriptId = await withRetry(
      () => submitTranscriptRequest(videoUrl),
      {
        maxAttempts: 3,
        delay: 1000,
        shouldRetry: (error) => error.message.includes("rate limit"),
      }
    );

    // Poll for transcription status
    const transcriptStatus = await pollTranscriptStatus(transcriptId, (status, progress) => {
      onProgress?.(`Transcribing: ${status}`, progress);
    });

    if (transcriptStatus.status === "error") {
      throw new Error(transcriptStatus.error || "Transcription failed");
    }

    // Update document with transcript
    await supabase
      .from("documents")
      .update({
        transcript: transcriptStatus.text,
        video_title: transcriptStatus.title,
        video_duration: transcriptStatus.duration,
      })
      .eq("id", documentId);

    onProgress?.("Generating summary...");

    // Generate summary using OpenAI
    const { summary, usage } = await withRetry(
      () => generateSummary(transcriptStatus.text),
      {
        maxAttempts: 3,
        delay: 1000,
        shouldRetry: (error) => error.message.includes("rate limit"),
      }
    );

    // Update document with summary and usage
    await supabase
      .from("documents")
      .update({
        summary: summary.text,
        key_points: summary.keyPoints,
        sentiment: summary.sentiment,
        topics: summary.topics,
        token_usage: usage,
        status: "completed",
      })
      .eq("id", documentId);

    const duration = Date.now() - startTime;
    logInfo("Document processing completed", {
      documentId,
      duration,
      tokenUsage: usage,
    });

    onProgress?.("Completed", 100);
  } catch (error) {
    const duration = Date.now() - startTime;
    logError("Document processing failed", {
      documentId,
      duration,
      error,
    });

    // Update document with error
    await supabase
      .from("documents")
      .update({
        status: "error",
        error_message: error instanceof Error ? error.message : "Processing failed",
      })
      .eq("id", documentId);

    onProgress?.("Error", 0);
    throw error;
  }
} 