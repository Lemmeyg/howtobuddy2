import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BackgroundProcessor } from "@/lib/background-processor";
import { getYouTubeVideoInfo } from "@/lib/youtube";
import { z } from "zod";
import { logError, logInfo } from "@/lib/logger";

// Request schema
const processVideoSchema = z.object({
  videoUrl: z.string().url(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  outputType: z.enum(['tutorial', 'guide', 'reference']).optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { videoUrl, skillLevel, outputType } = processVideoSchema.parse(body);

    // Validate YouTube video
    const videoInfo = await getYouTubeVideoInfo(videoUrl);
    logInfo("Video validated", { videoUrl, videoInfo });

    // Create document record
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .insert({
        user_id: session.user.id,
        title: videoInfo.title,
        video_url: videoUrl,
        status: "pending",
        metadata: {
          videoInfo,
          skillLevel,
          outputType,
          started_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (documentError) {
      logError("Error creating document", { error: documentError });
      return NextResponse.json(
        { error: "Failed to create document" },
        { status: 500 }
      );
    }

    // Submit processing job
    const processor = BackgroundProcessor.getInstance();
    const job = await processor.submitJob(document.id, videoUrl);
    logInfo("Processing job submitted", { jobId: job.id });

    return NextResponse.json({
      message: "Video processing started",
      documentId: document.id,
      jobId: job.id,
    });
  } catch (error) {
    logError("Error processing video", { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process video" },
      { status: 500 }
    );
  }
} 