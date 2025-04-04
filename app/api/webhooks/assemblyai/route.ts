import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

// AssemblyAI webhook payload schema
const webhookSchema = z.object({
  transcript_id: z.string(),
  status: z.enum(["completed", "error"]),
  text: z.string().optional(),
  error: z.string().optional(),
  confidence: z.number().optional(),
  language_code: z.string().optional(),
  audio_duration: z.number().optional(),
  word_count: z.number().optional(),
  completed_at: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Parse and validate webhook payload
    const body = await request.json();
    const payload = webhookSchema.parse(body);

    // Find document by transcription ID
    const { data: documents, error: findError } = await supabase
      .from("documents")
      .select("id")
      .eq("transcription_id", payload.transcript_id)
      .single();

    if (findError || !documents) {
      console.error("Error finding document:", findError);
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Update document with transcription results
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        status: payload.status === "completed" ? "completed" : "error",
        content: payload.text,
        error_message: payload.error,
        metadata: {
          ...payload,
          completed_at: new Date().toISOString(),
        },
      })
      .eq("id", documents.id);

    if (updateError) {
      console.error("Error updating document:", updateError);
      return NextResponse.json(
        { error: "Failed to update document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
} 