import { NextResponse } from "next/server";
import { submitTranscriptRequest, getYouTubeVideoInfo } from "@/lib/assemblyai";
import { z } from "zod";

const requestSchema = z.object({
  videoUrl: z.string().url(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoUrl } = requestSchema.parse(body);

    // First, validate the YouTube video
    const videoInfo = await getYouTubeVideoInfo(videoUrl);

    // Check video duration against subscription limits
    // TODO: Implement subscription-based duration limits
    if (videoInfo.duration > 900) { // 15 minutes in seconds
      return NextResponse.json(
        { error: "Video duration exceeds the maximum allowed length" },
        { status: 400 }
      );
    }

    // Submit transcription request
    const { id } = await submitTranscriptRequest(videoUrl);

    return NextResponse.json({
      transcriptId: id,
      videoInfo,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 