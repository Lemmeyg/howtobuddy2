export interface AssemblyAITranscriptResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text: string;
  words: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  confidence: number;
  audio_duration: number;
  error?: string;
}

export interface AssemblyAIError {
  error: string;
  status: number;
}

export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  duration: number;
  channelTitle: string;
} 