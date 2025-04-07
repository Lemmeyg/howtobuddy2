import { getSupabaseServerClient } from "@/lib/supabase/server";
import { logError, logInfo } from "@/lib/logger";
import { processDocument } from "@/lib/document-processing";

class BackgroundProcessor {
  private static instance: BackgroundProcessor;
  private isProcessing: boolean = false;
  private supabase = getSupabaseServerClient();

  private constructor() {}

  public static getInstance(): BackgroundProcessor {
    if (!BackgroundProcessor.instance) {
      BackgroundProcessor.instance = new BackgroundProcessor();
    }
    return BackgroundProcessor.instance;
  }

  public async processNextDocument() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get next pending document
      const { data: documents, error } = await this.supabase
        .from("documents")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(1);

      if (error) {
        throw error;
      }

      if (!documents || documents.length === 0) {
        return;
      }

      const document = documents[0];

      // Process the document
      await processDocument({
        documentId: document.id,
        userId: document.user_id,
        videoUrl: document.video_url,
        onProgress: async (status: string, error?: string) => {
          await this.supabase
            .from("documents")
            .update({
              status,
              error_message: error,
              updated_at: new Date().toISOString(),
            })
            .eq("id", document.id);
        },
      });

      logInfo("Document processed successfully", { documentId: document.id });
    } catch (error) {
      logError("Error in background processing", { error });
    } finally {
      this.isProcessing = false;
    }
  }
}

export const backgroundProcessor = BackgroundProcessor.getInstance(); 