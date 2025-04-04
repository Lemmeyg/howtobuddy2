import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logError, logInfo } from "@/lib/logger";

// Verify webhook signature
function verifyWebhookSignature(signature: string, payload: string): boolean {
  const secret = process.env.ASSEMBLY_WEBHOOK_SECRET;
  if (!secret) {
    logError("AssemblyAI webhook secret not configured");
    return false;
  }

  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const calculatedSignature = hmac.digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}

export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const signature = request.headers.get("x-assembly-signature");
    const payload = await request.text();
    
    if (!signature || !verifyWebhookSignature(signature, payload)) {
      logError("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const data = JSON.parse(payload);
    const { transcript_id, status, text, error } = data;

    if (!transcript_id) {
      logError("Missing transcript_id in webhook payload");
      return NextResponse.json(
        { error: "Missing transcript_id" },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Find document by transcript_id
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("transcript_id", transcript_id)
      .single();

    if (fetchError || !document) {
      logError("Document not found for transcript", { transcript_id });
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Update document based on transcription status
    const updateData: any = {
      status: status === "completed" ? "completed" : "error",
      updated_at: new Date().toISOString(),
    };

    if (status === "completed" && text) {
      updateData.content = text;
      updateData.completed_at = new Date().toISOString();
    } else if (status === "error") {
      updateData.error_message = error || "Unknown error occurred";
    }

    const { error: updateError } = await supabase
      .from("documents")
      .update(updateData)
      .eq("id", document.id);

    if (updateError) {
      logError("Error updating document", { 
        documentId: document.id, 
        error: updateError 
      });
      throw updateError;
    }

    logInfo("Document updated from webhook", { 
      documentId: document.id, 
      status 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Error processing webhook", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 