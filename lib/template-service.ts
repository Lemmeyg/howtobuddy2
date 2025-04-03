import { createClient } from "@/lib/supabase/server";
import { logInfo, logError } from "@/lib/logger";
import {
  Template,
  TemplateVersion,
  TemplateUsage,
  templateSchema,
  templateVersionSchema,
} from "./template";

export async function createTemplate(
  userId: string,
  data: Omit<Template, "id" | "version" | "userId" | "createdAt" | "updatedAt">
): Promise<Template> {
  const supabase = createClient();

  try {
    const { data: template, error } = await supabase
      .from("templates")
      .insert({
        ...data,
        userId,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    const validatedTemplate = templateSchema.parse(template);
    logInfo("Template created", { templateId: validatedTemplate.id, userId });
    return validatedTemplate;
  } catch (error) {
    logError("Error creating template", { userId, error });
    throw error;
  }
}

export async function updateTemplate(
  templateId: string,
  userId: string,
  data: Partial<Omit<Template, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Template> {
  const supabase = createClient();

  try {
    // Get current template
    const { data: currentTemplate, error: fetchError } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .eq("userId", userId)
      .single();

    if (fetchError) throw fetchError;

    // Create new version if content or variables changed
    if (data.content || data.variables) {
      const { error: versionError } = await supabase
        .from("template_versions")
        .insert({
          templateId,
          version: currentTemplate.version,
          content: currentTemplate.content,
          variables: currentTemplate.variables,
          createdAt: new Date().toISOString(),
        });

      if (versionError) throw versionError;

      // Increment version
      data.version = currentTemplate.version + 1;
    }

    // Update template
    const { data: template, error } = await supabase
      .from("templates")
      .update({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", templateId)
      .eq("userId", userId)
      .select()
      .single();

    if (error) throw error;

    const validatedTemplate = templateSchema.parse(template);
    logInfo("Template updated", { templateId, userId });
    return validatedTemplate;
  } catch (error) {
    logError("Error updating template", { templateId, userId, error });
    throw error;
  }
}

export async function deleteTemplate(
  templateId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", templateId)
      .eq("userId", userId);

    if (error) throw error;

    logInfo("Template deleted", { templateId, userId });
  } catch (error) {
    logError("Error deleting template", { templateId, userId, error });
    throw error;
  }
}

export async function getTemplate(
  templateId: string,
  userId: string
): Promise<Template | null> {
  const supabase = createClient();

  try {
    const { data: template, error } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .eq("userId", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return templateSchema.parse(template);
  } catch (error) {
    logError("Error fetching template", { templateId, userId, error });
    throw error;
  }
}

export async function listTemplates(
  userId: string,
  options: {
    type?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Template[]> {
  const supabase = createClient();

  try {
    let query = supabase
      .from("templates")
      .select("*")
      .eq("userId", userId);

    if (options.type) {
      query = query.eq("type", options.type);
    }

    if (options.isPublic !== undefined) {
      query = query.eq("isPublic", options.isPublic);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data: templates, error } = await query;

    if (error) throw error;

    return templates.map((template) => templateSchema.parse(template));
  } catch (error) {
    logError("Error listing templates", { userId, options, error });
    throw error;
  }
}

export async function getTemplateVersion(
  templateId: string,
  version: number,
  userId: string
): Promise<TemplateVersion | null> {
  const supabase = createClient();

  try {
    const { data: templateVersion, error } = await supabase
      .from("template_versions")
      .select("*")
      .eq("templateId", templateId)
      .eq("version", version)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return templateVersionSchema.parse(templateVersion);
  } catch (error) {
    logError("Error fetching template version", {
      templateId,
      version,
      userId,
      error,
    });
    throw error;
  }
}

export async function recordTemplateUsage(
  templateId: string,
  userId: string,
  documentId: string,
  variables: Record<string, string>
): Promise<TemplateUsage> {
  const supabase = createClient();

  try {
    const { data: usage, error } = await supabase
      .from("template_usage")
      .insert({
        templateId,
        userId,
        documentId,
        variables,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    logInfo("Template usage recorded", {
      templateId,
      userId,
      documentId,
    });
    return usage;
  } catch (error) {
    logError("Error recording template usage", {
      templateId,
      userId,
      documentId,
      error,
    });
    throw error;
  }
} 