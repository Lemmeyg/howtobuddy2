import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";

const querySchema = z.object({
  status: z.enum(["all", "processing", "completed", "error"]).optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["created_at", "title", "video_title"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Documents API: No session found', sessionError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Build query
    let queryBuilder = supabase
      .from("documents")
      .select("*", { count: "exact" })
      .eq("user_id", session.user.id);

    // Apply search if specified
    if (query.search) {
      queryBuilder = queryBuilder.ilike("title", `%${query.search}%`);
    }

    // Apply status filter if specified
    if (query.status && query.status !== "all") {
      queryBuilder = queryBuilder.eq("status", query.status);
    }

    // Apply date range filter
    if (query.from) {
      queryBuilder = queryBuilder.gte("created_at", query.from);
    }

    if (query.to) {
      queryBuilder = queryBuilder.lte("created_at", query.to);
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
      console.error('Documents API: Database error', error);
      throw error;
    }

    // Return consistent response structure
    return NextResponse.json({
      data: {
        documents: documents || [],
        total: count || 0,
        page,
        limit,
        hasMore: (page * limit) < (count || 0)
      }
    });
  } catch (error) {
    console.error('Documents API: Unexpected error', error);
    return NextResponse.json(
      { 
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
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

    if (error) {
      console.error('Documents API: Insert error', error);
      throw error;
    }

    return NextResponse.json({ data: { document } });
  } catch (error) {
    console.error("Documents API: Create error", error);
    return NextResponse.json(
      { 
        error: "Failed to create document",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 