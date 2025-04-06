import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { logError, logInfo } from "@/lib/logger";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const TemplateType = {
  SUMMARY: "summary",
  TUTORIAL: "tutorial",
  CHEATSHEET: "cheatsheet",
  TRANSCRIPT: "transcript",
} as const;

export type TemplateType = typeof TemplateType[keyof typeof TemplateType];

export const templateSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum([TemplateType.SUMMARY, TemplateType.TUTORIAL, TemplateType.CHEATSHEET, TemplateType.TRANSCRIPT]),
  content: z.string(),
  variables: z.array(z.string()),
  is_public: z.boolean(),
  version: z.number(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Template = z.infer<typeof templateSchema>;

export interface TemplateVariable {
  name: string;
  type: "text" | "number" | "boolean" | "select";
  required: boolean;
  options?: string[];
  defaultValue?: string | number | boolean;
}

export async function createTemplate(
  userId: string,
  template: Omit<Template, "id" | "user_id" | "created_at" | "updated_at" | "version">
) {
  try {
    const { data, error } = await supabase
      .from("templates")
      .insert({
        ...template,
        user_id: userId,
        version: 1,
      })
      .select()
      .single();

    if (error) throw error;

    logInfo("Template created", { templateId: data.id });
    return data;
  } catch (error) {
    logError("Error creating template", { error });
    throw error;
  }
}

export async function updateTemplate(
  userId: string,
  templateId: string,
  updates: Partial<Omit<Template, "id" | "user_id" | "created_at" | "updated_at">>
) {
  try {
    const { data: existingTemplate, error: fetchError } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .eq("user_id", userId)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from("templates")
      .update({
        ...updates,
        version: existingTemplate.version + 1,
      })
      .eq("id", templateId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    logInfo("Template updated", { templateId });
    return data;
  } catch (error) {
    logError("Error updating template", { error });
    throw error;
  }
}

export async function deleteTemplate(userId: string, templateId: string) {
  try {
    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", templateId)
      .eq("user_id", userId);

    if (error) throw error;

    logInfo("Template deleted", { templateId });
  } catch (error) {
    logError("Error deleting template", { error });
    throw error;
  }
}

export async function getTemplate(userId: string, templateId: string) {
  try {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logError("Error fetching template", { error });
    throw error;
  }
}

export async function listTemplates(userId: string, options?: { isPublic?: boolean }) {
  try {
    let query = supabase
      .from("templates")
      .select("*")
      .or(`user_id.eq.${userId},is_public.eq.true`);

    if (options?.isPublic !== undefined) {
      query = query.eq("is_public", options.isPublic);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error) {
    logError("Error listing templates", { error });
    throw error;
  }
}

export function parseTemplateVariables(content: string): TemplateVariable[] {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const matches = content.matchAll(variableRegex);
  const variables: TemplateVariable[] = [];

  for (const match of matches) {
    const [_, variable] = match;
    const [name, type = "text", required = "true", options] = variable.split(":");

    variables.push({
      name,
      type: type as TemplateVariable["type"],
      required: required === "true",
      options: options ? options.split(",") : undefined,
    });
  }

  return variables;
}

export function renderTemplate(content: string, variables: Record<string, any>): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    const [name] = variable.split(":");
    return variables[name]?.toString() || match;
  });
} 