import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { processVideo } from "@/lib/video-processing";
import { trackVideoProcessing } from "@/lib/usage";
import { logError, logInfo } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { documentId } = await request.json();

    // Get document
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", session.user.id)
      .single();

    if (documentError || !document) {
      logError("Error fetching document", { documentId, error: documentError });
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Update status to processing
    const { error: updateError } = await supabase
      .from("documents")
      .update({ status: "processing" })
      .eq("id", documentId);

    if (updateError) {
      logError("Error updating document status", { documentId, error: updateError });
      return NextResponse.json(
        { error: "Failed to update document status" },
        { status: 500 }
      );
    }

    try {
      // Process video
      const processed = await processVideo(document.video_url, {
        skillLevel: document.metadata?.skillLevel || "beginner",
        outputType: document.metadata?.outputType || "summary",
      });

      // Update document with processed content
      const { error: finalUpdateError } = await supabase
        .from("documents")
        .update({
          content: processed.content,
          status: "completed",
          metadata: {
            ...document.metadata,
            duration: processed.metadata.duration,
            wordCount: processed.metadata.wordCount,
            confidence: processed.metadata.confidence,
          },
          completed_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (finalUpdateError) {
        logError("Error updating document with processed content", { documentId, error: finalUpdateError });
        return NextResponse.json(
          { error: "Failed to update document with processed content" },
          { status: 500 }
        );
      }

      // Track video processing
      await trackVideoProcessing(session.user.id, processed.metadata.duration);

      logInfo("Document processing completed", { documentId });

      return NextResponse.json({
        message: "Document processed successfully",
        documentId,
      });
    } catch (error) {
      console.error("Error processing video:", error);
      await supabase
        .from("documents")
        .update({ status: "error" })
        .eq("id", documentId);
      throw error;
    }
  } catch (error) {
    logError("Error processing document", { error });
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
} 