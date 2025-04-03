import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logRequest, logResponse } from "@/lib/logger";
import { z } from "zod";
import { BackgroundProcessor } from "@/lib/background-processor";

const requestSchema = z.object({
  documentId: z.string().uuid(),
  videoUrl: z.string().url(),
});

export async function POST(request: Request) {
  const startTime = Date.now();
  const supabase = createClient();

  try {
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { documentId, videoUrl } = requestSchema.parse(body);

    // Verify document ownership
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("id")
      .eq("id", documentId)
      .eq("user_id", session.user.id)
      .single();

    if (documentError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Submit processing job
    const processor = BackgroundProcessor.getInstance();
    const job = await processor.submitJob(documentId, videoUrl);

    const duration = Date.now() - startTime;
    logResponse(new Response(JSON.stringify(job)), duration, {
      userId: session.user.id,
      path: "/api/documents/process",
      method: "POST",
      status: 200,
    });

    return NextResponse.json(job);
  } catch (error) {
    const duration = Date.now() - startTime;
    logResponse(new Response(JSON.stringify({ error: "Internal Server Error" })), duration, {
      path: "/api/documents/process",
      method: "POST",
      status: 500,
      error,
    });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 