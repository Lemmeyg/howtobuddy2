import { z } from "zod";

// AssemblyAI API configuration schema
export const assemblyAIConfigSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url().default("https://api.assemblyai.com/v2"),
  languageCode: z.enum(["en", "es", "fr", "de", "it", "pt", "nl", "hi", "ja", "zh", "ko", "pl", "ru", "ar", "tr", "vi", "th", "id", "ms", "fil", "he", "ro", "hu", "el", "da", "fi", "sv", "no", "cs", "sk", "uk", "hr", "ca", "nl", "et", "lv", "lt", "sl", "is", "ga", "mt", "lb", "mi", "mr", "cy", "eu", "hy", "ne", "bn", "bs", "kk", "sw", "eo", "ha", "jv", "fy", "su", "yo", "so", "af", "oc", "ka", "be", "tg", "sd", "gu", "am", "yi", "lo", "uz", "fo", "ht", "ps", "tk", "nn", "mt", "sa", "lb", "my", "bo", "tl", "mg", "as", "tt", "haw", "ln", "ha", "ba", "jw", "su"]).default("en"),
  maxRetries: z.number().int().min(1).max(5).default(3),
  timeout: z.number().int().min(5000).max(30000).default(10000),
  webhookUrl: z.string().url().optional(),
});

// AssemblyAI API configuration type
export type AssemblyAIConfig = z.infer<typeof assemblyAIConfigSchema>;

// Default configuration
export const defaultConfig: AssemblyAIConfig = {
  apiKey: process.env.ASSEMBLYAI_API_KEY || "",
  baseUrl: "https://api.assemblyai.com/v2",
  languageCode: "en",
  maxRetries: 3,
  timeout: 10000,
  webhookUrl: process.env.ASSEMBLYAI_WEBHOOK_URL,
};

// Validate configuration
export function validateConfig(config: Partial<AssemblyAIConfig>): AssemblyAIConfig {
  return assemblyAIConfigSchema.parse({
    ...defaultConfig,
    ...config,
  });
} 