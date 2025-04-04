import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().optional(),
  status: z.enum(["processing", "completed", "error"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Validate request body
    const body = await request.json();
    const result = updateDocumentSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.issues },
        { status: 400 }
      );
    }

    // Check document ownership
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("user_id")
      .eq("id", params.id)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (document.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update document
    const { data, error } = await supabase
      .from("documents")
      .update({
        ...result.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating document:", error);
      return NextResponse.json(
        { error: "Failed to update document" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check document ownership
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("user_id")
      .eq("id", params.id)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (document.user_id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete document
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Error deleting document:", error);
      return NextResponse.json(
        { error: "Failed to delete document" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Get document
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", session.user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 