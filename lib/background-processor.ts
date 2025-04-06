import { createSupabaseServer } from "@/lib/supabase/server";
import { processVideo } from "@/lib/video-processing";
import { logInfo, logError } from "@/lib/logger";
import { withRetry } from "@/lib/error-handling";

interface ProcessingJob {
  id: string;
  document_id: string;
  video_url: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  status_message: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export class BackgroundProcessor {
  private static instance: BackgroundProcessor;
  private supabase = createSupabaseServer();
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): BackgroundProcessor {
    if (!BackgroundProcessor.instance) {
      BackgroundProcessor.instance = new BackgroundProcessor();
    }
    return BackgroundProcessor.instance;
  }

  public start() {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(() => {
      if (!this.isProcessing) {
        this.processNextJob().catch((error) => {
          logError("Error processing job", { error });
        });
      }
    }, 5000);

    logInfo("Background processor started");
  }

  public stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    logInfo("Background processor stopped");
  }

  private async processNextJob() {
    this.isProcessing = true;

    try {
      // Get the next pending job
      const { data: jobs, error } = await this.supabase
        .from("processing_jobs")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(1);

      if (error) {
        throw error;
      }

      if (!jobs || jobs.length === 0) {
        return;
      }

      const job = jobs[0] as ProcessingJob;

      try {
        // Update job status to processing
        await this.supabase
          .from("processing_jobs")
          .update({ 
            status: "processing",
            status_message: "Starting video processing",
            progress: 0
          })
          .eq("id", job.id);

        // Process the video
        const result = await withRetry(
          () => processVideo({
            videoUrl: job.video_url,
            onProgress: async (status, progress) => {
              await this.updateJobProgress(job.id, status, progress);
            }
          }),
          {
            maxAttempts: 3,
            delay: 1000,
            shouldRetry: (error) => error.message.includes("rate limit")
          }
        );

        if (result.error) {
          throw new Error(result.error);
        }

        // Update document with processed content
        await this.supabase
          .from("documents")
          .update({
            content: result.content,
            metadata: result.metadata,
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", job.document_id);

        // Update job status to completed
        await this.supabase
          .from("processing_jobs")
          .update({
            status: "completed",
            progress: 100,
            status_message: "Completed",
          })
          .eq("id", job.id);

        logInfo("Job completed successfully", { jobId: job.id });
      } catch (error) {
        // Update job status to error
        await this.supabase
          .from("processing_jobs")
          .update({
            status: "error",
            error_message: error instanceof Error ? error.message : "Processing failed",
          })
          .eq("id", job.id);

        // Update document status to error
        await this.supabase
          .from("documents")
          .update({
            status: "error",
            error_message: error instanceof Error ? error.message : "Processing failed",
          })
          .eq("id", job.document_id);

        logError("Job failed", { jobId: job.id, error });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async updateJobProgress(jobId: string, status: string, progress?: number) {
    await this.supabase
      .from("processing_jobs")
      .update({
        status_message: status,
        progress: progress || 0,
      })
      .eq("id", jobId);
  }

  async submitJob(documentId: string, videoUrl: string) {
    const { data: job, error } = await this.supabase
      .from("processing_jobs")
      .insert([
        {
          document_id: documentId,
          video_url: videoUrl,
          status: "pending",
          progress: 0,
          status_message: "Queued",
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    logInfo("Job submitted", { jobId: job.id });
    return job;
  }
} 