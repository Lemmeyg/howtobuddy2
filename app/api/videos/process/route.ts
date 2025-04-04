import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AssemblyAIService, TranscriptionOptions } from "@/lib/assemblyai/service";
import { OpenAIService, DocumentGenerationOptions } from "@/lib/openai/service";
import { z } from "zod";

// Request schema
const processVideoSchema = z.object({
  videoUrl: z.string().url(),
  languageCode: z.string().optional(),
  speakerDiarization: z.boolean().optional(),
  punctuate: z.boolean().optional(),
  formatText: z.boolean().optional(),
  redactPII: z.boolean().optional(),
  filterProfanity: z.boolean().optional(),
  customVocabulary: z.array(z.string()).optional(),
  customSpelling: z.record(z.string(), z.string()).optional(),
  documentFormat: z.enum(["markdown", "html", "plain"]).optional(),
  documentStyle: z.enum(["formal", "casual", "technical", "academic"]).optional(),
  includeSummary: z.boolean().optional(),
  includeKeyPoints: z.boolean().optional(),
  includeActionItems: z.boolean().optional(),
  includeQuotes: z.boolean().optional(),
  maxLength: z.number().optional(),
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
    const { videoUrl, ...options } = processVideoSchema.parse(body);

    // Initialize AssemblyAI service with options
    const assemblyAI = new AssemblyAIService(options as TranscriptionOptions);

    // Create document record
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .insert({
        user_id: session.user.id,
        title: "New Video Transcription",
        status: "processing",
        video_url: videoUrl,
        metadata: {
          ...options,
          started_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (documentError) {
      console.error("Error creating document:", documentError);
      return NextResponse.json(
        { error: "Failed to create document" },
        { status: 500 }
      );
    }

    // Submit transcription request
    const transcriptionId = await assemblyAI.submitTranscription(videoUrl);

    // Update document with transcription ID
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        transcription_id: transcriptionId,
        status: "processing",
      })
      .eq("id", document.id);

    if (updateError) {
      console.error("Error updating document:", updateError);
      return NextResponse.json(
        { error: "Failed to update document" },
        { status: 500 }
      );
    }

    // Start background processing
    processTranscription(document.id, transcriptionId, options).catch((error) => {
      console.error("Error processing transcription:", error);
      updateDocumentStatus(document.id, "error", error.message).catch(console.error);
    });

    return NextResponse.json({
      message: "Video processing started",
      documentId: document.id,
    });
  } catch (error) {
    console.error("Error processing video:", error);
    return NextResponse.json(
      { error: "Failed to process video" },
      { status: 500 }
    );
  }
}

async function processTranscription(
  documentId: string,
  transcriptionId: string,
  options: Partial<DocumentGenerationOptions>
) {
  const supabase = createRouteHandlerClient({ cookies });
  const assemblyAI = new AssemblyAIService();
  const openAI = new OpenAIService(options);

  try {
    // Wait for transcription to complete
    const transcription = await assemblyAI.waitForTranscription(transcriptionId);

    // Generate document from transcription
    const generatedDocument = await openAI.generateDocument(transcription.text);

    // Update document with transcription and generated content
    await supabase
      .from("documents")
      .update({
        content: transcription.text,
        generated_content: generatedDocument.content,
        status: "completed",
        metadata: {
          ...transcription,
          ...generatedDocument,
          completed_at: new Date().toISOString(),
        },
      })
      .eq("id", documentId);
  } catch (error) {
    await updateDocumentStatus(documentId, "error", error.message);
    throw error;
  }
}

async function updateDocumentStatus(
  documentId: string,
  status: "processing" | "completed" | "error",
  error?: string
) {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase
    .from("documents")
    .update({
      status,
      ...(error && { error_message: error }),
    })
    .eq("id", documentId);
} 