import { NextResponse } from "next/server";
import { getTranscriptStatus } from "@/lib/assemblyai";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = paramsSchema.parse(params);
    const transcript = await getTranscriptStatus(id);

    return NextResponse.json(transcript);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request parameters", details: error.errors },
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