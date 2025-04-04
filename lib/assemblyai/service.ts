import { z } from "zod";

// AssemblyAI API configuration
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_API_URL = "https://api.assemblyai.com/v2";

// Transcription options schema
export const transcriptionOptionsSchema = z.object({
  languageCode: z.string().optional(),
  speakerDiarization: z.boolean().optional(),
  customVocabulary: z.array(z.string()).optional(),
  punctuate: z.boolean().optional(),
  formatText: z.boolean().optional(),
  redactPII: z.boolean().optional(),
  redactPIIPolicies: z.array(z.string()).optional(),
  boostParam: z.number().optional(),
  filterProfanity: z.boolean().optional(),
  customSpelling: z.record(z.string(), z.string()).optional(),
});

export type TranscriptionOptions = z.infer<typeof transcriptionOptionsSchema>;

// AssemblyAI error types
export class AssemblyAIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "AssemblyAIError";
  }
}

// Transcription response schema
const transcriptionResponseSchema = z.object({
  id: z.string(),
  status: z.enum(["queued", "processing", "completed", "error"]),
  text: z.string().optional(),
  error: z.string().optional(),
  confidence: z.number().optional(),
  language_code: z.string().optional(),
  audio_duration: z.number().optional(),
  word_count: z.number().optional(),
  utterances: z.array(z.object({
    text: z.string(),
    start: z.number(),
    end: z.number(),
    confidence: z.number(),
    speaker: z.string().optional(),
  })).optional(),
  completed_at: z.string().optional(),
});

export type TranscriptionResponse = z.infer<typeof transcriptionResponseSchema>;

export class AssemblyAIService {
  private apiKey: string;
  private options: TranscriptionOptions;

  constructor(options: TranscriptionOptions = {}) {
    if (!ASSEMBLYAI_API_KEY) {
      throw new Error("AssemblyAI API key is not configured");
    }
    this.apiKey = ASSEMBLYAI_API_KEY;
    this.options = transcriptionOptionsSchema.parse(options);
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Authorization": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new AssemblyAIError(
        error.message || "AssemblyAI API request failed",
        error.code || "unknown",
        response.status,
        error
      );
    }

    return response;
  }

  async submitTranscription(videoUrl: string): Promise<string> {
    try {
      const response = await this.fetchWithAuth(`${ASSEMBLYAI_API_URL}/transcript`, {
        method: "POST",
        body: JSON.stringify({
          audio_url: videoUrl,
          language_code: this.options.languageCode,
          speaker_diarization: this.options.speakerDiarization,
          custom_vocabulary: this.options.customVocabulary,
          punctuate: this.options.punctuate,
          format_text: this.options.formatText,
          redact_pii: this.options.redactPII,
          redact_pii_policies: this.options.redactPIIPolicies,
          boost_param: this.options.boostParam,
          filter_profanity: this.options.filterProfanity,
          custom_spelling: this.options.customSpelling,
        }),
      });

      const data = await response.json();
      return data.id;
    } catch (error) {
      if (error instanceof AssemblyAIError) {
        // Handle specific AssemblyAI error cases
        switch (error.code) {
          case "invalid_audio_url":
            throw new AssemblyAIError(
              "The provided video URL is invalid or inaccessible",
              error.code,
              error.status
            );
          case "invalid_language_code":
            throw new AssemblyAIError(
              "The specified language is not supported",
              error.code,
              error.status
            );
          case "invalid_custom_vocabulary":
            throw new AssemblyAIError(
              "The custom vocabulary contains invalid terms",
              error.code,
              error.status
            );
          case "invalid_boost_param":
            throw new AssemblyAIError(
              "The boost parameter must be between 0 and 1",
              error.code,
              error.status
            );
          case "rate_limit_exceeded":
            throw new AssemblyAIError(
              "API rate limit exceeded. Please try again later.",
              error.code,
              error.status
            );
          case "insufficient_credits":
            throw new AssemblyAIError(
              "Insufficient API credits. Please check your account balance.",
              error.code,
              error.status
            );
          default:
            throw error;
        }
      }
      throw error;
    }
  }

  async waitForTranscription(transcriptionId: string): Promise<TranscriptionResponse> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await this.fetchWithAuth(
          `${ASSEMBLYAI_API_URL}/transcript/${transcriptionId}`
        );
        const data = await response.json();
        const transcription = transcriptionResponseSchema.parse(data);

        if (transcription.status === "completed") {
          return transcription;
        }

        if (transcription.status === "error") {
          throw new AssemblyAIError(
            transcription.error || "Transcription failed",
            "transcription_error",
            500,
            transcription
          );
        }

        // Wait 5 seconds before next attempt
        await new Promise((resolve) => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        if (error instanceof AssemblyAIError) {
          // Handle specific AssemblyAI error cases
          switch (error.code) {
            case "transcript_not_found":
              throw new AssemblyAIError(
                "Transcription not found. The ID may be invalid or expired.",
                error.code,
                error.status
              );
            case "transcription_failed":
              throw new AssemblyAIError(
                "The transcription process failed. Please try again.",
                error.code,
                error.status
              );
            default:
              throw error;
          }
        }
        throw error;
      }
    }

    throw new AssemblyAIError(
      "Transcription timed out after 5 minutes",
      "timeout",
      408
    );
  }
} 