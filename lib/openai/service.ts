import OpenAI from "openai";
import { z } from "zod";

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = "gpt-4-turbo-preview";

// Document generation options schema
export const documentGenerationOptionsSchema = z.object({
  format: z.enum(["markdown", "html", "plain"]).default("markdown"),
  style: z.enum(["formal", "casual", "technical", "academic"]).default("formal"),
  includeSummary: z.boolean().default(true),
  includeKeyPoints: z.boolean().default(true),
  includeActionItems: z.boolean().default(true),
  includeQuotes: z.boolean().default(true),
  maxLength: z.number().optional(),
});

export type DocumentGenerationOptions = z.infer<typeof documentGenerationOptionsSchema>;

// Document generation response schema
const documentGenerationResponseSchema = z.object({
  content: z.string(),
  summary: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  actionItems: z.array(z.string()).optional(),
  quotes: z.array(z.string()).optional(),
  metadata: z.object({
    wordCount: z.number(),
    estimatedReadingTime: z.number(),
    generatedAt: z.string(),
  }),
});

export type DocumentGenerationResponse = z.infer<typeof documentGenerationResponseSchema>;

export class OpenAIService {
  private client: OpenAI;
  private options: DocumentGenerationOptions;

  constructor(options: Partial<DocumentGenerationOptions> = {}) {
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    this.client = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    this.options = documentGenerationOptionsSchema.parse(options);
  }

  private async generatePrompt(transcription: string): string {
    const format = this.options.format;
    const style = this.options.style;
    const includeSummary = this.options.includeSummary;
    const includeKeyPoints = this.options.includeKeyPoints;
    const includeActionItems = this.options.includeActionItems;
    const includeQuotes = this.options.includeQuotes;
    const maxLength = this.options.maxLength;

    return `Please process the following transcription and generate a ${format} document in a ${style} style.

Transcription:
${transcription}

Requirements:
${includeSummary ? "- Include a concise summary at the beginning\n" : ""}
${includeKeyPoints ? "- Extract and list key points\n" : ""}
${includeActionItems ? "- Identify and list action items\n" : ""}
${includeQuotes ? "- Include notable quotes\n" : ""}
${maxLength ? `- Keep the total length under ${maxLength} words\n` : ""}

Format the output as a JSON object with the following structure:
{
  "content": "The main document content",
  "summary": "A brief summary of the content",
  "keyPoints": ["Key point 1", "Key point 2", ...],
  "actionItems": ["Action item 1", "Action item 2", ...],
  "quotes": ["Notable quote 1", "Notable quote 2", ...],
  "metadata": {
    "wordCount": number,
    "estimatedReadingTime": number,
    "generatedAt": "ISO timestamp"
  }
}`;
  }

  async generateDocument(transcription: string): Promise<DocumentGenerationResponse> {
    try {
      const prompt = await this.generatePrompt(transcription);

      const response = await this.client.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a professional document generator. Your task is to process transcriptions and generate well-structured documents.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content generated");
      }

      const parsed = JSON.parse(content);
      return documentGenerationResponseSchema.parse(parsed);
    } catch (error) {
      console.error("Error generating document:", error);
      throw new Error("Failed to generate document");
    }
  }
} 