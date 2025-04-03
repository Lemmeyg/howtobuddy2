import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

const webhookSchema = z.object({
  transcript_id: z.string(),
  status: z.enum(["completed", "error"]),
  text: z.string().optional(),
  error: z.string().optional(),
  audio_duration: z.number().optional(),
  confidence: z.number().optional(),
  language_code: z.string().optional(),
  created: z.string().optional(),
  completed: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = webhookSchema.parse(body);

    const supabase = createRouteHandlerClient({ cookies });

    // Update the document in the database
    const { error } = await supabase
      .from("documents")
      .update({
        status: data.status === "completed" ? "completed" : "error",
        transcript: data.text,
        error_message: data.error,
        audio_duration: data.audio_duration,
        confidence: data.confidence,
        language_code: data.language_code,
        completed_at: data.completed,
      })
      .eq("transcript_id", data.transcript_id);

    if (error) {
      console.error("Error updating document:", error);
      return NextResponse.json(
        { error: "Failed to update document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid webhook data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 