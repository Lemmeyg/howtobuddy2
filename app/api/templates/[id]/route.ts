import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logRequest, logResponse } from "@/lib/logger";
import { z } from "zod";
import {
  updateTemplate,
  deleteTemplate,
  getTemplate,
  getTemplateVersion,
} from "@/lib/template-service";

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["SUMMARY", "TRANSCRIPT", "NOTES", "CUSTOM"]).optional(),
  content: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(
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

    logResponse("Template fetched", {
      templateId: params.id,
      userId: session.user.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(template);
  } catch (error) {
    logResponse("Error fetching template", {
      templateId: params.id,
      error,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    // Update template
    const template = await updateTemplate(params.id, session.user.id, validatedData);

    logResponse("Template updated", {
      templateId: params.id,
      userId: session.user.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(template);
  } catch (error) {
    logResponse("Error updating template", {
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

export async function DELETE(
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

    // Delete template
    await deleteTemplate(params.id, session.user.id);

    logResponse("Template deleted", {
      templateId: params.id,
      userId: session.user.id,
      duration: Date.now() - startTime,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logResponse("Error deleting template", {
      templateId: params.id,
      error,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 