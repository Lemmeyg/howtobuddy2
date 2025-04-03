import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logRequest, logResponse } from "@/lib/logger";
import { z } from "zod";

const querySchema = z.object({
  status: z.enum(["all", "processing", "completed", "error"]).optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["created_at", "title", "video_title"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export async function GET(request: Request) {
  const startTime = Date.now();
  const supabase = createClient();

  try {
    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Build query
    let queryBuilder = supabase
      .from("documents")
      .select("*")
      .eq("user_id", session.user.id);

    // Apply search if specified
    if (query.search) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query.search}%,video_title.ilike.%${query.search}%`
      );
    }

    // Apply status filter if specified
    if (query.status && query.status !== "all") {
      queryBuilder = queryBuilder.eq("status", query.status);
    }

    // Apply sorting
    const sortBy = query.sortBy || "created_at";
    const sortOrder = query.sortOrder || "desc";
    queryBuilder = queryBuilder.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    queryBuilder = queryBuilder.range(start, end);

    // Execute query
    const { data: documents, error, count } = await queryBuilder;

    if (error) {
      throw error;
    }

    const duration = Date.now() - startTime;
    logResponse(new Response(JSON.stringify(documents)), duration, {
      userId: session.user.id,
      path: "/api/documents",
      method: "GET",
      status: 200,
    });

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total: count || documents.length,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logResponse(new Response(JSON.stringify({ error: "Internal Server Error" })), duration, {
      path: "/api/documents",
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

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { videoUrl } = await request.json();

    // For now, just create a placeholder document
    const { data: document, error } = await supabase
      .from("documents")
      .insert([
        {
          user_id: session.user.id,
          title: "New Document",
          video_url: videoUrl,
          video_title: "Processing...",
          video_duration: 0,
          status: "processing",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
} 