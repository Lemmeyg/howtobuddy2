import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logRequest, logResponse } from "@/lib/logger";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const supabase = createClient();

  try {
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate document ID
    const { id } = paramsSchema.parse(params);

    // Fetch document
    const { data: document, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
      throw error;
    }

    const duration = Date.now() - startTime;
    logResponse(new Response(JSON.stringify(document)), duration, {
      userId: session.user.id,
      path: `/api/documents/${id}`,
      method: "GET",
      status: 200,
    });

    return NextResponse.json(document);
  } catch (error) {
    const duration = Date.now() - startTime;
    logResponse(new Response(JSON.stringify({ error: "Internal Server Error" })), duration, {
      path: `/api/documents/${params.id}`,
      method: "GET",
      status: 500,
      error,
    });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const supabase = createClient();

  try {
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate document ID
    const { id } = paramsSchema.parse(params);

    // Delete document
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
      throw error;
    }

    const duration = Date.now() - startTime;
    logResponse(new Response(JSON.stringify({ success: true })), duration, {
      userId: session.user.id,
      path: `/api/documents/${id}`,
      method: "DELETE",
      status: 200,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    logResponse(new Response(JSON.stringify({ error: "Internal Server Error" })), duration, {
      path: `/api/documents/${params.id}`,
      method: "DELETE",
      status: 500,
      error,
    });

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 