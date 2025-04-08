import { z } from "zod";
import { logInfo, logError } from "../logging";
import fs from "fs";

// AssemblyAI API configuration
const ASSEMBLYAI_API_URL = "https://api.assemblyai.com/v2";

// Add debug logging for API configuration
console.log('AssemblyAI Configuration:', {
  apiUrl: ASSEMBLYAI_API_URL
});

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
  text: z.string().nullable().optional(),
  error: z.string().optional(),
  confidence: z.number().nullable().optional(),
  language_code: z.string().optional(),
  audio_duration: z.number().nullable().optional(),
  word_count: z.number().optional(),
  utterances: z.array(z.object({
    text: z.string(),
    start: z.number(),
    end: z.number(),
    confidence: z.number(),
    speaker: z.string().optional(),
  })).nullable().optional(),
  completed_at: z.string().optional(),
});

export type TranscriptionResponse = z.infer<typeof transcriptionResponseSchema>;

export class AssemblyAIService {
  private apiKey: string;
  private options: TranscriptionOptions;

  constructor(options: TranscriptionOptions = {}) {
    // Check for API key in constructor instead
    const apiKey = process.env.NEXT_PUBLIC_ASSEMBLY_API_KEY;
    if (!apiKey) {
      throw new Error("NEXT_PUBLIC_ASSEMBLY_API_KEY is not configured");
    }
    this.apiKey = apiKey;
    this.options = transcriptionOptionsSchema.parse(options);

    // Add debug logging
    console.log('AssemblyAI Service Initialized:', {
      hasApiKey: true,
      apiKeyLength: this.apiKey.length,
      apiKeyPrefix: this.apiKey.substring(0, 4),
      apiKeySuffix: this.apiKey.substring(this.apiKey.length - 4),
      options: this.options
    });
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    // Add detailed request logging
    const contentType = (options.headers as Record<string, string>)?.['Content-Type'] || 'application/json';
    
    console.log('Making AssemblyAI API request:', {
      url,
      method: options.method || 'GET',
      headers: {
        ...options.headers,
        'Authorization': 'Bearer [REDACTED]', // Don't log the actual key
        'Content-Type': contentType
      },
      body: options.body && contentType === 'application/json' 
        ? JSON.parse(options.body as string) 
        : '[Binary Data]'
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": this.apiKey,
      },
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch (e) {
        error = { message: response.statusText };
      }
      
      console.error('AssemblyAI API request failed:', {
        status: response.status,
        statusText: response.statusText,
        error,
        requestUrl: url,
        requestMethod: options.method || 'GET'
      });
      throw new AssemblyAIError(
        error.message || "AssemblyAI API request failed",
        error.code || "unknown",
        response.status,
        error
      );
    }

    return response; // Return the Response object directly
  }

  async submitTranscription(audioPath: string): Promise<string> {
    try {
      logInfo('Submitting transcription request', { audioPath });

      // Check if the path is a local file
      const isLocalFile = audioPath.startsWith('file://') || !audioPath.startsWith('http');
      
      let audioUrl = audioPath;

      if (isLocalFile) {
        // Remove file:// prefix if present
        const cleanPath = audioPath.replace('file://', '');
        
        // Read the file
        const fileBuffer = await fs.promises.readFile(cleanPath);
        
        // Upload the file to AssemblyAI
        const uploadResponse = await this.fetchWithAuth(`${ASSEMBLYAI_API_URL}/upload`, {
          method: "POST",
          body: fileBuffer,
          headers: {
            "Content-Type": "application/octet-stream"
          }
        });

        // Add debug logging
        console.log('Upload Response:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          headers: {
            'content-type': uploadResponse.headers.get('content-type'),
            'content-length': uploadResponse.headers.get('content-length'),
            'x-request-id': uploadResponse.headers.get('x-request-id')
          },
          type: typeof uploadResponse
        });

        // Parse the response
        const uploadData = await uploadResponse.json();
        audioUrl = uploadData.upload_url;
        
        logInfo('File uploaded successfully', { uploadUrl: audioUrl });
      }

      // Submit transcription with the audio URL
      const response = await this.fetchWithAuth(`${ASSEMBLYAI_API_URL}/transcript`, {
        method: "POST",
        body: JSON.stringify({
          audio_url: audioUrl,
          language_code: this.options.languageCode,
          punctuate: this.options.punctuate,
          format_text: this.options.formatText,
          speaker_diarization: this.options.speakerDiarization,
          custom_vocabulary: this.options.customVocabulary,
          redact_pii: this.options.redactPII,
          redact_pii_policies: this.options.redactPIIPolicies,
          boost_param: this.options.boostParam,
          filter_profanity: this.options.filterProfanity,
          custom_spelling: this.options.customSpelling,
        }),
      });

      const data = await response.json();
      logInfo('Transcription submitted successfully', { 
        transcriptionId: data.id 
      });
      return data.id;
    } catch (error) {
      logError('Failed to submit transcription', { error });
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
        
        // Add debug logging for the response
        console.log('Transcription Status Response:', {
          status: data.status,
          hasText: !!data.text,
          hasConfidence: !!data.confidence,
          hasAudioDuration: !!data.audio_duration,
          hasUtterances: !!data.utterances
        });

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