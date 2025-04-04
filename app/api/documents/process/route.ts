import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { processVideo } from "@/lib/video-processing";
import { logError, logInfo } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Verify session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get document ID from request
    const { documentId } = await request.json();
    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Get document details
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", session.user.id)
      .single();

    if (fetchError || !document) {
      logError("Error fetching document", { documentId, error: fetchError });
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Update document status to processing
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
      const result = await processVideo({
        videoUrl: document.video_url,
        skillLevel: document.metadata?.skillLevel,
        outputType: document.metadata?.outputType,
      });

      if (result.error) {
        // Update document with error
        await supabase
          .from("documents")
          .update({
            status: "error",
            error_message: result.error,
          })
          .eq("id", documentId);

        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      // Update document with processed content
      const { error: finalUpdateError } = await supabase
        .from("documents")
        .update({
          content: result.content,
          metadata: {
            ...document.metadata,
            ...result.metadata,
          },
          status: "completed",
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

      logInfo("Document processing completed", { documentId });

      return NextResponse.json({
        message: "Document processed successfully",
        documentId,
      });
    } catch (error) {
      // Update document status to error
      await supabase
        .from("documents")
        .update({
          status: "error",
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
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