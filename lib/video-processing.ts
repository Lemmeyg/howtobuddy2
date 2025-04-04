import { submitTranscriptionJob, waitForTranscription } from './assemblyai';
import { logger } from './logger';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface VideoProcessingOptions {
  videoUrl: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  outputType?: 'tutorial' | 'guide' | 'reference';
}

interface ProcessedDocument {
  content: string;
  metadata: {
    duration?: number;
    wordCount?: number;
    confidence?: number;
    chapters?: Array<{
      title: string;
      startTime: number;
      endTime: number;
    }>;
    highlights?: Array<{
      text: string;
      startTime: number;
      endTime: number;
    }>;
    entities?: Array<{
      text: string;
      type: string;
      startTime: number;
      endTime: number;
    }>;
  };
  error?: string;
}

export async function processVideo(options: VideoProcessingOptions): Promise<ProcessedDocument> {
  try {
    logger.info('Starting video processing', { videoUrl: options.videoUrl });

    // Submit transcription job
    const jobId = await submitTranscriptionJob(options.videoUrl);
    logger.info('Transcription job submitted', { jobId });

    // Wait for transcription to complete
    const transcript = await waitForTranscription(jobId);
    logger.info('Transcription completed', { jobId });

    // Process transcript with OpenAI
    const prompt = `Create a ${options.outputType || 'tutorial'} for ${options.skillLevel || 'intermediate'} level users based on the following transcript:

${transcript.text}

Format the content as a well-structured document with:
1. Clear sections and headings
2. Key points and takeaways
3. Step-by-step instructions where applicable
4. Code examples if relevant
5. Best practices and tips`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical writer and educator. Create clear, concise, and well-structured educational content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content || '';

    // Extract metadata from transcript
    const metadata = {
      duration: transcript.audio_duration,
      wordCount: transcript.words?.length || 0,
      confidence: transcript.confidence,
      chapters: transcript.chapters?.map(chapter => ({
        title: chapter.headline,
        startTime: chapter.start / 1000,
        endTime: chapter.end / 1000,
      })),
      highlights: transcript.highlights?.map(highlight => ({
        text: highlight.text,
        startTime: highlight.start / 1000,
        endTime: highlight.end / 1000,
      })),
      entities: transcript.entities?.map(entity => ({
        text: entity.text,
        type: entity.entity_type,
        startTime: entity.start / 1000,
        endTime: entity.end / 1000,
      })),
    };

    logger.info('Video processing completed', { jobId });

    return {
      content,
      metadata,
    };
  } catch (error) {
    logger.error('Error processing video', { error, videoUrl: options.videoUrl });
    return {
      content: '',
      metadata: {},
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
} 