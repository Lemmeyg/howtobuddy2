import { z } from "zod";

export const TemplateType = {
  SUMMARY: "summary",
  TRANSCRIPT: "transcript",
  NOTES: "notes",
  CUSTOM: "custom",
} as const;

export type TemplateType = typeof TemplateType[keyof typeof TemplateType];

export const templateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  type: z.enum([
    TemplateType.SUMMARY,
    TemplateType.TRANSCRIPT,
    TemplateType.NOTES,
    TemplateType.CUSTOM,
  ]),
  content: z.string(),
  variables: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      required: z.boolean(),
      defaultValue: z.string().optional(),
    })
  ),
  version: z.number(),
  isPublic: z.boolean(),
  userId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Template = z.infer<typeof templateSchema>;

export const templateVersionSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  version: z.number(),
  content: z.string(),
  variables: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      required: z.boolean(),
      defaultValue: z.string().optional(),
    })
  ),
  createdAt: z.string().datetime(),
});

export type TemplateVersion = z.infer<typeof templateVersionSchema>;

export interface TemplateUsage {
  id: string;
  templateId: string;
  userId: string;
  documentId: string;
  variables: Record<string, string>;
  createdAt: string;
}

export function validateTemplateVariables(
  template: Template,
  variables: Record<string, string>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required variables
  template.variables.forEach((variable) => {
    if (variable.required && !variables[variable.name]) {
      errors.push(`Missing required variable: ${variable.name}`);
    }
  });

  // Check for unknown variables
  Object.keys(variables).forEach((variableName) => {
    if (!template.variables.find((v) => v.name === variableName)) {
      errors.push(`Unknown variable: ${variableName}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function renderTemplate(
  template: Template,
  variables: Record<string, string>
): string {
  let content = template.content;

  // Replace variables in content
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    content = content.replace(regex, value);
  });

  return content;
}

export function getDefaultVariables(template: Template): Record<string, string> {
  const defaults: Record<string, string> = {};

  template.variables.forEach((variable) => {
    if (variable.defaultValue) {
      defaults[variable.name] = variable.defaultValue;
    }
  });

  return defaults;
} 