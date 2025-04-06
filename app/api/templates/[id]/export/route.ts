import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { format } from "date-fns";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get template details
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("*")
      .eq("id", params.id)
      .single();

    if (templateError || !template) {
      return new NextResponse("Template not found", { status: 404 });
    }

    // Get usage data
    const { data: usageData, error: usageError } = await supabase
      .from("template_usage")
      .select(`
        id,
        user_id,
        document_id,
        created_at,
        variables,
        documents:document_id (
          title,
          type
        )
      `)
      .eq("template_id", params.id)
      .order("created_at", { ascending: false });

    if (usageError) {
      throw usageError;
    }

    // Format data for CSV
    const csvRows = [
      // Header row
      [
        "Date",
        "Document ID",
        "Document Title",
        "Document Type",
        "User ID",
        "Variables Used",
      ].join(","),
    ];

    // Add data rows
    usageData.forEach((use) => {
      const row = [
        format(new Date(use.created_at), "yyyy-MM-dd HH:mm:ss"),
        use.document_id,
        use.documents?.title || "",
        use.documents?.type || "",
        use.user_id,
        Object.keys(use.variables).length,
      ].join(",");
      csvRows.push(row);
    });

    const csvContent = csvRows.join("\n");

    // Create response
    const response = new NextResponse(csvContent);
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="${template.name}-analytics-${format(
        new Date(),
        "yyyy-MM-dd"
      )}.csv"`
    );
    response.headers.set("Content-Type", "text/csv");

    return response;
  } catch (error) {
    console.error("Error exporting template analytics:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 