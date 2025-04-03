import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logRequest, logResponse } from "@/lib/logger";
import { z } from "zod";
import { getTemplate } from "@/lib/template-service";
import { renderTemplate } from "@/lib/template";

const testTemplateSchema = z.object({
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
    const { variables } = testTemplateSchema.parse(body);

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

    logResponse("Template tested", {
      templateId: params.id,
      userId: session.user.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      content: renderedContent,
      variables,
    });
  } catch (error) {
    logResponse("Error testing template", {
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