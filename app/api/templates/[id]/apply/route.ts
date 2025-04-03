import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logRequest, logResponse } from "@/lib/logger";
import { z } from "zod";
import { getTemplate } from "@/lib/template-service";
import { renderTemplate } from "@/lib/template";
import { recordTemplateUsage } from "@/lib/template-service";

const applyTemplateSchema = z.object({
  documentId: z.string().uuid(),
  variables: z.record(z.string()),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const supabase = createClient();

  try {
    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get template
    const template = await getTemplate(params.id, session.user.id);

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { documentId, variables } = applyTemplateSchema.parse(body);

    // Validate document ownership
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("userId", session.user.id)
      .single();

    if (documentError || !document) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Validate variables against template requirements
    const missingVariables = template.variables.filter(
      (variable) => !(variable in variables)
    );

    if (missingVariables.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required variables",
          missingVariables,
        },
        { status: 400 }
      );
    }

    // Render template with provided variables
    const renderedContent = renderTemplate(template.content, variables);

    // Record template usage
    await recordTemplateUsage(params.id, session.user.id, documentId, variables);

    // Update document with rendered content
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        content: renderedContent,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", documentId);

    if (updateError) {
      throw updateError;
    }

    logResponse("Template applied to document", {
      templateId: params.id,
      documentId,
      userId: session.user.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      content: renderedContent,
      variables,
    });
  } catch (error) {
    logResponse("Error applying template", {
      templateId: params.id,
      error,
      duration: Date.now() - startTime,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 