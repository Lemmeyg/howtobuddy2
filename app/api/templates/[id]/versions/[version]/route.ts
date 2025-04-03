import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logRequest, logResponse } from "@/lib/logger";
import { getTemplateVersion } from "@/lib/template-service";

export async function GET(
  request: Request,
  { params }: { params: { id: string; version: string } }
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

    // Parse version number
    const version = parseInt(params.version);
    if (isNaN(version)) {
      return NextResponse.json(
        { error: "Invalid version number" },
        { status: 400 }
      );
    }

    // Get template version
    const templateVersion = await getTemplateVersion(
      params.id,
      version,
      session.user.id
    );

    if (!templateVersion) {
      return NextResponse.json(
        { error: "Template version not found" },
        { status: 404 }
      );
    }

    logResponse("Template version fetched", {
      templateId: params.id,
      version,
      userId: session.user.id,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(templateVersion);
  } catch (error) {
    logResponse("Error fetching template version", {
      templateId: params.id,
      version: params.version,
      error,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 