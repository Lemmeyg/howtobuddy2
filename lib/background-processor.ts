import { createClient } from "@/lib/supabase/server";
import { processDocument } from "@/lib/document-processing";
import { logInfo, logError } from "@/lib/logger";

interface ProcessingJob {
  id: string;
  document_id: string;
  video_url: string;
  status: "pending" | "processing" | "completed" | "error";
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export class BackgroundProcessor {
  private static instance: BackgroundProcessor;
  private isProcessing: boolean = false;
  private supabase = createClient();

  private constructor() {}

  static getInstance(): BackgroundProcessor {
    if (!BackgroundProcessor.instance) {
      BackgroundProcessor.instance = new BackgroundProcessor();
    }
    return BackgroundProcessor.instance;
  }

  async start() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    logInfo("Background processor started");

    while (this.isProcessing) {
      try {
        await this.processNextJob();
      } catch (error) {
        logError("Error in background processor", { error });
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  stop() {
    this.isProcessing = false;
    logInfo("Background processor stopped");
  }

  private async processNextJob() {
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
      // No jobs to process, wait before checking again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return;
    }

    const job = jobs[0] as ProcessingJob;

    try {
      // Update job status to processing
      await this.supabase
        .from("processing_jobs")
        .update({ status: "processing" })
        .eq("id", job.id);

      // Process the document
      await processDocument({
        documentId: job.document_id,
        videoUrl: job.video_url,
        onProgress: async (status, progress) => {
          // Update job progress
          await this.supabase
            .from("processing_jobs")
            .update({
              status: "processing",
              progress: progress || 0,
              status_message: status,
            })
            .eq("id", job.id);
        },
      });

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

      logError("Job failed", { jobId: job.id, error });
    }
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