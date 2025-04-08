import { getSupabaseServerClient } from "@/lib/supabase/server";
import { submitTranscriptRequest, pollTranscriptStatus } from "@/lib/assemblyai";
import { generateSummary } from "@/lib/openai";
import { logInfo, logError } from "@/lib/logger";
import { withRetry } from "@/lib/error-handling";
import { getYouTubeVideoId } from "@/lib/youtube";
import { trackDocumentCreation } from "@/lib/usage";
import { downloadYouTubeAudio, cleanupAudioFile } from './youtube';
import { AssemblyAIService } from './assemblyai/service';

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
  const supabase = getSupabaseServerClient();
  const assemblyAI = new AssemblyAIService();
  const startTime = Date.now();

  try {
    // Get document from database
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      throw new Error(fetchError?.message || 'Document not found');
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    onProgress?.('Downloading video audio...');

    // Download YouTube audio
    const videoInfo = await downloadYouTubeAudio(videoUrl);

    try {
      onProgress?.('Transcribing audio...');

      // Submit audio file for transcription
      const transcriptionId = await assemblyAI.submitTranscription(`file://${videoInfo.audioPath}`);
      
      // Wait for transcription to complete
      const transcription = await assemblyAI.waitForTranscription(transcriptionId);

      // Update document with transcription
      await supabase
        .from('documents')
        .update({
          status: 'completed',
          content: transcription.text,
          video_title: videoInfo.title,
          video_duration: videoInfo.duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      logInfo(`Document ${documentId} processed successfully`);
    } finally {
      // Clean up audio file
      cleanupAudioFile(videoInfo.audioPath);
    }

    onProgress?.("Generating summary...");

    // Generate summary using OpenAI
    const { summary, usage } = await withRetry(
      () => generateSummary(transcription.text),
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
        updated_at: new Date().toISOString()
      })
      .eq("id", documentId);

    onProgress?.("Error", 0);
    throw error;
  }
}

export async function createDocument(userId: string, url: string, title: string) {
  const supabase = getSupabaseServerClient();

  try {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    const { data: document, error } = await supabase
      .from("documents")
      .insert([
        {
          user_id: userId,
          video_url: url,
          title,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Track document creation for usage limits
    await trackDocumentCreation(userId);

    return document;
  } catch (error) {
    logError("Error creating document", { userId, url, error });
    throw error;
  }
} 