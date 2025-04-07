import { getSupabaseServerClient } from "@/lib/supabase/server";
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
  template: Omit<Template, "id" | "created_at" | "updated_at">
): Promise<Template> {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from("templates")
      .insert([{ ...template, user_id: userId }])
      .select()
      .single();

    if (error) throw error;

    return templateSchema.parse(data);
  } catch (error) {
    logError("Error creating template", { userId, template, error });
    throw error;
  }
}

export async function updateTemplate(
  userId: string,
  templateId: string,
  updates: Partial<Template>
): Promise<Template> {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from("templates")
      .update(updates)
      .eq("id", templateId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    return templateSchema.parse(data);
  } catch (error) {
    logError("Error updating template", { userId, templateId, updates, error });
    throw error;
  }
}

export async function deleteTemplate(userId: string, templateId: string): Promise<void> {
  const supabase = getSupabaseServerClient();

  try {
    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", templateId)
      .eq("user_id", userId);

    if (error) throw error;
  } catch (error) {
    logError("Error deleting template", { userId, templateId, error });
    throw error;
  }
}

export async function getTemplate(userId: string, templateId: string): Promise<Template> {
  const supabase = getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    return templateSchema.parse(data);
  } catch (error) {
    logError("Error getting template", { userId, templateId, error });
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
  const supabase = getSupabaseServerClient();

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
  const supabase = getSupabaseServerClient();

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
  const supabase = getSupabaseServerClient();

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