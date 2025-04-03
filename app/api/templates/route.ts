import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logRequest, logResponse } from "@/lib/logger";
import { z } from "zod";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplate,
  listTemplates,
} from "@/lib/template-service";

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["SUMMARY", "TRANSCRIPT", "NOTES", "CUSTOM"]),
  content: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

const updateTemplateSchema = createTemplateSchema.partial();

export async function POST(request: Request) {
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
    const validatedData = createTemplateSchema.parse(body);

    // Create template
    const template = await createTemplate(session.user.id, validatedData);

    logResponse("Template created", {
      templateId: template.id,
      userId: session.user.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(template);
  } catch (error) {
    logResponse("Error creating template", {
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

export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const isPublic = searchParams.get("isPublic");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // List templates
    const templates = await listTemplates(session.user.id, {
      type: type || undefined,
      isPublic: isPublic ? isPublic === "true" : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    logResponse("Templates listed", {
      userId: session.user.id,
      count: templates.length,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(templates);
  } catch (error) {
    logResponse("Error listing templates", {
      error,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 